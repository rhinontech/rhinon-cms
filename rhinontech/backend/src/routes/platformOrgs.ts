import { Router, Response } from "express";
import { Op } from "sequelize";
import { Organization } from "../models";
import { User } from "../models/User";
import { authenticate, requirePlatformSuperadmin, AuthRequest } from "../middleware/authenticate";
import { applyPlan } from "../services/billing";
import { planState } from "../services/usage";
import { runAsSystem, runForOrg } from "../services/tenantContext";
import { recordAudit, clientIp } from "../services/audit";
import { purgeWorkspace } from "../services/workspaceLifecycle";
import { AuditLog } from "../models/AuditLog";
import { Role } from "../models/Role";
import { usageSummary } from "../services/usage";
import { customDomainView } from "../services/customDomain";
import { deletionState } from "../services/workspaceLifecycle";

/**
 * Platform operators managing customer workspaces: who is on what plan, extend a
 * trial, suspend or reinstate. Reachable only by the platform workspace's
 * superadmin — a customer's owner is also a superadmin, so the role check alone
 * would not be enough.
 */
const router = Router();
router.use(authenticate, requirePlatformSuperadmin);

const PLANS = ["free", "starter", "enterprise"] as const;
const STATUSES = ["active", "trial", "suspended"] as const;

const view = (org: Organization, seats?: number) => {
  const state = planState(org);
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    emailDomain: org.emailDomain,
    plan: org.plan,
    status: org.status,
    isPlatform: org.isPlatform,
    trialEndsAt: state.trialEndsAt,
    trialExpired: state.trialExpired,
    emailVerificationPending: !!org.settings?.pendingEmailVerification,
    upgradeRequest: org.settings?.upgradeRequest ?? null,
    deletionScheduledFor: org.settings?.deletionScheduledFor ?? null,
    createdAt: org.createdAt,
    ...(seats !== undefined ? { seats } : {}),
  };
};

router.get("/", async (req: AuthRequest, res: Response) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const orgs = await runAsSystem("platform:list-orgs", () =>
    Organization.findAll({
      where: q ? { [Op.or]: [{ name: { [Op.iLike]: `%${q}%` } }, { slug: { [Op.iLike]: `%${q}%` } }] } : {},
      order: [["createdAt", "DESC"]],
      limit: 200,
    })
  );
  const counts = await runAsSystem("platform:seat-counts", () =>
    User.count({ where: { status: "active", userType: "internal" }, group: ["organizationId"] })
  );
  const seatsByOrg = new Map((counts as unknown as { organizationId: string; count: number }[]).map((c) => [c.organizationId, Number(c.count)]));
  res.json(orgs.map((o) => view(o, seatsByOrg.get(o.id) ?? 0)));
});

/**
 * Everything support needs to answer "what is going on with this customer?" in one
 * call: plan and trial, usage today, seats, email domain status, pending deletion,
 * whether the owner verified their email, and the latest entries of their audit
 * trail. Read-only, and deliberately limited to state about the workspace — no
 * customer content (leads, messages, payroll) and no way to act as a user.
 */
router.get("/:id", async (req: AuthRequest, res: Response) => {
  const org = await runAsSystem("platform:get-org", () => Organization.findByPk(req.params.id));
  if (!org) { res.status(404).json({ message: "Workspace not found" }); return; }

  const { summary, audit, owner } = await runForOrg(org.id, async () => ({
    summary: await usageSummary(org.id),
    audit: await AuditLog.findAll({ order: [["createdAt", "DESC"]], limit: 50 }),
    owner: await User.findOne({
      where: { userType: "internal" },
      include: [{ model: Role, as: "role", where: { slug: "superadmin" }, required: true, attributes: [] }],
      attributes: ["fullName", "personalEmail", "companyEmail", "createdAt"],
    }),
  }));

  res.json({
    ...view(org),
    usage: summary,
    owner: owner ? { name: owner.fullName, email: owner.personalEmail, companyEmail: owner.companyEmail } : null,
    customDomain: customDomainView(org),
    deletion: deletionState(org),
    terms: { accepted: org.settings?.termsVersion ?? null, acceptedAt: org.settings?.termsAcceptedAt ?? null },
    recentAudit: audit,
  });
});

router.patch("/:id", async (req: AuthRequest, res: Response) => {
  const { plan, status, trialEndsAt, extendTrialDays } = req.body ?? {};

  if (plan !== undefined && !PLANS.includes(plan)) { res.status(400).json({ message: `plan must be one of ${PLANS.join(", ")}` }); return; }
  if (status !== undefined && !STATUSES.includes(status)) { res.status(400).json({ message: `status must be one of ${STATUSES.join(", ")}` }); return; }

  const target = await runAsSystem("platform:get-org", () => Organization.findByPk(req.params.id));
  if (!target) { res.status(404).json({ message: "Workspace not found" }); return; }
  if (target.isPlatform && (status === "suspended" || plan === "free")) {
    res.status(400).json({ message: "The platform workspace cannot be suspended or downgraded." });
    return;
  }

  let trialEnd: Date | null | undefined;
  if (trialEndsAt === null) trialEnd = null;
  else if (typeof trialEndsAt === "string") {
    trialEnd = new Date(trialEndsAt);
    if (Number.isNaN(trialEnd.getTime())) { res.status(400).json({ message: "trialEndsAt is not a valid date" }); return; }
  } else if (Number.isFinite(Number(extendTrialDays)) && Number(extendTrialDays) > 0) {
    // Extending counts from whichever is later: today, or the current deadline.
    const current = target.settings?.trialEndsAt ? new Date(target.settings.trialEndsAt).getTime() : 0;
    trialEnd = new Date(Math.max(Date.now(), current) + Number(extendTrialDays) * 86_400_000);
  }

  const updated = await applyPlan(target.id, { plan, status, trialEndsAt: trialEnd });
  console.log(`[Billing] ${req.user!.fullName} set ${target.slug}: ${JSON.stringify({ plan, status, trialEnd })}`);
  // Filed under the CUSTOMER's workspace, so their administrators can see that
  // and when platform staff changed their plan.
  void recordAudit({
    organizationId: target.id,
    actorId: req.user!.userId,
    actorName: `${req.user!.fullName} (platform)`,
    action: "billing.plan_changed",
    entityType: "organization",
    entityId: target.id,
    metadata: { plan: plan ?? null, status: status ?? null, trialEndsAt: trialEnd === undefined ? null : trialEnd },
    ip: clientIp(req),
  });
  res.json(view(updated!));
});

/**
 * Permanently remove a workspace — for abuse and spam signups. Requires the
 * workspace's slug in the body so a wrong id in the URL cannot delete the wrong
 * company. Customers delete their own workspace through /workspace/deletion,
 * which has a grace period; this does not.
 */
router.post("/:id/purge", async (req: AuthRequest, res: Response) => {
  const target = await runAsSystem("platform:get-org", () => Organization.findByPk(req.params.id));
  if (!target) { res.status(404).json({ message: "Workspace not found" }); return; }
  if (target.isPlatform) { res.status(400).json({ message: "The platform workspace cannot be purged." }); return; }
  if (String(req.body?.confirmSlug ?? "").trim().toLowerCase() !== target.slug) {
    res.status(400).json({ message: `Send confirmSlug: "${target.slug}" to confirm.` });
    return;
  }
  try {
    console.log(`[Billing] ${req.user!.fullName} is purging ${target.slug}`);
    res.json(await purgeWorkspace(target.id));
  } catch (err: any) {
    console.error("[Workspace] Platform purge failed:", err.message);
    res.status(500).json({ message: "Purge failed; nothing was deleted." });
  }
});

export default router;
