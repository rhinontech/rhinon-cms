"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { TbChevronRight, TbPlus, TbFileInvoice, TbClockHour4 } from "react-icons/tb";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";
import { cn } from "@/lib/utils";
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
  const { isExpanded: isSubNavExpanded } = useSideNav();
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
    <div className={cn("flex min-h-0 min-w-0 flex-col h-full w-full glass-panel overflow-hidden", isSubNavExpanded ? "rounded-r-xl max-sm:rounded-xl" : "rounded-xl")}>
      <div className="sticky top-0 z-10 flex min-h-16 flex-wrap items-center gap-2.5 sm:gap-4 px-4 sm:px-5 py-2 sm:py-0 border-b border-border glass-header">
        <SubNavToggle />
        <h1 className="text-base sm:text-lg font-semibold tracking-tight truncate">Overview</h1>
      </div>

      <div className="flex-1 min-h-0 min-w-0 overflow-auto p-3 sm:p-6 max-w-full">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Payslips */}
          <div className="xl:col-span-2 glass-card-solid rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b">
              <p className="font-semibold text-xs sm:text-sm text-foreground">Recent Payslips</p>
              <Link href={`/${roleSlug}/payroll/payslips`} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-300 hover:underline">
                View all <TbChevronRight size={14} />
              </Link>
            </div>

            {loading ? (
              <div className="p-4 sm:p-6 space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : payslips.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center text-muted-foreground">
                <TbFileInvoice size={36} className="mb-3 text-muted-foreground/70" />
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">No payslips yet</p>
                <p className="text-[11px] sm:text-xs mt-1">Your payslips will appear here once payroll is processed.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {payslips.slice(0, 6).map((slip) => (
                  <Link
                    key={slip.id}
                    href={`/${roleSlug}/payroll/payslips/${slip.id}`}
                    className="flex items-center justify-between px-3.5 sm:px-5 py-3 sm:py-4 hover:bg-muted/40 transition-colors group gap-2"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-50 dark:bg-blue-400/10 flex items-center justify-center text-blue-600 dark:text-blue-300 shrink-0">
                        <TbFileInvoice size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-xs sm:text-sm truncate">
                          {MONTHS[slip.payroll.month - 1]} {slip.payroll.year}
                        </p>
                        <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                          Gross ₹{Number(slip.grossPay).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                      <span
                        className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${
                          slip.payroll.status === "paid"
                            ? "bg-green-100 dark:bg-green-400/15 text-green-700 dark:text-green-300"
                            : slip.payroll.status === "processed"
                            ? "bg-blue-100 dark:bg-blue-400/15 text-blue-700 dark:text-blue-300"
                            : "bg-amber-100 dark:bg-amber-400/15 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {slip.payroll.status}
                      </span>
                      <div className="text-right">
                        <p className="font-semibold text-foreground text-xs sm:text-sm">
                          ₹{Number(slip.netPay).toLocaleString("en-IN")}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Net Pay</p>
                      </div>
                      <TbChevronRight size={16} className="text-muted-foreground/70 group-hover:text-muted-foreground transition-colors hidden sm:block" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4 sm:gap-5">
            {/* My Requests */}
            <div className="glass-card-solid rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b">
                <p className="font-semibold text-xs sm:text-sm text-foreground">My Requests</p>
                <button className="inline-flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2.5 py-1 sm:py-1.5 rounded-lg hover:bg-primary/90 transition-colors">
                  <TbPlus size={13} /> New
                </button>
              </div>
              <div className="flex flex-col items-center justify-center py-8 sm:py-10 text-center px-4">
                <TbClockHour4 size={32} className="mb-2 text-muted-foreground/50" />
                <p className="text-xs sm:text-sm text-muted-foreground">No pending requests</p>
              </div>
            </div>

            {/* Payroll Approvals */}
            <div className="glass-card-solid rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b">
                <p className="font-semibold text-xs sm:text-sm text-foreground">Payroll Approvals</p>
                <button className="text-xs text-blue-600 dark:text-blue-300 hover:underline">View all</button>
              </div>
              <div className="flex flex-col items-center justify-center py-8 sm:py-10 text-center px-4">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mb-2">
                  <TbFileInvoice size={16} className="text-muted-foreground/70" />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">No approvals pending</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
