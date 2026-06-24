import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/authenticate";
import { Document } from "../models/Document";
import { User } from "../models/User";
import {
  getPresignedUploadUrl,
  getPresignedReadUrl,
  deleteObject,
} from "../services/storage";

const router = Router();
router.use(authenticate);

function isAdmin(req: AuthRequest): boolean {
  return req.user?.roleSlug === "superadmin" || req.user?.roleSlug === "hr";
}

// GET /documents
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const admin = isAdmin(req);

    const where: Record<string, unknown> = {};
    if (!admin) {
      where.employeeId = userId;
    } else if (req.query.employeeId) {
      where.employeeId = req.query.employeeId as string;
    }

    const docs = await Document.findAll({
      where,
      include: [
        { model: User, as: "employee", attributes: ["id", "fullName", "companyEmail", "department"] },
        { model: User, as: "uploader", attributes: ["id", "fullName"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch documents" });
  }
});

// GET /documents/employees (admin only)
router.get("/employees", async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const employees = await User.findAll({
      where: { status: "active" },
      attributes: ["id", "fullName", "companyEmail", "department"],
      order: [["fullName", "ASC"]],
    });

    // Count documents per employee
    const counts = await Document.findAll({
      attributes: ["employeeId"],
      raw: true,
    });

    const countMap: Record<string, number> = {};
    for (const doc of counts) {
      const eid = (doc as any).employeeId;
      countMap[eid] = (countMap[eid] || 0) + 1;
    }

    const result = employees.map((e) => ({
      id: e.id,
      fullName: e.fullName,
      companyEmail: e.companyEmail,
      department: e.department,
      documentCount: countMap[e.id] || 0,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch employees" });
  }
});

// POST /documents/presign
router.post("/presign", async (req: AuthRequest, res: Response) => {
  try {
    const { filename, mimeType, title, category } = req.body;
    const userId = req.user!.userId;
    // Allow "self" as a shorthand for the current user's own ID
    const employeeId = req.body.employeeId === "self" ? userId : req.body.employeeId;

    if (!isAdmin(req) && employeeId !== userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    if (!filename || !mimeType || !employeeId || !title || !category) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const { uploadUrl, key } = await getPresignedUploadUrl("documents", filename, mimeType);
    res.json({ uploadUrl, key });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate upload URL" });
  }
});

// POST /documents
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { title, category, fileKey, fileName, fileSize, mimeType } = req.body;
    const userId = req.user!.userId;
    const employeeId = req.body.employeeId === "self" ? userId : req.body.employeeId;

    if (!isAdmin(req) && employeeId !== userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const doc = await Document.create({
      employeeId,
      uploadedById: userId,
      title,
      category,
      fileKey,
      fileName,
      fileSize,
      mimeType,
      isRequest: false,
    });

    res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create document" });
  }
});

// POST /documents/request (admin only)
router.post("/request", async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const { employeeId, title, category, requestNote } = req.body;

    if (!employeeId || !title || !category) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const doc = await Document.create({
      employeeId,
      uploadedById: req.user!.userId,
      title,
      category,
      fileKey: null,
      isRequest: true,
      requestNote: requestNote || null,
    });

    res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create document request" });
  }
});

// PUT /documents/:id/upload
router.put("/:id/upload", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const doc = await Document.findByPk(req.params.id);

    if (!doc) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    if (doc.employeeId !== userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    if (!doc.isRequest) {
      res.status(400).json({ message: "Document is not a pending request" });
      return;
    }

    const { fileKey, fileName, fileSize, mimeType } = req.body;

    await doc.update({ fileKey, fileName, fileSize, mimeType, isRequest: false });
    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to upload document" });
  }
});

// GET /documents/:id/download
router.get("/:id/download", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const doc = await Document.findByPk(req.params.id);

    if (!doc) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    if (!isAdmin(req) && doc.employeeId !== userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    if (!doc.fileKey) {
      res.status(400).json({ message: "No file available" });
      return;
    }

    const downloadUrl = await getPresignedReadUrl(doc.fileKey);
    res.json({ downloadUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate download URL" });
  }
});

// DELETE /documents/:id (admin only)
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const doc = await Document.findByPk(req.params.id);
    if (!doc) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    if (doc.fileKey) {
      await deleteObject(doc.fileKey);
    }

    await doc.destroy();
    res.json({ message: "Document deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete document" });
  }
});

export default router;
