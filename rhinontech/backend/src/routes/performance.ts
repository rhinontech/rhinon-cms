import { Router as ExpressRouter, Response } from "express";
import { ReviewCycle, ReviewGoal, ReviewSubmission, Role, User } from "../models";
import { authenticate, AuthRequest } from "../middleware/authenticate";

const router = ExpressRouter();
router.use(authenticate);

function isAdmin(req: AuthRequest) {
  return req.user?.roleSlug === "superadmin" || req.user?.roleSlug === "hr";
}

async function getActiveEmployees() {
  const users = await User.findAll({
    where: { status: "active" },
    include: [{ model: Role, as: "role" }],
    attributes: ["id", "fullName", "companyEmail", "department"],
  });
  return users.filter((u) => (u as any).role?.slug !== "superadmin");
}

// ─── Review Cycles ────────────────────────────────────────────────────────────

// GET /performance/cycles
router.get("/cycles", async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ message: "Admins only" });
    const cycles = await ReviewCycle.findAll({
      order: [["createdAt", "DESC"]],
      include: [{ model: User, as: "creator", attributes: ["id", "fullName"] }],
    });
    res.json(cycles);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /performance/cycles
router.post("/cycles", async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ message: "Admins only" });
    const { name, type, startDate, endDate } = req.body;
    const cycle = await ReviewCycle.create({
      name, type, startDate, endDate,
      createdById: req.user!.userId,
    });

    // Create self + manager submission rows for all active non-superadmin employees
    const employees = await getActiveEmployees();
    const adminId = req.user!.userId;
    const submissions = employees.flatMap((emp) => [
      { cycleId: cycle.id, revieweeId: emp.id, reviewerId: emp.id, type: "self" as const },
      { cycleId: cycle.id, revieweeId: emp.id, reviewerId: adminId, type: "manager" as const },
    ]);
    await ReviewSubmission.bulkCreate(submissions, { ignoreDuplicates: true });

    res.status(201).json(cycle);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /performance/cycles/:id
router.put("/cycles/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ message: "Admins only" });
    const cycle = await ReviewCycle.findByPk(req.params.id);
    if (!cycle) return res.status(404).json({ message: "Not found" });
    const { name, status, startDate, endDate } = req.body;
    await cycle.update({ name, status, startDate, endDate });
    res.json(cycle);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /performance/cycles/:id/team
router.get("/cycles/:id/team", async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ message: "Admins only" });
    const cycle = await ReviewCycle.findByPk(req.params.id);
    if (!cycle) return res.status(404).json({ message: "Not found" });

    const submissions = await ReviewSubmission.findAll({
      where: { cycleId: req.params.id },
      include: [
        { model: User, as: "reviewee", attributes: ["id", "fullName", "department", "companyEmail"] },
      ],
    });

    res.json({ cycle, submissions });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Goals ────────────────────────────────────────────────────────────────────

