import app from "./app";
import { env } from "./config/env";
import { sequelize } from "./config/database";
import { syncDatabase } from "./models";
import { Campaign } from "./models/Campaign";
import { Attendance } from "./models/Attendance";
import { finalizeDueOffboardings } from "./services/offboarding";
import { runWorkflowEngineCycle } from "./services/workflowEngine";
import { syncPermissionCatalog } from "./config/permissions";
import { seedPipelineStages } from "./config/pipeline";
import { isReEnrichmentEnabled, runReEnrichmentCycle } from "./services/reEnrichment";
import { Op } from "sequelize";
import cron from "node-cron";
import axios from "axios";
import { seedDefaultWorkflow } from "./config/seedWorkflow";
import { ensureCollaboratorRole } from "./services/collaboratorRole";
import { runTenancyMigration, auditOrphanRows } from "./services/tenancyMigration";
import { provisionAllOrganizations } from "./services/orgProvisioning";
import { runAsSystem } from "./services/tenantContext";
import { refreshSendingDomains } from "./services/siteSender";
import { dispatchDueEventEmails } from "./services/eventReminderJob";

async function autoClockOut() {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // Overnight shifts (clocked in yesterday, still open when this runs) keep
  // their original day's attendance record — only clockOut moves to "now".
  const openRecords = await Attendance.findAll({
    where: {
      date: { [Op.in]: [todayStr, yesterdayStr] },
      clockIn: { [Op.ne]: null } as any,
      clockOut: null as any,
    },
  });

  for (const record of openRecords) {
    const breaks = Array.isArray(record.breaks) ? [...record.breaks] : [];
    if (breaks.length && !breaks[breaks.length - 1].end) {
      breaks[breaks.length - 1] = { ...breaks[breaks.length - 1], end: now.toISOString() };
    }
    await record.update({ clockOut: now, breaks, note: "Auto clocked out at 4:00 AM" });
  }

  if (openRecords.length > 0) {
    console.log(`[Cron] Auto clocked out ${openRecords.length} employee(s) at 4:00 AM.`);
  }
}

async function start() {
  /**
   * Boot reads and writes every tenant's rows by design — the migration, the
   * permission catalog, per-org provisioning. runAsSystem declares that rather
   * than leaving the tenancy hooks to warn about it.
   *
   * It deliberately does NOT wrap app.listen: a server handle created inside a
   * system context would hand that context to every inbound request, so an
   * unauthenticated route (or a bug in authenticate) would silently run
   * unscoped instead of tripping the warning.
   */
  await runAsSystem("boot", bootstrap);
  listen();
}

async function bootstrap() {
  await sequelize.authenticate();
  console.log("Database connected");

  // Tenancy migration runs BEFORE sync, and that ordering is load-bearing:
  // sync({ alter }) cannot add organizationId to a populated table, cannot
  // convert a single-column UNIQUE into a composite one (alter never drops
  // constraints, by design), and cannot backfill. This does those first and
  // hands sync a schema it can reconcile.
  const tenancy = await runTenancyMigration();
  console.log(
    `[Tenancy] Default org ${tenancy.defaultOrgId} · ` +
      `${tenancy.columnsAdded} column(s) added · ${tenancy.rowsBackfilled} row(s) adopted` +
      (tenancy.sitesCreated ? ` · ${tenancy.sitesCreated} site(s), ${tenancy.contentMapped} content row(s) mapped` : "") +
      (tenancy.moduleRowsMapped ? ` · ${tenancy.moduleRowsMapped} module row(s) assigned to a site` : "") +
      (tenancy.columnsRenamed.length ? ` · renamed ${tenancy.columnsRenamed.join(", ")}` : "") +
      (tenancy.uniquesDropped.length
        ? ` · dropped global uniques: ${tenancy.uniquesDropped.join(", ")}`
        : "")
  );

  await syncDatabase();
  console.log("Models synced");

  const orphans = await auditOrphanRows();
  if (orphans.length) {
    console.warn(
      "[Tenancy] Rows with no organization (invisible to every tenant query): " +
        orphans.map((o) => `${o.table}=${o.orphans}`).join(", ")
    );
  }

  // Keep the DB permission catalog in sync with the code catalog (additive)
  try {
    const { total, created } = await syncPermissionCatalog();
    console.log(`[Permissions] Catalog synced (${total} permissions, ${created} new)`);
  } catch (err: any) {
    console.error("[Permissions] Catalog sync failed:", err.message);
  }

  // Every org gets its own roles, deal stages and board columns. The old
  // single-tenant seeders returned early if ANY row existed anywhere, which
  // would have left organization #2 with an empty pipeline and no roles.
  try {
    const touched = await provisionAllOrganizations();
    if (touched) console.log(`[Tenancy] Provisioned defaults for ${touched} organization(s)`);
  } catch (err: any) {
    console.error("[Tenancy] Org provisioning failed:", err.message);
  }

  // Prime the brand sending-domain cache before the first mail goes out —
  // mailer.ts reads it synchronously, so an empty cache would send the first
  // message of the process on the platform domain regardless of brand.
  try {
    await refreshSendingDomains();
  } catch (err: any) {
    console.error("[Mail] Could not load brand sending domains:", err.message);
  }

  // Repairs a collaborator role created before per-org provisioning shipped.
  try {
    await ensureCollaboratorRole();
  } catch (err: any) {
    console.error("[Collaborator] Role check failed:", err.message);
  }

  // Default task workflow + backfill of tasks onto it. Additive and idempotent,
  // so it is safe on every boot.
  try {
    const { created, backfilled } = await seedDefaultWorkflow();
    if (created.length || backfilled) {
      console.log(`[Workflow] ${created.length} status(es) created, ${backfilled} task(s) backfilled`);
    }
  } catch (err: any) {
    console.error("[Workflow] Seed failed:", err.message);
  }

  // Create the default deal stages on a fresh database (no-op once any exist)
  try {
    const { total, created } = await seedPipelineStages();
    console.log(`[CRM] Pipeline stages ready (${total} stages, ${created} new)`);
  } catch (err: any) {
    console.error("[CRM] Pipeline stage seed failed:", err.message);
  }

  // Catch up on exits whose last working day passed while the server was down
  try {
    await finalizeDueOffboardings();
  } catch (err: any) {
    console.error("[Offboarding] Boot-time finalize failed:", err.message);
  }

}

