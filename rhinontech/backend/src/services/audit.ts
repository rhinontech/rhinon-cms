import type { Request, Response, NextFunction } from "express";
import { AuditLog } from "../models/AuditLog";
import { runForOrg } from "./tenantContext";
import type { AuthRequest } from "../middleware/authenticate";

/**
 * The audit trail.
 *
 * Two sources feed it:
 *   - explicit events for things a URL alone does not describe (sign-in, plan
 *     change, export, 2FA) — recordAudit();
 *   - a catch-all for successful writes to the sensitive modules — auditMutations,
 *     so a route added to one of them later is covered without anyone remembering.
 *
 * Writing the trail must never break the request it describes, so every failure
 * is swallowed into a log line.
 */
export interface AuditEvent {
  organizationId: string;
  actorId?: string | null;
  actorName?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
}

export async function recordAudit(event: AuditEvent): Promise<void> {
  try {
    await runForOrg(event.organizationId, () =>
      AuditLog.create({
        actorId: event.actorId ?? null,
        actorName: event.actorName ?? null,
        action: event.action,
        entityType: event.entityType ?? null,
        entityId: event.entityId ?? null,
        metadata: event.metadata ?? null,
        ip: event.ip ?? null,
      })
    );
  } catch (err: any) {
    console.error(`[Audit] Could not record ${event.action}:`, err.message);
  }
}

/** req.ip is the real client address (trust proxy is set to the one nginx hop). */
export const clientIp = (req: Request) => (req.ip || "").replace(/^::ffff:/, "") || null;

/** Audit an event on behalf of the signed-in user. */
export function auditRequest(req: AuthRequest, action: string, extra: Partial<AuditEvent> = {}) {
  if (!req.user) return Promise.resolve();
  return recordAudit({
    organizationId: req.user.organizationId,
    actorId: req.user.userId,
    actorName: req.user.fullName,
    action,
    ip: clientIp(req),
    ...extra,
  });
}

/**
 * Modules whose writes are worth a trail: who holds power, who is paid what, what
 * the workspace is called and how it is billed. Reads are not logged, and neither
 * are high-volume operational modules (inbox, tasks, tracking) where a line per
 * request would bury the entries an administrator actually looks for.
 */
const AUDITED_MOUNTS = new Set([
  "/roles", "/permissions", "/employees", "/payroll", "/people", "/branding",
  "/billing", "/letter-templates", "/mailbox-addresses", "/provisioning",
  "/google-calendar", "/linkedin", "/sites", "/documents", "/leave", "/performance",
  "/workspace", "/email-domain", "/analytics",
]);

export function auditMutations(req: Request, res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) { next(); return; }

  res.on("finish", () => {
    const r = req as AuthRequest;
    // Only successful writes by a signed-in user. Refused ones are already in the
    // request log, and an unauthenticated request has no workspace to file under.
    if (!r.user || res.statusCode >= 400 || !AUDITED_MOUNTS.has(r.baseUrl)) return;
    const route = `${r.baseUrl}${r.route?.path && r.route.path !== "/" ? r.route.path : ""}`;
    void recordAudit({
      organizationId: r.user.organizationId,
      actorId: r.user.userId,
      actorName: r.user.fullName,
      action: `${r.method} ${route}`,
      entityType: r.baseUrl.slice(1),
      entityId: typeof r.params?.id === "string" ? r.params.id : typeof r.params?.userId === "string" ? r.params.userId : null,
      ip: clientIp(r),
    });
  });
  next();
}
