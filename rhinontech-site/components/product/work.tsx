"use client";

import { useState } from "react";
import { AlertTriangle, Check, Flag, MessageSquare, Repeat, Tag, Timer } from "lucide-react";
import { Avatar, Pill } from "@/components/mockPrimitives";
import { AutoTabs, Cursor, Live, TypeText, useStepper } from "@/components/motion";

const EASE = "cubic-bezier(.4,.1,.2,1)";
const PANEL = "rounded-3xl border border-emerald-100 bg-white shadow-[0_40px_90px_-40px_rgb(16_150_130_/_0.45)]";

/* ───────────── Hero: a project timeline building itself ───────────── */

const GANTT: { name: string; start: number; end: number; progress: number; tone: string; who: number }[] = [
  { name: "Brief", start: 0, end: 1.5, progress: 100, tone: "#10c98f", who: 0 },
  { name: "Design", start: 1, end: 3.5, progress: 100, tone: "#2bbfd6", who: 1 },
  { name: "Build", start: 3, end: 6, progress: 55, tone: "#2f9bff", who: 2 },
  { name: "Review", start: 5.5, end: 7, progress: 0, tone: "#7c5cff", who: 3 },
  { name: "Launch", start: 7, end: 8, progress: 0, tone: "#ff8a4c", who: 4 },
];
const GANTT_TIMING: readonly number[] = [900, 650, 650, 650, 650, 650, 1500, 4000];

