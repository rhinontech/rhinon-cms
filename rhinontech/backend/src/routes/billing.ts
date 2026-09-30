import { Router, Response } from "express";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import { usageSummary } from "../services/usage";
import { PLAN_LIMITS } from "../config/plans";
import { Organization } from "../models/Organization";
import { User } from "../models/User";
import { rateLimit } from "../middleware/rateLimit";
import { sendEmail } from "../services/mailer";
import { auditRequest } from "../services/audit";

const router = Router();
router.use(authenticate);

/**
 * What the signed-in workspace is on and how much of it is used. Readable by any
 * internal user with settings access; it is how the UI shows the trial banner,
 * the seat meter and "you have hit your daily limit".
 */
router.get("/usage", authorize("settings:read"), async (req: AuthRequest, res: Response) => {
  const summary = await usageSummary(req.user!.organizationId);
  if (!summary) { res.status(404).json({ message: "Workspace not found" }); return; }
  const org = await Organization.findByPk(req.user!.organizationId, { attributes: ["settings", "isPlatform"] });
  res.json({ ...summary, isPlatform: !!org?.isPlatform, upgradeRequest: org?.settings?.upgradeRequest ?? null });
});

/** The plan catalogue, for an upgrade screen. */
router.get("/plans", authorize("settings:read"), (_req: AuthRequest, res: Response) => {
  res.json(Object.entries(PLAN_LIMITS).map(([id, limits]) => ({ id, ...limits })));
});

/**
 * "We'd like a different plan." There is no checkout yet, so this is how a
 * workspace owner asks: it emails the platform team, stamps the request on the
 * workspace (platform staff see it flagged in their list and clear it by changing
 * the plan), and lands in the audit trail.
 */
const upgradeLimiter = rateLimit({ name: "upgrade-request", windowMs: 60 * 60_000, max: 5, message: "You have already sent a few requests. We will be in touch." });

router.post("/upgrade-request", upgradeLimiter, async (req: AuthRequest, res: Response) => {
  if (req.user!.roleSlug !== "superadmin") {
    res.status(403).json({ message: "Only the workspace owner can request a plan change." });
    return;
  }
  const plan = String(req.body?.plan ?? "");
  if (!["starter", "enterprise"].includes(plan)) {
    res.status(400).json({ message: "Choose the plan you would like: starter or enterprise." });
    return;
  }
  const note = typeof req.body?.note === "string" ? req.body.note.trim().slice(0, 1000) : "";

  const org = await Organization.findByPk(req.user!.organizationId);
  if (!org) { res.status(404).json({ message: "Workspace not found" }); return; }
  if (org.isPlatform) { res.status(400).json({ message: "The platform workspace has no plan to change." }); return; }
  if (org.plan === plan) { res.status(400).json({ message: `This workspace is already on the ${PLAN_LIMITS[org.plan].label} plan.` }); return; }

  const owner = await User.unscoped().findByPk(req.user!.userId, { attributes: ["fullName", "personalEmail"] });
  const summary = await usageSummary(org.id);
  const to = process.env.UPGRADE_REQUEST_EMAIL || "support@rhinon.tech";
  const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const lines = [
    `Workspace: ${org.name} (${org.slug})`,
    `Owner: ${owner?.fullName} <${owner?.personalEmail}>`,
    `Current plan: ${PLAN_LIMITS[org.plan].label} (${org.status})`,
    `Requested plan: ${PLAN_LIMITS[plan as "starter" | "enterprise"].label}`,
    summary ? `Seats: ${summary.seats.used}/${summary.seats.limit ?? "unlimited"}` : "",
    note ? `\nNote from the owner:\n${note}` : "",
  ].filter(Boolean);

  try {
    await sendEmail({
      to,
      replyTo: owner?.personalEmail,
      subject: `Plan request: ${org.name} → ${PLAN_LIMITS[plan as "starter" | "enterprise"].label}`,
      text: lines.join("\n"),
      html: `<pre style="font-family:inherit;white-space:pre-wrap">${esc(lines.join("\n"))}</pre>`,
    });
  } catch (err: any) {
    console.error("[Billing] Upgrade request email failed:", err.message);
    res.status(502).json({ message: `We could not send your request. Please email ${to} directly.` });
    return;
  }

  await org.update({ settings: { ...org.settings, upgradeRequest: { plan, note: note || null, at: new Date().toISOString(), by: req.user!.userId } } });
  void auditRequest(req, "billing.upgrade_requested", { entityType: "organization", entityId: org.id, metadata: { plan } });
  res.status(202).json({ message: "Request sent. The Rhinon team will get back to you shortly.", plan });
});

export default router;
