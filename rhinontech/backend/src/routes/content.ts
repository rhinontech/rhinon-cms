import { Router, Response } from "express";
import { Op } from "sequelize";
import multer from "multer";
import { keepTenantContext } from "../services/tenantContext";
import { Blog, BlogTopic, CaseStudy, Event, Site } from "../models";
import type { BlogDomain } from "../models/Blog";
import { authenticate, authorize, requirePlatformOrg, AuthRequest } from "../middleware/authenticate";
import { uploadBuffer, publicUrl } from "../services/storage";
import eventsRouter from "./events";
import { generateBlogDraft, readTimeFor, type LinkTarget } from "../services/blogGenerator";
import { generateBlogImage } from "../services/aiImage";
import { pingIndexNow } from "../services/indexNow";

const BLOG_DOMAINS: BlogDomain[] = ["rhinonlabs", "uppercurve"];
function parseDomain(value: unknown): BlogDomain {
  return BLOG_DOMAINS.includes(value as BlogDomain) ? (value as BlogDomain) : "rhinonlabs";
}

/**
 * Resolves which of the workspace's sites a request is about.
 *
 * Accepts `?siteId=` (what the admin UI sends) or the legacy `?domain=` slug,
 * and falls back to the workspace's default site. Every query here is already
 * tenant-scoped, so this only ever picks between sites the caller owns — a
 * tenant with one site never has to send anything.
 */
async function resolveSite(query: Record<string, unknown>): Promise<Site | null> {
  const siteId = typeof query.siteId === "string" ? query.siteId : null;
  if (siteId) {
    const bySelection = await Site.findByPk(siteId);
    if (bySelection) return bySelection;
  }
  const slug = typeof query.domain === "string" ? query.domain : null;
  if (slug) {
    const bySlug = await Site.findOne({ where: { slug } });
    if (bySlug) return bySlug;
  }
  return (
    (await Site.findOne({ where: { isDefault: true } })) ?? (await Site.findOne())
  );
}

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
const MAX_VIDEO_MB = 100;
const uploadVideo = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_VIDEO_MB * 1024 * 1024 } });

router.use(authenticate);
// The CMS behind rhinonlabs.com and uppercurve — not part of a customer's
// workspace. Sites/Blog stay tenant-scoped so the data model needs no special
// case, but only the platform org can reach the admin CRUD.
router.use(requirePlatformOrg);

// GET /content/sites — the workspace's publishing brands. A tenant normally has
// exactly one, so the admin UI hides the picker when this returns a single row.
router.get("/sites", authorize("content:read"), async (_req: AuthRequest, res: Response) => {
  const sites = await Site.findAll({ order: [["isDefault", "DESC"], ["name", "ASC"]] });
  res.json(sites);
});

