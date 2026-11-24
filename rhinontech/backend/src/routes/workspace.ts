import { Router, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { authenticate, AuthRequest } from "../middleware/authenticate";
import { rateLimit } from "../middleware/rateLimit";
import { Organization } from "../models/Organization";
import { User } from "../models/User";
import { Role } from "../models/Role";
import { sequelize } from "../config/database";
import { auditRequest, clientIp } from "../services/audit";
import { generateApiKey } from "../services/orgProvisioning";
import {
  streamWorkspaceExport, scheduleDeletion, cancelDeletion, deletionState, DELETION_GRACE_DAYS,
} from "../services/workspaceLifecycle";

/**
 * Workspace-level data controls: take your data out, or have it deleted.
 *
 * Owner only. A customer's superadmin is the one person entitled to do either, so
 * these check the role rather than a permission that a custom role could be
 * granted.
 */
const router = Router();
router.use(authenticate);

function requireOwner(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.roleSlug !== "superadmin" || req.user.userType === "guest") {
    res.status(403).json({ message: "Only the workspace owner can do this." });
    return;
  }
  next();
}

// A full export walks every table; a handful an hour is plenty for a human.
const exportLimiter = rateLimit({ name: "workspace-export", windowMs: 60 * 60_000, max: 5, message: "Too many exports. Try again later." });
const deletionLimiter = rateLimit({ name: "workspace-deletion", windowMs: 60 * 60_000, max: 10 });

router.get("/export", requireOwner, exportLimiter, async (req: AuthRequest, res: Response) => {
  void auditRequest(req, "workspace.export", { entityType: "organization", entityId: req.user!.organizationId });
  try {
    await streamWorkspaceExport(req.user!.organizationId, res);
  } catch (err: any) {
    console.error("[Workspace] Export failed:", err.message);
    // Headers are already out once streaming starts; the truncated body is the signal.
    if (!res.headersSent) res.status(500).json({ message: "Could not export the workspace." });
    else res.destroy(err);
  }
});

router.get("/deletion", requireOwner, async (req: AuthRequest, res: Response) => {
  const org = await Organization.findByPk(req.user!.organizationId);
  if (!org) { res.status(404).json({ message: "Workspace not found" }); return; }
  res.json(deletionState(org));
});

/** Modules an owner may switch off. Home, Settings and the platform's own modules always stay. */
const SWITCHABLE_MODULES = ["crm", "outreach", "inbox", "chatbot", "analytics", "work", "chat", "meetings", "pages", "employees", "attendance", "payroll", "performance"];

/**
 * PUT /workspace/modules — hide modules this workspace doesn't use, so a sales
 * team isn't looking at payroll. Declutters menus, Home and search; it is not a
 * permission (roles still decide access), so the API routes stay as they are.
 */
router.put("/modules", requireOwner, async (req: AuthRequest, res: Response) => {
  const list = req.body?.disabledModules;
  if (!Array.isArray(list) || list.some((m) => typeof m !== "string" || !SWITCHABLE_MODULES.includes(m))) {
    res.status(400).json({ message: `disabledModules must be a list drawn from: ${SWITCHABLE_MODULES.join(", ")}` });
    return;
  }
  const org = await Organization.findByPk(req.user!.organizationId);
  if (!org) { res.status(404).json({ message: "Workspace not found" }); return; }
  const disabledModules = [...new Set(list as string[])];
  await org.update({ settings: { ...org.settings, disabledModules } });
  void auditRequest(req, "workspace.modules_changed", { entityType: "organization", entityId: org.id, metadata: { disabledModules } });
  res.json({ disabledModules });
});

const transferLimiter = rateLimit({ name: "ownership-transfer", windowMs: 60 * 60_000, max: 5, message: "Too many attempts. Try again later." });

/**
 * POST /workspace/transfer-ownership — hand the workspace to another person.
 * There is exactly one owner (superadmin) per workspace, so this swaps roles in
 * one transaction: they become the owner, you become an Admin. Password-confirmed.
 */
