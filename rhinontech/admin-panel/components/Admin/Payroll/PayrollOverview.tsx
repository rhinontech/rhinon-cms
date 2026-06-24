"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { TbChevronRight, TbPlus, TbFileInvoice, TbClockHour4 } from "react-icons/tb";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Payslip {
  id: string;
  netPay: number;
  grossPay: number;
  payroll: { month: number; year: number; status: string };
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function PayrollOverview() {
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("authToken");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/payroll/me/payslips`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: Payslip[]) => setPayslips(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full bg-stone-50 rounded-r-xl overflow-hidden">
      <div className="sticky top-0 z-10 flex items-center gap-4 h-16 px-5 border-b bg-stone-50">
        <SubNavToggle />
        <h1 className="text-base font-semibold tracking-tight">Overview</h1>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent Payslips */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <p className="font-semibold text-gray-900">Recent Payslips</p>
              <Link href={`/${roleSlug}/payroll/payslips`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                View all <TbChevronRight size={14} />
              </Link>
            </div>

            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : payslips.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
                <TbFileInvoice size={36} className="mb-3 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">No payslips yet</p>
                <p className="text-xs mt-1">Your payslips will appear here once payroll is processed.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {payslips.slice(0, 6).map((slip) => (
                  <Link
                    key={slip.id}
                    href={`/${roleSlug}/payroll/payslips/${slip.id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <TbFileInvoice size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {MONTHS[slip.payroll.month - 1]} {slip.payroll.year}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Gross ₹{Number(slip.grossPay).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                          slip.payroll.status === "paid"
                            ? "bg-green-100 text-green-700"
                            : slip.payroll.status === "processed"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {slip.payroll.status}
                      </span>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 text-sm">
                          ₹{Number(slip.netPay).toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-gray-400">Net Pay</p>
                      </div>
                      <TbChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            {/* My Requests */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <p className="font-semibold text-gray-900">My Requests</p>
                <button className="flex items-center gap-1 text-xs bg-stone-900 text-white px-2.5 py-1.5 rounded-lg hover:bg-stone-800 transition-colors">
                  <TbPlus size={13} /> New
                </button>
              </div>
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <TbClockHour4 size={32} className="mb-2 text-gray-200" />
                <p className="text-sm text-gray-400">No pending requests</p>
              </div>
            </div>

            {/* Payroll Approvals */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <p className="font-semibold text-gray-900">Payroll Approvals</p>
                <button className="text-xs text-blue-600 hover:underline">View all</button>
              </div>
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  <TbFileInvoice size={16} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">No approvals pending</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
