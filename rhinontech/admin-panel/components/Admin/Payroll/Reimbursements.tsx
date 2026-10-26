"use client";

import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { TbPlus, TbX, TbPaperclip, TbLoader2, TbReceipt } from "react-icons/tb";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { usePermissions } from "@/context/PermissionsContext";

import { NativeSelect } from "@/components/ui/native-select";
import { confirmDialog } from "@/components/ui/dialogs";
type ClaimStatus = "pending" | "approved" | "rejected" | "paid";

interface Claim {
  id: string;
  category: string;
  description: string;
  expenseMonth: number;
  expenseYear: number;
  amount: number;
  receiptKey: string | null;
  receiptName: string | null;
  status: ClaimStatus;
  payout: "payslip" | "direct" | null;
  payslipId: string | null;
  reviewNote: string | null;
  createdAt: string;
  employee?: { id: string; fullName: string; department: string };
  reviewer?: { fullName: string } | null;
}

const CATEGORIES = ["Internet", "Phone", "Travel", "Equipment", "Other"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const INR = (n: number) => `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const api = (path: string, init: RequestInit = {}) =>
  fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${Cookies.get("authToken")}`, ...(init.headers || {}) },
  });

const STATUS_STYLE: Record<ClaimStatus, string> = {
  pending:  "bg-yellow-100 dark:bg-yellow-400/15 text-yellow-700 dark:text-yellow-300",
  approved: "bg-blue-100 dark:bg-blue-400/15 text-blue-700 dark:text-blue-300",
  paid:     "bg-green-100 dark:bg-green-400/15 text-green-700 dark:text-green-300",
  rejected: "bg-red-100 dark:bg-red-400/15 text-red-700 dark:text-red-300",
};

function statusText(c: Claim) {
  if (c.status === "approved") return c.payslipId ? "on next payslip" : "approved · awaiting payslip";
  if (c.status === "paid") return c.payout === "direct" ? "paid (outside payroll)" : "paid with salary";
  return c.status;
}

async function openReceipt(id: string) {
  const r = await api(`/reimbursements/${id}/receipt`);
  const data = await r.json().catch(() => ({}));
  if (r.ok && data.url) window.open(data.url, "_blank", "noopener");
  else toast.error(data.message || "Couldn't open receipt");
}