// POST /content/upload-image — upload a blog/case-study image to S3 (public), returns a permanent URL
router.post("/upload-image", authorize("content:write"), keepTenantContext(upload.single("image")), async (req: AuthRequest, res: Response) => {
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

/* ------------------------- AI BLOG TOPICS ------------------------- */

// Service pages are hard-coded routes on rhinonlabs (not CMS rows), so they're
// listed here for the generator's internal links.
const RHINONLABS_SERVICE_PAGES: LinkTarget[] = [
  { title: "MVP development", path: "/services/mvp-development" },
  { title: "AI agent development", path: "/services/ai-agents" },
  { title: "Workflow automation", path: "/services/workflow-automation" },
  { title: "Internal dashboards", path: "/services/internal-dashboards" },
  { title: "Website & web app development", path: "/services/web-development" },
  { title: "Mobile app development", path: "/services/mobile-app-development" },
  { title: "Start a project (startup ideas)", path: "/build" },
  { title: "Contact us", path: "/contact-us" },
];

async function linkTargetsFor(site: Site | null): Promise<LinkTarget[]> {
  const where: any = { status: "Published" };
  if (site) where.siteId = site.id;
  const blogs = await Blog.findAll({ where, attributes: ["title", "slug"], order: [["publishedAt", "DESC"]], limit: 40 });
  const targets: LinkTarget[] = blogs.map((b) => ({ title: b.title, path: `/blogs/${b.slug}` }));
  if (!site || site.slug === "rhinonlabs") {
    const studies = await CaseStudy.findAll({ where: { status: "Published" } as any, attributes: ["title", "slug"], limit: 20 });
    targets.push(...studies.map((c) => ({ title: `Case study: ${c.title}`, path: `/case-studies/${c.slug}` })));
    targets.push(...RHINONLABS_SERVICE_PAGES);
  }
  return targets;
}

/** Runs one generation to completion and records the outcome on the topic. Never throws. */
async function runTopicGeneration(topicId: string, userId: string): Promise<void> {
  const topic = await BlogTopic.findByPk(topicId);
  if (!topic) return;
  try {
    const site = topic.siteId ? await Site.findByPk(topic.siteId) : await resolveSite({});
    const draft = await generateBlogDraft(topic, await linkTargetsFor(site));
    // Byline matches the site's real posts: reuse the latest published post's
    // author, so a new avatar uploaded there carries over automatically.
    const latest = await Blog.findOne({
      where: { status: "Published", ...(site ? { siteId: site.id } : {}), authorAvatar: { [Op.ne]: null } } as any,
      order: [["publishedAt", "DESC"]],
      attributes: ["authorName", "authorRole", "authorAvatar"],
    });
    const blog = await Blog.create({
      title: draft.title,
      slug: await uniqueSlug(Blog, draft.slug),
      excerpt: draft.excerpt || draft.title,
      content: "",
      contentBlocks: [{ id: crypto.randomUUID(), type: "paragraph", html: draft.html }],
      faqs: draft.faqs,
      category: draft.category || null,
      metaTitle: draft.metaTitle || null,
      metaDescription: draft.metaDescription || null,
      coverImage: draft.coverImage,
      tags: draft.tags,
      readTime: readTimeFor(draft.html),
      // Always a draft: a person reviews and publishes from the editor.
      status: "Draft",
      siteId: site?.id ?? null,
      domain: parseDomain(site?.slug),
      ...(latest ? { authorName: latest.authorName, authorRole: latest.authorRole, authorAvatar: latest.authorAvatar } : {}),
      createdById: userId,
    } as any);
    await topic.update({
      status: "Drafted",
      blogId: blog.id,
      generatedAt: new Date(),
      error: draft.imageErrors.length ? `Draft saved, but some images failed: ${draft.imageErrors.join("; ")}` : null,
    });
  } catch (err: any) {
    console.error(`[Blog AI] Topic ${topicId} failed:`, err.message);
    await topic.update({ status: "Failed", error: String(err.message || err).slice(0, 1000) }).catch(() => {});
  }
}

// GET /content/topics?siteId=… — the topic queue, newest first
router.get("/topics", authorize("content:read"), async (req: AuthRequest, res: Response) => {
  const site = await resolveSite(req.query as Record<string, unknown>);
  const topics = await BlogTopic.findAll({
    where: site ? { siteId: site.id } : {},
    order: [["createdAt", "DESC"]],
  });
  res.json(topics);
});

// POST /content/topics — add one topic, or many with { topics: [...] }.
// Accepts plain strings ("Title") or objects ({ title, keyword, audience, notes, targetPage, withImages }).
router.post("/topics", authorize("content:write"), async (req: AuthRequest, res: Response) => {
  const b = req.body || {};
  const list: any[] = Array.isArray(b.topics) ? b.topics : [b];
  const site = await resolveSite({ ...(req.query as any), ...b });
  const str = (v: unknown, max: number) => {
    const s = (v ?? "").toString().trim();
    return s ? s.slice(0, max) : null;
  };
  const rows = list
    .map((t) => (typeof t === "string" ? { title: t } : t || {}))
    .filter((t) => str(t.title, 300))
    .map((t) => ({
      title: str(t.title, 300)!,
      keyword: str(t.keyword, 200),
      audience: str(t.audience, 2000),
      notes: str(t.notes, 8000),
      targetPage: str(t.targetPage, 300),
      withImages: t.withImages !== false,
      siteId: site?.id ?? null,
      createdById: req.user!.userId,
    }));
  if (!rows.length) { res.status(400).json({ message: "At least one topic with a title is required" }); return; }
  if (rows.length > 200) { res.status(400).json({ message: "Add at most 200 topics at a time" }); return; }
  const created = await BlogTopic.bulkCreate(rows);
  res.status(201).json(created);
});

// PUT /content/topics/:id
router.put("/topics/:id", authorize("content:write"), async (req: AuthRequest, res: Response) => {
  const topic = await BlogTopic.findByPk(req.params.id);
  if (!topic) { res.status(404).json({ message: "Topic not found" }); return; }
  const allowed = ["title", "keyword", "audience", "notes", "targetPage", "withImages"] as const;
  const patch: any = {};
  for (const k of allowed) if (k in (req.body || {})) patch[k] = req.body[k];
  await topic.update(patch);
  res.json(topic);
});

// DELETE /content/topics/:id — removes the topic only; a generated draft stays.
router.delete("/topics/:id", authorize("content:write"), async (req: AuthRequest, res: Response) => {
  const topic = await BlogTopic.findByPk(req.params.id);
  if (!topic) { res.status(404).json({ message: "Topic not found" }); return; }
  await topic.destroy();
  res.json({ ok: true });
});

// POST /content/topics/:id/generate — drafts a blog in the background (1-3 min
// with images). Responds 202 at once; the UI polls GET /content/topics.
router.post("/topics/:id/generate", authorize("content:write"), async (req: AuthRequest, res: Response) => {
  const topic = await BlogTopic.findByPk(req.params.id);
  if (!topic) { res.status(404).json({ message: "Topic not found" }); return; }
  // A run older than 10 minutes was lost (e.g. a restart mid-generation) and may be retried.
  const stale = Date.now() - new Date(topic.updatedAt).getTime() > 10 * 60 * 1000;
  if (topic.status === "Generating" && !stale) { res.status(409).json({ message: "Already generating" }); return; }
  await topic.update({ status: "Generating", error: null });
  // Fire-and-forget; the tenant context travels with the async chain.
  void runTopicGeneration(topic.id, req.user!.userId);
  res.status(202).json(topic);
});

// POST /content/generate-image { prompt } — one AI image, stored publicly; returns { url }
router.post("/generate-image", authorize("content:write"), async (req: AuthRequest, res: Response) => {
  const prompt = (req.body?.prompt ?? "").toString().trim();
  if (!prompt) { res.status(400).json({ message: "prompt is required" }); return; }
  try {
    res.json({ url: await generateBlogImage(prompt.slice(0, 2000)) });
  } catch (err: any) {
    res.status(502).json({ message: err.message || "Image generation failed" });
  }
});

/* ----------------------------- BLOGS ----------------------------- */

// GET /content/blogs?siteId=…|domain=… — all blogs (drafts included) for the CMS,
// scoped to one of the workspace's sites (defaults to the default site).
router.get("/blogs", authorize("content:read"), async (req: AuthRequest, res: Response) => {
  const site = await resolveSite(req.query as Record<string, unknown>);
  const blogs = await Blog.findAll({
    where: site ? { siteId: site.id } : {},
    order: [["updatedAt", "DESC"]],
  });
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
    const site = await resolveSite(b);
    const blog = await Blog.create({
      ...b,
      content: b.content || "",
      slug,
      siteId: site?.id ?? null,
      // Legacy column, kept so the Uppercurve site (a separate repo) can keep
      // calling /public/blogs?domain=uppercurve during the transition.
      domain: parseDomain(site?.slug ?? b.domain),
      createdById: req.user!.userId,
    });
    if (blog.status === "Published") void pingIndexNow(site?.siteUrl, [`/blogs/${blog.slug}`, "/blogs"]);
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
    // Site/domain are set at creation time and never re-assigned from the editor.
    delete b.domain;
    delete b.siteId;
    // Re-slug only when an explicit slug/title change requires it
    if (b.slug && b.slug !== blog.slug) {
      b.slug = await uniqueSlug(Blog, b.slug, blog.id);
    } else {
      delete b.slug;
    }
    const wasPublished = blog.status === "Published";
    const oldSlug = blog.slug;
    await blog.update(b);
    if (blog.status === "Published") {
      const site = blog.siteId ? await Site.findByPk(blog.siteId) : null;
      const paths = [`/blogs/${blog.slug}`];
      if (!wasPublished) paths.push("/blogs");
      if (oldSlug !== blog.slug) paths.push(`/blogs/${oldSlug}`);
      void pingIndexNow(site?.siteUrl, paths);
    }
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
// Delegate /content/events to the comprehensive eventsRouter (cloned from TPS)
router.use("/events", eventsRouter);

export default router;
