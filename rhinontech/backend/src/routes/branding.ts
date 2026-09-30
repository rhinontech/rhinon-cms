import { Router, Response } from "express";
import multer from "multer";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import { Organization } from "../models";
import { uploadFixedObject, deleteObject, getPresignedReadUrl, resolveSignatureKey, signatureKey, signatureKeysToDelete } from "../services/storage";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });
const router = Router();
router.use(authenticate);

router.get("/signature", authorize("settings:read"), async (_req: AuthRequest, res: Response) => {
  const key = await resolveSignatureKey();
  if (!key) { res.json({ url: null }); return; }
  const url = await getPresignedReadUrl(key);
  res.json({ url });
});

router.post("/signature", authorize("settings:write"), upload.single("signature"), async (req: AuthRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ message: "No file provided" }); return; }
  if (req.file.mimetype !== "image/png") {
    res.status(400).json({ message: "Signature must be a PNG (ideally with a transparent background)" });
    return;
  }
  const key = signatureKey();
  await uploadFixedObject(key, req.file.buffer, "image/png");
  const url = await getPresignedReadUrl(key);
  res.json({ message: "Signature uploaded", url });
});

router.delete("/signature", authorize("settings:write"), async (_req: AuthRequest, res: Response) => {
  for (const key of await signatureKeysToDelete()) await deleteObject(key).catch(() => {});
  res.json({ message: "Signature removed" });
});

/**
 * The workspace's own brand profile — what outbound mail and the AI sales agent
 * say about the company. Until companyKnowledge is written the agent is told it
 * has nothing true to say, rather than borrowing another company's pitch.
 */
router.get("/company", authorize("settings:read"), async (req: AuthRequest, res: Response) => {
  const org = await Organization.findByPk(req.user!.organizationId);
  if (!org) { res.status(404).json({ message: "Workspace not found" }); return; }
  res.json({
    name: org.name,
    displayName: org.settings?.displayName ?? org.name,
    address: org.settings?.address ?? null,
    companyKnowledge: org.settings?.companyKnowledge ?? "",
    isPlatform: org.isPlatform,
  });
});

router.put("/company", authorize("settings:write"), async (req: AuthRequest, res: Response) => {
  const org = await Organization.findByPk(req.user!.organizationId);
  if (!org) { res.status(404).json({ message: "Workspace not found" }); return; }

  const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);
  const displayName = text(req.body?.displayName, 120);
  const address = text(req.body?.address, 500);
  const companyKnowledge = text(req.body?.companyKnowledge, 20000);

  if (displayName !== undefined && displayName.length === 0) {
    res.status(400).json({ message: "Display name cannot be empty" });
    return;
  }

  const settings = { ...(org.settings ?? {}) };
  if (displayName !== undefined) settings.displayName = displayName;
  if (address !== undefined) settings.address = address || null;
  if (companyKnowledge !== undefined) settings.companyKnowledge = companyKnowledge || null;
  await org.update({ settings });

  res.json({
    displayName: settings.displayName ?? org.name,
    address: settings.address ?? null,
    companyKnowledge: settings.companyKnowledge ?? "",
  });
});

export default router;
