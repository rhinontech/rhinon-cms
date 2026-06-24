"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import { TbCamera, TbLayoutSidebarFilled, TbLayoutSidebarRightFilled, TbPencil, TbPlus, TbSearch } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { WorkSchedulePicker } from "@/components/Admin/Common/WorkSchedulePicker";

interface Role {
  id: string;
  name: string;
  slug: string;
}

interface Employee {
  id: string;
  fullName: string;
  personalEmail: string;
  companyEmail: string;
  department: string;
  roleId: string;
  status: "active" | "inactive";
  joiningDate: string;
  dateOfBirth?: string;
  pan?: string;
  avatarUrl?: string;
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
  role?: Role;
}

type PanelMode = "view" | "create" | "edit";

type EmployeeForm = {
  fullName: string;
  personalEmail: string;
  roleId: string;
  department: string;
  joiningDate: string;
  dateOfBirth: string;
  status: "active" | "inactive";
  emailPrefix: string;
  pan: string;
  employmentType: string;
  compensationType: string;
  workSchedule: string;
  remotePosition: boolean;
  workLocation: string;
  paymentFrequency: string;
  legalName: string;
  roleTitle: string;
  annualCompensation: string;
  annualVariablePay: string;
  pastPayrollFinancialYear: string;
  pastTaxableSalary: string;
  pastTdsDeducted: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  bankBeneficiaryName: string;
  pfUanNumber: string;
  esicIpNumber: string;
  labourWelfareFundEnabled: boolean;
  npsEnabled: boolean;
  professionalTaxEnabled: boolean;
  basicSalary: string;
  hra: string;
  ta: string;
  medicalAllowance: string;
  otherAllowances: string;
};

