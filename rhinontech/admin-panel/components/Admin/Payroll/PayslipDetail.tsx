"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { TbArrowLeft, TbPrinter } from "react-icons/tb";
import adminImages from "@/constants/admin/images";
import Image from "next/image";

interface PayslipData {
  id: string;
  basicSalary: number;
  hra: number;
  ta: number;
  medicalAllowance: number;
  otherAllowances: number;
  grossPay: number;
  pfEmployee: number;
  pfEmployer: number;
  tds: number;
  professionalTax: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  paymentDate: string | null;
  status: string;
  payroll: { month: number; year: number; status: string };
  employee: {
    fullName: string;
    legalName?: string;
    companyEmail: string;
    department: string;
    joiningDate: string;
    dateOfBirth?: string;
    pan?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    roleTitle?: string;
    role?: { name: string };
  };
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function fmt(n: number) {
  return Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0 });
}

function fmtDate(iso: string | undefined | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function TableRow({ label, amount, bold }: { label: string; amount: number; bold?: boolean }) {
  return (
    <tr className={bold ? "bg-gray-50 font-semibold" : "hover:bg-gray-50/60"}>
      <td className={`py-2.5 px-4 text-sm ${bold ? "text-gray-900" : "text-gray-600"}`}>{label}</td>
      <td className={`py-2.5 px-4 text-sm text-right ${bold ? "text-gray-900" : "text-gray-800"}`}>{fmt(amount)}</td>
    </tr>
  );
}

function TaxRow({ label, gross, exempted, taxable, bold }: { label: string; gross: number; exempted: number; taxable: number; bold?: boolean }) {
  return (
    <tr className={bold ? "bg-gray-50 font-semibold" : "hover:bg-gray-50/60"}>
      <td className={`py-2.5 px-4 text-sm ${bold ? "text-gray-900" : "text-gray-600"}`}>{label}</td>
      <td className="py-2.5 px-4 text-sm text-right text-gray-800">{fmt(gross)}</td>
      <td className="py-2.5 px-4 text-sm text-right text-gray-800">{fmt(exempted)}</td>
      <td className={`py-2.5 px-4 text-sm text-right ${bold ? "text-gray-900 font-semibold" : "text-gray-800"}`}>{fmt(taxable)}</td>
    </tr>
  );
}

export function PayslipDetail({ id }: { id: string }) {
  const [slip, setSlip] = useState<PayslipData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const roleSlug = usePathname().split("/")[1];
  const isAdminView = roleSlug === "superadmin" || roleSlug === "hr";

  useEffect(() => {
    const token = Cookies.get("authToken");
    const endpoint = isAdminView
      ? `/payroll/admin/payslips/${id}`
      : `/payroll/me/payslips/${id}`;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then(setSlip)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, isAdminView]);

  if (loading) return <div className="h-full flex items-center justify-center text-sm text-gray-400">Loading…</div>;
  if (!slip) return <div className="h-full flex items-center justify-center text-sm text-gray-400">Payslip not found.</div>;

  const emp = slip.employee;
  const displayName = (emp.legalName || emp.fullName).toUpperCase();
  const jobTitle = emp.roleTitle || emp.role?.name || emp.department;
  const periodLabel = `${MONTHS[slip.payroll.month - 1]} ${slip.payroll.year}`;

  // Annual figures (× 12)
  const annualBasic    = Number(slip.basicSalary)       * 12;
  const annualHRA      = Number(slip.hra)               * 12;
  const annualTA       = Number(slip.ta)                * 12;
  const annualMedical  = Number(slip.medicalAllowance)  * 12;
  const annualOther    = Number(slip.otherAllowances)   * 12;
  const annualGross    = Number(slip.grossPay)          * 12;
  const annualTaxable  = annualGross;

  const detailFields = [
    { label: "Name",            value: displayName },
    { label: "Job Title",       value: jobTitle },
    { label: "Date of Birth",   value: fmtDate(emp.dateOfBirth) },
    { label: "PAN",             value: emp.pan || "—" },
    { label: "Account No.",     value: emp.bankAccountNumber || "—" },
    { label: "IFSC Code",       value: emp.bankIfscCode || "—" },
    { label: "Date of Joining", value: fmtDate(emp.joiningDate) },
    { label: "Regime Opted",    value: "New Regime" },
  ];

  return (
    <div className="h-full overflow-auto bg-stone-50">
      <style>{`
        @page { margin: 0; size: A4; }
        @media print {
          body * { visibility: hidden !important; }
          #payslip-print, #payslip-print * { visibility: visible !important; }
          #payslip-print {
            position: fixed;
            inset: 0;
            width: 100%;
            max-width: 100%;
            margin: 0;
            border-radius: 0;
            border: none;
            overflow: visible;
          }
        }
      `}</style>
      <div className="p-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <TbArrowLeft size={18} /> Back
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 bg-white transition-colors"
        >
          <TbPrinter size={16} /> Print / Download
        </button>
      </div>

      {/* Payslip card */}
      <div id="payslip-print" className="bg-white rounded-2xl border border-gray-100 max-w-3xl mx-auto overflow-hidden">

        {/* Company header */}
        <div className="bg-gray-900 px-8 py-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0">
              {/* <span className="text-white font-bold text-lg tracking-tight">RT</span> */}
              <Image src={adminImages.blueLogo} alt="Rhinon Tech" className="h-8 w-8 object-cover" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">Rhinon Tech</p>
              <p className="text-gray-400 text-xs mt-0.5">Hyderabad, Telangana, India</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs uppercase tracking-wider">Payslip</p>
            <p className="text-white font-semibold text-lg mt-0.5">{periodLabel}</p>
            <span className={`mt-1.5 inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${slip.status === "paid" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
              {slip.status}
            </span>
          </div>
        </div>

        {/* Net pay banner */}
        <div className="bg-stone-900 px-8 py-4 flex items-center justify-between">
          <p className="text-blue-100 text-sm">Take-Home (Net Pay)</p>
          <p className="text-white text-2xl font-bold">₹{fmt(slip.netPay)}</p>
        </div>

        {/* Employee details grid */}
        <div className="px-8 py-6 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Employee Details</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
            {detailFields.map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                <p className="text-sm font-medium text-gray-900 break-all">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Summary pills */}
        <div className="px-8 py-5 border-b border-gray-100 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5">
            <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Gross Pay (A)</span>
            <span className="text-green-700 font-bold">+ ₹{fmt(slip.grossPay)}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
            <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">Deductions (B)</span>
            <span className="text-red-700 font-bold">− ₹{fmt(slip.totalDeductions)}</span>
          </div>
        </div>

        {/* Earnings */}
        <div className="px-8 pt-6 pb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Earnings (A) <span className="normal-case font-normal text-gray-400">— The total money you earned before deductions</span>
          </p>
          <table className="w-full mt-3 rounded-xl overflow-hidden border border-gray-100">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="py-2.5 px-4 text-left font-medium">Earnings</th>
                <th className="py-2.5 px-4 text-right font-medium">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <TableRow label="Basic Salary"         amount={Number(slip.basicSalary)} />
              <TableRow label="House Rent Allowance" amount={Number(slip.hra)} />
              <TableRow label="Transport Allowance"  amount={Number(slip.ta)} />
              <TableRow label="Medical Allowance"    amount={Number(slip.medicalAllowance)} />
              {Number(slip.otherAllowances) > 0 && <TableRow label="Other Allowances" amount={Number(slip.otherAllowances)} />}
            </tbody>
            <tfoot className="border-t-2 border-gray-200">
              <TableRow label="Gross Pay" amount={Number(slip.grossPay)} bold />
            </tfoot>
          </table>
        </div>

        {/* Deductions */}
        <div className="px-8 pt-2 pb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Deductions (B) <span className="normal-case font-normal text-gray-400">— Amount deducted for taxes and other benefits</span>
          </p>
          <table className="w-full mt-3 rounded-xl overflow-hidden border border-gray-100">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="py-2.5 px-4 text-left font-medium">Deductions</th>
                <th className="py-2.5 px-4 text-right font-medium">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <TableRow label="Provident Fund (Employee 12%)" amount={Number(slip.pfEmployee)} />
              <TableRow label="Professional Tax"              amount={Number(slip.professionalTax)} />
              <TableRow label="Tax Deducted at Source (TDS)"  amount={Number(slip.tds)} />
              {Number(slip.otherDeductions) > 0 && <TableRow label="Other Deductions" amount={Number(slip.otherDeductions)} />}
            </tbody>
            <tfoot className="border-t-2 border-gray-200">
              <TableRow label="Total Deductions" amount={Number(slip.totalDeductions)} bold />
            </tfoot>
          </table>
        </div>

        {/* Yearly Taxable Income */}
        <div className="px-8 pt-2 pb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Yearly Taxable Income (C) <span className="normal-case font-normal text-gray-400">— Annual earnings excluding exemptions</span>
          </p>
          <table className="w-full mt-3 rounded-xl overflow-hidden border border-gray-100">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="py-2.5 px-4 text-left font-medium">Description</th>
                <th className="py-2.5 px-4 text-right font-medium">Gross (₹)</th>
                <th className="py-2.5 px-4 text-right font-medium">Exempted (₹)</th>
                <th className="py-2.5 px-4 text-right font-medium">Taxable (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <TaxRow label="Basic Salary"           gross={annualBasic}   exempted={0} taxable={annualBasic} />
              <TaxRow label="House Rent Allowance"   gross={annualHRA}     exempted={0} taxable={annualHRA} />
              <TaxRow label="Transport Allowance"    gross={annualTA}      exempted={0} taxable={annualTA} />
              <TaxRow label="Medical Allowance"      gross={annualMedical} exempted={0} taxable={annualMedical} />
              {annualOther > 0 && <TaxRow label="Other Allowances" gross={annualOther} exempted={0} taxable={annualOther} />}
            </tbody>
            <tfoot className="border-t-2 border-gray-200">
              <TaxRow label="Annual Taxable Salary" gross={annualGross} exempted={0} taxable={annualTaxable} bold />
            </tfoot>
          </table>
        </div>

        {/* Net Taxable Income */}
        <div className="px-8 pt-2 pb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Net Taxable Income (E) <span className="normal-case font-normal text-gray-400">— Taxes calculated on this amount</span>
          </p>
          <div className="mt-3 rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50 text-sm">
            <div className="flex justify-between items-center py-2.5 px-4 hover:bg-gray-50/60">
              <span className="text-gray-600">Annual Taxable Salary (C)</span>
              <span className="text-gray-900">₹{fmt(annualTaxable)}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 px-4 bg-gray-50 font-semibold">
              <span className="text-gray-900">Net Taxable Income</span>
              <span className="text-gray-900">₹{fmt(annualTaxable)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-100 px-8 py-4 flex items-center justify-between text-xs text-gray-400">
          <span>This is a system-generated payslip and does not require a signature.</span>
          {slip.paymentDate && <span>Paid on {fmtDate(slip.paymentDate)}</span>}
        </div>
      </div>
      </div>{/* end p-6 padding wrapper */}
    </div>
  );
}
