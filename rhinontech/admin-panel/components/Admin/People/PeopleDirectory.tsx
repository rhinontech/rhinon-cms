"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import { TbCamera, TbLayoutSidebarFilled, TbLayoutSidebarRightFilled, TbPencil, TbPlus, TbSearch, TbMailForward, TbKey, TbX } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { WorkSchedulePicker } from "@/components/Admin/Common/WorkSchedulePicker";
import { usePermissions } from "@/context/PermissionsContext";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";
import { LetterBlocksView } from "@/components/Admin/People/LetterBlocksView";
import { LetterEnvelope } from "@/components/Admin/People/LetterEnvelope";
import { RewriteToolbar } from "@/components/Admin/People/RewriteToolbar";
import { NewTemplateDialog } from "@/components/Admin/People/NewTemplateDialog";
import type { LetterBlock } from "@/types/letterBlocks";

// Splices local (unsaved) block-level edits onto a freshly-resolved preview —
// mirrors backend applyBlockOverrides so an AI edit survives a form-field
// change that re-triggers the debounced preview fetch.
function applyLocalOverrides(blocks: LetterBlock[], overrides: { blockId: string; text: string }[]): LetterBlock[] {
  if (overrides.length === 0) return blocks;
  const map = new Map(overrides.map((o) => [o.blockId, o.text]));
  return blocks.map((b) => (b.kind !== "pagebreak" && map.has(b.id) ? { ...b, text: map.get(b.id)! } : b));
}

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
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-400/15 text-amber-700 dark:text-amber-300" title={`Last working day: ${formatDate(exitDate)}`}>
        exiting
      </span>
    );
  }
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", status === "active" ? "bg-green-100 dark:bg-green-400/15 text-green-700 dark:text-green-300" : "bg-muted text-muted-foreground")}>
      {status === "active" ? "active" : "relieved"}
    </span>
  );
}

const EXIT_REASONS = ["Resignation", "Termination", "Contract ended", "Absconded", "Other"];

