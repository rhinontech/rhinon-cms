import { Router, Response } from "express";
import { authenticate, requireInternal, AuthRequest } from "../middleware/authenticate";
import { Organization } from "../models";
import { approvalCounts, homeSummary, pendingApprovals } from "../services/homeSummary";

/**
 * The Home screen: what needs this person's attention, their day, and the
 * first-run checklist. Internal staff only — collaborators live in the portal.
 */
const router = Router();
router.use(authenticate, requireInternal);

/** GET /home/summary — one request for the whole Home screen. */
router.get("/summary", async (req: AuthRequest, res: Response) => {
  try {
    res.json(await homeSummary(req));
  } catch (err) {
    console.error("[Home] summary failed:", err instanceof Error ? err.message : err);
    res.status(500).json({ message: "Could not load your home screen" });
  }
});

/** GET /home/approvals — every request waiting on a decision this person can make. */
router.get("/approvals", async (req: AuthRequest, res: Response) => {
  try {
    res.json(await pendingApprovals(req));
  } catch (err) {
    console.error("[Home] approvals failed:", err instanceof Error ? err.message : err);
    res.status(500).json({ message: "Could not load approvals" });
  }
});

/** GET /home/approvals/count — the sidebar badge. Counts only, so it stays cheap. */
router.get("/approvals/count", async (req: AuthRequest, res: Response) => {
  try {
    res.json(await approvalCounts(req));
  } catch {
    res.json({ total: 0 });
  }
});

const GOALS = ["sell", "deliver", "team"] as const;

/**
 * PUT /home/onboarding — the owner's answer to "what do you want to do first?",
 * or hiding the setup checklist. Stored on the workspace so every device agrees.
 */
router.put("/onboarding", async (req: AuthRequest, res: Response) => {
  if (req.user!.roleSlug !== "superadmin") {
    res.status(403).json({ message: "Only the workspace owner can change setup." });
    return;
  }
  const goal = req.body?.goal;
  const dismissed = req.body?.dismissed;
  if (goal !== undefined && !GOALS.includes(goal)) {
    res.status(400).json({ message: "Choose one of: sell, deliver, team." });
    return;
  }
  if (dismissed !== undefined && typeof dismissed !== "boolean") {
    res.status(400).json({ message: "dismissed must be true or false." });
    return;
  }

  const org = await Organization.findByPk(req.user!.organizationId);
  if (!org) { res.status(404).json({ message: "Workspace not found" }); return; }

  const now = new Date().toISOString();
  const onboarding = { ...(org.settings?.onboarding ?? {}) };
  if (goal !== undefined) Object.assign(onboarding, { goal, answeredAt: now });
  if (dismissed === true) onboarding.dismissedAt = now;
  if (dismissed === false) delete onboarding.dismissedAt;

  await org.update({ settings: { ...org.settings, onboarding } });
  res.json({ onboarding });
});

export default router;
