"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TbPaperclip, TbLoader2 } from "react-icons/tb";
import { hiringApi, inputCls, labelCls } from "./shared";
import { HiringAside } from "./HiringAside";

import { NativeSelect } from "@/components/ui/native-select";
const SOURCES = ["LinkedIn", "Referral", "Naukri", "Website", "Instagram", "Other"];

export function AddCandidateDialog({ openingId, onClose, onAdded }: { openingId: string; onClose: () => void; onAdded: () => void }) {
  const [f, setF] = useState({ fullName: "", email: "", phone: "", source: "LinkedIn", linkedinUrl: "", currentCtc: "", expectedCtc: "", noticePeriod: "", notes: "" });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!f.fullName.trim() || !f.email.trim()) { toast.error("Name and email are required"); return; }
    if (!file) { toast.error("Attach the resume"); return; }
    const fd = new FormData();
    Object.entries(f).forEach(([k, v]) => fd.append(k, v));
    fd.append("resume", file);
    setSaving(true);
    const r = await hiringApi(`/openings/${openingId}/candidates`, { method: "POST", body: fd });
    const data = await r.json().catch(() => ({}));
    setSaving(false);
    if (!r.ok) { toast.error(data.message || "Couldn't add candidate"); return; }
    toast.success("Candidate added");
    onAdded();
  };

  return (
    <HiringAside title={"Add candidate"} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className={labelCls}>Full name *<input value={f.fullName} onChange={set("fullName")} className={inputCls} /></label>
          <label className={labelCls}>Email *<input type="email" value={f.email} onChange={set("email")} className={inputCls} /></label>
          <label className={labelCls}>Phone<input value={f.phone} onChange={set("phone")} className={inputCls} /></label>
          <label className={labelCls}>
            Source
            <NativeSelect value={f.source} onChange={set("source")} className={inputCls}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</NativeSelect>
          </label>
          <label className={labelCls}>Current CTC (₹/yr)<input type="number" min={0} value={f.currentCtc} onChange={set("currentCtc")} className={inputCls} /></label>
          <label className={labelCls}>Expected CTC (₹/yr)<input type="number" min={0} value={f.expectedCtc} onChange={set("expectedCtc")} className={inputCls} /></label>
          <label className={labelCls}>Notice period<input value={f.noticePeriod} onChange={set("noticePeriod")} placeholder="e.g. 30 days" className={inputCls} /></label>
          <label className={labelCls}>LinkedIn URL<input value={f.linkedinUrl} onChange={set("linkedinUrl")} className={inputCls} /></label>
        </div>
        <label className={labelCls}>Notes<textarea value={f.notes} onChange={set("notes")} rows={3} className={inputCls} /></label>
        <label className="flex items-center gap-2 text-sm text-foreground/85 cursor-pointer">
          <TbPaperclip size={16} />
          <span className="truncate">{file ? file.name : "Attach resume (PDF / DOC) *"}</span>
          <input type="file" accept=".pdf,.doc,.docx,application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <button onClick={submit} disabled={saving || !file}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {saving && <TbLoader2 size={16} className="animate-spin" />} Add candidate
        </button>
      </div>
    </HiringAside>
  );
}
