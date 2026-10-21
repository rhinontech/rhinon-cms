"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { TbArrowLeft, TbPlus, TbPencil, TbStarFilled, TbCalendarEvent } from "react-icons/tb";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { hiringApi, jsonInit, fmtDateTime, type Candidate, type Opening } from "./shared";
import { OpeningDialog } from "./OpeningDialog";
import { AddCandidateDialog } from "./AddCandidateDialog";
import { CandidatePanel } from "./CandidatePanel";

import { NativeSelect } from "@/components/ui/native-select";
type Column = { key: string; title: string; stage: Candidate["stage"]; roundIndex?: number };

function avgRating(c: Candidate) {
  const rated = (c.interviews ?? []).filter((i) => i.rating);
  return rated.length ? rated.reduce((s, i) => s + Number(i.rating), 0) / rated.length : null;
}

function nextInterview(c: Candidate) {
  const now = Date.now();
  return (c.interviews ?? [])
    .filter((i) => i.status === "scheduled" && new Date(i.scheduledAt).getTime() >= now)
    .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))[0];
}

export function HiringBoard({ id }: { id: string }) {
  const roleSlug = usePathname().split("/")[1];
  const [opening, setOpening] = useState<Opening | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showClosed, setShowClosed] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const load = useCallback(() => {
    hiringApi(`/openings/${id}`).then(async (r) => {
      if (!r.ok) { setNotFound(true); return; }
      setOpening(await r.json());
    }).catch(() => {});
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const columns: Column[] = useMemo(() => !opening ? [] : [
    { key: "applied", title: "Applied", stage: "applied" },
    { key: "shortlisted", title: "Shortlisted", stage: "shortlisted" },
    ...opening.rounds.map((r, i) => ({ key: `round:${i}`, title: r.name, stage: "interview" as const, roundIndex: i })),
    { key: "offer", title: "Offer", stage: "offer" },
    { key: "hired", title: "Hired", stage: "hired" },
  ], [opening]);

  if (notFound) return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Opening not found.</div>;
  if (!opening) return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;

  const candidates = opening.candidates ?? [];
  const inColumn = (col: Column) =>
    candidates.filter((c) => c.stage === col.stage && (col.stage !== "interview" || c.roundIndex === col.roundIndex));
  const closedOut = candidates.filter((c) => c.stage === "rejected" || c.stage === "withdrawn");

  const drop = async (col: Column, candidateId: string) => {
    setDragOver(null);
    const c = candidates.find((x) => x.id === candidateId);
    if (!c || (c.stage === col.stage && c.roundIndex === (col.roundIndex ?? c.roundIndex))) return;
    if (col.stage === "hired") { toast.info("Open the candidate and use “Confirm & convert to employee”"); return; }
    if (c.stage === "hired") { toast.error("This candidate is already hired"); return; }
    // Optimistic move; reload either way
    setOpening({ ...opening, candidates: candidates.map((x) => x.id === c.id ? { ...x, stage: col.stage, roundIndex: col.roundIndex ?? x.roundIndex } : x) });
    const r = await hiringApi(`/candidates/${c.id}/move`, jsonInit("POST", { stage: col.stage, roundIndex: col.roundIndex }));
    if (!r.ok) toast.error((await r.json().catch(() => ({}))).message || "Couldn't move candidate");
    load();
  };

  const setStatus = async (status: Opening["status"]) => {
    const r = await hiringApi(`/openings/${opening.id}`, jsonInit("PUT", { ...opening, status }));
    if (r.ok) load(); else toast.error("Couldn't update status");
  };

  const card = (c: Candidate) => {
    const rating = avgRating(c);
    const next = nextInterview(c);
    return (
      <button key={c.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)} onClick={() => { setEditing(false); setAdding(false); setOpenId(c.id); }}
        className="w-full text-left rounded-lg bg-card border border-border p-3 hover:border-blue-400 transition-colors cursor-grab active:cursor-grabbing">
        <p className="text-sm font-medium text-foreground truncate">{c.fullName}</p>
        <p className="text-xs text-muted-foreground truncate">{c.source ?? c.email}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
          {rating != null && <span className="flex items-center gap-0.5 text-amber-600"><TbStarFilled size={11} /> {rating.toFixed(1)}</span>}
          {next && <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-300"><TbCalendarEvent size={11} /> {fmtDateTime(next.scheduledAt)}</span>}
        </div>
      </button>
    );
  };

  return (
    <div className="flex min-h-0 gap-2 w-full h-full overflow-hidden">
      <main className="flex min-h-0 flex-col glass-panel w-full h-full overflow-hidden rounded-r-xl max-sm:rounded-xl">
      <div className="sticky top-0 z-10 flex items-center gap-3 h-16 px-5 border-b border-border glass-header shrink-0">
        <SubNavToggle />
        <Link href={`/${roleSlug}/employees/hiring`} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Back"><TbArrowLeft size={18} /></Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold tracking-tight truncate">{opening.title}</h1>
          <p className="text-xs text-muted-foreground truncate">
            {[opening.department, opening.location, `${opening.positions} position${opening.positions === 1 ? "" : "s"}`].filter(Boolean).join(" · ")}
          </p>
        </div>
        <NativeSelect value={opening.status} onChange={(e) => setStatus(e.target.value as Opening["status"])} className="px-2 py-1.5 text-xs border border-border rounded-lg bg-card">
          <option value="open">Open</option>
          <option value="on_hold">On hold</option>
          <option value="closed">Closed</option>
        </NativeSelect>
        <button onClick={() => { setAdding(false); setOpenId(null); setEditing(true); }} className="p-2 text-muted-foreground hover:text-foreground border border-border rounded-lg" aria-label="Edit opening"><TbPencil size={15} /></button>
        <button onClick={() => { setEditing(false); setOpenId(null); setAdding(true); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90">
          <TbPlus size={14} /> <span className="hidden sm:inline">Add candidate</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-4">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {columns.map((col) => {
            const list = inColumn(col);
            return (
              <div key={col.key}
                onDragOver={(e) => { e.preventDefault(); setDragOver(col.key); }}
                onDragLeave={() => setDragOver((k) => (k === col.key ? null : k))}
                onDrop={(e) => { e.preventDefault(); drop(col, e.dataTransfer.getData("text/plain")); }}
                className={`w-60 shrink-0 rounded-xl p-2.5 space-y-2 transition-colors ${dragOver === col.key ? "bg-blue-100/60 dark:bg-blue-400/15" : "bg-muted/50"}`}>
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-semibold text-foreground/80 truncate">{col.title}</p>
                  <span className="text-xs text-muted-foreground">{list.length}</span>
                </div>
                <div className="space-y-2 min-h-16">{list.map(card)}</div>
              </div>
            );
          })}
        </div>

        <div>
          <button onClick={() => setShowClosed((v) => !v)} className="text-xs font-medium text-muted-foreground hover:text-foreground">
            {showClosed ? "Hide" : "Show"} rejected / withdrawn ({closedOut.length})
          </button>
          {showClosed && (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {closedOut.map((c) => (
                <button key={c.id} onClick={() => { setEditing(false); setAdding(false); setOpenId(c.id); }} className="text-left rounded-lg bg-card border border-border p-3 opacity-75 hover:opacity-100">
                  <p className="text-sm font-medium text-foreground truncate">{c.fullName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{c.stage}{c.rejectionReason ? ` · ${c.rejectionReason}` : ""}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      </main>

      {editing ? (
        <OpeningDialog key={`edit-${opening.id}`} opening={opening} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); load(); }} />
      ) : adding ? (
        <AddCandidateDialog openingId={opening.id} onClose={() => setAdding(false)} onAdded={() => { setAdding(false); load(); }} />
      ) : openId ? (
        <CandidatePanel key={openId} candidateId={openId} rounds={opening.rounds} onClose={() => setOpenId(null)} onChanged={load} />
      ) : null}
    </div>
  );
}
