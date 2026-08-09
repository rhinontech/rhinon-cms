import { Router, Response } from "express";
import { Op } from "sequelize";
import multer from "multer";
import { Blog, CaseStudy, Event } from "../models";
import type { BlogDomain } from "../models/Blog";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import { uploadBuffer, publicUrl } from "../services/storage";

const BLOG_DOMAINS: BlogDomain[] = ["rhinonlabs", "uppercurve"];
function parseDomain(value: unknown): BlogDomain {
  return BLOG_DOMAINS.includes(value as BlogDomain) ? (value as BlogDomain) : "rhinonlabs";
}

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
const MAX_VIDEO_MB = 100;
const uploadVideo = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_VIDEO_MB * 1024 * 1024 } });

router.use(authenticate);

// POST /content/upload-image — upload a blog/case-study image to S3 (public), returns a permanent URL
router.post("/upload-image", authorize("content:write"), upload.single("image"), async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ message: "No file provided" });
    return;
  }
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(req.file.mimetype)) {
    res.status(400).json({ message: "Only JPEG, PNG, WebP, or GIF images are allowed" });
    return;
  }
  try {
    const key = await uploadBuffer(req.file.buffer, req.file.originalname, "content", req.file.mimetype);
    res.status(201).json({ url: publicUrl(key), key });
  } catch (err: any) {
    console.error("Content image upload failed:", err);
    res.status(500).json({ message: "Image upload failed" });
  }
});

// POST /content/upload-video — upload a blog video to S3 (public), returns a permanent URL
router.post(
  "/upload-video",
  authorize("content:write"),
  (req: AuthRequest, res: Response, next) => {
    uploadVideo.single("video")(req as any, res as any, (err: any) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(413).json({ message: `Video exceeds the ${MAX_VIDEO_MB} MB limit` });
          return;
        }
        res.status(400).json({ message: err.message || "Video upload failed" });
        return;
      }
      next();
    });
  },
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      res.status(400).json({ message: "No file provided" });
      return;
    }
    const allowed = ["video/mp4", "video/webm", "video/quicktime"];
    if (!allowed.includes(req.file.mimetype)) {
      res.status(400).json({ message: "Only MP4, WebM, or MOV videos are allowed" });
      return;
    }
    try {
      const key = await uploadBuffer(req.file.buffer, req.file.originalname, "content", req.file.mimetype);
      res.status(201).json({ url: publicUrl(key), key });
    } catch (err: any) {
      console.error("Content video upload failed:", err);
      res.status(500).json({ message: "Video upload failed" });
    }
  }
);

