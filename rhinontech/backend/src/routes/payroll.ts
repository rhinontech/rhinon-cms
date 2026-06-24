import { Router, Response } from "express";
import { Payroll, Payslip, User, Role } from "../models";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import { sendEmail } from "../services/mailer";
import { payslipPaidEmail } from "../services/emailTemplates";
import { env } from "../config/env";

const router = Router();
router.use(authenticate);

// ═══════════════════════════════════════════════════════════════════════════════
// EMPLOYEE routes  (require payslips:read)
// ═══════════════════════════════════════════════════════════════════════════════

// My payslips
router.get("/me/payslips", authorize("payslips:read"), async (req: AuthRequest, res: Response) => {
  const payslips = await Payslip.findAll({
    where: { userId: req.user!.userId },
    include: [{ model: Payroll, as: "payroll", attributes: ["month", "year", "status"] }],
    order: [
      [{ model: Payroll, as: "payroll" }, "year", "DESC"],
      [{ model: Payroll, as: "payroll" }, "month", "DESC"],
    ],
  });
  res.json(payslips);
});

// Single payslip
router.get("/me/payslips/:id", authorize("payslips:read"), async (req: AuthRequest, res: Response) => {
  const payslip = await Payslip.findOne({
    where: { id: req.params.id, userId: req.user!.userId },
    include: [
      { model: Payroll, as: "payroll", attributes: ["month", "year", "status"] },
      {
        model: User,
        as: "employee",
        attributes: ["fullName", "legalName", "companyEmail", "department", "joiningDate", "dateOfBirth", "pan", "bankAccountNumber", "bankIfscCode", "roleTitle"],
        include: [{ model: Role, as: "role", attributes: ["name"] }],
      },
    ],
  });
  if (!payslip) { res.status(404).json({ message: "Payslip not found" }); return; }
  res.json(payslip);
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN routes  (require payroll:write)
// ═══════════════════════════════════════════════════════════════════════════════

// List all employees with their salary structure
router.get("/admin/employees", authorize("payroll:write"), async (_req: AuthRequest, res: Response) => {
  const employees = await User.findAll({
    where: { status: "active" },
    attributes: [
      "id", "fullName", "companyEmail", "department", "joiningDate",
      "employmentType", "workLocation",
      "basicSalary", "hra", "ta", "medicalAllowance", "otherAllowances",
      "pfEnabled", "ptAmount", "tdsAmount",
    ],
    include: [{ model: Role, as: "role", attributes: ["name", "slug"] }],
    order: [["fullName", "ASC"]],
  });
  res.json(employees);
});

// Get single employee's full profile + salary (for admin edit)
router.get("/admin/employees/:userId", authorize("payroll:write"), async (req: AuthRequest, res: Response) => {
  const user = await User.findByPk(req.params.userId, {
    attributes: { exclude: ["passwordHash"] },
    include: [{ model: Role, as: "role", attributes: ["name", "slug"] }],
  });
  if (!user) { res.status(404).json({ message: "Employee not found" }); return; }
  res.json(user);
});

// Set / update an employee's salary structure
router.put("/admin/employees/:userId/salary", authorize("payroll:write"), async (req: AuthRequest, res: Response) => {
  const { basicSalary, hra = 0, ta = 0, medicalAllowance = 0, otherAllowances = 0,
          pfEnabled = true, ptAmount = 200, tdsAmount = 0 } = req.body;
  if (!basicSalary || basicSalary <= 0) {
    res.status(400).json({ message: "basicSalary is required and must be > 0" });
    return;
  }
  const user = await User.findByPk(req.params.userId);
  if (!user) { res.status(404).json({ message: "Employee not found" }); return; }

  await user.update({ basicSalary, hra, ta, medicalAllowance, otherAllowances, pfEnabled, ptAmount, tdsAmount });
  res.json({ message: "Salary updated" });
});

// Update employee HR details (employment type, PAN, etc.)
router.put("/admin/employees/:userId/details", authorize("payroll:write"), async (req: AuthRequest, res: Response) => {
  const allowed = ["pan", "employmentType", "compensationType", "workSchedule", "remotePosition", "workLocation", "paymentFrequency", "department"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }
  const user = await User.findByPk(req.params.userId);
  if (!user) { res.status(404).json({ message: "Employee not found" }); return; }
  await user.update(update);
  res.json({ message: "Details updated" });
});

// List all payroll runs
router.get("/admin/runs", authorize("payroll:write"), async (_req: AuthRequest, res: Response) => {
  const runs = await Payroll.findAll({
    order: [["year", "DESC"], ["month", "DESC"]],
    include: [{ model: User, as: "processedBy", attributes: ["fullName"] }],
  });
  res.json(runs);
});

// Company payroll investment summary for admins/superadmins
router.get("/admin/investment", authorize("payroll:write"), async (_req: AuthRequest, res: Response) => {
  const paidPayslips = await Payslip.findAll({
    where: { status: "paid" },
    include: [{ model: Payroll, as: "payroll", where: { status: "paid" }, attributes: ["month", "year"] }],
  });

  const activeEmployees = await User.findAll({
    where: { status: "active" },
    attributes: ["id", "basicSalary", "hra", "ta", "medicalAllowance", "otherAllowances"],
  });

  const totalGrossPaid = paidPayslips.reduce((sum, slip) => sum + Number(slip.grossPay || 0), 0);
  const totalNetPaid = paidPayslips.reduce((sum, slip) => sum + Number(slip.netPay || 0), 0);
  const totalEmployerPfPaid = paidPayslips.reduce((sum, slip) => sum + Number(slip.pfEmployer || 0), 0);
  const totalCompanyCostPaid = totalGrossPaid + totalEmployerPfPaid;

  const activeSalaryEmployees = activeEmployees.filter((employee) => Number(employee.basicSalary || 0) > 0);
  const monthlyCommittedGross = activeSalaryEmployees.reduce((sum, employee) => {
    return sum
      + Number(employee.basicSalary || 0)
      + Number(employee.hra || 0)
      + Number(employee.ta || 0)
      + Number(employee.medicalAllowance || 0)
      + Number(employee.otherAllowances || 0);
  }, 0);

  res.json({
    totalGrossPaid,
    totalNetPaid,
    totalEmployerPfPaid,
    totalCompanyCostPaid,
    monthlyCommittedGross,
    paidPayslipCount: paidPayslips.length,
    activeEmployeeCount: activeEmployees.length,
    activeSalaryEmployeeCount: activeSalaryEmployees.length,
  });
});

// List all payslips for admins, optionally filtered by payroll run
router.get("/admin/payslips", authorize("payroll:write"), async (req: AuthRequest, res: Response) => {
  const where = typeof req.query.run === "string" ? { payrollId: req.query.run } : {};

  const payslips = await Payslip.findAll({
    where,
    include: [
      { model: Payroll, as: "payroll", attributes: ["id", "month", "year", "status"] },
      { model: User, as: "employee", attributes: ["id", "fullName", "companyEmail", "department"] },
    ],
    order: [
      [{ model: Payroll, as: "payroll" }, "year", "DESC"],
      [{ model: Payroll, as: "payroll" }, "month", "DESC"],
      [{ model: User, as: "employee" }, "fullName", "ASC"],
    ],
  });

  res.json(payslips);
});

// Get any payslip for admins
router.get("/admin/payslips/:id", authorize("payroll:write"), async (req: AuthRequest, res: Response) => {
  const payslip = await Payslip.findByPk(req.params.id, {
    include: [
      { model: Payroll, as: "payroll", attributes: ["month", "year", "status"] },
      {
        model: User,
        as: "employee",
        attributes: ["fullName", "legalName", "companyEmail", "department", "joiningDate", "dateOfBirth", "pan", "bankAccountNumber", "bankIfscCode", "roleTitle"],
        include: [{ model: Role, as: "role", attributes: ["name"] }],
      },
    ],
  });

  if (!payslip) { res.status(404).json({ message: "Payslip not found" }); return; }
  res.json(payslip);
});

// Get a single payroll run with all payslips
router.get("/admin/runs/:id", authorize("payroll:write"), async (req: AuthRequest, res: Response) => {
  const payroll = await Payroll.findByPk(req.params.id, {
    include: [{
      model: Payslip,
      as: "payslips",
      include: [{ model: User, as: "employee", attributes: ["id", "fullName", "companyEmail", "department"] }],
    }],
  });
  if (!payroll) { res.status(404).json({ message: "Payroll not found" }); return; }
  res.json(payroll);
});

// Auto-run payroll for a month — generates payslips for all active employees with salary set
router.post("/admin/run", authorize("payroll:write"), async (req: AuthRequest, res: Response) => {
  const { month, year } = req.body;
  if (!month || !year) { res.status(400).json({ message: "month and year are required" }); return; }

  const exists = await Payroll.findOne({ where: { month, year } });
  if (exists) { res.status(409).json({ message: `Payroll for this period already exists (status: ${exists.status})` }); return; }

  // Fetch all active employees who have a salary configured
  const employees = await User.findAll({
    where: { status: "active" },
    attributes: ["id", "basicSalary", "hra", "ta", "medicalAllowance", "otherAllowances", "pfEnabled", "ptAmount", "tdsAmount"],
  });

  const eligible = employees.filter((e) => e.basicSalary && Number(e.basicSalary) > 0);
  if (eligible.length === 0) {
    res.status(400).json({ message: "No active employees have a salary structure configured." });
    return;
  }

  const payroll = await Payroll.create({ month, year, processedById: req.user!.userId });

  let totalGross = 0;
  let totalNet = 0;

  for (const emp of eligible) {
    const basicSalary  = Number(emp.basicSalary);
    const hra          = Number(emp.hra ?? 0);
    const ta           = Number(emp.ta ?? 0);
    const medicalAllowance = Number(emp.medicalAllowance ?? 0);
    const otherAllowances  = Number(emp.otherAllowances ?? 0);

    const grossPay        = basicSalary + hra + ta + medicalAllowance + otherAllowances;
    const pfEmployee      = (emp as any).pfEnabled !== false ? Math.round(basicSalary * 0.12 * 100) / 100 : 0;
    const pfEmployer      = pfEmployee;
    const professionalTax = Number((emp as any).ptAmount  ?? 200);
    const tds             = Number((emp as any).tdsAmount ?? 0);
    const otherDeductions = 0;
    const totalDeductions = pfEmployee + professionalTax + tds + otherDeductions;
    const netPay          = grossPay - totalDeductions;

    await Payslip.create({
      payrollId: payroll.id,
      userId: emp.id,
      basicSalary,
      hra,
      ta,
      medicalAllowance,
      otherAllowances,
      grossPay,
      pfEmployee,
      pfEmployer,
      tds,
      professionalTax,
      otherDeductions,
      totalDeductions,
      netPay,
      status: "draft",
    });

    totalGross += grossPay;
    totalNet   += netPay;
  }

  await payroll.update({ totalGross, totalNet });

  res.status(201).json({
    message: `Payroll run complete. ${eligible.length} payslips generated.`,
    payroll: { id: payroll.id, month, year, status: payroll.status, totalGross, totalNet, count: eligible.length },
  });
});

// Manually create a single payslip for one employee (backfill historical or ad-hoc)
router.post("/admin/payslips/manual", authorize("payroll:write"), async (req: AuthRequest, res: Response) => {
  const {
    userId, month, year,
    basicSalary, hra = 0, ta = 0, medicalAllowance = 0, otherAllowances = 0,
    pfEnabled = true, ptAmount = 200, tdsAmount = 0,
  } = req.body;

  if (!userId || !month || !year || !basicSalary || Number(basicSalary) <= 0) {
    res.status(400).json({ message: "userId, month, year, and basicSalary are required" });
    return;
  }

  const user = await User.findByPk(userId);
  if (!user) { res.status(404).json({ message: "Employee not found" }); return; }

  // Prevent duplicate payslip for same employee + period
  const existingSlip = await Payslip.findOne({
    include: [{ model: Payroll, as: "payroll", where: { month, year }, required: true }],
    where: { userId },
  });
  if (existingSlip) {
    res.status(409).json({ message: `A payslip for this employee already exists for ${month}/${year}` });
    return;
  }

  // Find or create a Payroll record for this period
  const [payroll] = await Payroll.findOrCreate({
    where: { month, year },
    defaults: { month, year, processedById: req.user!.userId, status: "draft" },
  });

  const gross          = Number(basicSalary) + Number(hra) + Number(ta) + Number(medicalAllowance) + Number(otherAllowances);
  const pfEmployee     = pfEnabled ? Math.round(Number(basicSalary) * 0.12 * 100) / 100 : 0;
  const professionalTax = Number(ptAmount);
  const tds             = Number(tdsAmount);
  const totalDeductions = pfEmployee + professionalTax + tds;
  const netPay          = gross - totalDeductions;

  const payslip = await Payslip.create({
    payrollId:       payroll.id,
    userId,
    basicSalary:     Number(basicSalary),
    hra:             Number(hra),
    ta:              Number(ta),
    medicalAllowance: Number(medicalAllowance),
    otherAllowances: Number(otherAllowances),
    grossPay:        gross,
    pfEmployee,
    pfEmployer:      pfEmployee,
    tds,
    professionalTax,
    otherDeductions: 0,
    totalDeductions,
    netPay,
    status: "paid",
  });

  // Keep payroll totals in sync
  const allSlips = await Payslip.findAll({ where: { payrollId: payroll.id } });
  const totalGross = allSlips.reduce((s, p) => s + Number(p.grossPay), 0);
  const totalNet   = allSlips.reduce((s, p) => s + Number(p.netPay), 0);
  await payroll.update({ totalGross, totalNet });

  res.status(201).json({ message: "Payslip created", payslip, employeeName: user.fullName });
});

// Mark payroll run as paid (all payslips → paid)
router.post("/admin/runs/:id/pay", authorize("payroll:write"), async (req: AuthRequest, res: Response) => {
  const payroll = await Payroll.findByPk(req.params.id);
  if (!payroll) { res.status(404).json({ message: "Payroll not found" }); return; }
  if (payroll.status === "paid") { res.status(400).json({ message: "Already paid" }); return; }

  const paymentDate = new Date();
  await Payslip.update({ status: "paid", paymentDate }, { where: { payrollId: payroll.id } });
  await payroll.update({ status: "paid", processedById: req.user!.userId, processedAt: paymentDate });

  // Send salary credited emails to all employees in this payroll run
  const payslips = await Payslip.findAll({
    where: { payrollId: payroll.id },
    include: [{
      model: User,
      as: "employee",
      attributes: ["fullName", "personalEmail", "companyEmail", "bankAccountNumber"],
      include: [{ model: Role, as: "role", attributes: ["slug"] }],
    }],
  });

  for (const slip of payslips) {
    const emp = (slip as any).employee;
    if (!emp) continue;
    const emailTo = emp.personalEmail || emp.companyEmail;
    if (!emailTo) continue;
    const roleSlug = emp.role?.slug || "employee";
    const payslipUrl = `${env.frontendUrl}/${roleSlug}/payroll/payslips/${slip.id}`;
    const mail = payslipPaidEmail({
      fullName: emp.fullName,
      companyEmail: emp.companyEmail,
      netPay: Number(slip.netPay),
      grossPay: Number(slip.grossPay),
      month: payroll.month,
      year: payroll.year,
      bankAccountNumber: emp.bankAccountNumber,
      payslipUrl,
    });
    sendEmail({ to: emailTo, ...mail }).catch((err: Error) =>
      console.error(`Failed to send payslip email to ${emailTo}:`, err.message)
    );
  }

  res.json({ message: "Payroll marked as paid" });
});

export default router;
