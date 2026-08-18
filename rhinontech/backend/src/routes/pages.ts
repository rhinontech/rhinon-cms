import { Router, Response } from "express";
import { Op } from "sequelize";
import multer from "multer";
import { Page, PageShare, PageAttachment, User } from "../models";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import { sequelize } from "../config/database";
import { uploadBuffer, getPresignedReadUrl, deleteObject } from "../services/storage";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.use(authenticate, authorize("pages:read"));

type AccessLevel = "view" | "edit";

interface PageNode {
  id: string;
  parentId: string | null;
  ownerId: string;
  visibility: "private" | "workspace";
}

/**
 * Access is resolved by walking from the page up through its ancestors and
 * taking the FIRST (nearest) match — ownership, workspace visibility, or an
 * explicit share. This is what makes sharing/owning a parent page cascade
 * down to every descendant: a share on a page grants that same access to its
 * whole subtree, unless a closer ancestor (or the page itself) says otherwise.
 */
async function resolveAccess(pageId: string, userId: string): Promise<AccessLevel | null> {
  const allPages = await Page.findAll({
    where: { isArchived: false },
    attributes: ["id", "parentId", "ownerId", "visibility"],
    raw: true,
  }) as unknown as PageNode[];
  const byId = new Map(allPages.map((p) => [p.id, p]));

  const shareRows = await PageShare.findAll({ where: { userId }, attributes: ["pageId", "access"], raw: true });
  const shareByPageId = new Map(shareRows.map((s) => [s.pageId, s.access as AccessLevel]));

  let current = byId.get(pageId);
  let guard = 0;
  while (current && guard++ < 50) {
    if (current.ownerId === userId) return "edit";
    const shared = shareByPageId.get(current.id);
    if (shared) return shared;
    if (current.visibility === "workspace") return "view";
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return null;
}

/** Every page id visible to userId — used by both /tree and /search so they never drift apart. */
async function getVisiblePageIds(userId: string): Promise<Set<string>> {
  const allPages = await Page.findAll({
    where: { isArchived: false },
    attributes: ["id", "parentId", "ownerId", "visibility"],
    raw: true,
  }) as unknown as PageNode[];

  const childrenOf = new Map<string, string[]>();
  for (const p of allPages) {
    if (!p.parentId) continue;
    if (!childrenOf.has(p.parentId)) childrenOf.set(p.parentId, []);
    childrenOf.get(p.parentId)!.push(p.id);
  }

  const shareRows = await PageShare.findAll({ where: { userId }, attributes: ["pageId"], raw: true });
  const sharedIds = new Set(shareRows.map((s) => s.pageId));

  const visible = new Set<string>();
  const markVisible = (id: string) => {
    if (visible.has(id)) return;
    visible.add(id);
    (childrenOf.get(id) || []).forEach(markVisible);
  };

  for (const p of allPages) {
    if (p.ownerId === userId || p.visibility === "workspace" || sharedIds.has(p.id)) {
      markVisible(p.id);
    }
  }

  return visible;
}

async function requireAccess(pageId: string, userId: string, level: AccessLevel): Promise<Page | null> {
  const page = await Page.findOne({ where: { id: pageId, isArchived: false } });
  if (!page) return null;
  const access = await resolveAccess(pageId, userId);
  if (!access) return null;
  if (level === "edit" && access !== "edit") return null;
  return page;
}

// GET /pages/tree — every page visible to me (owned, shared, workspace-visible, or a
// descendant of any of those), flat list.
router.get("/tree", async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const visibleIds = await getVisiblePageIds(userId);

  const pages = await Page.findAll({
    where: { id: { [Op.in]: Array.from(visibleIds) } },
    attributes: ["id", "title", "icon", "parentId", "position", "ownerId", "visibility"],
    order: [["position", "ASC"], ["createdAt", "ASC"]],
  });

  res.json(pages);
});

