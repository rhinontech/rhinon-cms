"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";
import { cn } from "@/lib/utils";
import { TbLoader2, TbCheck, TbAlertCircle, TbChevronRight } from "react-icons/tb";
import { MdOutlinePlayCircle } from "react-icons/md";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Employee {
  id: string;
  fullName: string;
  department: string;
  exitDate?: string | null;
  basicSalary?: number;
  hra?: number;
  ta?: number;
  medicalAllowance?: number;
  otherAllowances?: number;
  pfEnabled?: boolean;
  ptAmount?: number;
  tdsAmount?: number;
  role?: { name: string };
}

function calcEmp(emp: Employee) {
  const basic = Number(emp.basicSalary ?? 0);
  const gross = basic + Number(emp.hra ?? 0) + Number(emp.ta ?? 0) + Number(emp.medicalAllowance ?? 0) + Number(emp.otherAllowances ?? 0);
  const pf  = emp.pfEnabled !== false ? Math.round(basic * 0.12) : 0;
  const pt  = Number(emp.ptAmount  ?? 200);
  const tds = Number(emp.tdsAmount ?? 0);
  return { gross, pf, pt, tds, net: gross - pf - pt - tds };
}

interface RunResult {
  message: string;
  payroll: { id: string; month: number; year: number; totalGross: number; totalNet: number; count: number };
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const INR = (v: number) => `₹${Number(v).toLocaleString("en-IN")}`;

export function AdminPayrollRun() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = Cookies.get("authToken");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/payroll/admin/employees`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setEmployees(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingPreview(false));
  }, []);

  // Members whose last working day falls in (or before) the selected month are paid
  // through Final Settlements, so the run skips them — mirror that in the preview.
  const endOfMonth = `${year}-${String(month).padStart(2, "0")}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
  const isExiting = (e: Employee) => !!e.exitDate && e.exitDate <= endOfMonth;
  const exiting = employees.filter(isExiting);
  const eligible = employees.filter((e) => e.basicSalary && Number(e.basicSalary) > 0 && !isExiting(e));
  const notConfigured = employees.filter((e) => (!e.basicSalary || Number(e.basicSalary) === 0) && !isExiting(e));

