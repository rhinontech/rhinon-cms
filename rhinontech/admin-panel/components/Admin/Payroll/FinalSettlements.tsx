"use client";

import { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { TbAlertCircle, TbChevronRight, TbLoader2, TbX } from "react-icons/tb";

interface SettlementItem {
  id: string;
  fullName: string;
  companyEmail: string;
  department: string;
  status: "active" | "inactive";
  exitDate: string;
  exitReason?: string | null;
  basicSalary?: number | null;
  role?: { name: string; slug: string };
  settlement: {
    payslipId: string;
    type: string;
    status: string;
    netPay: number;
    month: number;
    year: number;
  } | null;
}

interface Preview {
  month: number;
  year: number;
  daysInMonth: number;
  daysWorked: number;
  basicSalary: number;
  hra: number;
  ta: number;
  medicalAllowance: number;
  otherAllowances: number;
  leaveEncashment: number;
  noticeRecovery: number;
  pfEmployee: number;
  professionalTax: number;
  tds: number;
  perDayBasic: number;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const INR = (v: number) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

const AMOUNT_FIELDS = [
  { key: "basicSalary",      label: "Basic (pro-rated)",  group: "earning" },
  { key: "hra",              label: "HRA",                group: "earning" },
  { key: "ta",               label: "Transport",          group: "earning" },
  { key: "medicalAllowance", label: "Medical",            group: "earning" },
  { key: "otherAllowances",  label: "Other allowances",   group: "earning" },
  { key: "leaveEncashment",  label: "Leave encashment",   group: "earning" },
  { key: "pfEmployee",       label: "PF (employee)",      group: "deduction" },
  { key: "professionalTax",  label: "Professional tax",   group: "deduction" },
  { key: "tds",              label: "TDS",                group: "deduction" },
  { key: "noticeRecovery",   label: "Notice recovery",    group: "deduction" },
] as const;

type AmountKey = (typeof AMOUNT_FIELDS)[number]["key"];
type AmountForm = Record<AmountKey, string>;

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function FinalSettlements() {
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const token = Cookies.get("authToken");

  const [items, setItems] = useState<SettlementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SettlementItem | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [form, setForm] = useState<AmountForm | null>(null);
  const [encashDays, setEncashDays] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payroll/admin/settlements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openEditor = async (item: SettlementItem) => {
    setSelected(item);
    setPreview(null);
    setForm(null);
    setEncashDays("");
    setError("");
    setPreviewLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payroll/admin/settlements/${item.id}/preview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Could not compute the settlement preview.");
        return;
      }
      setPreview(data);
      const next = {} as AmountForm;
      for (const f of AMOUNT_FIELDS) next[f.key] = String(data[f.key] ?? 0);
      setForm(next);
    } catch {
      setError("Could not compute the settlement preview.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const closeEditor = () => {
    setSelected(null);
    setPreview(null);
    setForm(null);
    setError("");
  };

  const setAmount = (key: AmountKey, value: string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const applyEncashDays = (days: string) => {
    setEncashDays(days);
    if (preview && days !== "") {
      const amount = Math.round(Number(days) * preview.perDayBasic * 100) / 100;
      if (Number.isFinite(amount) && amount >= 0) setAmount("leaveEncashment", String(amount));
    }
  };

  const totals = useMemo(() => {
    if (!form) return { gross: 0, deductions: 0, net: 0 };
    const n = (k: AmountKey) => Number(form[k] || 0);
    const gross = n("basicSalary") + n("hra") + n("ta") + n("medicalAllowance") + n("otherAllowances") + n("leaveEncashment");
    const deductions = n("pfEmployee") + n("professionalTax") + n("tds") + n("noticeRecovery");
    return { gross, deductions, net: gross - deductions };
  }, [form]);

  const create = async (markPaid: boolean) => {
    if (!selected || !form) return;
    const confirmText = markPaid
      ? `Create the final settlement for ${selected.fullName} and mark it PAID (${INR(totals.net)} net)? A salary-credited email will be sent.`
      : `Create a DRAFT final settlement for ${selected.fullName} (${INR(totals.net)} net)?`;
    if (!confirm(confirmText)) return;

    setSaving(true);
    setError("");
    try {
      const payload: Record<string, unknown> = { markPaid };
      for (const f of AMOUNT_FIELDS) payload[f.key] = Number(form[f.key] || 0);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payroll/admin/settlements/${selected.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Could not create the settlement.");
        return;
      }
      closeEditor();
      await load();
    } catch {
      setError("Could not create the settlement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 rounded-r-xl overflow-hidden">
      <div className="sticky top-0 z-10 flex items-center gap-4 h-16 px-5 border-b bg-stone-50">
        <SubNavToggle />
        <div>
          <h1 className="text-base font-semibold tracking-tight">Final Settlements</h1>
          <p className="text-xs text-gray-500">Pro-rated exit-month pay for offboarded members</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <p className="font-semibold text-gray-900">Members with an exit on record</p>
              <span className="text-sm text-gray-500">{items.length}</span>
            </div>

            {loading ? (
              <div className="p-6 text-sm text-gray-400">Loading…</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No exits recorded yet. Offboard a member from the Team panel first.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Employee</th>
                    <th className="px-5 py-3 text-left">Last working day</th>
                    <th className="px-5 py-3 text-left">Settlement</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{item.fullName}</p>
                        <p className="text-xs text-gray-400">
                          {item.role?.name} · {item.department} · {item.status === "inactive" ? "relieved" : "exiting"}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {formatDate(item.exitDate)}
                        <p className="text-xs text-gray-400">{item.exitReason || "—"}</p>
                      </td>
                      <td className="px-5 py-3">
                        {item.settlement ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.settlement.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {item.settlement.status === "paid" ? "settled" : "draft"} · {INR(item.settlement.netPay)}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">pending</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {item.settlement ? (
                          <Link
                            href={`/${roleSlug}/payroll/payslips/${item.settlement.payslipId}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                          >
                            View payslip <TbChevronRight size={12} />
                          </Link>
                        ) : (
                          <button
                            onClick={() => openEditor(item)}
                            className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-800"
                          >
                            Run settlement
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {selected && (
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">Final settlement — {selected.fullName}</p>
                  {preview && (
                    <p className="text-xs text-gray-500">
                      {MONTHS[preview.month - 1]} {preview.year} · {preview.daysWorked} of {preview.daysInMonth} days worked
                      (last working day {formatDate(selected.exitDate)})
                    </p>
                  )}
                </div>
                <button onClick={closeEditor} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                  <TbX size={16} />
                </button>
              </div>

              {previewLoading ? (
                <div className="p-6 text-sm text-gray-400">Computing pro-rated amounts…</div>
              ) : form && preview ? (
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-2">
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Earnings</p>
                      {AMOUNT_FIELDS.filter((f) => f.group === "earning").map((f) => (
                        <label key={f.key} className="flex items-center justify-between gap-3 text-sm text-gray-700">
                          {f.label}
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form[f.key]}
                            onChange={(e) => setAmount(f.key, e.target.value)}
                            className="w-32 rounded-lg border border-gray-200 px-2.5 py-1.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </label>
                      ))}
                      <div className="flex items-center justify-end gap-2 text-xs text-gray-400">
                        <span>Encash</span>
                        <input
                          type="number"
                          min="0"
                          value={encashDays}
                          onChange={(e) => applyEncashDays(e.target.value)}
                          placeholder="0"
                          className="w-14 rounded-lg border border-gray-200 px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span>days × {INR(preview.perDayBasic)}/day (basic ÷ 30)</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Deductions</p>
                      {AMOUNT_FIELDS.filter((f) => f.group === "deduction").map((f) => (
                        <label key={f.key} className="flex items-center justify-between gap-3 text-sm text-gray-700">
                          {f.label}
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form[f.key]}
                            onChange={(e) => setAmount(f.key, e.target.value)}
                            className="w-32 rounded-lg border border-gray-200 px-2.5 py-1.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm">
                    <span className="text-gray-600">Gross <span className="font-semibold text-green-700">{INR(totals.gross)}</span></span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-600">Deductions <span className="font-semibold text-red-600">−{INR(totals.deductions)}</span></span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-900 font-semibold">Net payable {INR(totals.net)}</span>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700">
                      <TbAlertCircle size={16} /> {error}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 border-t pt-4">
                    <button
                      onClick={() => create(false)}
                      disabled={saving}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Create draft
                    </button>
                    <button
                      onClick={() => create(true)}
                      disabled={saving}
                      className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
                    >
                      {saving && <TbLoader2 size={15} className="animate-spin" />}
                      Create &amp; mark paid
                    </button>
                  </div>
                </div>
              ) : error ? (
                <div className="p-5">
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700">
                    <TbAlertCircle size={16} /> {error}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