const emptyForm: EmployeeForm = {
  fullName: "",
  personalEmail: "",
  roleId: "",
  department: "",
  joiningDate: "",
  dateOfBirth: "",
  status: "active",
  emailPrefix: "",
  pan: "",
  employmentType: "Full-Time",
  compensationType: "Salaried",
  workSchedule: "11 AM – 8 PM (Mon–Sat)",
  remotePosition: false,
  workLocation: "",
  paymentFrequency: "Monthly",
  legalName: "",
  roleTitle: "",
  annualCompensation: "",
  annualVariablePay: "0",
  pastPayrollFinancialYear: "FY 2026 - 2027",
  pastTaxableSalary: "0",
  pastTdsDeducted: "0",
  bankAccountNumber: "",
  bankIfscCode: "",
  bankBeneficiaryName: "",
  pfUanNumber: "",
  esicIpNumber: "",
  labourWelfareFundEnabled: false,
  npsEnabled: false,
  professionalTaxEnabled: true,
  basicSalary: "",
  hra: "",
  ta: "",
  medicalAllowance: "",
  otherAllowances: "",
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function inputDate(date: string) {
  return date ? date.slice(0, 10) : "";
}

function money(value?: number | string) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function employeeToForm(employee: Employee): EmployeeForm {
  return {
    fullName: employee.fullName,
    personalEmail: employee.personalEmail,
    roleId: employee.roleId,
    department: employee.department,
    joiningDate: inputDate(employee.joiningDate),
    dateOfBirth: inputDate(employee.dateOfBirth ?? ""),
    status: employee.status,
    emailPrefix: "",
    pan: employee.pan ?? "",
    employmentType: employee.employmentType ?? "Full-Time",
    compensationType: employee.compensationType ?? "Salaried",
    workSchedule: employee.workSchedule ?? "11 AM – 8 PM (Mon–Sat)",
    remotePosition: employee.remotePosition ?? false,
    workLocation: employee.workLocation ?? "",
    paymentFrequency: employee.paymentFrequency ?? "Monthly",
    legalName: employee.legalName ?? employee.fullName,
    roleTitle: employee.roleTitle ?? employee.role?.name ?? "",
    annualCompensation: String(employee.annualCompensation ?? ""),
    annualVariablePay: String(employee.annualVariablePay ?? 0),
    pastPayrollFinancialYear: employee.pastPayrollFinancialYear ?? "FY 2026 - 2027",
    pastTaxableSalary: String(employee.pastTaxableSalary ?? 0),
    pastTdsDeducted: String(employee.pastTdsDeducted ?? 0),
    bankAccountNumber: employee.bankAccountNumber ?? "",
    bankIfscCode: employee.bankIfscCode ?? "",
    bankBeneficiaryName: employee.bankBeneficiaryName ?? employee.fullName,
    pfUanNumber: employee.pfUanNumber ?? "",
    esicIpNumber: employee.esicIpNumber ?? "",
    labourWelfareFundEnabled: employee.labourWelfareFundEnabled ?? false,
    npsEnabled: employee.npsEnabled ?? false,
    professionalTaxEnabled: employee.professionalTaxEnabled ?? true,
    basicSalary: String(employee.basicSalary ?? ""),
    hra: String(employee.hra ?? ""),
    ta: String(employee.ta ?? ""),
    medicalAllowance: String(employee.medicalAllowance ?? ""),
    otherAllowances: String(employee.otherAllowances ?? ""),
  };
}

function formPayload(form: EmployeeForm, mode: PanelMode) {
  return {
    ...form,
    emailPrefix: mode === "create" ? form.emailPrefix : undefined,
    annualCompensation: Number(form.annualCompensation || 0),
    annualVariablePay: Number(form.annualVariablePay || 0),
    pastTaxableSalary: Number(form.pastTaxableSalary || 0),
    pastTdsDeducted: Number(form.pastTdsDeducted || 0),
    basicSalary: Number(form.basicSalary || 0),
    hra: Number(form.hra || 0),
    ta: Number(form.ta || 0),
    medicalAllowance: Number(form.medicalAllowance || 0),
    otherAllowances: Number(form.otherAllowances || 0),
  };
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
      {status}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-100 p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <div className="mt-1 font-medium text-gray-800">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border border-gray-100 p-3">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">{children}</div>
    </section>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-200 px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500"
        required={required}
      />
    </label>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function PeopleDirectory() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [mode, setMode] = useState<PanelMode>("view");
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(true);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const token = Cookies.get("authToken");
  const permissions: string[] = (() => {
    try { return JSON.parse(Cookies.get("permissions") || "[]"); }
    catch { return []; }
  })();
  const canManage = permissions.includes("employees:read");

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/people`, {
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

  useEffect(() => {
    fetchEmployees();
    if (canManage) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => setRoles(Array.isArray(data) ? data : []))
        .catch(() => setRoles([]));
    }
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter((e) => (
      e.fullName.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q) ||
      e.role?.name.toLowerCase().includes(q) ||
      e.companyEmail.toLowerCase().includes(q)
    ));
  }, [employees, search]);

  const openCreate = () => {
    setMode("create");
    setForm(emptyForm);
    setMessage("");
    setIsPreviewExpanded(true);
  };

  const selectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setMode("view");
    setMessage("");
    setIsPreviewExpanded(true);
  };

  const openEdit = () => {
    if (!selectedEmployee) {
      return;
    }

    setMode("edit");
    setForm(employeeToForm(selectedEmployee));
    setMessage("");
    setIsPreviewExpanded(true);
  };

  const updateForm = (field: keyof EmployeeForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitEmployee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const endpoint = mode === "create"
      ? `${process.env.NEXT_PUBLIC_API_URL}/employees`
      : `${process.env.NEXT_PUBLIC_API_URL}/employees/${selectedEmployee?.id}`;

    const payload = formPayload(form, mode);

    const res = await fetch(endpoint, {
      method: mode === "create" ? "POST" : "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.message || "Unable to save employee.");
      setSaving(false);
      return;
    }

    const savedEmployee = await res.json().catch(() => null);
    const nextEmployees = await fetchEmployees();
    setSaving(false);
    setMessage(mode === "create" ? "Employee added." : "Employee updated.");

    if (mode === "create") {
      setForm(emptyForm);
    }

    const nextSelected = nextEmployees.find((employee) => employee.id === savedEmployee?.id) ?? selectedEmployee;
    setSelectedEmployee(nextSelected);
    setMode("view");
  };

  const uploadAvatar = async (file: File) => {
    if (!selectedEmployee) return;
    setAvatarUploading(true);
    try {
      const data = new FormData();
      data.append("avatar", file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees/${selectedEmployee.id}/avatar`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      if (!res.ok) return;
      const { avatarUrl } = await res.json();
      setEmployees((prev) => prev.map((e) => e.id === selectedEmployee.id ? { ...e, avatarUrl } : e));
      setSelectedEmployee((prev) => prev ? { ...prev, avatarUrl } : prev);
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="flex min-h-0 gap-2 w-full h-full overflow-hidden">
      <main className="flex min-h-0 flex-col bg-stone-50 rounded-xl w-full h-full overflow-hidden">
        <div className="sticky top-0 bg-stone-50 z-10 flex items-center justify-between gap-4 h-16 px-5 border-b">
          <div>
            <h1 className="text-sm font-semibold tracking-tight">Team</h1>
            <p className="text-xs text-gray-500">{employees.length} members</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <TbSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employees..."
                className="pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            {canManage && (
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-800"
              >
                Add member
                <TbPlus size={14} />
              </button>
            )}
            {!isPreviewExpanded && (
              <button
                onClick={() => setIsPreviewExpanded(true)}
                className="p-2 text-gray-600 hover:bg-stone-100 rounded-lg"
              >
                <TbLayoutSidebarFilled size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">No employees found.</div>
          ) : (
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Employee</th>
                    <th className="px-5 py-3 text-left">Role</th>
                    <th className="px-5 py-3 text-left">Department</th>
                    <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filtered.map((emp) => (
                    <tr
                      key={emp.id}
                      onClick={() => selectEmployee(emp)}
                      className={cn(
                        "cursor-pointer hover:bg-gray-50 transition-colors",
                        selectedEmployee?.id === emp.id && "bg-blue-50 hover:bg-blue-50"
                      )}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-white text-xs font-semibold shrink-0 overflow-hidden">
                            {emp.avatarUrl ? <img src={emp.avatarUrl} alt={emp.fullName} className="w-full h-full object-cover" /> : initials(emp.fullName)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{emp.fullName}</p>
                            <p className="text-xs text-gray-400">{emp.companyEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{emp.role?.name}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{emp.department}</td>
                      <td className="px-5 py-3"><StatusBadge status={emp.status} /></td>
                      <td className="px-5 py-3 text-sm text-gray-400">{formatDate(emp.joiningDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
              <div className="flex items-center gap-4 self-stretch">
                <p className="flex self-stretch items-center text-md font-medium tracking-tight border-b-2 border-blue-600 text-black -mb-px">
                  {mode === "create" ? "Add Member" : "Member Details"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canManage && mode === "view" && selectedEmployee && (
                  <button
                    onClick={openEdit}
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
                    {/* Avatar + name — always visible */}
                    <div className="flex items-center gap-4">
                      <div className="relative group shrink-0">
                        <div className="w-14 h-14 rounded-full bg-stone-900 flex items-center justify-center text-white text-lg font-semibold overflow-hidden">
                          {selectedEmployee.avatarUrl
                            ? <img src={selectedEmployee.avatarUrl} alt={selectedEmployee.fullName} className="w-full h-full object-cover" />
                            : initials(selectedEmployee.fullName)}
                        </div>
                        {canManage && (
                          <>
                            <button
                              onClick={() => avatarInputRef.current?.click()}
                              disabled={avatarUploading}
                              className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              <TbCamera size={16} className="text-white" />
                            </button>
                            <input
                              ref={avatarInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); e.target.value = ""; }}
                            />
                          </>
                        )}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">{selectedEmployee.fullName}</h2>
                        <p className="text-sm text-gray-500">{selectedEmployee.companyEmail}</p>
                        <p className="text-xs text-gray-400">{selectedEmployee.role?.name} · {selectedEmployee.department}</p>
                      </div>
                    </div>

                    {/* Public info — visible to all */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <Detail label="Status" value={<StatusBadge status={selectedEmployee.status} />} />
                      <Detail label="Role title" value={selectedEmployee.roleTitle || selectedEmployee.role?.name || "-"} />
                      <Detail label="Department" value={selectedEmployee.department} />
                      <Detail label="Work location" value={selectedEmployee.workLocation || "-"} />
                      <Detail label="Employment type" value={selectedEmployee.employmentType || "-"} />
                      <Detail label="Work schedule" value={selectedEmployee.workSchedule || "-"} />
                      <Detail label="Remote" value={selectedEmployee.remotePosition ? "Yes" : "No"} />
                      <Detail label="Joining date" value={formatDate(selectedEmployee.joiningDate)} />
                    </div>

                    {/* Admin-only sections */}
                    {canManage && (
                      <>
                        <Section title="Personal & Legal">
                          <Detail label="Legal name" value={selectedEmployee.legalName || selectedEmployee.fullName} />
                          <Detail label="Personal email" value={selectedEmployee.personalEmail || "-"} />
                          <Detail label="Date of birth" value={selectedEmployee.dateOfBirth ? formatDate(selectedEmployee.dateOfBirth) : "-"} />
                          <Detail label="PAN" value={selectedEmployee.pan || "-"} />
                        </Section>
                        <Section title="Compensation">
                          <Detail label="Compensation type" value={selectedEmployee.compensationType || "-"} />
                          <Detail label="Payment frequency" value={selectedEmployee.paymentFrequency || "Monthly"} />
                          <Detail label="Annual compensation" value={money(selectedEmployee.annualCompensation)} />
                          <Detail label="Annual variable pay" value={money(selectedEmployee.annualVariablePay)} />
                        </Section>
                        <Section title="Salary Structure">
                          <Detail label="Basic salary" value={money(selectedEmployee.basicSalary)} />
                          <Detail label="HRA" value={money(selectedEmployee.hra)} />
                          <Detail label="Transport" value={money(selectedEmployee.ta)} />
                          <Detail label="Medical" value={money(selectedEmployee.medicalAllowance)} />
                          <Detail label="Other allowances" value={money(selectedEmployee.otherAllowances)} />
                        </Section>
                        <Section title="Past Payroll">
                          <Detail label="Financial year" value={selectedEmployee.pastPayrollFinancialYear || "FY 2026 - 2027"} />
                          <Detail label="Past taxable salary" value={money(selectedEmployee.pastTaxableSalary)} />
                          <Detail label="Past TDS deducted" value={money(selectedEmployee.pastTdsDeducted)} />
                        </Section>
                        <Section title="Payment Information">
                          <Detail label="Account number" value={selectedEmployee.bankAccountNumber || "-"} />
                          <Detail label="IFSC code" value={selectedEmployee.bankIfscCode || "-"} />
                          <Detail label="Beneficiary name" value={selectedEmployee.bankBeneficiaryName || "-"} />
                        </Section>
                        <Section title="Statutory">
                          <Detail label="PF UAN number" value={selectedEmployee.pfUanNumber || "Not opted in"} />
                          <Detail label="ESIC IP number" value={selectedEmployee.esicIpNumber || "Not opted in"} />
                          <Detail label="Labour Welfare Fund" value={selectedEmployee.labourWelfareFundEnabled ? "Enabled" : "Disabled"} />
                          <Detail label="National Pension System" value={selectedEmployee.npsEnabled ? "Enabled" : "Disabled"} />
                          <Detail label="Professional Tax" value={selectedEmployee.professionalTaxEnabled === false ? "Disabled" : "Enabled"} />
                        </Section>
                      </>
                    )}

                    {message && <p className={cn("text-sm", message.includes("Unable") ? "text-red-600" : "text-green-600")}>{message}</p>}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">Select an employee.</div>
                )}
              </div>
            ) : canManage ? (
              <form onSubmit={submitEmployee} className="flex-1 overflow-auto p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Full name
                    <input value={form.fullName} onChange={(e) => updateForm("fullName", e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Personal email
                    <input type="email" value={form.personalEmail} onChange={(e) => updateForm("personalEmail", e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Role
                    <select value={form.roleId} onChange={(e) => updateForm("roleId", e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                      <option value="">Select role</option>
                      {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Department
                    <input value={form.department} onChange={(e) => updateForm("department", e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </label>
                  <FormInput label="Legal name" value={form.legalName} onChange={(value) => updateForm("legalName", value)} />
                  <FormInput label="PAN" value={form.pan} onChange={(value) => updateForm("pan", value)} />
                  <FormInput label="Role title" value={form.roleTitle} onChange={(value) => updateForm("roleTitle", value)} />
                  <FormInput label="Joining date" type="date" value={form.joiningDate} onChange={(value) => updateForm("joiningDate", value)} required />
                  <FormInput label="Date of birth" type="date" value={form.dateOfBirth} onChange={(value) => updateForm("dateOfBirth", value)} />
                  <FormInput label="Work location" value={form.workLocation} onChange={(value) => updateForm("workLocation", value)} />
                  <FormInput label="Employment type" value={form.employmentType} onChange={(value) => updateForm("employmentType", value)} />
                  <FormInput label="Compensation type" value={form.compensationType} onChange={(value) => updateForm("compensationType", value)} />
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-500">Work Schedule</label>
                    <WorkSchedulePicker
                      value={form.workSchedule || "11 AM – 8 PM (Mon–Sat)"}
                      onChange={(v) => updateForm("workSchedule", v)}
                    />
                  </div>
                  <FormInput label="Payment frequency" value={form.paymentFrequency} onChange={(value) => updateForm("paymentFrequency", value)} />
                  <FormInput label="Annual compensation" type="number" value={form.annualCompensation} onChange={(value) => updateForm("annualCompensation", value)} />
                  <FormInput label="Annual variable pay" type="number" value={form.annualVariablePay} onChange={(value) => updateForm("annualVariablePay", value)} />
                  <FormInput label="Basic salary" type="number" value={form.basicSalary} onChange={(value) => updateForm("basicSalary", value)} />
                  <FormInput label="HRA" type="number" value={form.hra} onChange={(value) => updateForm("hra", value)} />
                  <FormInput label="Transport" type="number" value={form.ta} onChange={(value) => updateForm("ta", value)} />
                  <FormInput label="Medical" type="number" value={form.medicalAllowance} onChange={(value) => updateForm("medicalAllowance", value)} />
                  <FormInput label="Other allowances" type="number" value={form.otherAllowances} onChange={(value) => updateForm("otherAllowances", value)} />
                  <FormInput label="Past payroll FY" value={form.pastPayrollFinancialYear} onChange={(value) => updateForm("pastPayrollFinancialYear", value)} />
                  <FormInput label="Past taxable salary" type="number" value={form.pastTaxableSalary} onChange={(value) => updateForm("pastTaxableSalary", value)} />
                  <FormInput label="Past TDS deducted" type="number" value={form.pastTdsDeducted} onChange={(value) => updateForm("pastTdsDeducted", value)} />
                  <FormInput label="Bank account number" value={form.bankAccountNumber} onChange={(value) => updateForm("bankAccountNumber", value)} />
                  <FormInput label="IFSC code" value={form.bankIfscCode} onChange={(value) => updateForm("bankIfscCode", value)} />
                  <FormInput label="Beneficiary name" value={form.bankBeneficiaryName} onChange={(value) => updateForm("bankBeneficiaryName", value)} />
                  <FormInput label="PF UAN number" value={form.pfUanNumber} onChange={(value) => updateForm("pfUanNumber", value)} />
                  <FormInput label="ESIC IP number" value={form.esicIpNumber} onChange={(value) => updateForm("esicIpNumber", value)} />
                  <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Status
                    <select value={form.status} onChange={(e) => updateForm("status", e.target.value as EmployeeForm["status"])} className="rounded-lg border border-gray-200 px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                  <Checkbox label="Remote position" checked={form.remotePosition} onChange={(value) => updateForm("remotePosition", value)} />
                  <Checkbox label="Labour Welfare Fund" checked={form.labourWelfareFundEnabled} onChange={(value) => updateForm("labourWelfareFundEnabled", value)} />
                  <Checkbox label="National Pension System" checked={form.npsEnabled} onChange={(value) => updateForm("npsEnabled", value)} />
                  <Checkbox label="Professional Tax" checked={form.professionalTaxEnabled} onChange={(value) => updateForm("professionalTaxEnabled", value)} />
                  {mode === "create" && (
                    <label className="col-span-2 flex flex-col gap-1 text-sm font-medium text-gray-700">
                      Company Email
                      <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                        <input
                          type="text"
                          value={form.emailPrefix}
                          onChange={(e) => updateForm("emailPrefix", e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                          placeholder="firstname.lastname"
                          className="flex-1 px-3 py-2 text-sm font-normal focus:outline-none"
                          required
                        />
                        <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm border-l border-gray-200 select-none whitespace-nowrap">@rhinontech.in</span>
                      </div>
                      <p className="text-xs text-gray-400 font-normal">A welcome email with login credentials will be sent to their personal email.</p>
                    </label>
                  )}
                </div>

                {message && <p className={cn("text-sm", message.includes("Unable") ? "text-red-600" : "text-green-600")}>{message}</p>}

                <div className="flex items-center justify-end gap-3 border-t pt-4">
                  <button type="button" onClick={() => setMode("view")} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60">
                    {saving ? "Saving..." : mode === "create" ? "Add member" : "Save changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-center flex-1 text-sm text-gray-400">
                Select a team member to view their profile.
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
