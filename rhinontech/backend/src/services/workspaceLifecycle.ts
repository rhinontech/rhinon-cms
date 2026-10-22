import type { Response } from "express";
import { QueryTypes } from "sequelize";
import { sequelize } from "../config/database";
import { Organization } from "../models/Organization";
import { TENANT_MODELS } from "../models/tenantScope";
import { recordAudit } from "./audit";
import { runAsSystem } from "./tenantContext";
import { deleteOrgObjects } from "./storage";
import { sendEmail } from "./mailer";

/**
 * Taking a workspace's data out, and taking the workspace itself out.
 *
 * Export is synchronous and streamed, table by table, so a large workspace does
 * not have to fit in memory. Deletion is deliberately two-step: a request starts a
 * grace period (DELETION_GRACE_DAYS, default 7) during which the owner can change
 * their mind, and a daily job performs the purge once it has elapsed. There is no
 * endpoint that deletes a customer's data on the spot.
 */

export const DELETION_GRACE_DAYS = Number(process.env.DELETION_GRACE_DAYS || 7);

// Models left out of an export. These hold credentials for other services, which
// are no use to the customer and dangerous in a downloaded file.
const EXPORT_EXCLUDED_MODELS = new Set(["LinkedInToken", "GoogleCalendarToken"]);
// Any attribute that looks like a secret is dropped from every model's rows.
const SECRET_ATTRIBUTE = /(password|token|secret|hash|totp|recovery)/i;

const PAGE = 500;

function scrub(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) if (!SECRET_ATTRIBUTE.test(k)) out[k] = v;
  return out;
}

/**
 * Streams the calling workspace's data as one JSON document. Must run inside the
 * workspace's tenant context (an authenticated request), which is what scopes
 * every query — the export never names an organization itself.
 *
 * Files in storage are referenced by key, not embedded; an export of documents
 * and attachments' bytes is a separate, much larger job.
 */
export async function streamWorkspaceExport(organizationId: string, res: Response): Promise<void> {
  const org = await runAsSystem("export:organization", () => Organization.findByPk(organizationId));
  if (!org) throw new Error("Workspace not found");

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${org.slug}-export-${new Date().toISOString().slice(0, 10)}.json"`);

  res.write(
    `{"exportedAt":${JSON.stringify(new Date().toISOString())},` +
      `"organization":${JSON.stringify({ id: org.id, name: org.name, slug: org.slug, emailDomain: org.emailDomain, plan: org.plan, status: org.status, createdAt: org.createdAt })},` +
      `"note":${JSON.stringify("Files are referenced by storage key; credentials and password hashes are excluded.")},` +
      `"tables":{`
  );

  let firstTable = true;
  for (const model of TENANT_MODELS) {
    if (EXPORT_EXCLUDED_MODELS.has(model.name)) continue;
    res.write(`${firstTable ? "" : ","}${JSON.stringify(model.name)}:[`);
    firstTable = false;

    let first = true;
    for (let offset = 0; ; offset += PAGE) {
      // Scoped to the workspace by the tenant hooks; ordered so paging is stable.
      const rows = await model.unscoped().findAll({ order: [["id", "ASC"]], limit: PAGE, offset, raw: true });
      for (const row of rows) {
        res.write(`${first ? "" : ","}${JSON.stringify(scrub(row as Record<string, unknown>))}`);
        first = false;
      }
      if (rows.length < PAGE) break;
    }
    res.write("]");
  }
  res.write("}}");
  res.end();
}

export interface DeletionState {
  scheduled: boolean;
  scheduledFor: string | null;
  requestedAt: string | null;
  graceDays: number;
}

export function deletionState(org: Organization): DeletionState {
  const at = org.settings?.deletionScheduledFor ?? null;
  return { scheduled: !!at, scheduledFor: at, requestedAt: org.settings?.deletionRequestedAt ?? null, graceDays: DELETION_GRACE_DAYS };
}

/** Starts the grace period. Idempotent: asking twice keeps the original deadline. */
export async function scheduleDeletion(org: Organization, actor: { id: string; name: string; email: string; ip?: string | null }) {
  if (org.isPlatform) throw new Error("The platform workspace cannot be deleted.");
  if (org.settings?.deletionScheduledFor) return deletionState(org);

  const now = new Date();
  const when = new Date(now.getTime() + DELETION_GRACE_DAYS * 86_400_000);
  await org.update({
    settings: { ...org.settings, deletionRequestedAt: now.toISOString(), deletionScheduledFor: when.toISOString(), deletionRequestedBy: actor.id },
  });

  await recordAudit({
    organizationId: org.id, actorId: actor.id, actorName: actor.name, ip: actor.ip,
    action: "workspace.deletion_scheduled", entityType: "organization", entityId: org.id,
    metadata: { scheduledFor: when.toISOString() },
  });

  // Tell the owner, so a deletion nobody meant to request is noticed in time.
  const day = when.toUTCString().slice(0, 16);
  await sendEmail({
    to: actor.email,
    subject: `${org.name} will be deleted on ${day}`,
    text: `Deletion of the workspace "${org.name}" was requested. All of its data will be permanently removed on ${day}.\n\nIf this wasn't you, or you've changed your mind, sign in and cancel the deletion before then.`,
    html: `<p>Deletion of the workspace <strong>${org.name.replace(/</g, "&lt;")}</strong> was requested. All of its data will be permanently removed on <strong>${day}</strong>.</p><p>If this wasn't you, or you've changed your mind, sign in and cancel the deletion before then.</p>`,
  }).catch((err) => console.error("[Workspace] Deletion notice email failed:", err.message));

  return deletionState(org);
}

