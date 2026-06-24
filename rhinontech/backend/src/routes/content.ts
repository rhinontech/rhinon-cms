import { Router, Response } from "express";
import { Op } from "sequelize";
import { Blog, CaseStudy } from "../models";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";

const router = Router();

router.use(authenticate);

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

// GET /content/blogs — all blogs (drafts included) for the CMS
router.get("/blogs", authorize("content:read"), async (_req: AuthRequest, res: Response) => {
  const blogs = await Blog.findAll({ order: [["updatedAt", "DESC"]] });
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
    if (!b.title || !b.excerpt || !b.content) {
      res.status(400).json({ message: "title, excerpt and content are required" });
      return;
    }
    const slug = await uniqueSlug(Blog, b.slug || b.title);
    const blog = await Blog.create({
      ...b,
      slug,
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

export default router;