router.post("/transfer-ownership", requireOwner, transferLimiter, async (req: AuthRequest, res: Response) => {
  const targetId = String(req.body?.userId ?? "");
  const me = await User.unscoped().findByPk(req.user!.userId, { attributes: ["id", "passwordHash", "fullName"] });
  if (!me || !(await bcrypt.compare(String(req.body?.password ?? ""), me.passwordHash))) {
    res.status(401).json({ message: "Password is incorrect." });
    return;
  }
  if (!targetId || targetId === me.id) { res.status(400).json({ message: "Choose someone else to hand the workspace to." }); return; }
  const target = await User.findByPk(targetId, { attributes: ["id", "fullName", "status", "userType", "roleId"] });
  if (!target || target.status !== "active" || target.userType !== "internal") {
    res.status(400).json({ message: "Ownership can only go to an active member of this workspace." });
    return;
  }
  const [ownerRole, adminRole] = await Promise.all([Role.findOne({ where: { slug: "superadmin" } }), Role.findOne({ where: { slug: "admin" } })]);
  if (!ownerRole || !adminRole) { res.status(500).json({ message: "This workspace is missing its owner or Admin role. Contact support." }); return; }

  await sequelize.transaction(async (transaction) => {
    await User.update({ roleId: adminRole.id }, { where: { id: me.id }, transaction });
    await User.update({ roleId: ownerRole.id }, { where: { id: target.id }, transaction });
  });
  void auditRequest(req, "workspace.ownership_transferred", { entityType: "user", entityId: target.id, metadata: { from: me.id, to: target.id } });
  res.json({ message: `${target.fullName} now owns this workspace. You are an Admin. Sign in again to see your new access.` });
});

router.post("/deletion", requireOwner, deletionLimiter, async (req: AuthRequest, res: Response) => {
  const org = await Organization.findByPk(req.user!.organizationId);
  if (!org) { res.status(404).json({ message: "Workspace not found" }); return; }
  if (org.isPlatform) { res.status(400).json({ message: "The platform workspace cannot be deleted." }); return; }

  // Two separate confirmations, because this ends a company's data: type the
  // workspace's name AND prove it is really the owner at the keyboard.
  const confirmSlug = String(req.body?.confirmSlug ?? "").trim().toLowerCase();
  if (confirmSlug !== org.slug) {
    res.status(400).json({ message: `Type the workspace name "${org.slug}" to confirm.` });
    return;
  }
  const user = await User.unscoped().findByPk(req.user!.userId, { attributes: ["id", "fullName", "personalEmail", "passwordHash"] });
  if (!user || !(await bcrypt.compare(String(req.body?.password ?? ""), user.passwordHash))) {
    res.status(401).json({ message: "Password is incorrect." });
    return;
  }

  const state = await scheduleDeletion(org, { id: user.id, name: user.fullName, email: user.personalEmail, ip: clientIp(req) });
  res.status(202).json({
    ...state,
    message: `This workspace will be permanently deleted in ${DELETION_GRACE_DAYS} days. You can cancel until then.`,
  });
});

router.delete("/deletion", requireOwner, async (req: AuthRequest, res: Response) => {
  const org = await Organization.findByPk(req.user!.organizationId);
  if (!org) { res.status(404).json({ message: "Workspace not found" }); return; }
  res.json(await cancelDeletion(org, { id: req.user!.userId, name: req.user!.fullName, ip: clientIp(req) }));
});

// ── Public API key ───────────────────────────────────────────────────────────
// The key headless consumers (a marketing site reading blogs, say) send as
// `x-api-key`. Only its hash is stored, so it can be shown exactly once — when it
// is created or rotated. These endpoints show which key is live, and replace it.

router.get("/api-key", requireOwner, async (req: AuthRequest, res: Response) => {
  const org = await Organization.findByPk(req.user!.organizationId);
  if (!org) { res.status(404).json({ message: "Workspace not found" }); return; }
  res.json({ prefix: org.apiKeyPrefix, rotatedAt: org.apiKeyRotatedAt, exists: !!org.apiKeyHash, slug: org.slug });
});

const rotateLimiter = rateLimit({ name: "api-key-rotate", windowMs: 60 * 60_000, max: 10 });

router.post("/api-key/rotate", requireOwner, rotateLimiter, async (req: AuthRequest, res: Response) => {
  const org = await Organization.findByPk(req.user!.organizationId);
  if (!org) { res.status(404).json({ message: "Workspace not found" }); return; }

  const key = generateApiKey();
  const rotatedAt = new Date();
  await org.update({ apiKeyHash: key.hash, apiKeyPrefix: key.prefix, apiKeyRotatedAt: rotatedAt });
  void auditRequest(req, "workspace.api_key_rotated", { entityType: "organization", entityId: org.id });

  // The previous key stops working the moment this returns. Shown once, never again.
  res.json({ apiKey: key.key, prefix: key.prefix, rotatedAt });
});

export default router;