export async function cancelDeletion(org: Organization, actor: { id: string; name: string; ip?: string | null }) {
  if (!org.settings?.deletionScheduledFor) return deletionState(org);
  const settings = { ...org.settings };
  delete settings.deletionScheduledFor;
  delete settings.deletionRequestedAt;
  delete settings.deletionRequestedBy;
  await org.update({ settings });
  await recordAudit({
    organizationId: org.id, actorId: actor.id, actorName: actor.name, ip: actor.ip,
    action: "workspace.deletion_cancelled", entityType: "organization", entityId: org.id,
  });
  return deletionState(org);
}

export interface PurgeResult {
  organizationId: string;
  slug: string;
  rowsDeleted: number;
  objectsDeleted: number | null;
  passes: number;
}

/**
 * Permanently removes a workspace: its stored files, every row in every tenant
 * table, and finally the organization itself. Irreversible — callers are
 * responsible for the confirmation step.
 *
 * Tables reference each other with a mix of SET NULL, CASCADE and NO ACTION, and
 * there are ~70 of them, so rather than hand-maintain a deletion order this makes
 * repeated passes: each DELETE runs in a savepoint, one that trips a foreign key
 * is rolled back and retried after its dependents have gone, and the loop ends
 * when a pass removes nothing. If rows remain, the whole transaction rolls back
 * and nothing is deleted.
 */
export async function purgeWorkspace(organizationId: string): Promise<PurgeResult> {
  const org = await runAsSystem("purge:load", () => Organization.findByPk(organizationId));
  if (!org) throw new Error("Workspace not found");
  if (org.isPlatform) throw new Error("The platform workspace cannot be purged.");

  // Files first: if this fails the rows are still there and the purge can be retried.
  // Storage problems must not strand a customer's request forever, so an S3 error
  // is logged and reported rather than fatal.
  let objectsDeleted: number | null = null;
  try {
    objectsDeleted = await deleteOrgObjects(org.id);
  } catch (err: any) {
    console.error(`[Workspace] Could not delete stored files for ${org.slug}:`, err.message);
  }

  const tables = TENANT_MODELS.map((m) => m.getTableName() as string);
  let rowsDeleted = 0;
  let passes = 0;

  await sequelize.transaction(async (t) => {
    let remaining = [...tables];
    while (remaining.length) {
      passes++;
      const stuck: string[] = [];
      let progressed = false;

      for (const [i, table] of remaining.entries()) {
        const sp = `sp_${passes}_${i}`;
        await sequelize.query(`SAVEPOINT ${sp}`, { transaction: t });
        try {
          const [, meta] = (await sequelize.query(`DELETE FROM "${table}" WHERE "organizationId" = :id`, {
            replacements: { id: org.id }, transaction: t,
          })) as [unknown, { rowCount?: number }];
          rowsDeleted += meta?.rowCount ?? 0;
          progressed = true;
          await sequelize.query(`RELEASE SAVEPOINT ${sp}`, { transaction: t });
        } catch (err: any) {
          await sequelize.query(`ROLLBACK TO SAVEPOINT ${sp}`, { transaction: t });
          if (err?.parent?.code !== "23503") throw err; // only foreign-key ordering is retryable
          stuck.push(table);
        }
      }

      if (stuck.length && !progressed) {
        throw new Error(`Could not purge ${org.slug}: foreign keys still block ${stuck.join(", ")}`);
      }
      remaining = stuck;
    }

    // role_permissions has no organizationId but cascades from roles, which are gone.
    await sequelize.query(`DELETE FROM "organizations" WHERE id = :id`, { replacements: { id: org.id }, transaction: t, type: QueryTypes.DELETE });
  });

  console.log(`[Workspace] Purged ${org.slug}: ${rowsDeleted} rows, ${objectsDeleted ?? "unknown"} files, ${passes} pass(es).`);
  return { organizationId: org.id, slug: org.slug, rowsDeleted, objectsDeleted, passes };
}

/** The daily job: purge every workspace whose grace period has ended. */
export async function purgeDueWorkspaces(): Promise<PurgeResult[]> {
  const orgs = await runAsSystem("purge:find-due", () => Organization.findAll({ where: { isPlatform: false } }));
  const due = orgs.filter((o) => o.settings?.deletionScheduledFor && new Date(o.settings.deletionScheduledFor).getTime() <= Date.now());

  const done: PurgeResult[] = [];
  for (const org of due) {
    try {
      done.push(await purgeWorkspace(org.id));
    } catch (err: any) {
      // One stuck workspace must not stop the rest, and it stays scheduled so the
      // next run tries again.
      console.error(`[Workspace] Purge of ${org.slug} failed:`, err.message);
    }
  }
  return done;
}

