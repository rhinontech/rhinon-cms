import { Router, Response } from "express";
import multer from "multer";
import { keepTenantContext } from "../services/tenantContext";
import { ReimbursementClaim, User } from "../models";
import { authenticate, authorize, hasPermission, AuthRequest } from "../middleware/authenticate";
import { uploadBuffer, getPresignedReadUrl } from "../services/storage";
import { CLAIM_CATEGORIES } from "../models/ReimbursementClaim";
import {
  attachApprovedClaims, findOpenPayslip, syncPayrollTotals, detachClaims, setPayslipReimbursements,
} from "../services/reimbursementClaims";
import { Payslip } from "../models";

const router = Router();
router.use(authenticate);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const employeeInclude = { model: User, as: "employee", attributes: ["id", "fullName", "department"] };

/** Validates a claim body; returns an error message or the clean fields. */
function parseClaim(body: any): string | { category: string; description: string; expenseMonth: number; expenseYear: number; amount: number } {
  const category = CLAIM_CATEGORIES.includes(body.category) ? body.category : null;
  const description = String(body.description ?? "").trim().slice(0, 500);
  const expenseMonth = Number(body.expenseMonth);
  const expenseYear = Number(body.expenseYear);
  const amount = Math.round(Number(body.amount) * 100) / 100;
  if (!category) return "Pick a category";
  if (!description) return "Add a short description";
  if (!Number.isInteger(expenseMonth) || expenseMonth < 1 || expenseMonth > 12 || !Number.isInteger(expenseYear) || expenseYear < 2000) {
    return "Pick the month the expense was for";
  }
  const now = new Date();
  if (expenseYear * 12 + expenseMonth > now.getFullYear() * 12 + now.getMonth() + 1) return "Expense month can't be in the future";
  if (!Number.isFinite(amount) || amount <= 0) return "Amount must be greater than 0";
  return { category, description, expenseMonth, expenseYear, amount };
}

async function createClaim(req: AuthRequest, res: Response, userId: string) {
  const parsed = parseClaim(req.body);
  if (typeof parsed === "string") { res.status(400).json({ message: parsed }); return null; }

  const file = req.file;
  if (!file) { res.status(400).json({ message: "Attach the invoice or bill (PDF or image)" }); return null; }
  if (file.mimetype !== "application/pdf" && !file.mimetype.startsWith("image/")) {
    res.status(400).json({ message: "Invoice must be a PDF or an image" });
    return null;
  }
  // Bills carry addresses/account numbers — stored privately, served via presigned URL
  const receiptKey = await uploadBuffer(file.buffer, file.originalname, "reimbursements", file.mimetype);
  const receiptName = file.originalname;
  return ReimbursementClaim.create({ userId, ...parsed, receiptKey, receiptName });
}

// ── Employee ──────────────────────────────────────────────────────────────────

router.get("/me", authorize("payslips:read"), async (req: AuthRequest, res: Response) => {
  const claims = await ReimbursementClaim.findAll({
    where: { userId: req.user!.userId },
    order: [["createdAt", "DESC"]],
  });
  res.json(claims);
});

router.post("/me", authorize("payslips:read"), keepTenantContext(upload.single("receipt")), async (req: AuthRequest, res: Response) => {
  const claim = await createClaim(req, res, req.user!.userId);
  if (claim) res.status(201).json(claim);
});

router.delete("/me/:id", authorize("payslips:read"), async (req: AuthRequest, res: Response) => {
  const claim = await ReimbursementClaim.findOne({ where: { id: req.params.id, userId: req.user!.userId } });
  if (!claim) { res.status(404).json({ message: "Claim not found" }); return; }
  if (claim.status !== "pending") { res.status(400).json({ message: "Only pending claims can be withdrawn" }); return; }
  await claim.destroy();
  res.json({ message: "Claim withdrawn" });
});

