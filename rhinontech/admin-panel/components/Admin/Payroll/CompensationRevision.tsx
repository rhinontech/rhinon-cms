"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { TbLoader2, TbArrowRight, TbTrendingUp } from "react-icons/tb";

type Snapshot = {
  roleTitle: string | null;
  department: string | null;
  basicSalary: number;
  hra: number;
  ta: number;
  medicalAllowance: number;
  otherAllowances: number;
  annualCompensation: number;
};

interface Revision {
  id: string;
  kind: "increment" | "promotion";
  effectiveDate: string;
  before: Snapshot;
  after: Snapshot;
  reason: string | null;
  status: "scheduled" | "applied" | "cancelled";
  documentId: string | null;
  createdBy?: { fullName: string };
}

export interface RevisableEmployee {
  id: string;
  fullName: string;
  roleTitle?: string;
  department: string;
  basicSalary?: number;
  hra?: number;
  ta?: number;
  medicalAllowance?: number;
  otherAllowances?: number;
  annualCompensation?: number;
}

const api = (path: string, init: RequestInit = {}) =>
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/revisions${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${Cookies.get("authToken")}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });

const INR = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const gross = (s: Pick<Snapshot, "basicSalary" | "hra" | "ta" | "medicalAllowance" | "otherAllowances">) =>
  Number(s.basicSalary || 0) + Number(s.hra || 0) + Number(s.ta || 0) + Number(s.medicalAllowance || 0) + Number(s.otherAllowances || 0);
const fmtDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const inputCls = "w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "flex flex-col gap-1 text-sm font-medium text-foreground/85";

