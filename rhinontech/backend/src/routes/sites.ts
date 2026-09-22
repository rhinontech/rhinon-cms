import { Router, Response } from "express";
import { Site } from "../models";
import { authenticate, AuthRequest } from "../middleware/authenticate";

const router = Router();
router.use(authenticate);

/**
 * GET /sites — the brands in the signed-in workspace.
 *
 * Intentionally behind no permission beyond being signed in. Every brand-split
 * module (Inbox, CRM, Outreach, Automation, Analytics, Content) has to read this
 * list before it can render anything, and each of those sits behind a different
 * permission — gating the list on any one of them would blank the picker for
 * someone who legitimately has the others. The list itself is just brand names,
 * and it is tenant-scoped, so it discloses nothing across workspaces.
 */
router.get("/", async (_req: AuthRequest, res: Response) => {
  try {
    const sites = await Site.findAll({
      order: [
        ["isDefault", "DESC"],
        ["name", "ASC"],
      ],
    });
    res.json(sites);
  } catch (err: any) {
    console.error("[Sites] List failed:", err.message);
    res.status(500).json({ message: "Could not load sites" });
  }
});

export default router;