function Gantt({ live }: { live: boolean }) {
  const [step] = useStepper(8, GANTT_TIMING, live);
  const today = step >= 6 ? (4.3 / 8) * 100 : 0;
  return (
    <div className={`${PANEL} mx-auto w-full max-w-[1080px] overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-50 px-5 py-4">
        <span className="flex items-center gap-3"><b className="font-display text-[19px] font-semibold">Acme website</b><Pill color="#10c98f">On track</Pill></span>
        <span className="flex items-center gap-3 text-[12px] text-muted"><span className="flex -space-x-1.5">{[0, 1, 2, 3].map((i) => <Avatar key={i} name={["Ana Silva", "Yusuf Khan", "Dev Patel", "Meera Rao"][i]} i={i + 3} size={26} />)}</span>8 weeks</span>
      </div>
      <div className="grid grid-cols-[88px_1fr] sm:grid-cols-[130px_1fr]">
        <div />
        <div className="grid grid-cols-8 border-b border-emerald-50 py-2 text-center font-mono text-[10.5px] uppercase tracking-wider text-muted">{Array.from({ length: 8 }, (_, i) => <span key={i}>W{i + 1}</span>)}</div>
        <div>{GANTT.map((r) => <p key={r.name} className="flex h-14 items-center border-b border-emerald-50/70 px-5 text-[13.5px] font-semibold">{r.name}</p>)}</div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 grid grid-cols-8">{Array.from({ length: 8 }, (_, i) => <i key={i} className="border-l border-emerald-50" />)}</div>
          {GANTT.map((r, k) => {
            const shown = step >= k + 1;
            return (
              <div key={r.name} className="relative h-14 border-b border-emerald-50/70">
                <div className="absolute top-3 h-8 origin-left overflow-hidden rounded-lg" style={{ left: `${(r.start / 8) * 100}%`, width: `${((r.end - r.start) / 8) * 100}%`, background: `${r.tone}33`, border: `1.5px solid ${r.tone}`, transform: shown ? "scaleX(1)" : "scaleX(0)", opacity: shown ? 1 : 0, transition: `transform .6s ${EASE}, opacity .3s` }}>
                  <i className="block h-full" style={{ width: step >= 7 ? `${r.progress}%` : "0%", background: r.tone, opacity: 0.9, transition: "width 1.2s ease-out .2s" }} />
                </div>
                <span className="absolute top-[14px]" style={{ left: `calc(${(r.end / 8) * 100}% + 8px)`, opacity: shown ? 1 : 0, transition: "opacity .4s .4s" }}><Avatar name={["Ana Silva", "Yusuf Khan", "Dev Patel", "Meera Rao", "Sara Lin"][r.who]} i={r.who + 3} size={24} /></span>
              </div>
            );
          })}
          <div className="pointer-events-none absolute inset-y-0 w-[2px] bg-rose-400" style={{ left: `${today}%`, opacity: step >= 6 ? 1 : 0, transition: "left 1.3s cubic-bezier(.4,.1,.2,1), opacity .4s" }}><span className="absolute -top-0.5 left-1/2 -translate-x-1/2 rounded-b-md bg-rose-400 px-1.5 py-0.5 font-mono text-[9px] text-white">Today</span></div>
          {step >= 7 && <div className="pop-in glass-chip absolute left-[18%] top-[88px] z-10 flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-3 w-3" strokeWidth={3} /></span>Client approved Design</div>}
        </div>
      </div>
    </div>
  );
}

export function GanttHero() {
  return <Live className="max-sm:[zoom:0.62]">{(live) => <Gantt live={live} />}</Live>;
}

/* ───────────── Task anatomy: what hangs off one task ───────────── */

const PARTS: [label: string, body: string][] = [
  ["Subtasks", "Break the work into steps and tick them off."],
  ["Estimates and due dates", "Know how long it takes and when it is due."],
  ["Recurrence", "Repeat weekly or monthly work without re-creating it."],
  ["Blockers", "Flag what is in the way so it gets cleared."],
  ["Comments", "Talk about the task, on the task."],
  ["Tags and priority", "Filter and sort by what matters most."],
];

function Anatomy({ live }: { live: boolean }) {
  const [paused, setPaused] = useState(false);
  const [a, setA] = useStepper(6, 2200, live && !paused);
  const on = (k: number) => `rounded-xl transition-all duration-500 ${a === k ? "bg-emerald-50 ring-2 ring-emerald-400/70" : "ring-0"}`;
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <ul className="space-y-1.5" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
        {PARTS.map(([label, body], k) => (
          <li key={label}>
            <button type="button" onClick={() => setA(k)} className={`w-full rounded-2xl border px-5 py-3.5 text-left transition-all duration-300 ${a === k ? "border-emerald-300 bg-white shadow-[0_20px_40px_-24px_rgb(16_150_130_/_0.5)]" : "border-transparent hover:bg-white/60"}`}>
              <span className="flex items-center justify-between text-[16px] font-semibold">{label}<i className="h-2 w-2 rounded-full transition-colors" style={{ background: a === k ? "#10c98f" : "#d8ddea" }} /></span>
              <span className="grid transition-all duration-300" style={{ gridTemplateRows: a === k ? "1fr" : "0fr" }}><span className="overflow-hidden text-[14px] leading-6 text-ink-soft">{body}</span></span>
            </button>
          </li>
        ))}
      </ul>
      <div className={`${PANEL} mx-auto w-full max-w-[520px] p-5`}>
        <div className="flex items-start justify-between gap-3">
          <div><p className="font-display text-[22px] font-semibold leading-tight">Design landing page</p><p className="mt-1 text-[12.5px] text-muted">Acme website · in progress</p></div>
          <span className={`flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-600 ${on(5)}`}><Flag className="h-3.5 w-3.5" />Urgent</span>
        </div>
        <div className={`mt-4 flex flex-wrap items-center gap-3 p-2.5 ${on(1)}`}><span className="flex items-center gap-1.5 text-[12.5px] font-medium"><Timer className="h-4 w-4 text-emerald-600" />6 hours</span><span className="text-[12.5px] text-muted">Due Wed 12 Nov</span><span className="ml-auto flex -space-x-1.5"><Avatar name="Ana Silva" i={4} size={24} /><Avatar name="Dev Patel" i={2} size={24} /></span></div>
        <div className={`mt-3 p-2.5 ${on(0)}`}>
          <p className="mb-2 text-[11.5px] font-semibold text-muted">Subtasks · 2 of 4</p>
          {["Wireframe", "Hero section", "Pricing block", "Handover to build"].map((t, i) => <p key={t} className="flex items-center gap-2.5 py-1 text-[13px]"><span className={`flex h-4 w-4 items-center justify-center rounded border ${i < 2 ? "border-emerald-500 bg-emerald-500 text-white" : "border-line"}`}>{i < 2 && <Check className="h-3 w-3" strokeWidth={3} />}</span><span className={i < 2 ? "text-muted line-through" : ""}>{t}</span></p>)}
        </div>
        <div className={`mt-3 flex items-center gap-2 p-2.5 text-[12.5px] ${on(2)}`}><Repeat className="h-4 w-4 text-sky-500" />Repeats every Monday</div>
        <div className={`mt-3 flex items-center gap-2 p-2.5 text-[12.5px] ${on(3)}`}><AlertTriangle className="h-4 w-4 text-amber-500" />Blocked by “Collect brand assets”</div>
        <div className={`mt-3 flex items-center justify-between p-2.5 ${on(4)}`}><span className="flex items-center gap-1.5 text-[12.5px]"><MessageSquare className="h-4 w-4 text-violet" />4 comments</span><span className="text-[11.5px] text-muted">Yusuf: looks great</span></div>
        <div className={`mt-3 flex flex-wrap gap-2 p-2.5 ${on(5)}`}><Tag className="h-4 w-4 text-muted" />{["web", "client", "launch"].map((t) => <Pill key={t} color="#10c98f">#{t}</Pill>)}</div>
      </div>
    </div>
  );
}

export function AnatomySection() {
  return <Live>{(live) => <Anatomy live={live} />}</Live>;
}

/* ───────────── Views: the same six tasks in four layouts ───────────── */

type Task = { title: string; tag: string; col: number; day: number; who: number; color: string };
const TASKS: Task[] = [
  { title: "Write homepage brief", tag: "Brief", col: 0, day: 0, who: 0, color: "#10c98f" },
  { title: "Collect brand assets", tag: "Client", col: 0, day: 1, who: 1, color: "#f5a524" },
  { title: "Design landing page", tag: "Design", col: 1, day: 2, who: 0, color: "#2bbfd6" },
  { title: "Build contact form", tag: "Build", col: 1, day: 3, who: 1, color: "#2f9bff" },
  { title: "Set up analytics", tag: "Build", col: 1, day: 3, who: 2, color: "#7c5cff" },
  { title: "Kick-off call", tag: "Done", col: 2, day: 0, who: 2, color: "#8a93b2" },
];
const PEOPLE = ["Ana", "Yusuf", "Dev"];
const VIEW_LABELS: string[][] = [[], ["To do", "In progress", "Done"], ["Mon", "Tue", "Wed", "Thu", "Fri"], PEOPLE];
const ROW_H = 58;

function place(view: number, i: number): { left: string; top: number; width: string } {
  const t = TASKS[i];
  const before = (f: (x: Task) => number) => TASKS.slice(0, i).filter((x) => f(x) === f(t)).length;
  if (view === 0) return { left: "0%", top: i * ROW_H, width: "100%" };
  if (view === 1) return { left: `${t.col * 33.333}%`, top: before((x) => x.col) * ROW_H + 30, width: "calc(33.333% - 10px)" };
  if (view === 2) return { left: `${t.day * 20}%`, top: before((x) => x.day) * ROW_H + 30, width: "calc(20% - 8px)" };
  return { left: `${before((x) => x.who) * 33.333}%`, top: t.who * 112 + 24, width: "calc(33.333% - 10px)" };
}

function ViewStage({ view }: { view: number }) {
  return (
    <div className={`${PANEL} relative h-[390px] overflow-hidden p-5`}>
      <div className="relative h-full">
        {VIEW_LABELS.map((labels, v) => labels.map((l, k) => {
          const n = labels.length;
          const left = v === 3 ? "0%" : `${(k / n) * 100}%`;
          const top = v === 3 ? k * 112 : 0;
          return <span key={`${v}-${l}`} className="absolute font-mono text-[11px] uppercase tracking-wider text-muted transition-opacity duration-500" style={{ left, top, opacity: view === v ? 1 : 0 }}>{l}</span>;
        }))}
        {TASKS.map((t, i) => {
          const pos = place(view, i);
          return (
            <div key={t.title} className="absolute" style={{ ...pos, height: ROW_H - 8, transition: `all .75s ${EASE}` }}>
              <div className="flex h-full items-center gap-2.5 rounded-xl border border-emerald-100 bg-white px-3 shadow-[0_8px_20px_-12px_rgb(16_150_130_/_0.5)]" style={{ borderLeft: `3px solid ${t.color}` }}>
                <span className="min-w-0 flex-1"><b className="block truncate text-[12.5px] font-semibold">{t.title}</b><span className="text-[10.5px] text-muted">{t.tag}</span></span>
                <Avatar name={PEOPLE[t.who]} i={t.who + 3} size={22} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const VIEW_TABS = [
  { title: "List", body: "Every task in order, with the details." },
  { title: "Board", body: "Move work across stages as it happens." },
  { title: "Calendar", body: "See the week and what lands when." },
  { title: "Team", body: "Who has what, at a glance." },
];

export function ViewsSection() {
  return <AutoTabs items={VIEW_TABS} interval={4800} tone={["#10c98f", "#2bbfd6"]} visual={(i) => <ViewStage view={i} />} />;
}

/* ───────────── Portal: a client request lands on your board ───────────── */

const PORTAL_TIMING: readonly number[] = [1300, 2600, 1500, 1300, 3000];
const REQUEST = "Could the logo be a little bigger?";

function Portal({ live }: { live: boolean }) {
  const [step] = useStepper(5, PORTAL_TIMING, live);
  const landed = step >= 3;
  return (
    <div className="relative grid items-stretch gap-4 md:grid-cols-2">
      <div className={`${PANEL} p-4`}>
        <p className="mb-3 flex items-center justify-between text-[13px] font-semibold">Your team · Acme website<Pill color="#10c98f">Board</Pill></p>
        <div className="space-y-2">
          {[["Design landing page", "Ana Silva"], ["Build contact form", "Yusuf Khan"]].map(([t, who], i) => <div key={t} className="flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-[#fafefd] p-3 text-[12.5px] font-semibold"><Avatar name={who} i={i + 3} size={22} />{t}</div>)}
          {landed && <div key="req" className="pop-in flex items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-[12.5px] font-semibold ring-4 ring-amber-200/40"><Pill color="#f5a524">From client</Pill>Make the logo a bit bigger</div>}
        </div>
      </div>
      <div className={`${PANEL} relative p-4`}>
        <p className="mb-3 flex items-center justify-between text-[13px] font-semibold">Client portal<span className="text-[11px] font-medium text-muted">No login needed</span></p>
        <div className="flex items-center gap-4 rounded-xl bg-[#f3fbf8] p-3"><div className="relative h-14 w-14 shrink-0"><svg viewBox="0 0 36 36" className="-rotate-90"><circle cx="18" cy="18" r="15" fill="none" stroke="#d6efe8" strokeWidth="4" /><circle cx="18" cy="18" r="15" fill="none" stroke="#10c98f" strokeWidth="4" strokeLinecap="round" strokeDasharray="94" strokeDashoffset="26" /></svg><b className="absolute inset-0 flex items-center justify-center text-[12px]">72%</b></div><span className="text-[12.5px] leading-5 text-ink-soft"><b className="block text-[13.5px] text-ink">Your website is taking shape</b>Design done. Build in progress.</span></div>
        <div className="mt-3 rounded-xl border border-line p-3">
          <p className="text-[11.5px] font-semibold text-muted">Request a change</p>
          <p className="mt-1.5 min-h-[40px] text-[13.5px] leading-5"><TypeText text={REQUEST} run={step >= 1} speed={55} /></p>
          <span className={`mt-1 inline-block rounded-lg px-3.5 py-2 text-[12px] font-semibold text-white transition-transform duration-200 ${step === 2 ? "scale-95" : ""}`} style={{ background: step >= 2 ? "#10c98f" : "#2bbfd6" }}>{step >= 2 ? "Sent" : "Send request"}</span>
        </div>
        <Cursor x={step >= 2 ? 90 : 220} y={step >= 2 ? 262 : 300} down={step === 2} hidden={step < 1 || step > 2} />
      </div>
      <span className="pointer-events-none absolute top-[44%] hidden rounded-full bg-amber-400 px-3 py-1 text-[11px] font-semibold text-white shadow-lg md:block" style={{ left: step === 3 ? "40%" : "58%", opacity: step === 3 ? 1 : 0, transition: "left .9s cubic-bezier(.4,.1,.2,1), opacity .3s" }}>Change request</span>
    </div>
  );
}

export function PortalSection() {
  return <Live>{(live) => <Portal live={live} />}</Live>;
}

/* ───────────── Visibility: three rings ───────────── */

const NAMES = ["Ana Silva", "Yusuf Khan", "Dev Patel", "Meera Rao", "Sara Lin", "Anil Shah", "Ravi Menon", "Chloe Martin", "Priya Nair"];
const RINGS: { name: string; body: string; size: number; people: number }[] = [
  { name: "Workspace", body: "Everyone in the workspace can see the project. Good for company-wide work.", size: 100, people: 9 },
  { name: "Team", body: "Only the teams you choose. Good for work that belongs to one group.", size: 66, people: 5 },
  { name: "Private", body: "Only the people on the project. Good for anything sensitive.", size: 34, people: 3 },
];

function Rings({ live }: { live: boolean }) {
  const [a, setA] = useStepper(3, 3000, live);
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr]">
      <div className="relative mx-auto aspect-square w-full max-w-[420px]">
        {RINGS.map((r, k) => {
          const on = a === k;
          return (
            <div key={r.name} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all duration-700" style={{ width: `${r.size}%`, height: `${r.size}%`, borderColor: on ? "#10c98f" : "#d8ece6", background: on ? "radial-gradient(circle, rgb(16 201 143 / 0.16), rgb(43 191 214 / 0.06))" : "rgb(255 255 255 / 0.5)", boxShadow: on ? "0 0 60px -10px rgb(16 201 143 / 0.55)" : "none" }}>
              {Array.from({ length: r.people }, (_, j) => {
                const ang = (j / r.people) * Math.PI * 2 + k;
                return <span key={j} className="absolute transition-all duration-700" style={{ left: `${50 + Math.cos(ang) * 50}%`, top: `${50 + Math.sin(ang) * 50}%`, transform: `translate(-50%,-50%) scale(${on ? 1 : 0.7})`, opacity: on ? 1 : 0.35 }}><Avatar name={NAMES[(j + k * 3) % NAMES.length]} i={j + k} size={on ? 30 : 24} /></span>;
              })}
            </div>
          );
        })}
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted">Project</span>
      </div>
      <ul className="space-y-2.5">
        {RINGS.map((r, k) => (
          <li key={r.name}>
            <button type="button" onClick={() => setA(k)} className={`w-full rounded-2xl border p-5 text-left transition-all duration-300 ${a === k ? "border-emerald-300 bg-white shadow-[0_24px_50px_-28px_rgb(16_150_130_/_0.55)]" : "border-transparent hover:bg-white/60"}`}>
              <span className="flex items-center justify-between font-display text-[22px] font-semibold">{r.name}<Pill color="#10c98f">{r.people} people</Pill></span>
              <span className="mt-1.5 block text-[15px] leading-6 text-ink-soft">{r.body}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RingsSection() {
  return <Live>{(live) => <Rings live={live} />}</Live>;
}