// Receipt link — the claim's owner or a payroll admin
router.get("/:id/receipt", async (req: AuthRequest, res: Response) => {
  const claim = await ReimbursementClaim.findByPk(req.params.id);
  if (!claim || !claim.receiptKey) { res.status(404).json({ message: "No receipt" }); return; }
  if (claim.userId !== req.user!.userId && !hasPermission(req, "payroll:write")) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  res.json({ url: await getPresignedReadUrl(claim.receiptKey, 300) });
});

// ── Admin ─────────────────────────────────────────────────────────────────────

router.get("/admin", authorize("payroll:write"), async (req: AuthRequest, res: Response) => {
  const status = typeof req.query.status === "string" && req.query.status !== "all" ? { status: req.query.status } : {};
  const claims = await ReimbursementClaim.findAll({
    where: status,
    include: [employeeInclude, { model: User, as: "reviewer", attributes: ["fullName"] }],
    order: [["createdAt", "DESC"]],
  });
  res.json(claims);
});

// Admin records a claim on someone's behalf (e.g. bills the company already knows about)
router.post("/admin", authorize("payroll:write"), keepTenantContext(upload.single("receipt")), async (req: AuthRequest, res: Response) => {
  const user = await User.findByPk(req.body.userId);
  if (!user) { res.status(404).json({ message: "Employee not found" }); return; }
  const claim = await createClaim(req, res, user.id);
  if (claim) res.status(201).json(claim);
});

// payout "payslip" → added to the employee's next payslip (paid with it)
// payout "direct"  → already paid / paid outside payroll; counted as expense, never on a payslip
router.post("/admin/:id/approve", authorize("payroll:write"), async (req: AuthRequest, res: Response) => {
  const claim = await ReimbursementClaim.findByPk(req.params.id);
  if (!claim) { res.status(404).json({ message: "Claim not found" }); return; }
  if (claim.status !== "pending") { res.status(400).json({ message: `Claim is already ${claim.status}` }); return; }
  const payout = req.body.payout === "direct" ? "direct" : "payslip";
  const reviewNote = typeof req.body.note === "string" ? req.body.note.trim().slice(0, 1000) || null : null;
  const now = new Date();

  if (payout === "direct") {
    await claim.update({ status: "paid", payout, paidAt: now, reviewedById: req.user!.userId, reviewedAt: now, reviewNote });
    res.json({ message: "Approved and recorded as paid", claim });
    return;
  }

  await claim.update({ status: "approved", payout, reviewedById: req.user!.userId, reviewedAt: now, reviewNote });
  const slip = await findOpenPayslip(claim.userId);
  if (slip) {
    await attachApprovedClaims(slip);
    await syncPayrollTotals(slip.payrollId);
  }
  await claim.reload();
  res.json({
    message: slip ? "Approved and added to the open payslip" : "Approved — will be added to the next payslip",
    claim,
  });
});

router.post("/admin/:id/reject", authorize("payroll:write"), async (req: AuthRequest, res: Response) => {
  const claim = await ReimbursementClaim.findByPk(req.params.id);
  if (!claim) { res.status(404).json({ message: "Claim not found" }); return; }
  if (claim.status === "paid") { res.status(400).json({ message: "Paid claims can't be rejected" }); return; }

  // Approved and already sitting on an unpaid payslip → pull the line back off
  if (claim.payslipId) {
    const slip = await Payslip.findByPk(claim.payslipId);
    if (slip && slip.status !== "paid") {
      await setPayslipReimbursements(slip, (slip.reimbursements ?? []).filter((r) => r.claimId !== claim.id));
      await syncPayrollTotals(slip.payrollId);
    }
    await detachClaims(claim.payslipId, [claim.id]);
  }

  const reviewNote = typeof req.body.note === "string" ? req.body.note.trim().slice(0, 1000) || null : null;
  await claim.update({ status: "rejected", payslipId: null, reviewedById: req.user!.userId, reviewedAt: new Date(), reviewNote });
  res.json({ message: "Claim rejected", claim });
});

export default router;
