"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TbPlus, TbTrash, TbArrowUp, TbArrowDown, TbLoader2 } from "react-icons/tb";
import { hiringApi, jsonInit, inputCls, labelCls, type Opening } from "./shared";
import { HiringAside } from "./HiringAside";

const DEFAULT_ROUNDS = ["Screening call", "Technical round", "Founder round", "HR discussion"];

export function OpeningDialog({ opening, onClose, onSaved }: { opening?: Opening; onClose: () => void; onSaved: (o: Opening) => void }) {
  const [title, setTitle] = useState(opening?.title ?? "");
  const [department, setDepartment] = useState(opening?.department ?? "");
  const [location, setLocation] = useState(opening?.location ?? "");
  const [employmentType, setEmploymentType] = useState(opening?.employmentType ?? "Full-Time");
  const [positions, setPositions] = useState(String(opening?.positions ?? 1));
  const [salaryMin, setSalaryMin] = useState(opening?.salaryMin != null ? String(Number(opening.salaryMin)) : "");
  const [salaryMax, setSalaryMax] = useState(opening?.salaryMax != null ? String(Number(opening.salaryMax)) : "");
  const [description, setDescription] = useState(opening?.description ?? "");
  const [hiringManagerId, setHiringManagerId] = useState(opening?.hiringManagerId ?? "");
  const [rounds, setRounds] = useState<string[]>(opening?.rounds.map((r) => r.name) ?? DEFAULT_ROUNDS);
  const [people, setPeople] = useState<{ id: string; fullName: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    hiringApi("/interviewers").then((r) => r.json()).then((d) => setPeople(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const moveRound = (i: number, dir: -1 | 1) =>
    setRounds((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const save = async () => {
    const clean = rounds.map((r) => r.trim()).filter(Boolean);
    if (!title.trim()) { toast.error("Add a job title"); return; }
    if (clean.length === 0) { toast.error("Add at least one interview round"); return; }
    setSaving(true);
    const body = {
      title, department, location, employmentType, positions, salaryMin, salaryMax, description,
      hiringManagerId: hiringManagerId || null,
      rounds: clean.map((name) => ({ name })),
    };
    const r = await hiringApi(opening ? `/openings/${opening.id}` : "/openings", jsonInit(opening ? "PUT" : "POST", body));
    const data = await r.json().catch(() => ({}));
    setSaving(false);
    if (!r.ok) { toast.error(data.message || "Couldn't save opening"); return; }
    toast.success(opening ? "Opening updated" : "Opening created");
    onSaved(data);
  };

  return (
    <HiringAside title={opening ? "Edit opening" : "New opening"} onClose={onClose}>
      <div className="space-y-4">

        <label className={labelCls}>
          Job title *
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Marketing Manager" className={inputCls} />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className={labelCls}>
            Department
            <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Growth" className={inputCls} />
          </label>
          <label className={labelCls}>
            Location
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Hyderabad / Remote" className={inputCls} />
          </label>
          <label className={labelCls}>
            Employment type
            <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className={inputCls}>
              {["Full-Time", "Part-Time", "Contract", "Intern"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className={labelCls}>
            Positions to fill
            <input type="number" min={1} value={positions} onChange={(e) => setPositions(e.target.value)} className={inputCls} />
          </label>
          <label className={labelCls}>
            Salary from (₹ / year)
            <input type="number" min={0} value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} placeholder="Optional" className={inputCls} />
          </label>
          <label className={labelCls}>
            Salary to (₹ / year)
            <input type="number" min={0} value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} placeholder="Optional" className={inputCls} />
          </label>
        </div>

        <label className={labelCls}>
          Hiring manager
          <select value={hiringManagerId} onChange={(e) => setHiringManagerId(e.target.value)} className={inputCls}>
            <option value="">None</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
          </select>
        </label>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground/85">Interview rounds *</p>
            <button onClick={() => setRounds((p) => [...p, ""])} className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-300 hover:underline">
              <TbPlus size={14} /> Add round
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Candidates go Applied → Shortlisted → these rounds in order → Offer → Hired.</p>
          {rounds.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 text-xs text-muted-foreground text-right">{i + 1}.</span>
              <input value={r} onChange={(e) => setRounds((p) => p.map((x, j) => (j === i ? e.target.value : x)))} className={inputCls} placeholder="Round name" />
              <button onClick={() => moveRound(i, -1)} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Move up"><TbArrowUp size={15} /></button>
              <button onClick={() => moveRound(i, 1)} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Move down"><TbArrowDown size={15} /></button>
              <button onClick={() => setRounds((p) => p.filter((_, j) => j !== i))} className="p-1 text-muted-foreground hover:text-red-500" aria-label="Remove"><TbTrash size={15} /></button>
            </div>
          ))}
        </div>

        <label className={labelCls}>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Responsibilities, requirements…" className={inputCls} />
        </label>

        <button onClick={save} disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {saving && <TbLoader2 size={16} className="animate-spin" />} {opening ? "Save changes" : "Create opening"}
        </button>
      </div>
    </HiringAside>
  );
}