function slugify(input: string): string {
  return (input || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Build a slug that's unique within `model`, ignoring the row being updated (excludeId).
async function uniqueSlug(model: any, base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || "untitled";
  let candidate = root;
  let n = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const where: any = { slug: candidate };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const clash = await model.findOne({ where });
    if (!clash) return candidate;
    candidate = `${root}-${n++}`;
  }
}

/* ----------------------------- BLOGS ----------------------------- */

// GET /content/blogs?domain=rhinonlabs|uppercurve — all blogs (drafts included) for the CMS,
// scoped to one site's blog (defaults to rhinonlabs when omitted).
router.get("/blogs", authorize("content:read"), async (req: AuthRequest, res: Response) => {
  const blogs = await Blog.findAll({ where: { domain: parseDomain(req.query.domain) }, order: [["updatedAt", "DESC"]] });
  res.json(blogs);
});

// GET /content/blogs/:id — single blog (for the editor)
router.get("/blogs/:id", authorize("content:read"), async (req: AuthRequest, res: Response) => {
  const blog = await Blog.findByPk(req.params.id);
  if (!blog) { res.status(404).json({ message: "Blog not found" }); return; }
  res.json(blog);
});

// POST /content/blogs
router.post("/blogs", authorize("content:write"), async (req: AuthRequest, res: Response) => {
  try {
    const b = req.body || {};
    const hasBlocks = Array.isArray(b.contentBlocks) && b.contentBlocks.length > 0;
    if (!b.title || !b.excerpt || (!b.content && !hasBlocks)) {
      res.status(400).json({ message: "title, excerpt and content (or content blocks) are required" });
      return;
    }
    const slug = await uniqueSlug(Blog, b.slug || b.title);
    const blog = await Blog.create({
      ...b,
      content: b.content || "",
      slug,
      domain: parseDomain(b.domain),
      createdById: req.user!.userId,
    });
    res.status(201).json(blog);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /content/blogs/:id
router.put("/blogs/:id", authorize("content:write"), async (req: AuthRequest, res: Response) => {
  try {
    const blog = await Blog.findByPk(req.params.id);
    if (!blog) { res.status(404).json({ message: "Blog not found" }); return; }
    const b = { ...req.body };
    delete b.id;
    delete b.createdById;
    // Domain is set at creation time and never re-assigned from the editor.
    delete b.domain;
    // Re-slug only when an explicit slug/title change requires it
    if (b.slug && b.slug !== blog.slug) {
      b.slug = await uniqueSlug(Blog, b.slug, blog.id);
    } else {
      delete b.slug;
    }
    await blog.update(b);
    res.json(blog);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /content/blogs/:id
router.delete("/blogs/:id", authorize("content:write"), async (req: AuthRequest, res: Response) => {
  const blog = await Blog.findByPk(req.params.id);
  if (!blog) { res.status(404).json({ message: "Blog not found" }); return; }
  await blog.destroy();
  res.json({ ok: true });
});

/* -------------------------- CASE STUDIES -------------------------- */

// GET /content/case-studies — all (drafts included)
router.get("/case-studies", authorize("content:read"), async (_req: AuthRequest, res: Response) => {
  const items = await CaseStudy.findAll({ order: [["displayOrder", "ASC"], ["updatedAt", "DESC"]] });
  res.json(items);
});

router.get("/case-studies/:id", authorize("content:read"), async (req: AuthRequest, res: Response) => {
  const item = await CaseStudy.findByPk(req.params.id);
  if (!item) { res.status(404).json({ message: "Case study not found" }); return; }
  res.json(item);
});

router.post("/case-studies", authorize("content:write"), async (req: AuthRequest, res: Response) => {
  try {
    const b = req.body || {};
    if (!b.title || !b.description) {
      res.status(400).json({ message: "title and description are required" });
      return;
    }
    const slug = await uniqueSlug(CaseStudy, b.slug || b.title);
    const item = await CaseStudy.create({
      ...b,
      slug,
      createdById: req.user!.userId,
    });
    res.status(201).json(item);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/case-studies/:id", authorize("content:write"), async (req: AuthRequest, res: Response) => {
  try {
    const item = await CaseStudy.findByPk(req.params.id);
    if (!item) { res.status(404).json({ message: "Case study not found" }); return; }
    const b = { ...req.body };
    delete b.id;
    delete b.createdById;
    if (b.slug && b.slug !== item.slug) {
      b.slug = await uniqueSlug(CaseStudy, b.slug, item.id);
    } else {
      delete b.slug;
    }
    await item.update(b);
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/case-studies/:id", authorize("content:write"), async (req: AuthRequest, res: Response) => {
  const item = await CaseStudy.findByPk(req.params.id);
  if (!item) { res.status(404).json({ message: "Case study not found" }); return; }
  await item.destroy();
  res.json({ ok: true });
});

/* ----------------------------- EVENTS ----------------------------- */
// Uppercurve's events — same shape/CRUD as Blogs, but a single-domain resource
// (no `domain` filter/field, since only uppercurve owns events).

// GET /content/events — all events (drafts included) for the CMS
router.get("/events", authorize("content:read"), async (_req: AuthRequest, res: Response) => {
  const events = await Event.findAll({ order: [["updatedAt", "DESC"]] });
  res.json(events);
});

// GET /content/events/:id — single event (for the editor)
router.get("/events/:id", authorize("content:read"), async (req: AuthRequest, res: Response) => {
  const event = await Event.findByPk(req.params.id);
  if (!event) { res.status(404).json({ message: "Event not found" }); return; }
  res.json(event);
});

// POST /content/events
router.post("/events", authorize("content:write"), async (req: AuthRequest, res: Response) => {
  try {
    const b = req.body || {};
    const hasBlocks = Array.isArray(b.contentBlocks) && b.contentBlocks.length > 0;
    if (!b.title || !b.excerpt || (!b.content && !hasBlocks)) {
      res.status(400).json({ message: "title, excerpt and content (or content blocks) are required" });
      return;
    }
    const slug = await uniqueSlug(Event, b.slug || b.title);
    const event = await Event.create({
      ...b,
      content: b.content || "",
      slug,
      createdById: req.user!.userId,
    });
    res.status(201).json(event);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /content/events/:id
router.put("/events/:id", authorize("content:write"), async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) { res.status(404).json({ message: "Event not found" }); return; }
    const b = { ...req.body };
    delete b.id;
    delete b.createdById;
    // Re-slug only when an explicit slug/title change requires it
    if (b.slug && b.slug !== event.slug) {
      b.slug = await uniqueSlug(Event, b.slug, event.id);
    } else {
      delete b.slug;
    }
    await event.update(b);
    res.json(event);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /content/events/:id
router.delete("/events/:id", authorize("content:write"), async (req: AuthRequest, res: Response) => {
  const event = await Event.findByPk(req.params.id);
  if (!event) { res.status(404).json({ message: "Event not found" }); return; }
  await event.destroy();
  res.json({ ok: true });
});

export default router;
