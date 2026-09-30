import { Router, Response } from "express";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import { usageSummary } from "../services/usage";
import { PLAN_LIMITS } from "../config/plans";

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
  res.json(summary);
});

/** The plan catalogue, for an upgrade screen. */
router.get("/plans", authorize("settings:read"), (_req: AuthRequest, res: Response) => {
  res.json(Object.entries(PLAN_LIMITS).map(([id, limits]) => ({ id, ...limits })));
});

export default router;
