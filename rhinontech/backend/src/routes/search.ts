import { Router, Response } from "express";
import { authenticate, requireInternal, AuthRequest } from "../middleware/authenticate";
import { searchWorkspace } from "../services/search";

/** GET /search?q= — the ⌘K search box. Internal staff only. */
const router = Router();
router.use(authenticate, requireInternal);

router.get("/", async (req: AuthRequest, res: Response) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (q.length < 2) {
    res.json({ query: q, results: [] });
    return;
  }
  if (q.length > 100) {
    res.status(400).json({ message: "Search text is too long." });
    return;
  }
  try {
    res.json({ query: q, results: await searchWorkspace(req, q) });
  } catch (err) {
    console.error("[Search] failed:", err instanceof Error ? err.message : err);
    res.status(500).json({ message: "Search failed" });
  }
});

export default router;
