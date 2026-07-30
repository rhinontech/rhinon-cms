import { Router, Response } from "express";
import { LetterTemplate } from "../models";
import type { LetterBlock, LetterTemplateCategory } from "../types/letterBlocks";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import { rewriteLetterSentence } from "../services/gemini";

const router = Router();

router.use(authenticate);

function slugify(title: string): string {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-+|-+$)/g, "") || "template";
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let n = 1;
  while (await LetterTemplate.findOne({ where: { key: slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

router.get("/", authorize("employees:write"), async (req: AuthRequest, res: Response) => {
  const category = typeof req.query.category === "string" ? (req.query.category as LetterTemplateCategory) : undefined;
  const templates = await LetterTemplate.findAll({
    where: category ? { category } : {},
    attributes: ["key", "category", "title", "version", "updatedAt"],
    order: [["category", "ASC"], ["createdAt", "ASC"]],
  });
  res.json(templates);
});

router.get("/:key", authorize("employees:write"), async (req: AuthRequest, res: Response) => {
  const template = await LetterTemplate.findOne({ where: { key: req.params.key } });
  if (!template) {
    res.status(404).json({ message: "Template not found." });
    return;
  }
  res.json(template);
});

// Creates a new offer_letter-category template — either blank or duplicated
// from an existing one (cloneFromKey). NDA is deliberately not creatable
// here: the user chose to keep NDA as a single fixed template.
router.post("/", authorize("employees:write"), async (req: AuthRequest, res: Response) => {
  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  if (!title) {
    res.status(400).json({ message: "title is required." });
    return;
  }

  let blocks: LetterBlock[] = [
    { id: "block-0", kind: "paragraph", text: "New paragraph — select text to rewrite it with AI, or switch to \"Edit text directly\"." },
  ];
  const cloneFromKey = typeof req.body.cloneFromKey === "string" ? req.body.cloneFromKey : undefined;
  if (cloneFromKey) {
    const source = await LetterTemplate.findOne({ where: { key: cloneFromKey, category: "offer_letter" } });
    if (!source) {
      res.status(404).json({ message: "Template to duplicate from was not found." });
      return;
    }
    blocks = source.blocks;
  }

  const key = await uniqueSlug(slugify(title));
  const template = await LetterTemplate.create({
    key,
    category: "offer_letter",
    title,
    blocks,
    version: 1,
    updatedById: req.user!.userId,
  });
  res.status(201).json(template);
});

router.put("/:key", authorize("employees:write"), async (req: AuthRequest, res: Response) => {
  const blocks = req.body.blocks as LetterBlock[] | undefined;
  if (!Array.isArray(blocks)) {
    res.status(400).json({ message: "blocks must be an array." });
    return;
  }

  const template = await LetterTemplate.findOne({ where: { key: req.params.key } });
  if (!template) {
    res.status(404).json({ message: "Template not found." });
    return;
  }

  const title = typeof req.body.title === "string" && req.body.title.trim() ? req.body.title.trim() : template.title;
  await template.update({ blocks, title, version: template.version + 1, updatedById: req.user!.userId });
  res.json(template);
});

// NDA can never be deleted (single fixed template); an offer_letter template
// can't be deleted if it's the only one left — the create-member form always
// needs at least one to fall back to.
router.delete("/:key", authorize("employees:write"), async (req: AuthRequest, res: Response) => {
  const template = await LetterTemplate.findOne({ where: { key: req.params.key } });
  if (!template) {
    res.status(404).json({ message: "Template not found." });
    return;
  }
  if (template.category === "nda") {
    res.status(400).json({ message: "The NDA template cannot be deleted." });
    return;
  }
  const siblingCount = await LetterTemplate.count({ where: { category: template.category } });
  if (siblingCount <= 1) {
    res.status(400).json({ message: "Cannot delete the only offer letter template — at least one must remain." });
    return;
  }
  await template.destroy();
  res.status(204).send();
});

// Rewrites a single block's text per a free-text instruction, scoped to
// whatever the admin selected in the preview — never the whole document (see
// plan rationale: round-tripping a 37-clause NDA through an LLM risks
// silently dropped/reordered clauses). Nothing is persisted here; the caller
// (template editor or the create-member form) applies the result to its own
// local state and saves separately.
router.post("/ai-rewrite", authorize("employees:write"), async (req: AuthRequest, res: Response) => {
  const { blockFullText, selectedText, instruction } = req.body ?? {};
  if (typeof blockFullText !== "string" || !blockFullText.trim()) {
    res.status(400).json({ message: "blockFullText is required." });
    return;
  }
  if (typeof selectedText !== "string" || !selectedText.trim()) {
    res.status(400).json({ message: "selectedText is required." });
    return;
  }
  if (typeof instruction !== "string" || !instruction.trim()) {
    res.status(400).json({ message: "instruction is required." });
    return;
  }
  // selectedText comes from a browser text selection, which renders **bold**
  // markup as plain characters — compare against blockFullText with the same
  // markers stripped so a selection touching bold text still validates.
  if (!blockFullText.replace(/\*\*/g, "").includes(selectedText)) {
    res.status(400).json({ message: "selectedText must be a substring of blockFullText." });
    return;
  }

  let rewritten: string;
  try {
    rewritten = await rewriteLetterSentence(blockFullText, selectedText, instruction.trim());
  } catch (err) {
    console.error("AI rewrite failed:", err);
    res.status(502).json({ message: "The AI rewrite failed. Please try again." });
    return;
  }

  const originalTokens = blockFullText.match(/\{\{[\w.]+\}\}/g) ?? [];
  const missing = originalTokens.filter((t) => !rewritten.includes(t));
  if (missing.length > 0) {
    res.status(422).json({ message: `The AI rewrite dropped a placeholder (${missing.join(", ")}). Try rephrasing your instruction.` });
    return;
  }

  res.json({ blockFullText: rewritten });
});

export default router;
