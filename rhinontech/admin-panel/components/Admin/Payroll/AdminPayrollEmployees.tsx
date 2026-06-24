"use client";

import { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { TbPencil, TbCheck, TbX, TbSearch, TbLoader2, TbLayoutSidebarFilled, TbLayoutSidebarRightFilled } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { useSideNav } from "@/context/SideNavContext";

interface Employee {
  id: string;
  fullName: string;
  companyEmail: string;
  department: string;
  joiningDate: string;
  pan?: string;
  employmentType?: string;
  compensationType?: string;
  workSchedule?: string;
  remotePosition?: boolean;
  workLocation?: string;
  paymentFrequency?: string;
  legalName?: string;
  roleTitle?: string;
  annualCompensation?: number;
  annualVariablePay?: number;
  pastPayrollFinancialYear?: string;
  pastTaxableSalary?: number;
  pastTdsDeducted?: number;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankBeneficiaryName?: string;
  pfUanNumber?: string;
  esicIpNumber?: string;
  labourWelfareFundEnabled?: boolean;
  npsEnabled?: boolean;
  professionalTaxEnabled?: boolean;
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

interface SalaryForm {
  basicSalary: string;
  hra: string;
  ta: string;
  medicalAllowance: string;
  otherAllowances: string;
  pfEnabled: boolean;
  ptAmount: string;
  tdsAmount: string;
}

type PanelMode = "view" | "edit";

const INR = (v: number) => `₹${Number(v).toLocaleString("en-IN")}`;

function calcGross(f: SalaryForm) {
  return (
    Number(f.basicSalary || 0) +
    Number(f.hra || 0) +
    Number(f.ta || 0) +
    Number(f.medicalAllowance || 0) +
    Number(f.otherAllowances || 0)
  );
}

function calcDeductions(f: SalaryForm) {
  const pf  = f.pfEnabled ? Math.round(Number(f.basicSalary || 0) * 0.12) : 0;
  const pt  = Number(f.ptAmount  || 0);
  const tds = Number(f.tdsAmount || 0);
  return { pf, pt, tds, total: pf + pt + tds };
}

function calcNet(f: SalaryForm) {
  const { total } = calcDeductions(f);
  return calcGross(f) - total;
}

export function AdminPayrollEmployees() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [mode, setMode] = useState<PanelMode>("view");
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(true);
  const [form, setForm] = useState<SalaryForm>({ basicSalary: "", hra: "", ta: "", medicalAllowance: "", otherAllowances: "", pfEnabled: true, ptAmount: "200", tdsAmount: "0" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchEmployees = async () => {
    const token = Cookies.get("authToken");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payroll/admin/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const nextEmployees = Array.isArray(data) ? data : [];

      setEmployees(nextEmployees);
      setSelectedEmployee((current) => {
        if (current) {
          return nextEmployees.find((employee) => employee.id === current.id) ?? nextEmployees[0] ?? null;
        }

        return nextEmployees[0] ?? null;
      });

      return nextEmployees;
    } catch {
      setEmployees([]);
      setSelectedEmployee(null);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const selectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setMode("view");
    setError("");
    setIsPreviewExpanded(true);
  };

  const startEdit = () => {
    if (!selectedEmployee) {
      return;
    }

    setMode("edit");
    setError("");
    setForm({
      basicSalary:      String(selectedEmployee.basicSalary      ?? ""),
      hra:              String(selectedEmployee.hra               ?? ""),
      ta:               String(selectedEmployee.ta                ?? ""),
      medicalAllowance: String(selectedEmployee.medicalAllowance  ?? ""),
      otherAllowances:  String(selectedEmployee.otherAllowances   ?? ""),
      pfEnabled:        selectedEmployee.pfEnabled  !== false,
      ptAmount:         String(selectedEmployee.ptAmount  ?? 200),
      tdsAmount:        String(selectedEmployee.tdsAmount ?? 0),
    });
  };

  const cancelEdit = () => { setMode("view"); setError(""); };

  const save = async () => {
    if (!selectedEmployee) {
      return;
    }

    if (!form.basicSalary || Number(form.basicSalary) <= 0) {
      setError("Basic salary is required");
      return;
    }
    setSaving(true);
    setError("");
    const token = Cookies.get("authToken");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payroll/admin/employees/${selectedEmployee.id}/salary`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        basicSalary:      Number(form.basicSalary),
        hra:              Number(form.hra || 0),
        ta:               Number(form.ta || 0),
        medicalAllowance: Number(form.medicalAllowance || 0),
        otherAllowances:  Number(form.otherAllowances || 0),
        pfEnabled:        form.pfEnabled,
        ptAmount:         Number(form.ptAmount  || 0),
        tdsAmount:        Number(form.tdsAmount || 0),
      }),
    });
    setSaving(false);
    if (res.ok) {
      const nextEmployees = await fetchEmployees();
      setSelectedEmployee(nextEmployees.find((employee) => employee.id === selectedEmployee.id) ?? selectedEmployee);
      setMode("view");
    } else {
      const data = await res.json();
      setError(data.message ?? "Failed to save");
    }
  };

  const filtered = useMemo(() => employees.filter(
    (e) => (
      e.fullName.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase()) ||
      (e.role?.name ?? "").toLowerCase().includes(search.toLowerCase())
    )
  ), [employees, search]);

  const selectedHasSalary = selectedEmployee?.basicSalary && Number(selectedEmployee.basicSalary) > 0;
  const selectedGross = selectedHasSalary
    ? Number(selectedEmployee.basicSalary) + Number(selectedEmployee.hra ?? 0) + Number(selectedEmployee.ta ?? 0) + Number(selectedEmployee.medicalAllowance ?? 0) + Number(selectedEmployee.otherAllowances ?? 0)
    : 0;
  const selectedPF  = selectedHasSalary && selectedEmployee?.pfEnabled !== false ? Math.round(Number(selectedEmployee!.basicSalary) * 0.12) : 0;
  const selectedPT  = selectedHasSalary ? Number(selectedEmployee?.ptAmount  ?? 200) : 0;
  const selectedTDS = selectedHasSalary ? Number(selectedEmployee?.tdsAmount ?? 0)   : 0;
  const selectedNet = selectedGross - selectedPF - selectedPT - selectedTDS;

  return (
    <div className="flex min-h-0 gap-2 h-full overflow-hidden">
      <main className={cn("flex min-h-0 flex-col h-full w-full bg-stone-50 overflow-hidden", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 h-16 px-5 border-b bg-stone-50">
          <div className="flex items-center gap-4">
            <SubNavToggle />
            <h1 className="text-lg font-semibold tracking-tight">Employee Salary Setup</h1>
          </div>
          {!isPreviewExpanded && (
            <button
              onClick={() => setIsPreviewExpanded(true)}
              className="p-2 text-gray-600 hover:bg-stone-100 rounded-lg"
            >
              <TbLayoutSidebarFilled size={20} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="relative mb-5 max-w-sm">
            <TbSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, department or role..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-sm text-gray-400">Loading employees...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">No employees found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Employee</th>
                    <th className="px-5 py-3 text-left">Role / Dept</th>
                    <th className="px-5 py-3 text-right">Basic (mo.)</th>
                    <th className="px-5 py-3 text-right">Gross (mo.)</th>
                    <th className="px-5 py-3 text-right">Net (mo.)</th>
                    <th className="px-5 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((emp) => {
                    const hasSalary = emp.basicSalary && Number(emp.basicSalary) > 0;
                    const gross = hasSalary
                      ? (Number(emp.basicSalary) + Number(emp.hra ?? 0) + Number(emp.ta ?? 0) + Number(emp.medicalAllowance ?? 0) + Number(emp.otherAllowances ?? 0))
                      : null;
                    const empPF  = hasSalary && emp.pfEnabled !== false ? Math.round(Number(emp.basicSalary) * 0.12) : 0;
                    const empPT  = hasSalary ? Number(emp.ptAmount  ?? 200) : 0;
                    const empTDS = hasSalary ? Number(emp.tdsAmount ?? 0)   : 0;
                    const net = hasSalary && gross ? gross - empPF - empPT - empTDS : null;

                    return (
                      <tr
                        key={emp.id}
                        onClick={() => selectEmployee(emp)}
                        className={cn(
                          "cursor-pointer hover:bg-gray-50 transition-colors",
                          selectedEmployee?.id === emp.id && "bg-blue-50 hover:bg-blue-50"
                        )}
                      >
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-900">{emp.fullName}</p>
                          <p className="text-xs text-gray-400">{emp.companyEmail}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-gray-700">{emp.role?.name ?? "—"}</p>
                          <p className="text-xs text-gray-400">{emp.department}</p>
                        </td>
                        <td className="px-5 py-3 text-right font-medium">
                          {hasSalary ? INR(Number(emp.basicSalary)) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {gross ? INR(gross) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold">
                          {net ? INR(net) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-3">
                          {hasSalary ? (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">Set</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 font-medium">Not Set</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      <aside
        className={`flex min-h-0 h-full flex-col bg-white rounded-xl overflow-hidden transition-all duration-200 ease-in-out ${
          isPreviewExpanded ? "w-[42%]" : "w-0"
        }`}
      >
        {isPreviewExpanded && (
          <div className="flex flex-col w-full flex-1 h-full overflow-hidden relative">
            <div className="sticky top-0 w-full flex items-center justify-between h-16 px-5 border-b bg-white z-10">
              <p className="flex self-stretch items-center text-md font-medium tracking-tight border-b-2 border-blue-600 text-black -mb-px">
                Salary Details
              </p>
              <div className="flex items-center gap-2">
                {mode === "view" && selectedEmployee && (
                  <button
                    onClick={startEdit}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <TbPencil size={15} />
                    Edit
                  </button>
                )}
                <button
                  className="cursor-pointer text-gray-600 hover:text-gray-900"
                  onClick={() => setIsPreviewExpanded(false)}
                >
                  <TbLayoutSidebarRightFilled size={20} />
                </button>
              </div>
            </div>

            {mode === "view" ? (
              <div className="flex-1 overflow-auto p-5">
                {selectedEmployee ? (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{selectedEmployee.fullName}</h2>
                      <p className="text-sm text-gray-500">{selectedEmployee.companyEmail}</p>
                      <p className="text-xs text-gray-400 mt-1">{selectedEmployee.role?.name ?? "-"} / {selectedEmployee.department}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="rounded-lg border border-gray-100 p-3">
                        <p className="text-xs text-gray-400">Legal name</p>
                        <p className="mt-1 font-semibold text-gray-900">{selectedEmployee.legalName || selectedEmployee.fullName}</p>
                      </div>
                      <div className="rounded-lg border border-gray-100 p-3">
                        <p className="text-xs text-gray-400">PAN</p>
                        <p className="mt-1 font-semibold text-gray-900">{selectedEmployee.pan || "-"}</p>
                      </div>
                      <div className="rounded-lg border border-gray-100 p-3">
                        <p className="text-xs text-gray-400">Employment type</p>
                        <p className="mt-1 font-semibold text-gray-900">{selectedEmployee.employmentType || "-"}</p>
                      </div>
                      <div className="rounded-lg border border-gray-100 p-3">
                        <p className="text-xs text-gray-400">Work location</p>
                        <p className="mt-1 font-semibold text-gray-900">{selectedEmployee.workLocation || "-"}</p>
                      </div>
                      <div className="rounded-lg border border-gray-100 p-3">
                        <p className="text-xs text-gray-400">Basic salary</p>
                        <p className="mt-1 font-semibold text-gray-900">{selectedHasSalary ? INR(Number(selectedEmployee.basicSalary)) : "-"}</p>
                      </div>
                      <div className="rounded-lg border border-gray-100 p-3">
                        <p className="text-xs text-gray-400">HRA</p>
                        <p className="mt-1 font-semibold text-gray-900">{INR(Number(selectedEmployee.hra ?? 0))}</p>
                      </div>
                      <div className="rounded-lg border border-gray-100 p-3">
                        <p className="text-xs text-gray-400">Transport</p>
                        <p className="mt-1 font-semibold text-gray-900">{INR(Number(selectedEmployee.ta ?? 0))}</p>
                      </div>
                      <div className="rounded-lg border border-gray-100 p-3">
                        <p className="text-xs text-gray-400">Medical</p>
                        <p className="mt-1 font-semibold text-gray-900">{INR(Number(selectedEmployee.medicalAllowance ?? 0))}</p>
                      </div>
                      <div className="rounded-lg border border-gray-100 p-3">
                        <p className="text-xs text-gray-400">Other allowances</p>
                        <p className="mt-1 font-semibold text-gray-900">{INR(Number(selectedEmployee.otherAllowances ?? 0))}</p>
                      </div>
                      <div className="rounded-lg border border-gray-100 p-3">
                        <p className="text-xs text-gray-400">Status</p>
                        <div className="mt-1">
                          {selectedHasSalary ? (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">Set</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 font-medium">Not Set</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-100 p-4 text-sm space-y-3">
                      <p className="font-semibold text-gray-900">Payment Information</p>
                      <div className="grid grid-cols-2 gap-3">
                        <PayrollDetail label="Account number" value={selectedEmployee.bankAccountNumber || "-"} />
                        <PayrollDetail label="IFSC code" value={selectedEmployee.bankIfscCode || "-"} />
                        <PayrollDetail label="Beneficiary" value={selectedEmployee.bankBeneficiaryName || "-"} />
                        <PayrollDetail label="Payment frequency" value={selectedEmployee.paymentFrequency || "Monthly"} />
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-100 p-4 text-sm space-y-3">
                      <p className="font-semibold text-gray-900">Past Payroll & Statutory</p>
                      <div className="grid grid-cols-2 gap-3">
                        <PayrollDetail label="Financial year" value={selectedEmployee.pastPayrollFinancialYear || "FY 2026 - 2027"} />
                        <PayrollDetail label="Past taxable salary" value={INR(Number(selectedEmployee.pastTaxableSalary || 0))} />
                        <PayrollDetail label="Past TDS deducted" value={INR(Number(selectedEmployee.pastTdsDeducted || 0))} />
                        <PayrollDetail label="PF UAN" value={selectedEmployee.pfUanNumber || "Not opted in"} />
                        <PayrollDetail label="ESIC IP" value={selectedEmployee.esicIpNumber || "Not opted in"} />
                        <PayrollDetail label="Professional Tax" value={selectedEmployee.professionalTaxEnabled === false ? "Disabled" : "Enabled"} />
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-100 p-4 text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Gross monthly</span>
                        <strong>{selectedHasSalary ? INR(selectedGross) : "-"}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">PF {selectedEmployee?.pfEnabled !== false ? "(12%)" : "(disabled)"}</span>
                        <strong className={selectedPF > 0 ? "text-red-600" : "text-gray-400"}>{selectedHasSalary ? `-${INR(selectedPF)}` : "-"}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">PT</span>
                        <strong className={selectedPT > 0 ? "text-red-600" : "text-gray-400"}>{selectedHasSalary ? `-${INR(selectedPT)}` : "-"}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">TDS</span>
                        <strong className={selectedTDS > 0 ? "text-red-600" : "text-gray-400"}>{selectedHasSalary ? `-${INR(selectedTDS)}` : "-"}</strong>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-700">Estimated net</span>
                        <strong className="text-green-700">{selectedHasSalary ? INR(selectedNet) : "-"}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">Select an employee.</div>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-auto p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {([
                    { key: "basicSalary",      label: "Basic Salary *" },
                    { key: "hra",              label: "HRA" },
                    { key: "ta",               label: "Transport (TA)" },
                    { key: "medicalAllowance", label: "Medical" },
                    { key: "otherAllowances",  label: "Other" },
                  ] as { key: keyof SalaryForm; label: string }[]).map(({ key, label }) => (
                    <label key={key} className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                      {label}
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                        <input
                          type="number"
                          min={0}
                          value={form[key] as string}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                          className="w-full pl-6 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          placeholder="0"
                        />
                      </div>
                    </label>
                  ))}
                </div>

                {/* Deductions */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deductions</p>
                  <label className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-gray-700">PF (12% of Basic)</p>
                      <p className="text-xs text-gray-400 mt-0.5">Provident Fund — employee contribution</p>
                    </div>
                    <div
                      className={cn("w-9 h-5 rounded-full transition-colors flex items-center px-0.5 shrink-0 cursor-pointer", form.pfEnabled ? "bg-stone-900" : "bg-gray-200")}
                      onClick={() => setForm((f) => ({ ...f, pfEnabled: !f.pfEnabled }))}
                    >
                      <div className={cn("w-4 h-4 bg-white rounded-full shadow-sm transition-transform", form.pfEnabled ? "translate-x-4" : "translate-x-0")} />
                    </div>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                      Professional Tax (₹/mo)
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                        <input type="number" min={0} value={form.ptAmount} onChange={(e) => setForm((f) => ({ ...f, ptAmount: e.target.value }))} className="w-full pl-6 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" placeholder="200" />
                      </div>
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                      TDS (₹/mo)
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                        <input type="number" min={0} value={form.tdsAmount} onChange={(e) => setForm((f) => ({ ...f, tdsAmount: e.target.value }))} className="w-full pl-6 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" placeholder="0" />
                      </div>
                    </label>
                  </div>
                </div>

                {/* Live preview */}
                <div className="rounded-lg border border-gray-100 p-4 text-sm space-y-2">
                  {(() => { const d = calcDeductions(form); return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Gross</span>
                        <strong>{INR(calcGross(form))}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">PF {form.pfEnabled ? "(12%)" : "(off)"}</span>
                        <strong className={d.pf > 0 ? "text-red-600" : "text-gray-400"}>-{INR(d.pf)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">PT</span>
                        <strong className={d.pt > 0 ? "text-red-600" : "text-gray-400"}>-{INR(d.pt)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">TDS</span>
                        <strong className={d.tds > 0 ? "text-red-600" : "text-gray-400"}>-{INR(d.tds)}</strong>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-700">Estimated net</span>
                        <strong className="text-green-700">{INR(calcNet(form))}</strong>
                      </div>
                    </>
                  ); })()}
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <div className="flex items-center justify-end gap-3 border-t pt-4">
                  <button
                    onClick={cancelEdit}
                    className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <TbX size={15} />
                    Cancel
                  </button>
                  <button
                    onClick={save}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
                  >
                    {saving ? <TbLoader2 size={15} className="animate-spin" /> : <TbCheck size={15} />}
                    Save changes
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

function PayrollDetail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <div className="mt-1 font-medium text-gray-900">{value}</div>
    </div>
  );
}
