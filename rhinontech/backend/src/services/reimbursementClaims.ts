import { Op } from "sequelize";
import { Payroll, Payslip, ReimbursementClaim } from "../models";
import type { PayslipReimbursement } from "../models/Payslip";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const round2 = (v: number) => Math.round(v * 100) / 100;

export function claimLabel(c: ReimbursementClaim): string {
  return `${c.category} – ${MONTHS_SHORT[c.expenseMonth - 1]} ${c.expenseYear}`;
}

/** Rewrites a payslip's reimbursement lines and keeps total + net pay consistent. */
export async function setPayslipReimbursements(slip: Payslip, lines: PayslipReimbursement[]) {
  const reimbursementTotal = round2(lines.reduce((s, r) => s + Number(r.amount), 0));
  const netPay = round2(Number(slip.grossPay) - Number(slip.totalDeductions) + reimbursementTotal);
  await slip.update({ reimbursements: lines, reimbursementTotal, netPay });
}

/**
 * Puts every approved, not-yet-attached "payslip" claim of this employee onto the
 * given unpaid payslip. Called when a payslip is created and when a claim is approved.
 */
export async function attachApprovedClaims(slip: Payslip) {
  if (slip.status === "paid") return;
  const claims = await ReimbursementClaim.findAll({
    where: { userId: slip.userId, status: "approved", payout: "payslip", payslipId: null },
    order: [["expenseYear", "ASC"], ["expenseMonth", "ASC"]],
  });
  if (claims.length === 0) return;

  const lines = [...(slip.reimbursements ?? [])];
  for (const c of claims) lines.push({ label: claimLabel(c), amount: Number(c.amount), claimId: c.id });
  await setPayslipReimbursements(slip, lines);
  await ReimbursementClaim.update({ payslipId: slip.id }, { where: { id: claims.map((c) => c.id) } });
}

/** The employee's open payslip a newly approved claim should ride on, if any. */
export async function findOpenPayslip(userId: string) {
  return Payslip.findOne({ where: { userId, status: { [Op.ne]: "paid" } }, order: [["createdAt", "DESC"]] });
}

/** Claims on these payslips are now paid. */
export async function markClaimsPaid(payslipIds: string[], paidAt: Date) {
  if (payslipIds.length === 0) return;
  await ReimbursementClaim.update(
    { status: "paid", paidAt },
    { where: { payslipId: payslipIds, status: "approved" } },
  );
}

/** Payslip removed or line dropped → claims go back to waiting for the next payslip. */
export async function detachClaims(payslipId: string, claimIds?: string[]) {
  await ReimbursementClaim.update(
    { payslipId: null },
    { where: { payslipId, status: "approved", ...(claimIds ? { id: claimIds } : {}) } },
  );
}

export async function syncPayrollTotals(payrollId: string) {
  const slips = await Payslip.findAll({ where: { payrollId } });
  await Payroll.update(
    {
      totalGross: slips.reduce((s, p) => s + Number(p.grossPay), 0),
      totalNet: slips.reduce((s, p) => s + Number(p.netPay), 0),
    },
    { where: { id: payrollId } },
  );
}
