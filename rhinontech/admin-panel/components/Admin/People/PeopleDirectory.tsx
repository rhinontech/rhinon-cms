"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import { TbCamera, TbLayoutSidebarFilled, TbLayoutSidebarRightFilled, TbPencil, TbPlus, TbSearch, TbMailForward, TbKey, TbX } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { WorkSchedulePicker } from "@/components/Admin/Common/WorkSchedulePicker";
import adminImages from "@/constants/admin/images";
import { usePermissions } from "@/context/PermissionsContext";
import Image from "next/image";

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
  onboarded?: boolean;
  exitDate?: string | null;
  exitReason?: string | null;
  exitNotes?: string | null;
  exitChecklist?: Record<string, boolean> | null;
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

function StatusBadge({ status, exitDate }: { status: string; exitDate?: string | null }) {
  if (status === "active" && exitDate) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700" title={`Last working day: ${formatDate(exitDate)}`}>
        exiting
      </span>
    );
  }
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
      {status === "active" ? "active" : "relieved"}
    </span>
  );
}

const EXIT_REASONS = ["Resignation", "Termination", "Contract ended", "Absconded", "Other"];

const EXIT_CHECKLIST_ITEMS: { key: string; label: string }[] = [
  { key: "emailDisabled",   label: "Company email account disabled" },
  { key: "assetsReturned",  label: "Company assets returned" },
  { key: "accessRevoked",   label: "Third-party tool access revoked" },
  { key: "settlementPaid",  label: "Final settlement paid" },
  { key: "lettersIssued",   label: "Relieving / experience letters issued" },
];

function localToday() {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
}