  const run = async () => {
    setRunning(true);
    setError("");
    const token = Cookies.get("authToken");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payroll/admin/run`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ month, year }),
    });
    const data = await res.json();
    setRunning(false);
    if (res.ok) {
      setResult(data);
    } else {
      setError(data.message ?? "Failed to run payroll");
    }
  };

  // Success state
  if (result) {
    return (
      <div className={cn("flex min-h-0 min-w-0 flex-col h-full w-full glass-panel overflow-hidden", isSubNavExpanded ? "rounded-r-xl max-sm:rounded-xl" : "rounded-xl")}>
        <div className="sticky top-0 z-10 flex min-h-16 flex-wrap items-center gap-2.5 sm:gap-4 px-4 sm:px-5 py-2 sm:py-0 border-b border-border glass-header">
          <SubNavToggle />
          <h1 className="text-base sm:text-lg font-semibold tracking-tight truncate">Run Payroll</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-auto">
          <div className="bg-card rounded-2xl border border-green-100 dark:border-green-400/20 p-6 sm:p-10 text-center max-w-md w-full">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-100 dark:bg-green-400/15 flex items-center justify-center mx-auto mb-4 sm:mb-5">
              <TbCheck size={28} className="text-green-600 dark:text-green-300" />
            </div>
            <h2 className="text-sm sm:text-base font-semibold text-foreground mb-1">Payroll Run Complete</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-5 sm:mb-6">{result.message}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 mb-5 sm:mb-6 text-left">
              <div className="bg-muted/40 rounded-lg p-2.5 sm:p-3">
                <p className="text-xs text-muted-foreground">Period</p>
                <p className="font-semibold text-foreground text-xs sm:text-sm truncate">{MONTHS[result.payroll.month - 1]} {result.payroll.year}</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-2.5 sm:p-3">
                <p className="text-xs text-muted-foreground">Total Net</p>
                <p className="font-semibold text-foreground text-xs sm:text-sm truncate">{INR(result.payroll.totalNet)}</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-2.5 sm:p-3">
                <p className="text-xs text-muted-foreground">Payslips</p>
                <p className="font-semibold text-foreground text-xs sm:text-sm">{result.payroll.count}</p>
              </div>
            </div>
            <div className="flex flex-wrap sm:flex-nowrap gap-2.5 sm:gap-3 justify-center">
              <Link
                href={`/${roleSlug}/payroll/overview`}
                className="flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 bg-primary text-primary-foreground text-xs sm:text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors w-full sm:w-auto"
              >
                View Dashboard <TbChevronRight size={14} />
              </Link>
              <button
                onClick={() => { setResult(null); setError(""); }}
                className="px-3.5 sm:px-4 py-2 border border-border text-xs sm:text-sm text-foreground/70 rounded-lg hover:bg-muted/40 transition-colors w-full sm:w-auto"
              >
                Run Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-0 min-w-0 flex-col h-full w-full glass-panel overflow-hidden", isSubNavExpanded ? "rounded-r-xl max-sm:rounded-xl" : "rounded-xl")}>
      <div className="sticky top-0 z-10 flex min-h-16 flex-wrap items-center gap-2.5 sm:gap-4 px-4 sm:px-5 py-2 sm:py-0 border-b border-border glass-header">
        <SubNavToggle />
        <h1 className="text-base sm:text-lg font-semibold tracking-tight truncate">Run Payroll</h1>
      </div>

      <div className="flex-1 min-h-0 min-w-0 overflow-auto p-3 sm:p-6 max-w-full">
        <div className="max-w-3xl">
          {/* Period selector */}
          <div className="glass-card-solid rounded-xl p-4 sm:p-6 mb-4 sm:mb-5">
            <p className="font-semibold text-xs sm:text-sm text-foreground mb-3 sm:mb-4">Select Payroll Period</p>
            <div className="flex flex-wrap sm:flex-nowrap gap-3 sm:gap-4">
              <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                <label className="text-xs text-muted-foreground">Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-card"
                >
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                <label className="text-xs text-muted-foreground">Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-card"
                >
                  {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Preview — eligible employees */}
          <div className="glass-card-solid rounded-xl overflow-x-auto shadow-xs max-w-full w-full mb-4 sm:mb-5">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b flex items-center justify-between">
              <p className="font-semibold text-xs sm:text-sm text-foreground">Payslips to be generated</p>
              <span className="text-xs sm:text-sm text-muted-foreground">{eligible.length} employee{eligible.length !== 1 ? "s" : ""}</span>
            </div>

            {loadingPreview ? (
              <div className="p-6 text-xs sm:text-sm text-muted-foreground">Loading preview…</div>
            ) : eligible.length === 0 ? (
              <div className="p-6 sm:p-8 text-center">
                <p className="text-xs sm:text-sm text-muted-foreground">No employees have a salary configured.</p>
                <Link href={`/${roleSlug}/payroll/employees`} className="text-xs text-blue-600 dark:text-blue-300 hover:underline mt-1 block">
                  Set up employee salaries →
                </Link>
              </div>
            ) : (
              <table className="w-full min-w-[560px] text-xs sm:text-sm">
                <thead className="glass-thead text-xs text-foreground/70 uppercase">
                  <tr>
                    <th className="px-4 sm:px-5 py-2.5 sm:py-3 text-left">Employee</th>
                    <th className="px-4 sm:px-5 py-2.5 sm:py-3 text-right">Gross</th>
                    <th className="px-4 sm:px-5 py-2.5 sm:py-3 text-right">PF</th>
                    <th className="px-4 sm:px-5 py-2.5 sm:py-3 text-right">PT</th>
                    <th className="px-4 sm:px-5 py-2.5 sm:py-3 text-right">Net Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {eligible.map((emp) => {
                    const { gross, pf, pt, tds, net } = calcEmp(emp);
                    return (
                      <tr key={emp.id} className="hover:bg-muted/40">
                        <td className="px-4 sm:px-5 py-2.5 sm:py-3">
                          <p className="font-medium text-foreground">{emp.fullName}</p>
                          <p className="text-xs text-muted-foreground">{emp.role?.name} · {emp.department}</p>
                        </td>
                        <td className="px-4 sm:px-5 py-2.5 sm:py-3 text-right">{INR(gross)}</td>
                        <td className="px-4 sm:px-5 py-2.5 sm:py-3 text-right text-red-600 dark:text-red-300">{pf > 0 ? `−${INR(pf)}` : <span className="text-muted-foreground/70">—</span>}</td>
                        <td className="px-4 sm:px-5 py-2.5 sm:py-3 text-right text-red-600 dark:text-red-300">{pt > 0 ? `−${INR(pt)}` : <span className="text-muted-foreground/70">—</span>}</td>
                        <td className="px-4 sm:px-5 py-2.5 sm:py-3 text-right font-semibold text-green-700 dark:text-green-300">{INR(net)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t border-border bg-muted/40 font-semibold text-foreground">
                  <tr>
                    <td className="px-4 sm:px-5 py-2.5 sm:py-3">Total ({eligible.length})</td>
                    <td className="px-4 sm:px-5 py-2.5 sm:py-3 text-right">{INR(eligible.reduce((s, e) => s + calcEmp(e).gross, 0))}</td>
                    <td colSpan={2} />
                    <td className="px-4 sm:px-5 py-2.5 sm:py-3 text-right text-green-700 dark:text-green-300">{INR(eligible.reduce((s, e) => s + calcEmp(e).net, 0))}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Exiting members — settled separately */}
          {exiting.length > 0 && (
            <div className="flex items-start gap-2.5 sm:gap-3 bg-purple-50 dark:bg-purple-400/10 border border-purple-200 dark:border-purple-400/25 rounded-xl px-3.5 sm:px-5 py-3 sm:py-4 mb-4 sm:mb-5 text-xs sm:text-sm text-purple-800 dark:text-purple-200">
              <TbAlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{exiting.length} exiting member{exiting.length !== 1 ? "s" : ""} excluded from this run</p>
                <p className="text-[11px] sm:text-xs mt-0.5 text-purple-700 dark:text-purple-300">
                  Last working day falls within this period for: {exiting.map((e) => e.fullName).join(", ")}
                </p>
                <Link href={`/${roleSlug}/payroll/settlements`} className="text-xs text-purple-900 dark:text-purple-200 underline mt-1 block">
                  Pay them via Final Settlements →
                </Link>
              </div>
            </div>
          )}

          {/* Not configured warning */}
          {notConfigured.length > 0 && (
            <div className="flex items-start gap-2.5 sm:gap-3 bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/25 rounded-xl px-3.5 sm:px-5 py-3 sm:py-4 mb-4 sm:mb-5 text-xs sm:text-sm text-amber-800 dark:text-amber-200">
              <TbAlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{notConfigured.length} employee{notConfigured.length !== 1 ? "s" : ""} will be skipped</p>
                <p className="text-[11px] sm:text-xs mt-0.5 text-amber-700 dark:text-amber-300">No salary structure set for: {notConfigured.map((e) => e.fullName).join(", ")}</p>
                <Link href={`/${roleSlug}/payroll/employees`} className="text-xs text-amber-900 dark:text-amber-200 underline mt-1 block">Set up salaries →</Link>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-400/10 border border-red-200 dark:border-red-400/25 rounded-xl px-3.5 sm:px-5 py-2.5 sm:py-3 mb-4 sm:mb-5 text-xs sm:text-sm text-red-700 dark:text-red-300">
              <TbAlertCircle size={16} className="shrink-0" /> {error}
            </div>
          )}

          {/* Run button */}
          <button
            onClick={run}
            disabled={running || eligible.length === 0}
            className="flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground text-xs sm:text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            {running ? <TbLoader2 size={18} className="animate-spin" /> : <MdOutlinePlayCircle size={18} />}
            <span>{running ? "Running…" : `Run Payroll for ${MONTHS[month - 1]} ${year}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