export function RevisionForm({ employee, onDone, onCancel }: { employee: RevisableEmployee; onDone: () => void; onCancel: () => void }) {
  const currentAnnual = Number(employee.annualCompensation || 0) || gross({
    basicSalary: Number(employee.basicSalary || 0), hra: Number(employee.hra || 0), ta: Number(employee.ta || 0),
    medicalAllowance: Number(employee.medicalAllowance || 0), otherAllowances: Number(employee.otherAllowances || 0),
  }) * 12;

  const [kind, setKind] = useState<"increment" | "promotion">("increment");
  const [roleTitle, setRoleTitle] = useState(employee.roleTitle ?? "");
  const [department, setDepartment] = useState(employee.department ?? "");
  const [f, setF] = useState({
    basicSalary: String(employee.basicSalary ?? ""),
    hra: String(employee.hra ?? 0),
    ta: String(employee.ta ?? 0),
    medicalAllowance: String(employee.medicalAllowance ?? 0),
    otherAllowances: String(employee.otherAllowances ?? 0),
  });
  const [annualOverride, setAnnualOverride] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(todayLocal());
  const [reason, setReason] = useState("");
  const [sendLetter, setSendLetter] = useState(true);
  const [saving, setSaving] = useState(false);

  const newMonthly = gross({
    basicSalary: Number(f.basicSalary || 0), hra: Number(f.hra || 0), ta: Number(f.ta || 0),
    medicalAllowance: Number(f.medicalAllowance || 0), otherAllowances: Number(f.otherAllowances || 0),
  });
  const newAnnual = annualOverride ? Number(annualOverride) : newMonthly * 12;
  const hike = currentAnnual > 0 ? ((newAnnual - currentAnnual) / currentAnnual) * 100 : null;
  const scheduled = effectiveDate > todayLocal();

  const save = async () => {
    if (!f.basicSalary || Number(f.basicSalary) <= 0) { toast.error("Basic salary is required"); return; }
    if (kind === "promotion" && roleTitle.trim() === (employee.roleTitle ?? "")) { toast.error("Enter the new role title"); return; }
    setSaving(true);
    const r = await api("", {
      method: "POST",
      body: JSON.stringify({
        userId: employee.id, kind, roleTitle, department, ...f,
        annualCompensation: annualOverride || undefined, effectiveDate, reason, sendLetter,
      }),
    });
    const data = await r.json().catch(() => ({}));
    setSaving(false);
    if (!r.ok) { toast.error(data.message || "Couldn't save revision"); return; }
    toast.success(
      `${kind === "promotion" ? "Promotion" : "Revision"} ${scheduled ? `scheduled for ${fmtDate(effectiveDate)}` : "applied"}` +
      (sendLetter ? (data.letterEmailSent ? " — letter sent for signing" : " — letter created, email failed") : ""),
    );
    onDone();
  };

  const money = (key: keyof typeof f, label: string) => (
    <label className={labelCls}>
      {label}
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
        <input type="number" min={0} value={f[key]} onChange={(e) => setF((p) => ({ ...p, [key]: e.target.value }))} className={`${inputCls} pl-6`} />
      </div>
      <span className="text-[11px] font-normal text-muted-foreground">was {INR(Number(employee[key] ?? 0))}</span>
    </label>
  );

  return (
    <div className="flex-1 overflow-auto p-5 space-y-5">
      <div>
        <p className="font-semibold text-foreground">{employee.fullName}</p>
        <p className="text-xs text-muted-foreground">{employee.roleTitle || "—"} · {employee.department}</p>
      </div>

      <div className="flex gap-2">
        {(["increment", "promotion"] as const).map((k) => (
          <button key={k} onClick={() => setKind(k)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border ${kind === k ? "bg-foreground text-background border-foreground" : "border-border text-foreground/75 hover:bg-muted/40"}`}>
            {k === "increment" ? "Salary increment" : "Promotion"}
          </button>
        ))}
      </div>

      {kind === "promotion" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className={labelCls}>
            New role title *
            <input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} className={inputCls} />
            <span className="text-[11px] font-normal text-muted-foreground">was {employee.roleTitle || "—"}</span>
          </label>
          <label className={labelCls}>
            Department
            <input value={department} onChange={(e) => setDepartment(e.target.value)} className={inputCls} />
            <span className="text-[11px] font-normal text-muted-foreground">was {employee.department || "—"}</span>
          </label>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">New monthly salary</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {money("basicSalary", "Basic *")}
          {money("hra", "HRA")}
          {money("ta", "Transport")}
          {money("medicalAllowance", "Medical")}
          {money("otherAllowances", "Other allowances")}
          <label className={labelCls}>
            Annual compensation
            <input type="number" min={0} value={annualOverride} onChange={(e) => setAnnualOverride(e.target.value)} placeholder={String(newMonthly * 12)} className={inputCls} />
            <span className="text-[11px] font-normal text-muted-foreground">defaults to monthly × 12</span>
          </label>
        </div>
      </div>

      <div className="rounded-xl bg-muted/40 p-4 text-sm space-y-1.5">
        <div className="flex justify-between"><span className="text-muted-foreground">Gross monthly</span><span>{INR(gross({ basicSalary: Number(employee.basicSalary || 0), hra: Number(employee.hra || 0), ta: Number(employee.ta || 0), medicalAllowance: Number(employee.medicalAllowance || 0), otherAllowances: Number(employee.otherAllowances || 0) }))} <TbArrowRight className="inline mx-1" size={12} /> <strong>{INR(newMonthly)}</strong></span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Annual</span><span>{INR(currentAnnual)} <TbArrowRight className="inline mx-1" size={12} /> <strong>{INR(newAnnual)}</strong></span></div>
        {hike != null && (
          <div className="flex justify-between"><span className="text-muted-foreground">Change</span>
            <strong className={hike >= 0 ? "text-green-700 dark:text-green-300" : "text-red-600 dark:text-red-300"}>{hike >= 0 ? "+" : ""}{hike.toFixed(1)}%</strong>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className={labelCls}>
          Effective from *
          <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className={inputCls} />
          <span className="text-[11px] font-normal text-muted-foreground">{scheduled ? "Applied automatically on this date" : "Applied right away"}</span>
        </label>
        <label className={labelCls}>
          Reason (internal)
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Annual appraisal 2026" className={inputCls} />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground/85">
        <input type="checkbox" checked={sendLetter} onChange={(e) => setSendLetter(e.target.checked)} />
        Send {kind === "promotion" ? "promotion" : "increment"} letter for e-signing
      </label>

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted/40">Cancel</button>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {saving && <TbLoader2 size={15} className="animate-spin" />}
          {scheduled ? "Schedule" : "Apply"} {kind === "promotion" ? "promotion" : "revision"}
        </button>
      </div>
    </div>
  );
}

export function RevisionHistory({ userId, refreshKey }: { userId: string; refreshKey: number }) {
  const [items, setItems] = useState<Revision[]>([]);

  const load = () => api(`/user/${userId}`).then((r) => r.json()).then((d) => setItems(Array.isArray(d) ? d : [])).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [userId, refreshKey]);

  const cancel = async (id: string) => {
    if (!confirm("Cancel this scheduled revision?")) return;
    const r = await api(`/${id}/cancel`, { method: "POST" });
    if (r.ok) { toast.success("Revision cancelled"); load(); } else toast.error("Couldn't cancel");
  };

  if (items.length === 0) return null;
  return (
    <div className="rounded-lg border border-border p-4 text-sm space-y-3">
      <p className="font-semibold text-foreground flex items-center gap-1.5"><TbTrendingUp size={16} /> Revision history</p>
      {items.map((r) => {
        const b = Number(r.before.annualCompensation) || gross(r.before) * 12;
        const a = Number(r.after.annualCompensation) || gross(r.after) * 12;
        const pct = b > 0 ? ((a - b) / b) * 100 : null;
        return (
          <div key={r.id} className={`rounded-lg bg-muted/40 p-3 space-y-1 ${r.status === "cancelled" ? "opacity-50" : ""}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-foreground">
                {r.kind === "promotion" ? `Promoted to ${r.after.roleTitle}` : "Salary revision"}
              </p>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                r.status === "applied" ? "bg-green-100 dark:bg-green-400/15 text-green-700 dark:text-green-300"
                : r.status === "scheduled" ? "bg-blue-100 dark:bg-blue-400/15 text-blue-700 dark:text-blue-300"
                : "bg-muted text-muted-foreground"}`}>
                {r.status === "scheduled" ? `from ${fmtDate(r.effectiveDate)}` : r.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {fmtDate(r.effectiveDate)} · {INR(b)} → {INR(a)}/yr{pct != null ? ` (${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%)` : ""}
              {r.kind === "promotion" && r.before.roleTitle ? ` · was ${r.before.roleTitle}` : ""}
            </p>
            {(r.reason || r.createdBy) && (
              <p className="text-xs text-muted-foreground">{[r.reason, r.createdBy && `by ${r.createdBy.fullName}`].filter(Boolean).join(" · ")}</p>
            )}
            {r.status === "scheduled" && (
              <button onClick={() => cancel(r.id)} className="text-xs text-muted-foreground hover:text-red-500">Cancel</button>
            )}
          </div>
        );
      })}
    </div>
  );
}