function OffboardDialog({
  employee,
  busy,
  onClose,
  onConfirm,
}: {
  employee: Employee;
  busy: boolean;
  onClose: () => void;
  onConfirm: (payload: { exitDate: string; exitReason: string; exitNotes: string }) => void;
}) {
  const [exitDate, setExitDate] = useState(localToday());
  const [exitReason, setExitReason] = useState("Resignation");
  const [exitNotes, setExitNotes] = useState("");
  const immediate = !!exitDate && exitDate <= localToday();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay p-4" onClick={onClose}>
      <div className="w-full max-w-md space-y-4 rounded-xl glass-modal p-5" onClick={(e) => e.stopPropagation()}>
        <div>
          <h3 className="text-base font-semibold text-gray-900">Offboard {employee.fullName}</h3>
          <p className="mt-1 text-xs text-gray-500">{employee.companyEmail}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Last working day
            <input
              type="date"
              value={exitDate}
              onChange={(e) => setExitDate(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Reason
            <select
              value={exitReason}
              onChange={(e) => setExitReason(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {EXIT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="col-span-2 flex flex-col gap-1 text-sm font-medium text-gray-700">
            Notes <span className="font-normal text-gray-400">(optional)</span>
            <textarea
              value={exitNotes}
              onChange={(e) => setExitNotes(e.target.value)}
              rows={3}
              placeholder="Handover details, exit interview notes..."
              className="rounded-lg border border-gray-200 px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>

        <div className="space-y-1 rounded-lg bg-red-50 p-3 text-xs text-red-700">
          <p className="font-semibold">
            {immediate
              ? "Access is revoked immediately — any active session stops working."
              : `They keep access until the end of ${formatDate(exitDate)}, then it is revoked automatically.`}
          </p>
          <p>
            Pending leave requests are cancelled, open tasks return to the unassigned pool,
            docs access is revoked, and they are excluded from future payroll runs.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 border-t pt-4">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !exitDate}
            onClick={() => onConfirm({ exitDate, exitReason, exitNotes })}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? "Offboarding..." : immediate ? "Offboard now" : "Schedule exit"}
          </button>
        </div>
      </div>
    </div>
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

function LetterPreviewDialog({
  employeeName,
  personalEmail,
  letterLabel,
  pdfUrl,
  loading,
  loadError,
  sending,
  onClose,
  onSend,
}: {
  employeeName: string;
  personalEmail: string;
  letterLabel: string;
  pdfUrl: string | null;
  loading: boolean;
  loadError: string;
  sending: boolean;
  onClose: () => void;
  onSend: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay p-4" onClick={onClose}>
      <div
        className="flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl glass-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{letterLabel} — {employeeName}</h3>
            <p className="text-xs text-gray-500">Preview before sending. Nothing is saved or emailed yet.</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <TbX size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-gray-100">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">Rendering preview...</div>
          ) : loadError ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-red-600">{loadError}</div>
          ) : pdfUrl ? (
            <iframe src={pdfUrl} className="h-full w-full" title="Letter preview" />
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t px-5 py-4">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
            Cancel
          </button>
          <button
            type="button"
            disabled={sending || loading || !!loadError}
            onClick={onSend}
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
          >
            {sending ? "Sending..." : `Save & email to ${personalEmail || "member"}`}
          </button>
        </div>
      </div>
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

const EMPLOYMENT_TYPES = ["Full-Time", "Part-Time", "Contract", "Intern"];
const COMPENSATION_TYPES = ["Salaried", "Hourly", "Contract"];
const PAYMENT_FREQUENCIES = ["Monthly", "Bi-Weekly", "Weekly"];

function FormSelect({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-200 px-3 py-2 font-normal bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        required={required}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PeopleDirectory() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attachDocs, setAttachDocs] = useState(true);
  const [previewTab, setPreviewTab] = useState<"offer" | "nda">("offer");
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
  const { has } = usePermissions();
  const canManage = has("employees:read");
  const canWrite = has("employees:write");
  const [resending, setResending] = useState(false);
  const [tab, setTab] = useState<"active" | "alumni">("active");
  const [showOffboard, setShowOffboard] = useState(false);
  const [offboardBusy, setOffboardBusy] = useState(false);
  const [letterPreview, setLetterPreview] = useState<{ type: "relieving" | "experience"; url: string | null; loading: boolean; error: string } | null>(null);
  const [letterSending, setLetterSending] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/people?include=all`, {
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

  const activeCount = useMemo(() => employees.filter((e) => e.status === "active").length, [employees]);
  const alumniCount = employees.length - activeCount;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees
      .filter((e) => (tab === "active" ? e.status === "active" : e.status === "inactive"))
      .filter((e) => (
        e.fullName.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.role?.name.toLowerCase().includes(q) ||
        e.companyEmail.toLowerCase().includes(q)
      ));
  }, [employees, search, tab]);

  const switchTab = (next: "active" | "alumni") => {
    setTab(next);
    setMode("view");
    const pool = employees.filter((e) => (next === "active" ? e.status === "active" : e.status === "inactive"));
    setSelectedEmployee(pool[0] ?? null);
  };

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

  const resendInvite = async () => {
    if (!selectedEmployee) return;
    if (!confirm(`Resend the setup invite to ${selectedEmployee.fullName}?\n\nThis generates a new temporary password and setup link, emails it to ${selectedEmployee.personalEmail}, and replaces their current password.`)) return;
    setResending(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees/${selectedEmployee.id}/resend-onboarding`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || "Could not resend the invite.");
        return;
      }
      alert(`Invite re-sent to ${data.sentTo || selectedEmployee.personalEmail}.`);
    } catch {
      alert("Could not resend the invite. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const sendReset = async () => {
    if (!selectedEmployee) return;
    if (!confirm(`Email a password reset link to ${selectedEmployee.fullName}?\n\nThis sends a reset link to ${selectedEmployee.personalEmail} and does NOT change their current password.`)) return;
    setResending(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees/${selectedEmployee.id}/send-reset`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || "Could not send the reset link.");
        return;
      }
      alert(`Reset link sent to ${data.sentTo || selectedEmployee.personalEmail}.`);
    } catch {
      alert("Could not send the reset link. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const submitOffboard = async (payload: { exitDate: string; exitReason: string; exitNotes: string }) => {
    if (!selectedEmployee) return;
    setOffboardBusy(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees/${selectedEmployee.id}/offboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || "Could not offboard this member.");
        return;
      }
      setShowOffboard(false);
      await fetchEmployees();
    } catch {
      alert("Could not offboard this member. Please try again.");
    } finally {
      setOffboardBusy(false);
    }
  };

  const reactivate = async () => {
    if (!selectedEmployee) return;
    const scheduled = selectedEmployee.status === "active" && selectedEmployee.exitDate;
    const prompt = scheduled
      ? `Cancel the scheduled exit for ${selectedEmployee.fullName}? They will stay active.`
      : `Reactivate ${selectedEmployee.fullName}? They will be able to log in and will appear in payroll runs again.`;
    if (!confirm(prompt)) return;
    setOffboardBusy(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees/${selectedEmployee.id}/reactivate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || "Could not reactivate this member.");
        return;
      }
      await fetchEmployees();
    } catch {
      alert("Could not reactivate. Please try again.");
    } finally {
      setOffboardBusy(false);
    }
  };

  const toggleChecklist = async (key: string, value: boolean) => {
    if (!selectedEmployee) return;
    const updated = { ...(selectedEmployee.exitChecklist ?? {}), [key]: value };
    setSelectedEmployee((prev) => (prev ? { ...prev, exitChecklist: updated } : prev));
    setEmployees((prev) => prev.map((e) => (e.id === selectedEmployee.id ? { ...e, exitChecklist: updated } : e)));
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees/${selectedEmployee.id}/exit-checklist`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ checklist: { [key]: value } }),
      });
    } catch {
      // optimistic update stays; the next refresh corrects any drift
    }
  };

  const openLetterPreview = async (type: "relieving" | "experience") => {
    if (!selectedEmployee) return;
    const label = type === "relieving" ? "relieving letter" : "experience letter";
    setLetterPreview({ type, url: null, loading: true, error: "" });
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees/${selectedEmployee.id}/letters/preview?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLetterPreview({ type, url: null, loading: false, error: data.message || `Could not render the ${label}.` });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setLetterPreview({ type, url, loading: false, error: "" });
    } catch {
      setLetterPreview({ type, url: null, loading: false, error: `Could not render the ${label}.` });
    }
  };

  const closeLetterPreview = () => {
    if (letterPreview?.url) URL.revokeObjectURL(letterPreview.url);
    setLetterPreview(null);
  };

  const sendLetter = async () => {
    if (!selectedEmployee || !letterPreview) return;
    const { type } = letterPreview;
    const label = type === "relieving" ? "relieving letter" : "experience letter";
    setLetterSending(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees/${selectedEmployee.id}/letters`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || `Could not send the ${label}.`);
        return;
      }
      closeLetterPreview();
      alert(data.message);
    } catch {
      alert(`Could not send the ${label}. Please try again.`);
    } finally {
      setLetterSending(false);
    }
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

    const payload = {
      ...formPayload(form, mode),
      attachDocs: mode === "create" ? attachDocs : undefined,
    };

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
      <main
        className={cn(
          "flex min-h-0 flex-col glass-panel rounded-xl w-full h-full overflow-hidden",
          (mode === "create" || mode === "edit") && "hidden"
        )}
      >
        <div className="sticky top-0 glass-header z-10 flex items-center justify-between gap-4 h-16 px-5 border-b border-black/5">
          <div>
            <h1 className="text-sm font-semibold tracking-tight">Team</h1>
            <p className="text-xs text-gray-500">
              {activeCount} active{alumniCount > 0 ? ` · ${alumniCount} alumni` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-gray-200 bg-white p-0.5">
              <button
                onClick={() => switchTab("active")}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  tab === "active" ? "bg-stone-900 text-white" : "text-gray-500 hover:text-gray-900"
                )}
              >
                Active
              </button>
              <button
                onClick={() => switchTab("alumni")}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  tab === "alumni" ? "bg-stone-900 text-white" : "text-gray-500 hover:text-gray-900"
                )}
              >
                Alumni{alumniCount > 0 ? ` (${alumniCount})` : ""}
              </button>
            </div>
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
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              {tab === "alumni" ? "No alumni yet." : "No employees found."}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="glass-thead text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Employee</th>
                    <th className="px-5 py-3 text-left">Role</th>
                    <th className="px-5 py-3 text-left">Department</th>
                    <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">{tab === "alumni" ? "Left" : "Joined"}</th>
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
                      <td className="px-5 py-3"><StatusBadge status={emp.status} exitDate={emp.exitDate} /></td>
                      <td className="px-5 py-3 text-sm text-gray-400">
                        {formatDate(tab === "alumni" && emp.exitDate ? emp.exitDate : emp.joiningDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <aside
        className={cn(
          "flex min-h-0 h-full flex-col bg-white rounded-xl overflow-hidden transition-all duration-200 ease-in-out",
          isPreviewExpanded ? ((mode === "create" || mode === "edit") ? "w-full" : "w-[42%]") : "w-0"
        )}
      >
        {isPreviewExpanded && (
          <div className="flex flex-col w-full flex-1 h-full overflow-hidden relative">
            <div className="sticky top-0 w-full flex items-center justify-between h-16 px-5 border-b bg-white z-10">
              <div className="flex items-center gap-4 self-stretch">
                <p className="flex self-stretch items-center text-md font-medium tracking-tight border-b-2 border-blue-600 text-black -mb-px">
                  {mode === "create" ? "Add Member" : mode === "edit" ? "Edit Member" : "Member Details"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canWrite && mode === "view" && selectedEmployee && selectedEmployee.status === "active" && (
                  selectedEmployee.onboarded ? (
                    <button
                      onClick={sendReset}
                      disabled={resending}
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      title="Email a password reset link (doesn't change their current password)"
                    >
                      <TbKey size={15} />
                      {resending ? "Sending..." : "Send password reset"}
                    </button>
                  ) : (
                    <button
                      onClick={resendInvite}
                      disabled={resending}
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      title="Email a fresh temporary password + setup link"
                    >
                      <TbMailForward size={15} />
                      {resending ? "Sending..." : "Resend invite"}
                    </button>
                  )
                )}
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
                      <Detail label="Status" value={<StatusBadge status={selectedEmployee.status} exitDate={selectedEmployee.exitDate} />} />
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

                        <section
                          className={cn(
                            "space-y-3 rounded-lg border p-3",
                            selectedEmployee.status === "inactive"
                              ? "border-gray-200 bg-gray-50"
                              : selectedEmployee.exitDate
                                ? "border-amber-200 bg-amber-50"
                                : "border-red-100"
                          )}
                        >
                          {selectedEmployee.status === "active" && !selectedEmployee.exitDate ? (
                            <>
                              <h3 className="text-sm font-semibold text-gray-900">Offboarding</h3>
                              <p className="text-xs text-gray-500">
                                Relieve this member — records their last working day, revokes access,
                                and removes them from future payroll runs.
                              </p>
                              {selectedEmployee.role?.slug === "superadmin" ? (
                                <p className="text-xs text-gray-400">The superadmin account cannot be offboarded.</p>
                              ) : canWrite ? (
                                <button
                                  onClick={() => setShowOffboard(true)}
                                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                                >
                                  Offboard member
                                </button>
                              ) : null}
                            </>
                          ) : selectedEmployee.status === "active" ? (
                            <>
                              <h3 className="text-sm font-semibold text-amber-800">Exit scheduled</h3>
                              <p className="text-xs text-amber-700">
                                Last working day <span className="font-semibold">{formatDate(selectedEmployee.exitDate!)}</span>
                                {" · "}{selectedEmployee.exitReason || "—"}. Access is revoked automatically after that day ends.
                              </p>
                              {selectedEmployee.exitNotes && <p className="text-xs text-amber-700/80">{selectedEmployee.exitNotes}</p>}
                              {canWrite && (
                                <button
                                  onClick={reactivate}
                                  disabled={offboardBusy}
                                  className="rounded-lg border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                                >
                                  {offboardBusy ? "Working..." : "Cancel scheduled exit"}
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              <h3 className="text-sm font-semibold text-gray-900">Relieved</h3>
                              <p className="text-xs text-gray-500">
                                Last working day{" "}
                                <span className="font-semibold">
                                  {selectedEmployee.exitDate ? formatDate(selectedEmployee.exitDate) : "not recorded"}
                                </span>
                                {" · "}{selectedEmployee.exitReason || "reason not recorded"}
                              </p>
                              {selectedEmployee.exitNotes && <p className="text-xs text-gray-500">{selectedEmployee.exitNotes}</p>}
                              {canWrite && (
                                <button
                                  onClick={reactivate}
                                  disabled={offboardBusy}
                                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                >
                                  {offboardBusy ? "Working..." : "Reactivate member"}
                                </button>
                              )}
                            </>
                          )}

                          {selectedEmployee.exitDate && (
                            <div className="space-y-3 border-t border-black/5 pt-3">
                              <div>
                                <p className="mb-2 text-xs font-semibold text-gray-700">Exit checklist</p>
                                <div className="grid grid-cols-1 gap-1.5">
                                  {EXIT_CHECKLIST_ITEMS.map((item) => (
                                    <label key={item.key} className="flex items-center gap-2 text-xs text-gray-600">
                                      <input
                                        type="checkbox"
                                        disabled={!canWrite}
                                        checked={!!selectedEmployee.exitChecklist?.[item.key]}
                                        onChange={(e) => toggleChecklist(item.key, e.target.checked)}
                                      />
                                      {item.label}
                                    </label>
                                  ))}
                                </div>
                              </div>
                              {canWrite && (
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => openLetterPreview("relieving")}
                                    disabled={!!letterPreview}
                                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                  >
                                    Preview relieving letter
                                  </button>
                                  <button
                                    onClick={() => openLetterPreview("experience")}
                                    disabled={!!letterPreview}
                                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                  >
                                    Preview experience letter
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </section>
                      </>
                    )}

                    {message && <p className={cn("text-sm", message.includes("Unable") ? "text-red-600" : "text-green-600")}>{message}</p>}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">Select an employee.</div>
                )}
              </div>
            ) : canManage ? (
              <form onSubmit={submitEmployee} className="flex-1 flex overflow-hidden min-h-0 divide-x bg-gray-50/50">
                  {/* Left: Input fields */}
                  <div className="w-1/2 overflow-auto p-6 bg-white space-y-4 flex flex-col justify-between">
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
                      <FormSelect label="Employment type" value={form.employmentType} onChange={(value) => updateForm("employmentType", value)} options={EMPLOYMENT_TYPES} />
                      <FormSelect label="Compensation type" value={form.compensationType} onChange={(value) => updateForm("compensationType", value)} options={COMPENSATION_TYPES} />
                      <div className="col-span-2 flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-500">Work Schedule</label>
                        <WorkSchedulePicker
                          value={form.workSchedule || "11 AM – 8 PM (Mon–Sat)"}
                          onChange={(v) => updateForm("workSchedule", v)}
                        />
                      </div>
                      <FormSelect label="Payment frequency" value={form.paymentFrequency} onChange={(value) => updateForm("paymentFrequency", value)} options={PAYMENT_FREQUENCIES} />
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
                      
                      {mode === "create" && (
                        <label className="col-span-2 flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50/30 px-3 py-2 text-sm font-medium text-gray-700 mt-2 cursor-pointer">
                          <input type="checkbox" checked={attachDocs} onChange={(e) => setAttachDocs(e.target.checked)} className="rounded" />
                          Attach generated Offer Letter & NDA to welcome email
                        </label>
                      )}
                    </div>

                    {message && <p className={cn("text-sm mt-4", message.includes("Unable") ? "text-red-600" : "text-green-600")}>{message}</p>}

                    <div className="flex items-center justify-end gap-3 border-t pt-4 mt-6">
                      <button type="button" onClick={() => setMode("view")} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                        Cancel
                      </button>
                      <button type="submit" disabled={saving} className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60">
                        {saving ? "Saving..." : mode === "create" ? "Add member" : "Save changes"}
                      </button>
                    </div>
                  </div>

                  {/* Right: Live Preview */}
                  <div className="w-1/2 overflow-hidden flex flex-col p-6 bg-stone-100/50">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-3">Live Document Preview</p>
                    
                    {/* Tabs */}
                    <div className="flex gap-2 mb-4 border-b border-stone-200">
                      <button
                        type="button"
                        onClick={() => setPreviewTab("offer")}
                        className={cn(
                          "px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-all",
                          previewTab === "offer" ? "border-stone-900 text-stone-900" : "border-transparent text-stone-400 hover:text-stone-600"
                        )}
                      >
                        Offer Letter
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewTab("nda")}
                        className={cn(
                          "px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-all",
                          previewTab === "nda" ? "border-stone-900 text-stone-900" : "border-transparent text-stone-400 hover:text-stone-600"
                        )}
                      >
                        NDA
                      </button>
                    </div>

                    <div className="flex-1 bg-white border border-stone-200 rounded-xl shadow-sm p-8 overflow-auto font-serif text-[11px] leading-relaxed text-gray-800 w-full relative select-none">
                      {previewTab === "offer" ? (
                        <OfferLetterPreview form={form} />
                      ) : (
                        <NdaPreview form={form} />
                      )}
                    </div>
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

      {showOffboard && selectedEmployee && (
        <OffboardDialog
          employee={selectedEmployee}
          busy={offboardBusy}
          onClose={() => !offboardBusy && setShowOffboard(false)}
          onConfirm={submitOffboard}
        />
      )}

      {letterPreview && selectedEmployee && (
        <LetterPreviewDialog
          employeeName={selectedEmployee.fullName}
          personalEmail={selectedEmployee.personalEmail}
          letterLabel={letterPreview.type === "relieving" ? "Relieving letter" : "Experience letter"}
          pdfUrl={letterPreview.url}
          loading={letterPreview.loading}
          loadError={letterPreview.error}
          sending={letterSending}
          onClose={() => !letterSending && closeLetterPreview()}
          onSend={sendLetter}
        />
      )}
    </div>
  );
}

function OfferLetterLogo() {
  return (
    <div className="flex flex-col items-center justify-center border-b pb-2 mb-3 select-none">
      <Image src={adminImages.Logo_Rhinon_Tech_Dark} alt="Rhinon Tech" className="h-7 w-auto object-contain" />
    </div>
  );
}

function getOrdinal(d: number) {
  if (d > 3 && d < 21) return "th";
  switch (d % 10) {
    case 1:  return "st";
    case 2:  return "nd";
    case 3:  return "rd";
    default: return "th";
  }
}

function OfferLetterPreview({ form }: { form: EmployeeForm }) {
  const currentYear = new Date().getFullYear();
  const today = new Date();
  const ordinalDay = getOrdinal(today.getDate());
  const dateStr = `${today.getDate()}${ordinalDay} ${today.toLocaleDateString("en-US", { month: "long" })}, ${today.getFullYear()}`;
  
  const startD = form.joiningDate ? new Date(form.joiningDate) : new Date();
  const endD = new Date(startD.getFullYear(), startD.getMonth() + 6, startD.getDate());
  
  const startOrd = getOrdinal(startD.getDate());
  const startStr = `${startD.getDate()}${startOrd} ${startD.toLocaleDateString("en-US", { month: "long" })}, ${startD.getFullYear()}`;
  
  const endOrd = getOrdinal(endD.getDate());
  const endStr = `${endD.getDate()}${endOrd} ${endD.toLocaleDateString("en-US", { month: "long" })}, ${endD.getFullYear()}`;
  
  const fmtStartShort = startD.toLocaleDateString("en-GB").replace(/\//g, "-");
  const fmtEndShort = endD.toLocaleDateString("en-GB").replace(/\//g, "-");
  
  const stipend = form.annualCompensation ? Math.round(Number(form.annualCompensation) / 12) : 5000;
  const ctc = form.annualCompensation ? `₹${Number(form.annualCompensation).toLocaleString("en-IN")}` : "As discussed";
  const variable = form.annualVariablePay ? `₹${Number(form.annualVariablePay).toLocaleString("en-IN")}` : "₹0";
  const isIntern = form.employmentType?.toLowerCase() === "internship";

  return (
    <div className="space-y-6 overflow-y-auto max-h-[70vh] p-4 bg-stone-100/60 rounded-xl">
      {/* PAGE 1 */}
      <div className="bg-white border border-stone-200 shadow-sm p-10 aspect-[1/1.41] w-full text-[9.5px] leading-relaxed relative flex flex-col font-sans text-stone-700 select-none">
        <OfferLetterLogo />
        <div className="text-center font-bold text-[#005085] tracking-wider text-[10px] mb-4">
          PRIVATE & CONFIDENTIAL
        </div>
        <div className="space-y-0.5 mb-4">
          <p>{dateStr}</p>
          <p className="font-bold text-stone-900 text-[10.5px]">{form.legalName || form.fullName || "[Full Name]"}</p>
          <p>{form.workLocation || "Bengaluru, India"}</p>
        </div>
        <p className="mb-3">Dear {form.fullName ? form.fullName.split(" ")[0] : "[First Name]"},</p>
        
        <div className="space-y-3 flex-1">
          <div>
            <h3 className="font-bold text-[#005085] text-[9.5px] mb-0.5">1. Introduction to Rhinon Tech</h3>
            <p className="text-justify">
              We are thrilled to offer you the opportunity to {isIntern ? "intern" : "work"} with <span className="font-bold text-stone-900">Rhinon Tech</span>, a cutting-edge technology company dedicated to pushing the boundaries of innovation and excellence. Since our inception, Rhinon Tech has been at the forefront of developing scalable solutions and empowering industries with the tools to grow in a highly competitive marketplace.
            </p>
            <p className="text-justify mt-1">
              As a company that values creativity, innovation, and a passion for technology, we believe in providing our {isIntern ? "interns" : "employees"} with the best learning experience and preparing them for future roles in the industry. Through this {isIntern ? "internship" : "employment"}, you will be involved in projects that contribute directly to Rhinon Tech's mission.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#005085] text-[9.5px] mb-0.5">2. Offer of {isIntern ? "Internship" : "Employment"}</h3>
            <p className="text-justify">
              We are pleased to offer you the position of <span className="font-bold text-stone-900">{form.roleTitle || (isIntern ? "NextJs Developer Intern" : "NextJs Developer")}</span> {isIntern ? `for a period of **6 months** starting from **${fmtStartShort}** to **${fmtEndShort}**` : `starting from **${startStr}**`}. This position is an important step toward building your professional experience, and we look forward to seeing your contributions in real-world projects.
            </p>
            <p className="text-justify mt-1">
              This role will help you gain skills in Product Development and AI with talented professionals and get exposure to cutting-edge technologies.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#005085] text-[9.5px] mb-0.5">3. {isIntern ? "Internship" : "Employment"} Position Details</h3>
            <ul className="list-disc pl-4 space-y-0.5">
              <li><span className="font-bold text-stone-900">Designation:</span> {form.roleTitle || "NextJs Developer"}</li>
              <li><span className="font-bold text-stone-900">Location:</span> {form.workLocation || "Bengaluru (Remote)"}</li>
              {isIntern ? (
                <li><span className="font-bold text-stone-900">Internship Duration:</span> 6 months</li>
              ) : (
                <li><span className="font-bold text-stone-900">Employment Type:</span> Full-Time / Permanent</li>
              )}
              <li><span className="font-bold text-stone-900">Working Hours:</span> {isIntern ? "48 hours per week" : "40 hours per week"}</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-[#005085] text-[9.5px] mb-0.5">4. Compensation and Benefits</h3>
          </div>
        </div>
        <div className="absolute bottom-3 left-0 right-0 text-center text-[7.5px] text-stone-400">Page 1 of 5</div>
      </div>

      {/* PAGE 2 */}
      <div className="bg-white border border-stone-200 shadow-sm p-10 aspect-[1/1.41] w-full text-[9.5px] leading-relaxed relative flex flex-col font-sans text-stone-700 select-none">
        <OfferLetterLogo />
        <div className="space-y-3 flex-1">
          <p className="text-justify">
            {isIntern ? (
              <>During your internship period, this is a paid internship for <span className="font-bold text-stone-900">₹{stipend.toLocaleString("en-IN")}/- per month</span>. After three months, there will be a review meeting to assess your performance, and based on this review, we will decide on future opportunities and compensation.</>
            ) : (
              <>Your starting compensation package includes an annual CTC of <span className="font-bold text-stone-900">{ctc}</span> (with variable component of <span className="font-bold text-stone-900">{variable}</span>) paid on a monthly basis. Your compensation will be subject to annual performance reviews.</>
            )}
          </p>
          <p>You will enjoy the following benefits as {isIntern ? "an intern" : "an employee"} at Rhinon Tech:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><span className="font-bold text-stone-900">Mentorship:</span> You will be assigned a mentor who will provide guidance throughout your tenure.</li>
            <li><span className="font-bold text-stone-900">Workshops and Training:</span> Access to internal training programs and workshops that align with your field of work.</li>
            <li><span className="font-bold text-stone-900">Networking Opportunities:</span> Participate in company events, meetups, and team-building exercises to build professional connections.</li>
            <li><span className="font-bold text-stone-900">Team Collaboration:</span> Engage with various teams and departments to understand how cross-functional collaboration leads to the success of a company.</li>
          </ul>

          <div>
            <h3 className="font-bold text-[#005085] text-[9.5px] mb-0.5">5. Terms and Conditions</h3>
            <p className="font-bold text-stone-900 mb-0.5">Working Hours</p>
            <p className="text-justify">
              The standard working hours will be <span className="font-bold text-stone-900">11 AM to 8 PM, Monday to Saturday</span>. You may be required to work additional hours depending on project needs, but this will be communicated well in advance.
            </p>
            <p className="font-bold text-stone-900 mt-2 mb-0.5">Performance Reviews</p>
            <p className="text-justify">
              Throughout your tenure, you will be subject to regular performance reviews. These reviews are designed to assess your progress and provide feedback for improvement. Based on these evaluations, you will be given opportunities to work on more complex projects or explore different areas of interest within the company.
            </p>
            <p className="font-bold text-stone-900 mt-2 mb-0.5">Confidentiality Agreement</p>
            <p className="text-justify">
              During your association with Rhinon Tech, you may have access to sensitive and proprietary information. It is expected that you maintain confidentiality and not disclose any company-related information to external parties. A separate Non-Disclosure Agreement (NDA) will be provided to you on the first day.
            </p>
          </div>
        </div>
        <div className="absolute bottom-3 left-0 right-0 text-center text-[7.5px] text-stone-400">Page 2 of 5</div>
      </div>

      {/* PAGE 3 */}
      <div className="bg-white border border-stone-200 shadow-sm p-10 aspect-[1/1.41] w-full text-[9.5px] leading-relaxed relative flex flex-col font-sans text-stone-700 select-none">
        <OfferLetterLogo />
        <div className="space-y-3 flex-1">
          <div>
            <p className="font-bold text-stone-900 mb-0.5">Intellectual Property</p>
            <p className="text-justify">
              Any work, project, or intellectual property developed by you during the association remains the sole property of <span className="font-bold text-stone-900">Rhinon Tech</span>. You will be expected to transfer all rights of any code, design, or product developed during your tenure to the company.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#005085] text-[9.5px] mb-0.5">6. Termination Clause</h3>
            <p className="text-justify">
              While we expect you to successfully complete your tenure, both you and Rhinon Tech have the right to terminate the association under the following conditions:
            </p>
            <ul className="list-disc pl-4 space-y-1 mt-1 text-justify">
              <li><span className="font-bold text-gray-900">Voluntary Termination:</span> Either party may terminate the agreement with <span className="font-bold text-gray-900">1 Month Prior Notice</span>. A written notice is required in case you decide to discontinue.</li>
              <li><span className="font-bold text-gray-900">Involuntary Termination:</span> The company reserves the right to terminate immediately if any of the following occurs:
                <ul className="list-alpha pl-4 mt-0.5 space-y-0.5 text-stone-600">
                  <li>a. Violation of company policies or non-compliance with the agreement.</li>
                  <li>b. Misconduct, dishonesty, or inappropriate behavior within the workplace.</li>
                  <li>c. Poor performance reviews with no sign of improvement for 2 consecutive months.</li>
                  <li>d. Intentionally or negligently disclosing Confidential Information to unauthorized parties.</li>
                  <li>e. Intentionally or negligently misusing or misappropriating Confidential Information.</li>
                  <li>f. Failure to comply with security policies regarding Confidential Information.</li>
                  <li>g. Failure to return all company property and settle pending tasks.</li>
                </ul>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-[#005085] text-[9.5px] mb-0.5">7. Post-Employment Review and Opportunities</h3>
          </div>
        </div>
        <div className="absolute bottom-3 left-0 right-0 text-center text-[7.5px] text-stone-400">Page 3 of 5</div>
      </div>

      {/* PAGE 4 */}
      <div className="bg-white border border-stone-200 shadow-sm p-10 aspect-[1/1.41] w-full text-[9.5px] leading-relaxed relative flex flex-col font-sans text-stone-700 select-none">
        <OfferLetterLogo />
        <div className="space-y-3 flex-1">
          <p className="text-justify">
            At the conclusion of your tenure, we will conduct a <span className="font-bold text-stone-900">formal review of your performance</span>. This review will evaluate your contributions, professionalism, teamwork, and learning agility.
          </p>
          <p className="font-bold text-stone-900">Post-Internship Outcomes:</p>
          <ol className="list-decimal pl-4 space-y-1">
            <li><span className="font-bold text-stone-900">Certificate of Completion:</span> Issued if you have met objectives satisfactorily.</li>
            <li><span className="font-bold text-stone-900">Experience Letter:</span> Provided to highlight your key contributions.</li>
            <li><span className="font-bold text-stone-900">Full-Time Employment Opportunity:</span> Outstanding interns may be offered a permanent role.</li>
          </ol>
          <p className="text-justify">
            We strongly believe in recognizing talent, and those who demonstrate exceptional performance will be considered for permanent leadership positions with Rhinon Tech.
          </p>

          <div>
            <h3 className="font-bold text-[#005085] text-[9.5px] mb-0.5">8. Code of Conduct</h3>
            <ol className="list-decimal pl-4 space-y-0.5">
              <li><span className="font-bold text-stone-900">Professionalism:</span> Maintain a professional demeanor at all times.</li>
              <li><span className="font-bold text-stone-900">Punctuality:</span> Be punctual and accountable for agreed-upon hours.</li>
              <li><span className="font-bold text-stone-900">Workplace Ethics:</span> Follow all company policies and security guidelines.</li>
              <li><span className="font-bold text-stone-900">Teamwork:</span> Collaborate effectively and contribute to culture.</li>
            </ol>
          </div>

          <div>
            <h3 className="font-bold text-[#005085] text-[9.5px] mb-0.5">9. Next Steps and Acceptance</h3>
            <p className="text-justify">
              To confirm your acceptance of this offer, please sign and return a copy of this offer letter by the acceptance deadline. We look forward to your contributions.
            </p>
            <p className="mt-1">HR Department: info@rhinontech.com</p>
          </div>

          <div className="pt-2">
            <p>Best regards,</p>
            <div className="h-6 flex items-center italic text-stone-400 select-none">[Founder Signature]</div>
            <p className="font-bold text-stone-900">Prabhat Patra (Founder)</p>
          </div>
        </div>
        <div className="absolute bottom-3 left-0 right-0 text-center text-[7.5px] text-stone-400">Page 4 of 5</div>
      </div>

      {/* PAGE 5 */}
      <div className="bg-white border border-stone-200 shadow-sm p-10 aspect-[1/1.41] w-full text-[9.5px] leading-relaxed relative flex flex-col font-sans text-stone-700 select-none">
        <OfferLetterLogo />
        <div className="text-center font-bold text-[#005085] tracking-wider text-[10px] mb-6">
          Rhinon Tech Acknowledgment of Offer
        </div>
        <p className="text-justify mb-6">
          I, <span className="font-bold text-stone-900">{form.legalName || form.fullName || "[Full Name]"}</span>, accept the offer of the <span className="font-bold text-stone-900">{form.roleTitle || "[Role Title]"}</span> position at Rhinon Tech under the terms stated in this letter.
        </p>

        <div className="space-y-4">
          <p className="font-bold text-stone-900">Signature: _______________________</p>
          <p className="font-bold text-stone-900">Date: ___{fmtStartShort}____________________</p>
        </div>
        <div className="absolute bottom-3 left-0 right-0 text-center text-[7.5px] text-stone-400">Page 5 of 5</div>
      </div>
    </div>
  );
}

function NdaPreview({ form }: { form: EmployeeForm }) {
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const joinedStr = form.joiningDate
    ? new Date(form.joiningDate).toLocaleDateString("en-GB").replace(/\//g, "-")
    : "[Joining Date]";

  return (
    <div className="space-y-6 overflow-y-auto max-h-[70vh] p-4 bg-stone-100/60 rounded-xl">
      <div className="bg-white border border-stone-200 shadow-sm p-10 aspect-[1/1.41] w-full text-[9.5px] leading-relaxed relative flex flex-col font-sans text-stone-700 select-none">
        <OfferLetterLogo />
        <div className="text-center font-bold text-[#005085] tracking-wider text-[10px] mb-4">
          NON-DISCLOSURE & CONFIDENTIALITY AGREEMENT
        </div>
        
        <div className="text-right mb-2">Date: {dateStr}</div>

        <div className="space-y-3 flex-1">
          <p className="text-justify">
            This Non-Disclosure and Confidentiality Agreement (the "Agreement") is entered into as of {dateStr} by and between:
          </p>
          <div className="pl-4 space-y-1">
            <p><span className="font-bold text-stone-900">1. Rhinon Tech</span> (the "Company"), and</p>
            <p><span className="font-bold text-stone-900">2. {form.legalName || form.fullName || "[Employee Full Name]"}</span> residing at {form.workLocation || "[Work Location]"} (the "Employee").</p>
          </div>

          <div>
            <h3 className="font-bold text-[#005085] text-[9.5px] mb-0.5">1. Purpose</h3>
            <p className="text-justify text-stone-600">
              The Company desires to associate with the Employee, during which the Employee will have access to confidential, proprietary, and highly sensitive information of the Company. The Employee agrees to receive and safeguard such information under the terms of this Agreement.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#005085] text-[9.5px] mb-0.5">2. Confidential Information</h3>
            <p className="text-justify text-stone-600">
              Confidential Information includes all trade secrets, source code, playbooks, databases, client records, research, and financial reports. The Employee agrees to keep all such information strictly confidential and not disclose it to any third party.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#005085] text-[9.5px] mb-0.5">3. Intellectual Property</h3>
            <p className="text-justify text-stone-600">
              All inventions, systems, software designs, codes, and business methodologies developed by the Employee during their association with the Company remain the exclusive intellectual property of the Company.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#005085] text-[9.5px] mb-0.5">4. Remedies & Jurisdiction</h3>
            <p className="text-justify text-stone-600">
              Any breach of this agreement shall entitle the Company to seek injunctive relief and damages in accordance with governing laws.
            </p>
          </div>

          <p className="pt-1 text-justify">
            IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.
          </p>

          <div className="pt-2 grid grid-cols-2 gap-8 text-[9px]">
            <div className="space-y-3">
              <p>For <span className="font-bold text-stone-900">Rhinon Tech</span>,</p>
              <div className="h-6 flex items-center italic text-stone-400 select-none">[Authorized Sign]</div>
              <p className="font-bold text-stone-900">Authorized Signatory</p>
            </div>
            <div className="space-y-3">
              <p>Accepted & Agreed By:</p>
              <div className="h-6 border-b border-stone-200"></div>
              <div>
                <p className="font-bold text-stone-900">{form.legalName || form.fullName || "[Employee Full Name]"}</p>
                <p className="text-[7.5px] text-stone-400">Date: {joinedStr}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-3 left-0 right-0 text-center text-[7.5px] text-stone-400">Page 1 of 1</div>
      </div>
    </div>
  );
}