// GET /pages/search?q= — title + body text match over pages visible to me.
router.get("/search", async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const q = ((req.query.q as string) || "").trim();
  if (!q) { res.json([]); return; }

  const visibleIds = await getVisiblePageIds(userId);
  if (visibleIds.size === 0) { res.json([]); return; }

  const pages = await Page.findAll({
    where: {
      id: { [Op.in]: Array.from(visibleIds) },
      [Op.or]: [
        { title: { [Op.iLike]: `%${q}%` } },
        sequelize.where(sequelize.cast(sequelize.col("content"), "text"), { [Op.iLike]: `%${q}%` }),
      ],
    },
    attributes: ["id", "title", "icon", "parentId"],
    limit: 25,
  });

  res.json(pages);
});

// POST /pages — create a page, optionally as a child of parentId (requires edit access to the parent).
router.post("/", authorize("pages:write"), async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { title, parentId } = req.body || {};

  if (parentId) {
    const parent = await requireAccess(parentId, userId, "edit");
    if (!parent) { res.status(403).json({ message: "No edit access to the parent page" }); return; }
  }

  const page = await Page.create({
    title: title || "Untitled",
    parentId: parentId || null,
    ownerId: userId,
  });
  res.status(201).json(page);
});

// GET /pages/:id — full doc + my access level + shares (shares only visible to the owner).
router.get("/:id", async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const page = await Page.findOne({ where: { id: req.params.id, isArchived: false } });
  if (!page) { res.status(404).json({ message: "Page not found" }); return; }

  const access = await resolveAccess(page.id, userId);
  if (!access) { res.status(403).json({ message: "You don't have access to this page" }); return; }

  const isOwner = page.ownerId === userId;
  const shares = isOwner
    ? await PageShare.findAll({
        where: { pageId: page.id },
        include: [{ model: User, as: "user", attributes: ["id", "fullName", "avatarKey"] }],
      })
    : [];

  res.json({ ...page.toJSON(), myAccess: access, shares });
});

// PUT /pages/:id — update; optimistic-concurrency guard via expectedUpdatedAt.
router.put("/:id", authorize("pages:write"), async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const page = await requireAccess(req.params.id, userId, "edit");
  if (!page) { res.status(403).json({ message: "You don't have edit access to this page" }); return; }

  const { expectedUpdatedAt, title, icon, coverImage, content, parentId, position, visibility } = req.body || {};
  if (expectedUpdatedAt && new Date(expectedUpdatedAt).getTime() !== new Date(page.updatedAt).getTime()) {
    res.status(409).json({ message: "This page was updated elsewhere. Reload to see the latest version." });
    return;
  }

  // Only the owner may reparent, reorder, or change visibility — editors edit content.
  const isOwner = page.ownerId === userId;
  const patch: any = {};
  if (title !== undefined) patch.title = title || "Untitled";
  if (icon !== undefined) patch.icon = icon;
  if (coverImage !== undefined) patch.coverImage = coverImage;
  if (content !== undefined) patch.content = content;
  if (isOwner) {
    if (parentId !== undefined) patch.parentId = parentId;
    if (position !== undefined) patch.position = position;
    if (visibility !== undefined) patch.visibility = visibility;
  }

  await page.update(patch);
  res.json(page);
});

// DELETE /pages/:id — archive (cascades to children), owner only.
router.delete("/:id", authorize("pages:write"), async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const page = await Page.findOne({ where: { id: req.params.id, isArchived: false } });
  if (!page) { res.status(404).json({ message: "Page not found" }); return; }
  if (page.ownerId !== userId) { res.status(403).json({ message: "Only the owner can delete this page" }); return; }

  async function archiveTree(id: string) {
    await Page.update({ isArchived: true }, { where: { id } });
    const children = await Page.findAll({ where: { parentId: id, isArchived: false }, attributes: ["id"] });
    for (const child of children) await archiveTree(child.id);
  }
  await archiveTree(page.id);

  res.json({ ok: true });
});

