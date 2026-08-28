"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TbFileInvoice, TbDownload } from "react-icons/tb";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { usePermissions } from "@/context/PermissionsContext";

interface Payslip {
  id: string;
  netPay: number;
  grossPay: number;
  totalDeductions: number;
  status: string;
  payroll: { month: number; year: number; status: string };
  employee?: { fullName: string; companyEmail: string; department: string };
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function PayslipsList() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const { has } = usePermissions();
  const isAdminView = has("payroll:write");

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("authToken="))
      ?.split("=")[1];
    const runId = new URLSearchParams(window.location.search).get("run");
    const params = new URLSearchParams();
    if (runId) params.set("run", runId);
    const endpoint = isAdminView
      ? `/payroll/admin/payslips${params.toString() ? `?${params.toString()}` : ""}`
      : "/payroll/me/payslips";

    fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setPayslips(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAdminView]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-muted rounded-r-xl">
      <div className="sticky top-0 z-10 flex items-center gap-4 h-16 px-5 border-b bg-muted">
        <SubNavToggle />
        <h1 className="text-base font-semibold tracking-tight">Payslips</h1>
      </div>

      <div className="flex-1 overflow-auto p-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : payslips.length === 0 ? (
          <div className="glass-card-solid rounded-xl p-12 text-center text-muted-foreground text-sm">No payslips found.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {payslips.map((slip) => (
              <div key={slip.id} className="glass-card-solid rounded-xl px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-50 dark:bg-blue-400/10 rounded-lg text-blue-600 dark:text-blue-300"><TbFileInvoice size={20} /></div>
                  <div>
                    <p className="font-medium text-foreground">{MONTHS[slip.payroll.month - 1]} {slip.payroll.year}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isAdminView && slip.employee ? `${slip.employee.fullName} · ` : ""}
                      Net ₹{Number(slip.netPay).toLocaleString("en-IN")} · Gross ₹{Number(slip.grossPay).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${slip.payroll.status === "paid" ? "bg-green-100 dark:bg-green-400/15 text-green-700 dark:text-green-300" : "bg-yellow-100 dark:bg-yellow-400/15 text-yellow-700 dark:text-yellow-300"}`}>
                    {slip.payroll.status}
                  </span>
                  <Link href={`/${roleSlug}/payroll/payslips/${slip.id}`} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground/85 border border-border rounded-lg hover:bg-muted/40 transition-colors">
                    <TbDownload size={14} /> View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
