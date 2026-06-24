"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";

interface Payslip {
  pfEmployee: number;
  tds: number;
  professionalTax: number;
  otherDeductions: number;
  totalDeductions: number;
  payroll: { month: number; year: number };
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">₹{Number(value).toLocaleString("en-IN")}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Deductions() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("authToken");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/payroll/me/payslips`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setPayslips)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const latest = payslips[0];
  const maxDeduction = latest ? Number(latest.totalDeductions) : 1;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-stone-100 rounded-r-xl">
      <div className="sticky top-0 z-10 flex items-center gap-4 h-16 px-5 border-b bg-stone-100">
        <SubNavToggle />
        <h1 className="text-base font-semibold tracking-tight">Deductions</h1>
      </div>

      <div className="flex-1 overflow-auto p-5">
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : !latest ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">No deduction data yet.</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <p className="font-medium text-gray-900 mb-4">{MONTHS[latest.payroll.month - 1]} {latest.payroll.year} — Breakdown</p>
              <Bar label="PF (Employee 12%)" value={Number(latest.pfEmployee)} max={maxDeduction} />
              <Bar label="TDS" value={Number(latest.tds)} max={maxDeduction} />
              <Bar label="Professional Tax" value={Number(latest.professionalTax)} max={maxDeduction} />
              {Number(latest.otherDeductions) > 0 && <Bar label="Other Deductions" value={Number(latest.otherDeductions)} max={maxDeduction} />}
              <div className="border-t pt-4 flex justify-between font-semibold text-gray-900">
                <span>Total</span>
                <span>₹{Number(latest.totalDeductions).toLocaleString("en-IN")}</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b"><p className="font-medium text-gray-900">History</p></div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Period</th>
                    <th className="px-4 py-3 text-right">PF</th>
                    <th className="px-4 py-3 text-right">TDS</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payslips.map((s, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{MONTHS[s.payroll.month - 1]} {s.payroll.year}</td>
                      <td className="px-4 py-3 text-right">₹{Number(s.pfEmployee).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right">₹{Number(s.tds).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right font-medium text-red-600">₹{Number(s.totalDeductions).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
