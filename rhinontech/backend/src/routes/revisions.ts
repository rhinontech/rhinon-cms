import { Router, Response } from "express";
import { CompensationRevision, User } from "../models";
import { authenticate, authorize, hasPermission, AuthRequest } from "../middleware/authenticate";
import { snapshotOf, applyRevision, sendRevisionLetter } from "../services/compensationRevisions";
import { todayIST } from "../services/offboarding";

// Salary revisions & promotions: dated, kept as history, applied on the effective
// date (immediately if it's today or earlier) and optionally sent as an e-signable letter.
const router = Router();
router.use(authenticate);

const ADMIN = "payroll:write";
const money = (v: unknown) => {
  const n = Math.round(Number(v ?? 0) * 100) / 100;
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};

// History for one employee — payroll admins, or the employee themselves
router.get("/user/:userId", async (req: AuthRequest, res: Response) => {
  if (req.params.userId !== req.user!.userId && !hasPermission(req, ADMIN)) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  const revisions = await CompensationRevision.findAll({
    where: { userId: req.params.userId },
    include: [{ model: User, as: "createdBy", attributes: ["fullName"] }],
    order: [["effectiveDate", "DESC"], ["createdAt", "DESC"]],
  });
  res.json(revisions);
});

router.post("/", authorize(ADMIN), async (req: AuthRequest, res: Response) => {
  const user = await User.findByPk(req.body.userId);
  if (!user) { res.status(404).json({ message: "Employee not found" }); return; }
  if (user.status !== "active") { res.status(400).json({ message: "Only active employees can be revised" }); return; }

  const kind = req.body.kind === "promotion" ? "promotion" : "increment";
  const effectiveDate = typeof req.body.effectiveDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.body.effectiveDate)
    ? req.body.effectiveDate : null;
  if (!effectiveDate) { res.status(400).json({ message: "Pick an effective date" }); return; }

  const before = snapshotOf(user);
  const b = req.body;
  const after = {
    roleTitle: typeof b.roleTitle === "string" && b.roleTitle.trim() ? b.roleTitle.trim().slice(0, 200) : before.roleTitle,
    department: typeof b.department === "string" && b.department.trim() ? b.department.trim().slice(0, 200) : before.department,
    basicSalary: money(b.basicSalary),
    hra: money(b.hra),
    ta: money(b.ta),
    medicalAllowance: money(b.medicalAllowance),
    otherAllowances: money(b.otherAllowances),
    annualCompensation: 0,
  };
  const amounts = [after.basicSalary, after.hra, after.ta, after.medicalAllowance, after.otherAllowances];
  if (amounts.some(Number.isNaN)) { res.status(400).json({ message: "Amounts must be non-negative numbers" }); return; }
  if (after.basicSalary <= 0) { res.status(400).json({ message: "Basic salary is required" }); return; }
  const monthly = amounts.reduce((s, v) => s + v, 0);
  after.annualCompensation = b.annualCompensation !== undefined && b.annualCompensation !== ""
    ? money(b.annualCompensation) : monthly * 12;
  if (Number.isNaN(after.annualCompensation)) { res.status(400).json({ message: "Invalid annual compensation" }); return; }

  if (kind === "promotion" && (after.roleTitle || "") === (before.roleTitle || "")) {
    res.status(400).json({ message: "A promotion needs a new role title" });
    return;
  }
  const changed = (Object.keys(after) as (keyof typeof after)[]).some((k) => String(after[k] ?? "") !== String(before[k] ?? ""));
  if (!changed) { res.status(400).json({ message: "Nothing changes in this revision" }); return; }

  const revision = await CompensationRevision.create({
    userId: user.id,
    kind,
    effectiveDate,
    before,
    after,
    reason: typeof b.reason === "string" ? b.reason.trim().slice(0, 2000) || null : null,
    createdById: req.user!.userId,
  });

  if (effectiveDate <= todayIST()) await applyRevision(revision);

  let letter: { emailSent: boolean } | null = null;
  if (b.sendLetter !== false) {
    await user.reload();
    letter = await sendRevisionLetter(revision, user, req.user!.userId).catch((err) => {
      console.error("[Revisions] Letter failed:", err.message);
      return { emailSent: false };
    });
  }

  await revision.reload();
  res.status(201).json({ revision, letterEmailSent: letter?.emailSent ?? null });
});

router.post("/:id/cancel", authorize(ADMIN), async (req: AuthRequest, res: Response) => {
  const revision = await CompensationRevision.findByPk(req.params.id);
  if (!revision) { res.status(404).json({ message: "Revision not found" }); return; }
  if (revision.status !== "scheduled") { res.status(400).json({ message: "Only scheduled revisions can be cancelled" }); return; }
  await revision.update({ status: "cancelled" });
  res.json(revision);
});

export default router;