function NewClaimDialog({ isAdmin, onClose, onCreated }: { isAdmin: boolean; onClose: () => void; onCreated: () => void }) {
  const now = new Date();
  const [employees, setEmployees] = useState<{ id: string; fullName: string }[]>([]);
  const [userId, setUserId] = useState("");
  const [category, setCategory] = useState("Internet");
  const [description, setDescription] = useState("");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    api("/payroll/admin/employees").then((r) => r.json()).then((d) => setEmployees(Array.isArray(d) ? d : [])).catch(() => {});
  }, [isAdmin]);

  const submit = async () => {
    if (isAdmin && !userId) { toast.error("Pick an employee"); return; }
    if (!file) { toast.error("Attach the invoice or bill"); return; }
    const fd = new FormData();
    if (isAdmin) fd.append("userId", userId);
    fd.append("category", category);
    fd.append("description", description);
    fd.append("expenseMonth", String(month));
    fd.append("expenseYear", String(year));
    fd.append("amount", amount);
    if (file) fd.append("receipt", file);
    setSaving(true);
    const r = await api(isAdmin ? "/reimbursements/admin" : "/reimbursements/me", { method: "POST", body: fd });
    const data = await r.json().catch(() => ({}));
    setSaving(false);
    if (!r.ok) { toast.error(data.message || "Couldn't submit claim"); return; }
    toast.success(isAdmin ? "Claim added — review it in Pending" : "Claim submitted for review");
    onCreated();
  };

  const input = "w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-[3px] focus:ring-ring/20 focus:border-ring/60";
  const years = [now.getFullYear(), now.getFullYear() - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-card rounded-2xl border border-border p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="font-semibold text-foreground">New reimbursement claim</p>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><TbX size={18} /></button>
        </div>

        {isAdmin && (
          <label className="flex flex-col gap-1 text-sm font-medium text-foreground/85">
            Employee
            <NativeSelect value={userId} onChange={(e) => setUserId(e.target.value)} className={input}>
              <option value="">Select employee</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
            </NativeSelect>
          </label>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-foreground/85">
            Category
            <NativeSelect value={category} onChange={(e) => setCategory(e.target.value)} className={input}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </NativeSelect>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-foreground/85">
            Amount
            <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className={input} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-foreground/85">
            Expense month
            <NativeSelect value={month} onChange={(e) => setMonth(Number(e.target.value))} className={input}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </NativeSelect>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-foreground/85">
            Year
            <NativeSelect value={year} onChange={(e) => setYear(Number(e.target.value))} className={input}>
              {years.map((y) => <option key={y}>{y}</option>)}
            </NativeSelect>
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-foreground/85">
          Description
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Airtel broadband bill" className={input} />
        </label>

        <label className="flex items-center gap-2 text-sm text-foreground/85 cursor-pointer">
          <TbPaperclip size={16} />
          <span className="truncate">{file ? file.name : "Attach invoice / bill (PDF or image) *"}</span>
          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>

        <button
          onClick={submit}
          disabled={saving || !file}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {saving && <TbLoader2 size={16} className="animate-spin" />} Submit claim
        </button>
      </div>
    </div>
  );
}

function ReviewDialog({ claim, onClose, onDone }: { claim: Claim; onClose: () => void; onDone: () => void }) {
  const [payout, setPayout] = useState<"payslip" | "direct">("payslip");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const act = async (action: "approve" | "reject") => {
    setBusy(true);
    const r = await api(`/reimbursements/admin/${claim.id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payout, note }),
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { toast.error(data.message || "Action failed"); return; }
    toast.success(data.message);
    onDone();
  };

  const option = (value: "payslip" | "direct", title: string, hint: string) => (
    <label className={`flex gap-3 rounded-xl border px-4 py-3 cursor-pointer ${payout === value ? "border-blue-500 bg-blue-50 dark:bg-blue-400/10" : "border-border"}`}>
      <input type="radio" checked={payout === value} onChange={() => setPayout(value)} className="mt-1" />
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
      </div>
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-card rounded-2xl border border-border p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-foreground">{claim.employee?.fullName} · {INR(claim.amount)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {claim.category} · {MONTHS[claim.expenseMonth - 1]} {claim.expenseYear} · {claim.description}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><TbX size={18} /></button>
        </div>

        {claim.status === "pending" && (
          <div className="space-y-2">
            {option("payslip", "Add to next payslip", "Paid with salary and shown on the payslip as a reimbursement.")}
            {option("direct", "Already paid / pay outside payroll", "For past months you've already paid. Counted in expenses, not shown on any payslip.")}
          </div>
        )}

        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)"
          className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-[3px] focus:ring-ring/20 focus:border-ring/60" />

        <div className="flex gap-2">
          <button onClick={() => act("reject")} disabled={busy}
            className="flex-1 py-2.5 rounded-xl border border-red-300 dark:border-red-400/30 text-red-600 dark:text-red-300 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-400/10 disabled:opacity-50">
            Reject
          </button>
          {claim.status === "pending" && (
            <button onClick={() => act("approve")} disabled={busy}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              Approve
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Reimbursements() {
  const { has } = usePermissions();
  const isAdmin = has("payroll:write");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "paid" | "rejected" | "all">("pending");
  const [showNew, setShowNew] = useState(false);
  const [reviewing, setReviewing] = useState<Claim | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api(isAdmin ? `/reimbursements/admin?status=${filter}` : "/reimbursements/me")
      .then((r) => r.json())
      .then((d) => setClaims(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAdmin, filter]);

  useEffect(() => { load(); }, [load]);

  const withdraw = async (c: Claim) => {
    if (!(await confirmDialog("Withdraw this claim?"))) return;
    const r = await api(`/reimbursements/me/${c.id}`, { method: "DELETE" });
    if (r.ok) { toast.success("Claim withdrawn"); load(); } else toast.error("Couldn't withdraw claim");
  };

  const total = claims.reduce((s, c) => s + Number(c.amount), 0);

  return (
    <div className="flex flex-col h-full glass-panel rounded-r-xl overflow-hidden">
      <div className="sticky top-0 z-10 flex items-center gap-4 h-16 px-5 border-b border-border glass-header shrink-0">
        <SubNavToggle />
        <div className="flex-1">
          <h1 className="text-base font-semibold tracking-tight">Reimbursements</h1>
          <p className="text-xs text-muted-foreground">{isAdmin ? "Review bills employees claim back" : "Claim back bills you paid for work"}</p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90">
          <TbPlus size={14} /> New claim
        </button>
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-4">
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            {(["pending", "approved", "paid", "rejected", "all"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize border ${filter === f ? "bg-foreground text-background border-foreground" : "border-border text-foreground/75 hover:bg-muted/40"}`}>
                {f}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : claims.length === 0 ? (
          <div className="glass-card-solid rounded-xl p-12 text-center text-muted-foreground text-sm">
            {isAdmin ? "No claims here." : "No claims yet. Use “New claim” to submit a bill."}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {claims.map((c) => (
                <div key={c.id} className="glass-card-solid rounded-xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="p-2 bg-blue-50 dark:bg-blue-400/10 rounded-lg text-blue-600 dark:text-blue-300"><TbReceipt size={20} /></div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {isAdmin && c.employee ? `${c.employee.fullName} · ` : ""}{c.category} · {MONTHS[c.expenseMonth - 1]} {c.expenseYear}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {c.description}{c.reviewNote ? ` · Note: ${c.reviewNote}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground">{INR(c.amount)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[c.status]}`}>{statusText(c)}</span>
                    {c.receiptKey && (
                      <button onClick={() => openReceipt(c.id)} className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-300 hover:underline">
                        <TbPaperclip size={13} /> Bill
                      </button>
                    )}
                    {isAdmin && (c.status === "pending" || c.status === "approved") && (
                      <button onClick={() => setReviewing(c)}
                        className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted/40">
                        {c.status === "pending" ? "Review" : "Reject"}
                      </button>
                    )}
                    {!isAdmin && c.status === "pending" && (
                      <button onClick={() => withdraw(c)} className="text-xs text-muted-foreground hover:text-red-500">Withdraw</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-right">{claims.length} claim{claims.length === 1 ? "" : "s"} · {INR(total)}</p>
          </>
        )}
      </div>

      {showNew && <NewClaimDialog isAdmin={isAdmin} onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); setFilter("pending"); load(); }} />}
      {reviewing && <ReviewDialog claim={reviewing} onClose={() => setReviewing(null)} onDone={() => { setReviewing(null); load(); }} />}
    </div>
  );
}
