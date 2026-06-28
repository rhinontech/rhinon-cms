import { Router, Response } from "express";
import { DocsAccess } from "../models";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";

const router = Router();

router.use(authenticate);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /docs-access — list everyone granted access to the developer docs
router.get("/", authorize("docsAccess:read"), async (_req: AuthRequest, res: Response) => {
  const entries = await DocsAccess.findAll({ order: [["createdAt", "DESC"]] });
  res.json(entries);
});

// POST /docs-access — grant a new email access
router.post("/", authorize("docsAccess:write"), async (req: AuthRequest, res: Response) => {
  const email = (req.body?.email ?? "").toString().trim().toLowerCase();
  const note = ((req.body?.note ?? "").toString().trim().slice(0, 500)) || null;

  if (!email || !EMAIL_RE.test(email)) {
    res.status(400).json({ message: "A valid email is required" });
    return;
  }

  const [entry, created] = await DocsAccess.findOrCreate({
    where: { email },
    defaults: {
      email,
      grantedById: req.user?.userId ?? null,
      grantedByName: req.user?.fullName ?? null,
      note,
    },
  });

  if (!created) {
    res.status(200).json({ ...entry.toJSON(), deduped: true });
    return;
  }
  res.status(201).json(entry);
});

// DELETE /docs-access/:id — revoke access
router.delete("/:id", authorize("docsAccess:write"), async (req: AuthRequest, res: Response) => {
  const entry = await DocsAccess.findByPk(req.params.id);
  if (!entry) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  await entry.destroy();
  res.json({ message: "Access revoked" });
});

export default router;
