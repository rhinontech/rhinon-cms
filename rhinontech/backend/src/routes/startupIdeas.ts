import { Router, Response } from "express";
import { Op } from "sequelize";
import { StartupIdea, Lead } from "../models";
import { STARTUP_IDEA_STATUSES, type StartupIdeaStatus } from "../models/StartupIdea";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";

// Inbound submissions from the rhinonlabs /build campaign page. Separate from CRM leads
// by design — see models/StartupIdea.ts.
const router = Router();
router.use(authenticate);

function isStatus(v: unknown): v is StartupIdeaStatus {
  return STARTUP_IDEA_STATUSES.includes(v as StartupIdeaStatus);
}

// GET /startup-ideas — list with optional ?status, ?q search and pagination.
router.get("/", authorize("startupIdeas:read"), async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status ? String(req.query.status) : null;
    const q = req.query.q ? String(req.query.q).trim() : "";
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const offset = Number(req.query.offset) || 0;

    const where: any = {};
    if (status && status !== "All" && isStatus(status)) where.status = status;
    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { email: { [Op.iLike]: `%${q}%` } },
        { organization: { [Op.iLike]: `%${q}%` } },
        { idea: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const { rows, count } = await StartupIdea.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    // Per-status tallies drive the filter chips, so they ignore the status filter itself.
    const statusWhere: any = {};
    if (q) statusWhere[Op.or] = where[Op.or];
    const grouped = await StartupIdea.findAll({
      where: statusWhere,
      attributes: ["status", [StartupIdea.sequelize!.fn("COUNT", "*"), "count"]],
      group: ["status"],
      raw: true,
    });
    const counts: Record<string, number> = { All: 0 };
    for (const s of STARTUP_IDEA_STATUSES) counts[s] = 0;
    for (const row of grouped as any[]) {
      const n = Number(row.count) || 0;
      counts[row.status] = n;
      counts.All += n;
    }

    res.json({ ideas: rows, total: count, counts });
  } catch (err) {
    console.error("startup-ideas list failed:", err);
    res.status(500).json({ message: "Failed to load startup ideas" });
  }
});

// GET /startup-ideas/unread-count — powers the sidebar badge.
router.get("/unread-count", authorize("startupIdeas:read"), async (_req: AuthRequest, res: Response) => {
  try {
    const count = await StartupIdea.count({ where: { isRead: false } });
    res.json({ count });
  } catch (err) {
    console.error("startup-ideas unread-count failed:", err);
    res.status(500).json({ message: "Failed to load unread count" });
  }
});

// GET /startup-ideas/:id — full submission. Opening it marks it read.
router.get("/:id", authorize("startupIdeas:read"), async (req: AuthRequest, res: Response) => {
  try {
    const idea = await StartupIdea.findByPk(req.params.id);
    if (!idea) {
      res.status(404).json({ message: "Startup idea not found" });
      return;
    }
    if (!idea.isRead) {
      await idea.update({ isRead: true, reviewedById: req.user?.userId ?? null });
    }
    res.json(idea);
  } catch (err) {
    console.error("startup-ideas detail failed:", err);
    res.status(500).json({ message: "Failed to load startup idea" });
  }
});

// PATCH /startup-ideas/:id — status, notes and read/unread.
router.patch("/:id", authorize("startupIdeas:write"), async (req: AuthRequest, res: Response) => {
  try {
    const idea = await StartupIdea.findByPk(req.params.id);
    if (!idea) {
      res.status(404).json({ message: "Startup idea not found" });
      return;
    }

    const updates: any = {};
    if (req.body.status !== undefined) {
      if (!isStatus(req.body.status)) {
        res.status(400).json({ message: "Invalid status" });
        return;
      }
      updates.status = req.body.status;
    }
    if (req.body.notes !== undefined) updates.notes = String(req.body.notes ?? "").slice(0, 5000) || null;
    if (req.body.isRead !== undefined) updates.isRead = Boolean(req.body.isRead);

    await idea.update(updates);
    res.json(idea);
  } catch (err) {
    console.error("startup-ideas update failed:", err);
    res.status(500).json({ message: "Failed to update startup idea" });
  }
});

// POST /startup-ideas/:id/convert — promote a promising idea into the CRM as a Lead.
// This is the ONLY path from this module into the leads table.
router.post("/:id/convert", authorize("startupIdeas:write"), async (req: AuthRequest, res: Response) => {
  try {
    const idea = await StartupIdea.findByPk(req.params.id);
    if (!idea) {
      res.status(404).json({ message: "Startup idea not found" });
      return;
    }
    if (idea.convertedLeadId) {
      res.status(409).json({ message: "This idea has already been converted to a lead", leadId: idea.convertedLeadId });
      return;
    }

    const notes = [
      `Startup idea (${idea.source || "/build"}):`,
      idea.idea,
      idea.stage ? `Stage: ${idea.stage}` : null,
      idea.budget ? `Budget: ${idea.budget}` : null,
      idea.notes ? `Internal notes: ${idea.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    // Repeat submitters may already exist in the CRM — append rather than break the
    // unique email constraint.
    const existing = await Lead.findOne({ where: { email: idea.email } });
    let lead;
    if (existing) {
      await existing.update({
        notes: [existing.notes, notes].filter(Boolean).join("\n\n"),
        phone: existing.phone || idea.phone || undefined,
      });
      lead = existing;
    } else {
      lead = await Lead.create({
        name: idea.name,
        email: idea.email,
        company: idea.organization || "Startup Idea",
        phone: idea.phone,
        notes,
        source: "Startup Ideas",
        status: "New",
        raw: {
          startupIdeaId: idea.id,
          stage: idea.stage,
          budget: idea.budget,
          submittedAt: idea.createdAt,
        },
      } as any);
    }

    await idea.update({
      convertedLeadId: lead.id,
      convertedAt: new Date(),
      status: "Converted",
      isRead: true,
    });

    res.status(201).json({ ok: true, leadId: lead.id, deduped: Boolean(existing), idea });
  } catch (err) {
    console.error("startup-ideas convert failed:", err);
    res.status(500).json({ message: "Failed to convert startup idea" });
  }
});

// DELETE /startup-ideas/:id — spam and test submissions.
router.delete("/:id", authorize("startupIdeas:write"), async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await StartupIdea.destroy({ where: { id: req.params.id } });
    if (!deleted) {
      res.status(404).json({ message: "Startup idea not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("startup-ideas delete failed:", err);
    res.status(500).json({ message: "Failed to delete startup idea" });
  }
});

export default router;