// GET /performance/goals
router.get("/goals", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const where: any = isAdmin(req)
      ? req.query.userId ? { userId: req.query.userId } : {}
      : { userId };

    const goals = await ReviewGoal.findAll({
      where,
      order: [["createdAt", "DESC"]],
      include: [
        { model: ReviewCycle, as: "cycle", attributes: ["id", "name", "type"], required: false },
        { model: User, as: "user", attributes: ["id", "fullName", "department"] },
      ],
    });
    res.json(goals);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /performance/goals
router.post("/goals", async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, cycleId, targetDate } = req.body;
    const goal = await ReviewGoal.create({
      title, description, cycleId: cycleId || null, targetDate: targetDate || null,
      userId: req.user!.userId,
      createdById: req.user!.userId,
    });
    res.status(201).json(goal);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /performance/goals/:id
router.put("/goals/:id", async (req: AuthRequest, res: Response) => {
  try {
    const goal = await ReviewGoal.findByPk(req.params.id);
    if (!goal) return res.status(404).json({ message: "Not found" });
    if (goal.userId !== req.user!.userId && !isAdmin(req)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const { title, description, status, progress, targetDate, cycleId } = req.body;
    await goal.update({ title, description, status, progress, targetDate, cycleId });
    res.json(goal);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /performance/goals/:id
router.delete("/goals/:id", async (req: AuthRequest, res: Response) => {
  try {
    const goal = await ReviewGoal.findByPk(req.params.id);
    if (!goal) return res.status(404).json({ message: "Not found" });
    if (goal.userId !== req.user!.userId && !isAdmin(req)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    await goal.destroy();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Reviews / Submissions ────────────────────────────────────────────────────

// GET /performance/reviews
router.get("/reviews", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    // self reviews (as reviewee)
    const selfReviews = await ReviewSubmission.findAll({
      where: { revieweeId: userId, type: "self" },
      include: [{ model: ReviewCycle, as: "cycle", attributes: ["id", "name", "type", "status"] }],
      order: [["createdAt", "DESC"]],
    });
    // manager reviews given (as reviewer)
    const managerReviews = await ReviewSubmission.findAll({
      where: { reviewerId: userId, type: "manager" },
      include: [
        { model: ReviewCycle, as: "cycle", attributes: ["id", "name", "type", "status"] },
        { model: User, as: "reviewee", attributes: ["id", "fullName", "department"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json({ selfReviews, managerReviews });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /performance/reviews/:id
router.get("/reviews/:id", async (req: AuthRequest, res: Response) => {
  try {
    const submission = await ReviewSubmission.findByPk(req.params.id, {
      include: [
        { model: ReviewCycle, as: "cycle" },
        { model: User, as: "reviewee", attributes: ["id", "fullName", "department", "companyEmail"] },
        { model: User, as: "reviewer", attributes: ["id", "fullName"] },
      ],
    });
    if (!submission) return res.status(404).json({ message: "Not found" });
    const userId = req.user!.userId;
    if (submission.revieweeId !== userId && submission.reviewerId !== userId && !isAdmin(req)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(submission);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /performance/reviews/:id
router.put("/reviews/:id", async (req: AuthRequest, res: Response) => {
  try {
    const submission = await ReviewSubmission.findByPk(req.params.id);
    if (!submission) return res.status(404).json({ message: "Not found" });
    const userId = req.user!.userId;
    if (submission.revieweeId !== userId && submission.reviewerId !== userId && !isAdmin(req)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (submission.type === "self") {
      const { selfRating, selfFeedback, strengths, improvements } = req.body;
      await submission.update({ selfRating, selfFeedback, strengths, improvements, status: "submitted" });
    } else {
      const { managerRating, managerFeedback, strengths, improvements } = req.body;
      await submission.update({ managerRating, managerFeedback, strengths, improvements, status: "submitted" });
    }
    res.json(submission);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /performance/team — admin: all reviewees with stats
router.get("/team", async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ message: "Admins only" });
    const submissions = await ReviewSubmission.findAll({
      include: [
        { model: ReviewCycle, as: "cycle", attributes: ["id", "name", "type", "status"] },
        { model: User, as: "reviewee", attributes: ["id", "fullName", "department", "companyEmail"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Group by reviewee
    const byReviewee: Record<string, any> = {};
    for (const sub of submissions) {
      const s = sub as any;
      const id = s.revieweeId;
      if (!byReviewee[id]) {
        byReviewee[id] = {
          reviewee: s.reviewee,
          submissions: [],
          cycles: new Set<string>(),
          selfRatings: [] as number[],
          managerRatings: [] as number[],
          latestStatus: s.status,
        };
      }
      byReviewee[id].submissions.push(s);
      byReviewee[id].cycles.add(s.cycleId);
      if (s.type === "self" && s.selfRating) byReviewee[id].selfRatings.push(s.selfRating);
      if (s.type === "manager" && s.managerRating) byReviewee[id].managerRatings.push(s.managerRating);
    }

    const result = Object.values(byReviewee).map((r: any) => ({
      reviewee: r.reviewee,
      cycleCount: r.cycles.size,
      avgSelfRating: r.selfRatings.length
        ? +(r.selfRatings.reduce((a: number, b: number) => a + b, 0) / r.selfRatings.length).toFixed(1)
        : null,
      avgManagerRating: r.managerRatings.length
        ? +(r.managerRatings.reduce((a: number, b: number) => a + b, 0) / r.managerRatings.length).toFixed(1)
        : null,
      latestStatus: r.submissions[0]?.status ?? "pending",
      submissions: r.submissions,
    }));

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
