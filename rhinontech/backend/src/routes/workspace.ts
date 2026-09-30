import { Router, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { authenticate, AuthRequest } from "../middleware/authenticate";
import { rateLimit } from "../middleware/rateLimit";
import { Organization } from "../models/Organization";
import { User } from "../models/User";
import { auditRequest, clientIp } from "../services/audit";
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

export default router;
