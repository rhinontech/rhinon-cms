import { Router, Response } from "express";
import multer from "multer";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import { uploadFixedObject, deleteObject, getPresignedReadUrl, objectExists, SIGNATURE_KEY } from "../services/storage";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });
const router = Router();
router.use(authenticate);

router.get("/signature", authorize("settings:read"), async (_req: AuthRequest, res: Response) => {
  const exists = await objectExists(SIGNATURE_KEY);
  if (!exists) { res.json({ url: null }); return; }
  const url = await getPresignedReadUrl(SIGNATURE_KEY);
  res.json({ url });
});

router.post("/signature", authorize("settings:write"), upload.single("signature"), async (req: AuthRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ message: "No file provided" }); return; }
  if (req.file.mimetype !== "image/png") {
    res.status(400).json({ message: "Signature must be a PNG (ideally with a transparent background)" });
    return;
  }
  await uploadFixedObject(SIGNATURE_KEY, req.file.buffer, "image/png");
  const url = await getPresignedReadUrl(SIGNATURE_KEY);
  res.json({ message: "Signature uploaded", url });
});

router.delete("/signature", authorize("settings:write"), async (_req: AuthRequest, res: Response) => {
  await deleteObject(SIGNATURE_KEY).catch(() => {});
  res.json({ message: "Signature removed" });
});

export default router;