// GET /pages/:id/attachments — files attached to this page. Attachments live in a
// private S3 prefix (unlike Content's public images), since a page's own access
// control (owner/share/workspace) should gate its files too — so each row gets a
// freshly-signed, short-lived download URL rather than a permanent public one.
router.get("/:id/attachments", async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const page = await requireAccess(req.params.id, userId, "view");
  if (!page) { res.status(403).json({ message: "You don't have access to this page" }); return; }

  const rows = await PageAttachment.findAll({
    where: { pageId: page.id },
    include: [{ model: User, as: "uploadedBy", attributes: ["id", "fullName"] }],
    order: [["createdAt", "DESC"]],
  });

  const withUrls = await Promise.all(
    rows.map(async (a) => ({ ...a.toJSON(), url: await getPresignedReadUrl(a.key) }))
  );
  res.json(withUrls);
});

// POST /pages/:id/attachments — upload a file of any type, requires edit access.
router.post("/:id/attachments", authorize("pages:write"), upload.single("file"), async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const page = await requireAccess(req.params.id, userId, "edit");
  if (!page) { res.status(403).json({ message: "You don't have edit access to this page" }); return; }
  if (!req.file) { res.status(400).json({ message: "No file provided" }); return; }

  try {
    const key = await uploadBuffer(req.file.buffer, req.file.originalname, "pages", req.file.mimetype);
    const attachment = await PageAttachment.create({
      pageId: page.id,
      name: req.file.originalname,
      key,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedById: userId,
    });
    const url = await getPresignedReadUrl(attachment.key);
    res.status(201).json({ ...attachment.toJSON(), uploadedBy: { id: userId, fullName: req.user!.fullName }, url });
  } catch (err: any) {
    console.error("Page attachment upload failed:", err);
    res.status(500).json({ message: "Upload failed" });
  }
});

// DELETE /pages/:id/attachments/:attachmentId — requires edit access.
router.delete("/:id/attachments/:attachmentId", authorize("pages:write"), async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const page = await requireAccess(req.params.id, userId, "edit");
  if (!page) { res.status(403).json({ message: "You don't have edit access to this page" }); return; }

  const attachment = await PageAttachment.findOne({ where: { id: req.params.attachmentId, pageId: page.id } });
  if (!attachment) { res.status(404).json({ message: "Attachment not found" }); return; }

  await deleteObject(attachment.key);
  await attachment.destroy();
  res.json({ ok: true });
});

// GET /pages/:id/shares — owner only.
router.get("/:id/shares", authorize("pages:write"), async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const page = await Page.findOne({ where: { id: req.params.id, isArchived: false } });
  if (!page) { res.status(404).json({ message: "Page not found" }); return; }
  if (page.ownerId !== userId) { res.status(403).json({ message: "Only the owner can view sharing" }); return; }

  const shares = await PageShare.findAll({
    where: { pageId: page.id },
    include: [{ model: User, as: "user", attributes: ["id", "fullName", "avatarKey"] }],
  });
  res.json(shares);
});

// PUT /pages/:id/shares — replace the share list, owner only. Body: [{ userId, access }]
router.put("/:id/shares", authorize("pages:write"), async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const page = await Page.findOne({ where: { id: req.params.id, isArchived: false } });
  if (!page) { res.status(404).json({ message: "Page not found" }); return; }
  if (page.ownerId !== userId) { res.status(403).json({ message: "Only the owner can manage sharing" }); return; }

  const list: Array<{ userId: string; access: "view" | "edit" }> = Array.isArray(req.body) ? req.body : [];

  await PageShare.destroy({ where: { pageId: page.id } });
  if (list.length) {
    await PageShare.bulkCreate(
      list
        .filter((s) => s.userId && s.userId !== page.ownerId)
        .map((s) => ({ pageId: page.id, userId: s.userId, access: s.access === "edit" ? "edit" : "view" }))
    );
  }

  const shares = await PageShare.findAll({
    where: { pageId: page.id },
    include: [{ model: User, as: "user", attributes: ["id", "fullName", "avatarKey"] }],
  });
  res.json(shares);
});

export default router;