function listen() {
  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);

    // Stale-intel refresh: nightly at 3:30 AM IST, well clear of the outreach
    // scheduler. No-ops unless LEAD_REENRICH_ENABLED=true.
    if (isReEnrichmentEnabled()) {
      cron.schedule("30 3 * * *", async () => {
        try {
          const { scanned, refreshed, failed } = await runAsSystem("cron:re-enrichment", runReEnrichmentCycle);
          if (scanned > 0) {
            console.log(`[Re-enrichment] Scanned ${scanned}, refreshed ${refreshed}, failed ${failed}.`);
          }
        } catch (err: any) {
          console.error("[Re-enrichment] Cycle failed:", err.message);
        }
      }, { timezone: "Asia/Kolkata" });
      console.log("[Re-enrichment] Nightly refresh scheduled for 3:30 AM IST.");
    }

    // Auto clock-out: runs every day at 4:00 AM IST, closing out anyone still
    // clocked in (covers late/overnight shifts) without disturbing which day's
    // attendance record they land on.
    cron.schedule("0 4 * * *", async () => {
      console.log("[Cron] Running auto clock-out...");
      try {
        await runAsSystem("cron:auto-clock-out", autoClockOut);
      } catch (err: any) {
        console.error("[Cron] Auto clock-out failed:", err.message);
      }
    }, { timezone: "Asia/Kolkata" });

    // Scheduled offboardings: shortly after midnight IST, deactivate anyone whose
    // last working day has ended
    cron.schedule("5 0 * * *", async () => {
      try {
        await runAsSystem("cron:offboarding", finalizeDueOffboardings);
      } catch (err: any) {
        console.error("[Cron] Offboarding finalize failed:", err.message);
      }
    }, { timezone: "Asia/Kolkata" });

    // Outreach campaign engine: check every minute, one-shot fire for campaigns
    // whose runTime + startDate (exact calendar date, not a recurring weekday)
    // match right now. Each matching campaign is triggered independently so one
    // campaign's schedule can never cause another Active campaign to be sent.
    cron.schedule("* * * * *", async () => {
      const now = new Date();
      const hh = now.getHours().toString().padStart(2, "0");
      const mm = now.getMinutes().toString().padStart(2, "0");
      const currentTime = `${hh}:${mm}`;
      const todayStr = now.toISOString().slice(0, 10);

      try {
        const dueCampaigns = await runAsSystem("cron:outreach-scan", () => Campaign.findAll({
          where: { stage: "Active", autoSend: true },
          attributes: ["id", "startDate", "runTime"],
        }));

        const matches = dueCampaigns.filter((c) => {
          const runTime = c.runTime || "09:00";
          const campaignDateStr = new Date(c.startDate).toISOString().slice(0, 10);
          return runTime === currentTime && campaignDateStr === todayStr;
        });

        await Promise.allSettled(
          matches.map(async (c) => {
            console.log(`[Cron] Firing outreach engine for campaign ${c.id} at ${currentTime}`);
            await axios.get(`http://localhost:${env.port}/campaigns/cron/run`, {
              params: { campaignId: c.id },
              headers: { Authorization: `Bearer ${env.cronSecret}` },
            });
          })
        );
      } catch (err: any) {
        console.error("[Cron] Outreach schedule check failed:", err.message);
      }

      // Workflow execution engine: check pending wait steps and batch emails every minute
      try {
        await runAsSystem("cron:workflow-engine", runWorkflowEngineCycle);
      } catch (err: any) {
        console.error("[Cron] Workflow engine cycle failed:", err.message);
      }

      // Scheduled event emails (reminders, announcements) that have come due.
      try {
        const { processed } = await dispatchDueEventEmails();
        if (processed) console.log(`[Cron] Sent ${processed} scheduled event email(s)`);
      } catch (err: any) {
        console.error("[Cron] Event email dispatch failed:", err.message);
      }
    });
  });
}

// A rejected promise that escapes a handler must not kill the process and take
// every other tenant's in-flight request with it. Logged loudly instead, so it
// still shows up in `pm2 logs` as something to fix.
process.on("unhandledRejection", (reason) => {
  console.error("[UnhandledRejection]", reason instanceof Error ? reason.stack : reason);
});

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