const EXIT_CHECKLIST_ITEMS: { key: string; label: string }[] = [
  { key: "emailDisabled", label: "Company email account disabled" },
  { key: "assetsReturned", label: "Company assets returned" },
  { key: "accessRevoked", label: "Third-party tool access revoked" },
  { key: "settlementPaid", label: "Final settlement paid" },
  { key: "lettersIssued", label: "Relieving / experience letters issued" },
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
          <h3 className="text-base font-semibold text-foreground">Offboard {employee.fullName}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{employee.companyEmail}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-foreground/85">
            Last working day
            <input
              type="date"
              value={exitDate}
              onChange={(e) => setExitDate(e.target.value)}
              className="rounded-lg border border-border px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-foreground/85">
            Reason
            <select
              value={exitReason}
              onChange={(e) => setExitReason(e.target.value)}
              className="rounded-lg border border-border px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {EXIT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="col-span-2 flex flex-col gap-1 text-sm font-medium text-foreground/85">
            Notes <span className="font-normal text-muted-foreground">(optional)</span>
            <textarea
              value={exitNotes}
              onChange={(e) => setExitNotes(e.target.value)}
              rows={3}
              placeholder="Handover details, exit interview notes..."
              className="rounded-lg border border-border px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>

        <div className="space-y-1 rounded-lg bg-red-50 dark:bg-red-400/10 p-3 text-xs text-red-700 dark:text-red-300">
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
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-foreground/85 hover:bg-muted">
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
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 font-medium text-foreground">{value}</div>
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
            <h3 className="text-base font-semibold text-foreground">{letterLabel} — {employeeName}</h3>
            <p className="text-xs text-muted-foreground">Preview before sending. Nothing is saved or emailed yet.</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground/85 rounded-lg hover:bg-muted">
            <TbX size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-muted">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Rendering preview...</div>
          ) : loadError ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-red-600 dark:text-red-300">{loadError}</div>
          ) : pdfUrl ? (
            <iframe src={pdfUrl} className="h-full w-full" title="Letter preview" />
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t px-5 py-4">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-foreground/85 hover:bg-muted">
            Cancel
          </button>
          <button
            type="button"
            disabled={sending || loading || !!loadError}
            onClick={onSend}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
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
    <section className="space-y-3 rounded-lg border border-border p-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
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
    <label className="flex flex-col gap-1 text-sm font-medium text-foreground/85">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500"
        required={required}
      />
    </label>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground/85">
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
    <label className="flex flex-col gap-1 text-sm font-medium text-foreground/85">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border px-3 py-2 font-normal bg-card focus:outline-none focus:ring-2 focus:ring-blue-500"
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
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attachDocs, setAttachDocs] = useState(true);
  const [previewTab, setPreviewTab] = useState<"offer" | "nda">("offer");
  const [mobileFormTab, setMobileFormTab] = useState<"form" | "preview">("form");
  // Per-block AI/manual edits made in the live preview during create — kept
  // here (not inside LiveLetterPreview) so they survive form-field changes
  // that re-trigger the debounced preview fetch, and so submitEmployee can
  // send them along with POST /employees. Never touches the shared template.
  const [offerOverrides, setOfferOverrides] = useState<{ blockId: string; text: string }[]>([]);
  const [ndaOverrides, setNdaOverrides] = useState<{ blockId: string; text: string }[]>([]);
  // Signing status for the employee currently open in edit mode — drives
  // whether the "Resend for signing" action shows per-tab (never once signed).
  const [docStatus, setDocStatus] = useState<{
    offer_letter: { exists: boolean; signed: boolean };
    nda: { exists: boolean; signed: boolean };
  } | null>(null);
  const [resendingDoc, setResendingDoc] = useState(false);
  // Which offer-letter template applies to this hire. Empty string = not yet
  // manually chosen — auto-follows Employment Type (matching the backend's
  // default) until the admin picks one explicitly from the dropdown.
  const [offerTemplates, setOfferTemplates] = useState<{ key: string; title: string }[]>([]);
  const [offerTemplateKey, setOfferTemplateKey] = useState("");
  const [offerTemplateManuallySet, setOfferTemplateManuallySet] = useState(false);
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [mode, setMode] = useState<PanelMode>("view");
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(true);
  const [detailWidthPct, setDetailWidthPct] = useState(42);
  const [isResizingDetail, setIsResizingDetail] = useState(false);
  const panesRef = useRef<HTMLDivElement>(null);
  // Phone-only: the aside becomes a full-screen overlay, opened by tapping a
  // row / Add member / Edit — never by the desktop auto-selection.
  const [mobileDetail, setMobileDetail] = useState(false);
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
  }, []);

  // Keyed on canManage, not run once at mount: permissions load asynchronously
  // (PermissionsContext starts empty and fills in after /auth/me), so at mount
  // canManage is still false — this refires once it flips true.
  useEffect(() => {
    if (!canManage) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/roles`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setRoles(Array.isArray(data) ? data : []))
      .catch(() => setRoles([]));
  }, [canManage]);

  const fetchOfferTemplates = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/letter-templates?category=offer_letter`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setOfferTemplates(Array.isArray(data) ? data : []))
      .catch(() => setOfferTemplates([]));
  };

  useEffect(() => {
    if (!canManage) return;
    fetchOfferTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage]);

  // Auto-follows Employment Type (same default the backend applies) until the
  // admin explicitly picks a template from the dropdown — matches the create
  // flow's existing "smart defaults until touched" pattern.
  useEffect(() => {
    if (offerTemplateManuallySet || offerTemplates.length === 0) return;
    const isIntern = form.employmentType?.toLowerCase().startsWith("intern");
    const defaultKey = offerTemplates.find((t) => t.key === (isIntern ? "offer_letter_intern" : "offer_letter_fulltime"))?.key
      ?? offerTemplates[0]?.key
      ?? "";
    setOfferTemplateKey(defaultKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerTemplates, form.employmentType, offerTemplateManuallySet]);

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
    setOfferOverrides([]);
    setNdaOverrides([]);
    setOfferTemplateKey("");
    setOfferTemplateManuallySet(false);
    setDocStatus(null);
    setMessage("");
    setMobileFormTab("form");
    setIsPreviewExpanded(true);
    setMobileDetail(true);
  };

  // One combined action for both documents — mirrors the original create-time
  // flow (one shared signing session, one email covering both). Any already-
  // signed document is left untouched server-side; only unsigned ones are
  // regenerated, but there's still just one email either way, never one per
  // document, so re-sending doesn't spam the employee with duplicate emails.
  const resendDocuments = async () => {
    if (!selectedEmployee) return;
    if (!confirm(`Regenerate and re-send the offer letter and/or NDA to ${selectedEmployee.personalEmail} for signing?\n\nOne email is sent covering whichever documents are still unsigned, rebuilt from the current template and this employee's current details, plus any edits shown in the previews right now. Already-signed documents are left untouched. Edits from an earlier resend that aren't reflected in the preview won't carry over automatically.`)) return;

    setResendingDoc(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees/${selectedEmployee.id}/documents/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          offerLetterTemplateKey: offerTemplateKey || undefined,
          offerLetterOverrides: offerOverrides.length > 0 ? offerOverrides : undefined,
          ndaOverrides: ndaOverrides.length > 0 ? ndaOverrides : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || "Could not resend the documents.");
        return;
      }
      setOfferOverrides([]);
      setNdaOverrides([]);
      alert(`Updated and re-sent to ${data.sentTo || selectedEmployee.personalEmail} (${(data.regenerated || []).join(", ") || "no changes"}).`);
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees/${selectedEmployee.id}/documents/status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => setDocStatus(d))
        .catch(() => { });
    } catch {
      alert("Could not resend the documents. Please try again.");
    } finally {
      setResendingDoc(false);
    }
  };

  const selectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setMode("view");
    setMessage("");
    setIsPreviewExpanded(true);
    setMobileDetail(true);
  };

  const openEdit = () => {
    if (!selectedEmployee) {
      return;
    }

    setMode("edit");
    setForm(employeeToForm(selectedEmployee));
    setOfferOverrides([]);
    setNdaOverrides([]);
    setOfferTemplateKey("");
    setOfferTemplateManuallySet(false);
    setMessage("");
    setIsPreviewExpanded(true);
    setDocStatus(null);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees/${selectedEmployee.id}/documents/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setDocStatus(data))
      .catch(() => setDocStatus(null));
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
      offerLetterOverrides: mode === "create" && attachDocs && offerOverrides.length > 0 ? offerOverrides : undefined,
      ndaOverrides: mode === "create" && attachDocs && ndaOverrides.length > 0 ? ndaOverrides : undefined,
      offerLetterTemplateKey: mode === "create" && attachDocs && offerTemplateKey ? offerTemplateKey : undefined,
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

    // Creation succeeds even when the welcome email doesn't go out — never let
    // that failure pass silently (strict false: older responses omit the flag).
    if (mode === "create" && savedEmployee?.welcomeEmailSent === false) {
      alert(`${savedEmployee.fullName || "The member"} was created, but the welcome email could NOT be sent.\n\nOpen their profile and use "Resend invite" to send the credentials and signing link again.`);
    }

    const nextEmployees = await fetchEmployees();
    setSaving(false);
    setMessage(mode === "create" ? "Employee added." : "Employee updated.");

    if (mode === "create") {
      setForm(emptyForm);
      setOfferOverrides([]);
      setNdaOverrides([]);
      setOfferTemplateKey("");
      setOfferTemplateManuallySet(false);
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

  const startDetailResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingDetail(true);
    const onMouseMove = (moveEvent: MouseEvent) => {
      const container = panesRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pct = ((rect.right - moveEvent.clientX) / rect.width) * 100;
      setDetailWidthPct(Math.min(70, Math.max(28, pct)));
    };
    const onMouseUp = () => {
      setIsResizingDetail(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div ref={panesRef} className="flex min-h-0 gap-2 w-full h-full overflow-hidden">
      <main
        className={cn(
          "flex min-h-0 flex-col glass-panel w-full h-full overflow-hidden",
          isSubNavExpanded ? "rounded-r-xl max-sm:rounded-xl" : "rounded-xl",
          (mode === "create" || mode === "edit") && "hidden"
        )}
      >
        <div className="sticky top-0 glass-header z-10 flex min-h-16 flex-wrap items-center justify-between gap-2.5 px-3 sm:px-5 py-2.5 sm:py-0 border-b border-border">
          <div className="flex items-center gap-2.5 min-w-0">
            <SubNavToggle />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold tracking-tight truncate">Team</h1>
              <p className="text-xs text-muted-foreground truncate">
                {activeCount} active{alumniCount > 0 ? ` · ${alumniCount} alumni` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex items-center rounded-lg border border-border bg-card p-0.5 shrink-0">
              <button
                onClick={() => switchTab("active")}
                className={cn(
                  "rounded-md px-2.5 sm:px-3 py-1 text-xs font-medium transition-colors",
                  tab === "active" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Active
              </button>
              <button
                onClick={() => switchTab("alumni")}
                className={cn(
                  "rounded-md px-2.5 sm:px-3 py-1 text-xs font-medium transition-colors",
                  tab === "alumni" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Alumni{alumniCount > 0 ? ` (${alumniCount})` : ""}
              </button>
            </div>
            <div className="relative min-w-[120px] flex-1 sm:flex-initial">
              <TbSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 text-xs border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-56 md:w-64 bg-card"
              />
            </div>
            {canManage && (
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 sm:px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 whitespace-nowrap shrink-0"
              >
                <TbPlus size={14} />
                <span className="hidden sm:inline">Add member</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
            {!isPreviewExpanded && (
              <button
                onClick={() => { setIsPreviewExpanded(true); setMobileDetail(true); }}
                className="p-1.5 sm:p-2 text-foreground/70 hover:bg-muted rounded-lg shrink-0"
                title="Open details"
              >
                <TbLayoutSidebarFilled size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3 sm:p-5">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              {tab === "alumni" ? "No alumni yet." : "No employees found."}
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-x-auto shadow-xs">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="glass-thead text-foreground/70 text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Employee</th>
                    <th className="px-5 py-3 text-left">Role</th>
                    <th className="px-5 py-3 text-left">Department</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">{tab === "alumni" ? "Left" : "Joined"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {filtered.map((emp) => (
                    <tr
                      key={emp.id}
                      onClick={() => selectEmployee(emp)}
                      className={cn(
                        "cursor-pointer hover:bg-muted/40 transition-colors",
                        selectedEmployee?.id === emp.id && "bg-blue-50 dark:bg-blue-400/10 hover:bg-blue-50 dark:hover:bg-blue-400/10"
                      )}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold shrink-0 overflow-hidden">
                            {emp.avatarUrl ? <img src={emp.avatarUrl} alt={emp.fullName} className="w-full h-full object-cover" /> : initials(emp.fullName)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{emp.fullName}</p>
                            <p className="text-xs text-muted-foreground">{emp.companyEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-foreground/70">{emp.role?.name}</td>
                      <td className="px-5 py-3 text-sm text-foreground/70">{emp.department}</td>
                      <td className="px-5 py-3"><StatusBadge status={emp.status} exitDate={emp.exitDate} /></td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">
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

      {isPreviewExpanded && mode === "view" && !mobileDetail && (
        <div
          onMouseDown={startDetailResize}
          className="hidden lg:block w-1.5 shrink-0 cursor-col-resize group"
          title="Drag to resize"
        >
          <div className={cn(
            "mx-auto h-full w-0.5 rounded-full transition-colors",
            isResizingDetail ? "bg-blue-500" : "bg-transparent group-hover:bg-muted"
          )} />
        </div>
      )}

      <aside
        style={
          isPreviewExpanded && mode === "view" && !mobileDetail
            ? { width: `${detailWidthPct}%` }
            : undefined
        }
        className={cn(
          "min-h-0 flex-col bg-card overflow-hidden",
          isResizingDetail ? "transition-none" : "transition-all duration-200 ease-in-out",
          mobileDetail ? "fixed inset-0 z-50 flex w-full max-w-full" : "hidden",
          "lg:static lg:z-auto lg:flex lg:h-full lg:rounded-xl",
          isPreviewExpanded ? (mode === "create" || mode === "edit" ? "lg:w-full" : "shrink-0") : "lg:w-0"
        )}
      >
        {isPreviewExpanded && (
          <div className="flex flex-col w-full flex-1 h-full overflow-hidden relative">
            <div className="sticky top-0 w-full flex min-h-16 items-center justify-between px-4 sm:px-5 py-2 sm:py-0 border-b bg-card z-10 shrink-0">
              <div className="flex items-center gap-2 sm:gap-4 self-stretch min-w-0">
                <p className="flex self-stretch items-center text-sm sm:text-md font-medium tracking-tight border-b-2 border-blue-600 text-foreground -mb-px truncate">
                  {mode === "create" ? "Add Member" : mode === "edit" ? "Edit Member" : "Member Details"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {canWrite && mode === "view" && selectedEmployee && selectedEmployee.status === "active" && (
                  selectedEmployee.onboarded ? (
                    <button
                      onClick={sendReset}
                      disabled={resending}
                      className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground/85 hover:bg-muted disabled:opacity-50"
                      title="Email a password reset link (doesn't change their current password)"
                    >
                      <TbKey size={15} />
                      <span className="hidden sm:inline">{resending ? "Sending..." : "Send password reset"}</span>
                      <span className="sm:hidden">{resending ? "..." : "Reset pwd"}</span>
                    </button>
                  ) : (
                    <button
                      onClick={resendInvite}
                      disabled={resending}
                      className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground/85 hover:bg-muted disabled:opacity-50"
                      title="Email a fresh temporary password + setup link"
                    >
                      <TbMailForward size={15} />
                      <span className="hidden sm:inline">{resending ? "Sending..." : "Resend invite"}</span>
                      <span className="sm:hidden">{resending ? "..." : "Invite"}</span>
                    </button>
                  )
                )}
                {canManage && mode === "view" && selectedEmployee && (
                  <button
                    onClick={openEdit}
                    className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground/85 hover:bg-muted"
                  >
                    <TbPencil size={15} />
                    <span>Edit</span>
                  </button>
                )}
                <button
                  className="cursor-pointer text-foreground/70 hover:text-foreground p-1.5 rounded-lg hover:bg-muted"
                  onClick={() => {
                    if (mode === "create" || mode === "edit") {
                      setMode("view");
                    } else {
                      setIsPreviewExpanded(false);
                    }
                    setMobileDetail(false);
                  }}
                  title="Close"
                >
                  <TbX size={18} className="lg:hidden" />
                  <TbLayoutSidebarRightFilled size={18} className="hidden lg:block" />
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
                        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-semibold overflow-hidden">
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
                        <h2 className="text-lg font-semibold text-foreground">{selectedEmployee.fullName}</h2>
                        <p className="text-sm text-muted-foreground">{selectedEmployee.companyEmail}</p>
                        <p className="text-xs text-muted-foreground">{selectedEmployee.role?.name} · {selectedEmployee.department}</p>
                      </div>
                    </div>

                    {/* Public info — visible to all */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
                              ? "border-border bg-muted/40"
                              : selectedEmployee.exitDate
                                ? "border-amber-200 dark:border-amber-400/25 bg-amber-50 dark:bg-amber-400/10"
                                : "border-red-100 dark:border-red-400/20"
                          )}
                        >
                          {selectedEmployee.status === "active" && !selectedEmployee.exitDate ? (
                            <>
                              <h3 className="text-sm font-semibold text-foreground">Offboarding</h3>
                              <p className="text-xs text-muted-foreground">
                                Relieve this member — records their last working day, revokes access,
                                and removes them from future payroll runs.
                              </p>
                              {selectedEmployee.role?.slug === "superadmin" ? (
                                <p className="text-xs text-muted-foreground">The superadmin account cannot be offboarded.</p>
                              ) : canWrite ? (
                                <button
                                  onClick={() => setShowOffboard(true)}
                                  className="rounded-lg border border-red-200 dark:border-red-400/25 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-400/10"
                                >
                                  Offboard member
                                </button>
                              ) : null}
                            </>
                          ) : selectedEmployee.status === "active" ? (
                            <>
                              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">Exit scheduled</h3>
                              <p className="text-xs text-amber-700 dark:text-amber-300">
                                Last working day <span className="font-semibold">{formatDate(selectedEmployee.exitDate!)}</span>
                                {" · "}{selectedEmployee.exitReason || "—"}. Access is revoked automatically after that day ends.
                              </p>
                              {selectedEmployee.exitNotes && <p className="text-xs text-amber-700/80 dark:text-amber-300">{selectedEmployee.exitNotes}</p>}
                              {canWrite && (
                                <button
                                  onClick={reactivate}
                                  disabled={offboardBusy}
                                  className="rounded-lg border border-amber-300 dark:border-amber-400/30 px-3 py-1.5 text-sm font-medium text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-400/15 disabled:opacity-50"
                                >
                                  {offboardBusy ? "Working..." : "Cancel scheduled exit"}
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              <h3 className="text-sm font-semibold text-foreground">Relieved</h3>
                              <p className="text-xs text-muted-foreground">
                                Last working day{" "}
                                <span className="font-semibold">
                                  {selectedEmployee.exitDate ? formatDate(selectedEmployee.exitDate) : "not recorded"}
                                </span>
                                {" · "}{selectedEmployee.exitReason || "reason not recorded"}
                              </p>
                              {selectedEmployee.exitNotes && <p className="text-xs text-muted-foreground">{selectedEmployee.exitNotes}</p>}
                              {canWrite && (
                                <button
                                  onClick={reactivate}
                                  disabled={offboardBusy}
                                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground/85 hover:bg-muted disabled:opacity-50"
                                >
                                  {offboardBusy ? "Working..." : "Reactivate member"}
                                </button>
                              )}
                            </>
                          )}

                          {selectedEmployee.exitDate && (
                            <div className="space-y-3 border-t border-border pt-3">
                              <div>
                                <p className="mb-2 text-xs font-semibold text-foreground/85">Exit checklist</p>
                                <div className="grid grid-cols-1 gap-1.5">
                                  {EXIT_CHECKLIST_ITEMS.map((item) => (
                                    <label key={item.key} className="flex items-center gap-2 text-xs text-foreground/70">
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
                                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/85 hover:bg-muted disabled:opacity-50"
                                  >
                                    Preview relieving letter
                                  </button>
                                  <button
                                    onClick={() => openLetterPreview("experience")}
                                    disabled={!!letterPreview}
                                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/85 hover:bg-muted disabled:opacity-50"
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

                    {message && <p className={cn("text-sm", message.includes("Unable") ? "text-red-600 dark:text-red-300" : "text-green-600 dark:text-green-300")}>{message}</p>}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Select an employee.</div>
                )}
              </div>
            ) : canManage ? (
              <form onSubmit={submitEmployee} className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 lg:divide-x bg-muted/40">
                {/* Mobile Tab Switcher */}
                <div className="flex lg:hidden items-center justify-center p-2.5 bg-card border-b border-border shrink-0">
                  <div className="flex bg-muted rounded-lg p-0.5 w-full max-w-xs">
                    <button
                      type="button"
                      onClick={() => setMobileFormTab("form")}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all text-center",
                        mobileFormTab === "form" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Form Details
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileFormTab("preview")}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all text-center",
                        mobileFormTab === "preview" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Live Preview
                    </button>
                  </div>
                </div>

                {/* Left: Input fields */}
                <div className={cn(
                  "w-full lg:w-1/2 overflow-y-auto p-4 sm:p-6 bg-card space-y-4 flex-col justify-between",
                  mobileFormTab === "form" ? "flex flex-1" : "hidden lg:flex"
                )}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1 text-sm font-medium text-foreground/85">
                      Full name
                      <input value={form.fullName} onChange={(e) => updateForm("fullName", e.target.value)} className="rounded-lg border border-border px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-foreground/85">
                      Personal email
                      <input type="email" value={form.personalEmail} onChange={(e) => updateForm("personalEmail", e.target.value)} className="rounded-lg border border-border px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-foreground/85">
                      Role
                      <select value={form.roleId} onChange={(e) => updateForm("roleId", e.target.value)} className="rounded-lg border border-border px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                        <option value="">Select role</option>
                        {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-foreground/85">
                      Department
                      <input value={form.department} onChange={(e) => updateForm("department", e.target.value)} className="rounded-lg border border-border px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500" required />
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
                      <label className="text-xs font-medium text-muted-foreground">Work Schedule</label>
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
                      <label className="col-span-2 flex flex-col gap-1 text-sm font-medium text-foreground/85">
                        Company Email
                        <div className="flex items-center rounded-lg border border-border overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                          <input
                            type="text"
                            value={form.emailPrefix}
                            onChange={(e) => updateForm("emailPrefix", e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                            placeholder="firstname.lastname"
                            className="flex-1 px-3 py-2 text-sm font-normal focus:outline-none"
                            required
                          />
                          <span className="px-3 py-2 bg-muted/40 text-muted-foreground text-sm border-l border-border select-none whitespace-nowrap">@rhinontech.in</span>
                        </div>
                        <p className="text-xs text-muted-foreground font-normal">A welcome email with login credentials will be sent to their personal email.</p>
                      </label>
                    )}

                    {mode === "create" && (
                      <label className="col-span-2 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-medium text-foreground/85 mt-2 cursor-pointer">
                        <input type="checkbox" checked={attachDocs} onChange={(e) => setAttachDocs(e.target.checked)} className="rounded" />
                        Generate Offer Letter & NDA for e-signing (credentials email is sent automatically after both are signed)
                      </label>
                    )}
                  </div>

                  {message && <p className={cn("text-sm mt-4", message.includes("Unable") ? "text-red-600 dark:text-red-300" : "text-green-600 dark:text-green-300")}>{message}</p>}

                  <div className="flex items-center justify-end gap-3 border-t pt-4 mt-6">
                    <button type="button" onClick={() => { setMode("view"); setMobileDetail(false); }} className="rounded-lg px-4 py-2 text-sm font-medium text-foreground/85 hover:bg-muted">
                      Cancel
                    </button>
                    <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                      {saving ? "Saving..." : mode === "create" ? "Add member" : "Save changes"}
                    </button>
                  </div>
                </div>

                {/* Right: Live Preview */}
                <div className={cn(
                  "w-full lg:w-1/2 overflow-y-auto flex-col p-4 sm:p-6 bg-muted/70",
                  mobileFormTab === "preview" ? "flex flex-1 min-h-[500px]" : "hidden lg:flex"
                )}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Live Document Preview</p>

                  {/* Tabs */}
                  <div className="flex gap-2 mb-4 border-b border-border">
                    <button
                      type="button"
                      onClick={() => setPreviewTab("offer")}
                      className={cn(
                        "px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-all",
                        previewTab === "offer" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground/70"
                      )}
                    >
                      Offer Letter
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab("nda")}
                      className={cn(
                        "px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-all",
                        previewTab === "nda" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground/70"
                      )}
                    >
                      NDA
                    </button>
                  </div>

                  {mode === "edit" && docStatus && (() => {
                    const rows = (["offer_letter", "nda"] as const)
                      .filter((c) => docStatus[c].exists)
                      .map((c) => ({ label: c === "offer_letter" ? "Offer Letter" : "NDA", signed: docStatus[c].signed }));
                    if (rows.length === 0) return null;
                    const anyUnsigned = rows.some((r) => !r.signed);

                    return (
                      <div className="mb-3 space-y-2">
                        <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {rows.map((r) => (
                            <span key={r.label}>
                              {r.label}: {r.signed ? <span className="font-medium text-emerald-600 dark:text-emerald-300">✓ Signed</span> : <span className="text-amber-600 dark:text-amber-300">Pending signature</span>}
                            </span>
                          ))}
                        </p>
                        {anyUnsigned && (
                          <button
                            type="button"
                            disabled={resendingDoc}
                            onClick={resendDocuments}
                            className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground/85 hover:bg-muted/40 disabled:opacity-50"
                          >
                            {resendingDoc ? "Sending…" : "Resend for signing"}
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {previewTab === "offer" && (
                    <div className="flex items-center gap-2 mb-3">
                      <select
                        value={offerTemplateKey}
                        onChange={(e) => {
                          setOfferTemplateKey(e.target.value);
                          setOfferTemplateManuallySet(true);
                        }}
                        className="flex-1 rounded-lg border border-border bg-card px-2 py-1.5 text-xs font-medium text-foreground/85"
                      >
                        {offerTemplates.map((t) => (
                          <option key={t.key} value={t.key}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowNewTemplateDialog(true)}
                        className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      >
                        + New
                      </button>
                    </div>
                  )}

                  <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden w-full relative">
                    <LiveLetterPreview
                      form={form}
                      type={previewTab}
                      token={token}
                      templateKey={previewTab === "offer" ? offerTemplateKey : undefined}
                      overrides={previewTab === "offer" ? offerOverrides : ndaOverrides}
                      onOverride={(blockId, text) => {
                        const setOverrides = previewTab === "offer" ? setOfferOverrides : setNdaOverrides;
                        setOverrides((prev) => {
                          const next = prev.filter((o) => o.blockId !== blockId);
                          next.push({ blockId, text });
                          return next;
                        });
                      }}
                    />
                  </div>
                </div>

                {showNewTemplateDialog && (
                  <NewTemplateDialog
                    existing={offerTemplates}
                    onClose={() => setShowNewTemplateDialog(false)}
                    onCreated={(key) => {
                      setShowNewTemplateDialog(false);
                      fetchOfferTemplates();
                      setOfferTemplateKey(key);
                      setOfferTemplateManuallySet(true);
                    }}
                  />
                )}
              </form>
            ) : (
              <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
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

// Renders the real, backend-resolved letter content (same LetterTemplate +
// token resolution used for the actual offer letter / NDA) from the
// in-progress form fields, debounced as the admin types. Nothing is
// persisted server-side — see POST /employees/preview-documents. Rendered as
// selectable HTML (not a PDF-in-iframe) so RewriteToolbar can capture a text
// selection and offer an AI rewrite scoped to this one employee's copy;
// accepted rewrites are lifted to the parent via onOverride and sent along
// with the final POST /employees, never touching the shared template.
function LiveLetterPreview({
  form,
  type,
  token,
  templateKey,
  overrides,
  onOverride,
}: {
  form: EmployeeForm;
  type: "offer" | "nda";
  token?: string;
  templateKey?: string;
  overrides: { blockId: string; text: string }[];
  onOverride: (blockId: string, text: string) => void;
}) {
  const [blocks, setBlocks] = useState<LetterBlock[] | null>(null);
  const [tokens, setTokens] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const fullName = form.fullName.trim();

  useEffect(() => {
    if (!fullName) {
      setBlocks(null);
      setTokens(null);
      setError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees/preview-documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        signal: controller.signal,
        body: JSON.stringify({
          type,
          templateKey: type === "offer" ? templateKey || undefined : undefined,
          fullName: form.fullName,
          legalName: form.legalName,
          roleTitle: form.roleTitle,
          workLocation: form.workLocation,
          employmentType: form.employmentType,
          workSchedule: form.workSchedule,
          remotePosition: form.remotePosition,
          department: form.department,
          joiningDate: form.joiningDate,
          annualCompensation: Number(form.annualCompensation || 0),
          annualVariablePay: Number(form.annualVariablePay || 0),
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || "Could not render the preview.");
          }
          return res.json() as Promise<{ blocks: LetterBlock[]; tokens: Record<string, string> }>;
        })
        .then((data) => {
          setBlocks(applyLocalOverrides(data.blocks, overrides));
          setTokens(data.tokens);
          setLoading(false);
        })
        .catch((err) => {
          if (err.name === "AbortError") return;
          setError(err.message || "Could not render the preview.");
          setLoading(false);
        });
    }, 700);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // overrides intentionally excluded — re-applying them on every keystroke
    // in `instruction` (etc.) would refetch the whole preview; onOverride
    // already patches local state immediately (see below).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    type,
    templateKey,
    fullName,
    form.legalName,
    form.roleTitle,
    form.workLocation,
    form.employmentType,
    form.workSchedule,
    form.remotePosition,
    form.department,
    form.joiningDate,
    form.annualCompensation,
    form.annualVariablePay,
    token,
  ]);

  if (!fullName) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
        Enter the member&apos;s name to preview the {type === "offer" ? "offer letter" : "NDA"}.
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-red-500 dark:text-red-400">{error}</div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-auto" ref={containerRef}>
      {blocks && (
        <>
          <LetterEnvelope type={type} tokens={tokens ?? undefined}>
            <LetterBlocksView blocks={blocks} />
          </LetterEnvelope>
          <RewriteToolbar
            containerRef={containerRef}
            blocks={blocks}
            onApply={(blockId, text) => {
              setBlocks((prev) => (prev ? prev.map((b) => (b.id === blockId ? { ...b, text } : b)) : prev));
              onOverride(blockId, text);
            }}
          />
        </>
      )}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/70 text-xs text-muted-foreground">
          Rendering preview...
        </div>
      )}
    </div>
  );
}
