"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { TbLoader2, TbCheck, TbAlertCircle, TbChevronRight } from "react-icons/tb";
import { MdOutlinePlayCircle } from "react-icons/md";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Employee {
  id: string;
  fullName: string;
  department: string;
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

  const eligible = employees.filter((e) => e.basicSalary && Number(e.basicSalary) > 0);
  const notConfigured = employees.filter((e) => !e.basicSalary || Number(e.basicSalary) === 0);

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
      <div className="flex flex-col h-full bg-stone-50 rounded-r-xl overflow-hidden">
        <div className="sticky top-0 z-10 flex items-center gap-4 h-16 px-5 border-b bg-stone-50">
          <SubNavToggle />
          <h1 className="text-base font-semibold tracking-tight">Run Payroll</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-green-100 p-10 text-center max-w-md w-full">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <TbCheck size={32} className="text-green-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Payroll Run Complete</h2>
            <p className="text-sm text-gray-500 mb-6">{result.message}</p>
            <div className="grid grid-cols-3 gap-4 mb-6 text-left">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Period</p>
                <p className="font-semibold text-gray-900 text-sm">{MONTHS[result.payroll.month - 1]} {result.payroll.year}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Total Net</p>
                <p className="font-semibold text-gray-900 text-sm">{INR(result.payroll.totalNet)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Payslips</p>
                <p className="font-semibold text-gray-900 text-sm">{result.payroll.count}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <Link
                href={`/${roleSlug}/payroll/overview`}
                className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800"
              >
                View Dashboard <TbChevronRight size={14} />
              </Link>
              <button
                onClick={() => { setResult(null); setError(""); }}
                className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50"
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
    <div className="flex flex-col h-full bg-stone-50 rounded-r-xl overflow-hidden">
      <div className="sticky top-0 z-10 flex items-center gap-4 h-16 px-5 border-b bg-stone-50">
        <SubNavToggle />
        <h1 className="text-base font-semibold tracking-tight">Run Payroll</h1>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl">
          {/* Period selector */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-5">
            <p className="font-semibold text-gray-900 mb-4">Select Payroll Period</p>
            <div className="flex gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500">Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500">Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Preview — eligible employees */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-5">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <p className="font-semibold text-gray-900">Payslips to be generated</p>
              <span className="text-sm text-gray-500">{eligible.length} employee{eligible.length !== 1 ? "s" : ""}</span>
            </div>

            {loadingPreview ? (
              <div className="p-6 text-sm text-gray-400">Loading preview…</div>
            ) : eligible.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-500">No employees have a salary configured.</p>
                <Link href={`/${roleSlug}/payroll/employees`} className="text-xs text-blue-600 hover:underline mt-1 block">
                  Set up employee salaries →
                </Link>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Employee</th>
                    <th className="px-5 py-3 text-right">Gross</th>
                    <th className="px-5 py-3 text-right">PF</th>
                    <th className="px-5 py-3 text-right">PT</th>
                    <th className="px-5 py-3 text-right">Net Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {eligible.map((emp) => {
                    const { gross, pf, pt, tds, net } = calcEmp(emp);
                    return (
                      <tr key={emp.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-900">{emp.fullName}</p>
                          <p className="text-xs text-gray-400">{emp.role?.name} · {emp.department}</p>
                        </td>
                        <td className="px-5 py-3 text-right">{INR(gross)}</td>
                        <td className="px-5 py-3 text-right text-red-600">{pf > 0 ? `−${INR(pf)}` : <span className="text-gray-300">—</span>}</td>
                        <td className="px-5 py-3 text-right text-red-600">{pt > 0 ? `−${INR(pt)}` : <span className="text-gray-300">—</span>}</td>
                        <td className="px-5 py-3 text-right font-semibold text-green-700">{INR(net)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t border-gray-200 bg-gray-50 font-semibold text-gray-900">
                  <tr>
                    <td className="px-5 py-3">Total ({eligible.length})</td>
                    <td className="px-5 py-3 text-right">{INR(eligible.reduce((s, e) => s + calcEmp(e).gross, 0))}</td>
                    <td colSpan={2} />
                    <td className="px-5 py-3 text-right text-green-700">{INR(eligible.reduce((s, e) => s + calcEmp(e).net, 0))}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Not configured warning */}
          {notConfigured.length > 0 && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-5 text-sm text-amber-800">
              <TbAlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{notConfigured.length} employee{notConfigured.length !== 1 ? "s" : ""} will be skipped</p>
                <p className="text-xs mt-0.5 text-amber-700">No salary structure set for: {notConfigured.map((e) => e.fullName).join(", ")}</p>
                <Link href={`/${roleSlug}/payroll/employees`} className="text-xs text-amber-900 underline mt-1 block">Set up salaries →</Link>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-5 py-3 mb-5 text-sm text-red-700">
              <TbAlertCircle size={16} /> {error}
            </div>
          )}

          {/* Run button */}
          <button
            onClick={run}
            disabled={running || eligible.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white font-medium rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {running ? <TbLoader2 size={18} className="animate-spin" /> : <MdOutlinePlayCircle size={18} />}
            {running ? "Running…" : `Run Payroll for ${MONTHS[month - 1]} ${year}`}
          </button>
        </div>
      </div>
    </div>
  );
}
