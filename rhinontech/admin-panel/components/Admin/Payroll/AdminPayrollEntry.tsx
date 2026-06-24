"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { TbCheck, TbLoader2, TbPlus, TbChevronDown } from "react-icons/tb";
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  fullName: string;
  companyEmail: string;
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

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const INR = (v: number) => `₹${Number(v).toLocaleString("en-IN")}`;

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

function calcAmounts(f: {
  basicSalary: string; hra: string; ta: string; medicalAllowance: string; otherAllowances: string;
  pfEnabled: boolean; ptAmount: string; tdsAmount: string;
}) {
  const basic = Number(f.basicSalary || 0);
  const gross = basic + Number(f.hra || 0) + Number(f.ta || 0) + Number(f.medicalAllowance || 0) + Number(f.otherAllowances || 0);
  const pf    = f.pfEnabled ? Math.round(basic * 0.12) : 0;
  const pt    = Number(f.ptAmount  || 0);
  const tds   = Number(f.tdsAmount || 0);
  return { gross, pf, pt, tds, net: gross - pf - pt - tds };
}

type SuccessInfo = { employeeName: string; month: number; year: number; net: number };

export function AdminPayrollEntry() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId]   = useState("");
  const [month, setMonth]             = useState(new Date().getMonth() + 1); // 1-based
  const [year, setYear]               = useState(currentYear);

  const [basicSalary, setBasicSalary]           = useState("");
  const [hra, setHra]                           = useState("");
  const [ta, setTa]                             = useState("");
  const [medicalAllowance, setMedicalAllowance] = useState("");
  const [otherAllowances, setOtherAllowances]   = useState("");
  const [pfEnabled, setPfEnabled]               = useState(true);
  const [ptAmount, setPtAmount]                 = useState("200");
  const [tdsAmount, setTdsAmount]               = useState("0");

  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState<SuccessInfo | null>(null);

  const token = Cookies.get("authToken");
  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetch(`${apiBase}/payroll/admin/employees`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setEmployees(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const prefill = (emp: Employee) => {
    setBasicSalary(String(emp.basicSalary    ?? ""));
    setHra(String(emp.hra               ?? ""));
    setTa(String(emp.ta                ?? ""));
    setMedicalAllowance(String(emp.medicalAllowance ?? ""));
    setOtherAllowances(String(emp.otherAllowances  ?? ""));
    setPfEnabled(emp.pfEnabled !== false);
    setPtAmount(String(emp.ptAmount  ?? 200));
    setTdsAmount(String(emp.tdsAmount ?? 0));
  };

  const handleEmployeeChange = (id: string) => {
    setSelectedId(id);
    setError("");
    setSuccess(null);
    const emp = employees.find((e) => e.id === id);
    if (emp) prefill(emp);
    else {
      setBasicSalary(""); setHra(""); setTa(""); setMedicalAllowance(""); setOtherAllowances("");
      setPfEnabled(true); setPtAmount("200"); setTdsAmount("0");
    }
  };

  const resetForm = () => {
    setSelectedId(""); setBasicSalary(""); setHra(""); setTa("");
    setMedicalAllowance(""); setOtherAllowances("");
    setPfEnabled(true); setPtAmount("200"); setTdsAmount("0");
    setError(""); setSuccess(null);
  };

  const submit = async () => {
    if (!selectedId) { setError("Select an employee."); return; }
    if (!basicSalary || Number(basicSalary) <= 0) { setError("Basic salary is required."); return; }
    setSaving(true);
    setError("");

    const res = await fetch(`${apiBase}/payroll/admin/payslips/manual`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        userId: selectedId, month, year,
        basicSalary: Number(basicSalary),
        hra:              Number(hra              || 0),
        ta:               Number(ta               || 0),
        medicalAllowance: Number(medicalAllowance || 0),
        otherAllowances:  Number(otherAllowances  || 0),
        pfEnabled,
        ptAmount:  Number(ptAmount  || 0),
        tdsAmount: Number(tdsAmount || 0),
      }),
    });

    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(data.message || "Failed to create payslip.");
      return;
    }

    const { gross, net } = calcAmounts({ basicSalary, hra, ta, medicalAllowance, otherAllowances, pfEnabled, ptAmount, tdsAmount });
    setSuccess({ employeeName: data.employeeName, month, year, net });
  };

  const amounts = calcAmounts({ basicSalary, hra, ta, medicalAllowance, otherAllowances, pfEnabled, ptAmount, tdsAmount });
  const selectedEmployee = employees.find((e) => e.id === selectedId);

  return (
    <div className="flex flex-col h-full bg-stone-50 rounded-r-xl overflow-hidden">
      <div className="sticky top-0 z-10 flex items-center gap-4 h-16 px-5 border-b bg-stone-50 shrink-0">
        <SubNavToggle />
        <div>
          <h1 className="text-sm font-semibold tracking-tight">Payslip Entry</h1>
          <p className="text-xs text-gray-400">Create payslips for past or current periods</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-6">

          {success ? (
            <div className="bg-white rounded-xl border border-green-200 p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <TbCheck size={22} className="text-green-600" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">Payslip Created</p>
                <p className="text-sm text-gray-500 mt-1">
                  {success.employeeName} · {MONTHS[success.month - 1]} {success.year}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{INR(success.net)} <span className="text-sm font-normal text-gray-400">net pay</span></p>
              </div>
              <button
                onClick={resetForm}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800"
              >
                <TbPlus size={15} /> Add another payslip
              </button>
            </div>
          ) : (
            <>
              {/* Period + Employee */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Period & Employee</p>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Month
                    <div className="relative">
                      <select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                      </select>
                      <TbChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </label>

                  <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Year
                    <div className="relative">
                      <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <TbChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </label>
                </div>

                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  Employee
                  <div className="relative">
                    <select
                      value={selectedId}
                      onChange={(e) => handleEmployeeChange(e.target.value)}
                      className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">{loading ? "Loading..." : "Select employee"}</option>
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>{e.fullName} — {e.department}</option>
                      ))}
                    </select>
                    <TbChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  {selectedEmployee && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Current salary: {selectedEmployee.basicSalary ? INR(Number(selectedEmployee.basicSalary)) : "not set"} basic
                      {selectedEmployee.basicSalary ? " — pre-filled below, edit for this period" : ""}
                    </p>
                  )}
                </label>
              </div>

              {/* Earnings */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Earnings for this period</p>
                <div className="grid grid-cols-2 gap-4">
                  {([
                    { label: "Basic Salary *", value: basicSalary, set: setBasicSalary },
                    { label: "HRA",             value: hra,         set: setHra         },
                    { label: "Transport (TA)",  value: ta,          set: setTa          },
                    { label: "Medical",         value: medicalAllowance, set: setMedicalAllowance },
                    { label: "Other Allowances",value: otherAllowances,  set: setOtherAllowances  },
                  ] as { label: string; value: string; set: (v: string) => void }[]).map(({ label, value, set }) => (
                    <label key={label} className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                      {label}
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                        <input
                          type="number" min={0} value={value}
                          onChange={(e) => { set(e.target.value); setError(""); }}
                          className="w-full pl-6 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Deductions */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deductions for this period</p>

                <label className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-gray-700">PF (12% of Basic)</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {pfEnabled ? `= ${INR(Math.round(Number(basicSalary || 0) * 0.12))} this period` : "Disabled — ₹0"}
                    </p>
                  </div>
                  <div
                    className={cn("w-9 h-5 rounded-full flex items-center px-0.5 shrink-0 cursor-pointer transition-colors", pfEnabled ? "bg-stone-900" : "bg-gray-200")}
                    onClick={() => setPfEnabled((v) => !v)}
                  >
                    <div className={cn("w-4 h-4 bg-white rounded-full shadow-sm transition-transform", pfEnabled ? "translate-x-4" : "translate-x-0")} />
                  </div>
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Professional Tax (₹)
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                      <input type="number" min={0} value={ptAmount} onChange={(e) => setPtAmount(e.target.value)}
                        className="w-full pl-6 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="200" />
                    </div>
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    TDS (₹)
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                      <input type="number" min={0} value={tdsAmount} onChange={(e) => setTdsAmount(e.target.value)}
                        className="w-full pl-6 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
                    </div>
                  </label>
                </div>
              </div>

              {/* Live summary */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Summary</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gross</span>
                    <span className="font-medium">{INR(amounts.gross)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">PF {pfEnabled ? "(12%)" : "(off)"}</span>
                    <span className={amounts.pf > 0 ? "text-red-500" : "text-gray-400"}>−{INR(amounts.pf)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Professional Tax</span>
                    <span className={amounts.pt > 0 ? "text-red-500" : "text-gray-400"}>−{INR(amounts.pt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">TDS</span>
                    <span className={amounts.tds > 0 ? "text-red-500" : "text-gray-400"}>−{INR(amounts.tds)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3 mt-1">
                    <span className="font-semibold text-gray-900">Net Pay</span>
                    <span className="text-lg font-bold text-green-700">{INR(amounts.net)}</span>
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}

              <button
                onClick={submit}
                disabled={saving || !selectedId || !basicSalary}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors"
              >
                {saving ? <TbLoader2 size={16} className="animate-spin" /> : <TbCheck size={16} />}
                {saving ? "Creating payslip…" : `Create payslip for ${MONTHS[month - 1]} ${year}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
