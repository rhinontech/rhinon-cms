import { api } from "./api";
import { MONTHS_LONG, MONTHS, defineLive, replace, shortDate, write } from "./live-core";
import { PAYSLIPS, type Claim, type PayLine, type Payslip } from "./mock-data";
import { actions, hydrate } from "./store";

type ApiSlip = {
  id: string; status: string; paymentDate?: string | null; basicSalary: number; hra: number; ta: number; medicalAllowance: number; otherAllowances: number;
  leaveEncashment: number; pfEmployee: number; tds: number; professionalTax: number; noticeRecovery: number; otherDeductions: number; reimbursementTotal: number;
  payroll?: { month: number; year: number; status: string } | null;
};
type ApiClaim = { id: string; category: string; description: string; expenseMonth: number; expenseYear: number; amount: number; status: string; payout: string | null; reviewNote: string | null };

const lines = (pairs: [string, number][]): PayLine[] => pairs.map(([label, amount]) => ({ label, amount: Number(amount) })).filter((l) => l.amount > 0);

async function syncMoney() {
  const [slips, claims] = await Promise.all([
    api<ApiSlip[]>("/payroll/me/payslips").catch(() => [] as ApiSlip[]),
    api<ApiClaim[]>("/reimbursements/me").catch(() => [] as ApiClaim[]),
  ]);
  replace(PAYSLIPS, slips.filter((s) => s.status === "paid" && s.payroll).map((s): Payslip => {
    const { month, year } = s.payroll!;
    const last = new Date(year, month, 0);
    return {
      id: s.id, month: `${MONTHS_LONG[month - 1]} ${year}`, short: MONTHS[month - 1]!,
      paidOn: shortDate((s.paymentDate ?? `${year}-${String(month).padStart(2, "0")}-${last.getDate()}`).slice(0, 10)),
      earnings: lines([["Basic", s.basicSalary], ["House rent allowance", s.hra], ["Travel allowance", s.ta], ["Medical allowance", s.medicalAllowance], ["Other allowances", s.otherAllowances], ["Leave encashment", s.leaveEncashment], ["Reimbursements", s.reimbursementTotal]]),
      deductions: lines([["Provident fund", s.pfEmployee], ["TDS", s.tds], ["Professional tax", s.professionalTax], ["Notice recovery", s.noticeRecovery], ["Other deductions", s.otherDeductions]]),
    };
  }));
  const status = (s: string): Claim["status"] => (s === "approved" ? "Approved" : s === "rejected" ? "Rejected" : s === "paid" ? "Paid" : "Pending");
  hydrate({
    claims: claims.map((c): Claim => ({
      id: c.id, title: c.description, category: c.category, amount: Number(c.amount), month: `${MONTHS[c.expenseMonth - 1]} ${c.expenseYear}`,
      status: status(c.status), payout: c.payout === "direct" ? "Direct" : "With payslip", ...(c.reviewNote ? { note: c.reviewNote } : {}),
    })),
  });
}

defineLive({
  name: "money",
  sync: syncMoney,
  blank: () => { replace(PAYSLIPS, []); hydrate({ claims: [] }); },
  install: () => { void actions; void write; },
});
