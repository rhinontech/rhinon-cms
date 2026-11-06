"use client";

import { useEffect, useState } from "react";
import { Check, ChevronRight, FileText, FolderKanban, Inbox, MessagesSquare, Plus, Target } from "lucide-react";
import { Avatar } from "@/components/ProductMocks";
import { Cursor, Live, TypeText, useStepper } from "@/components/motion";

const PAPER = "rounded-2xl border border-[#e9e1d1] bg-white shadow-[0_40px_90px_-40px_rgb(60_50_20_/_0.35)]";
const HEAD = "font-display font-medium";
const EASE = "cubic-bezier(.4,.1,.2,1)";

/* ───────────── Hero: a page being written ───────────── */

const TITLE = "Client onboarding";
const INTRO = "A short checklist we run through for every new client, so nobody starts from a blank page.";
const MENU: [string, string][] = [["Heading", "H"], ["Bulleted list", "•"], ["Checklist", "☑"], ["Divider", "—"]];
const CHECKS = ["Send the welcome email", "Create the project", "Share the client portal link"];
const DOC_TIMING: readonly number[] = [1600, 3300, 1200, 1200, 4200, 2800];

function Doc({ live }: { live: boolean }) {
  const [step] = useStepper(6, DOC_TIMING, live);
  const [cycle, setCycle] = useState(0);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (step === 0) setCycle((c) => c + 1);
  }, [step]);
  useEffect(() => {
    if (step < 4) return setTick(0);
    if (step >= 5) return setTick(3);
    const t = [1000, 1900, 2800].map((d, i) => setTimeout(() => setTick(i + 1), d));
    return () => t.forEach(clearTimeout);
  }, [step]);
  const menu = step === 2 || step === 3;
  return (
    <div className={`${PAPER} grid overflow-hidden sm:grid-cols-[170px_1fr]`}>
      <aside className="hidden border-r border-[#efe8d9] bg-[#fcfaf5] p-3 sm:block">
        <p className="mb-2 px-2 font-mono text-[10px] uppercase tracking-wider text-[#a59b85]">Pages</p>
        {[["Handbook", 0], ["Onboarding", 1], ["Policies", 1], ["Project briefs", 0]].map(([t, l]) => <p key={t as string} className="rounded-lg px-2 py-1.5 text-[12.5px] text-[#6d654f]" style={{ marginLeft: (l as number) * 12 }}>{l ? "↳ " : ""}{t}</p>)}
        <p className="mt-1 rounded-lg bg-indigo-50 px-2 py-1.5 text-[12.5px] font-semibold text-indigo-700" style={{ marginLeft: 12 }}>↳ {step >= 1 ? TITLE : "Untitled"}</p>
      </aside>
      <div className="relative min-h-[430px] p-6 sm:p-8">
        <p className={`${HEAD} min-h-[44px] text-[32px] leading-[1.1] text-[#1d1a12]`}><TypeText key={cycle} text={TITLE} run speed={60} /></p>
        <p className="mt-4 min-h-[72px] text-[15px] leading-7 text-[#5d5640]"><TypeText key={`i${cycle}`} text={INTRO} run={step >= 1} speed={26} /></p>
        {menu && (
          <div className="pop-in relative mt-2 w-[220px] rounded-xl border border-[#e4dbc8] bg-white p-1.5 shadow-[0_24px_50px_-20px_rgb(60_50_20_/_0.45)]">
            <p className="px-2 pb-1 pt-0.5 font-mono text-[10px] uppercase tracking-wider text-[#a59b85]">/ Add a block</p>
            <span aria-hidden className="absolute inset-x-1.5 h-[34px] rounded-lg bg-indigo-50 transition-all duration-500" style={{ top: 28 + (step === 2 ? 0 : 2) * 34 }} />
            {MENU.map(([t, g]) => <p key={t} className="relative flex h-[34px] items-center gap-2.5 px-2 text-[13px] text-[#3c3626]"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#f5f0e4] text-[12px] font-bold">{g}</span>{t}</p>)}
          </div>
        )}
        {step >= 4 && (
          <ul className="mt-3 space-y-2.5">
            {CHECKS.map((c, i) => (
              <li key={c} className="slide-in flex items-center gap-3 text-[15px] text-[#2a2618]" style={{ "--d": `${i * 220}ms` } as React.CSSProperties}>
                <span className={`flex h-[22px] w-[22px] items-center justify-center rounded-md border-2 transition-all duration-300 ${tick > i ? "border-indigo-500 bg-indigo-500 text-white" : "border-[#d4cab4]"}`}>{tick > i && <Check className="h-3.5 w-3.5" strokeWidth={3.5} />}</span>
                <span className={`transition-colors duration-300 ${tick > i ? "text-[#a59b85] line-through" : ""}`}>{c}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function DocHero() {
  return <Live className="max-sm:[zoom:0.85]">{(live) => <Doc live={live} />}</Live>;
}

/* ───────────── Tree: a page is created, named and nested ───────────── */

const TREE_TIMING: readonly number[] = [1500, 1300, 1100, 2200, 3200];
const NAME = "Leave policy";

function Tree({ live }: { live: boolean }) {
  const [step] = useStepper(5, TREE_TIMING, live);
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    if (step === 0) setCycle((c) => c + 1);
  }, [step]);
  const rows: [string, number, boolean][] = [["Handbook", 0, true], ["Onboarding", 1, false], ["Policies", 1, false]];
  const added = step >= 2;
  return (
    <div className={`${PAPER} relative grid overflow-hidden sm:grid-cols-[250px_1fr]`}>
      <div className="border-r border-[#efe8d9] bg-[#fcfaf5] p-4">
        <div className="mb-3 flex items-center justify-between px-1"><span className="font-mono text-[10px] uppercase tracking-wider text-[#a59b85]">Pages</span><span className={`flex h-6 w-6 items-center justify-center rounded-md bg-white text-[#6d654f] ring-1 ring-[#e4dbc8] transition-transform duration-200 ${step === 1 ? "scale-90 bg-indigo-50" : ""}`}><Plus className="h-3.5 w-3.5" /></span></div>
        {rows.map(([t, l, open]) => (
          <p key={t} className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-[13.5px] text-[#4b4431]" style={{ marginLeft: l * 18 }}>{open ? <ChevronRight className="h-3.5 w-3.5 rotate-90" /> : <FileText className="h-3.5 w-3.5 text-[#b0a68f]" />}{t}</p>
        ))}
        {added && (
          <p key={`n${cycle}`} className={`slide-in flex items-center gap-1.5 rounded-lg px-2 py-2 text-[13.5px] ${step >= 3 ? "bg-indigo-50 font-semibold text-indigo-700" : "text-[#8c8268]"}`} style={{ marginLeft: 18 }}><FileText className="h-3.5 w-3.5" /><TypeText text={NAME} run={step >= 3} speed={90} />{step < 3 && "Untitled"}</p>
        )}
        <p className="mt-1 flex items-center gap-1.5 px-2 py-2 text-[13.5px] text-[#4b4431]"><ChevronRight className="h-3.5 w-3.5" />Project briefs</p>
        <p className="flex items-center gap-1.5 px-2 py-2 text-[13.5px] text-[#4b4431]"><FileText className="h-3.5 w-3.5 text-[#b0a68f]" />Meeting notes</p>
      </div>
      <div className="hidden p-8 sm:block">
        <p className={`${HEAD} text-[30px] leading-tight text-[#1d1a12] transition-opacity duration-500`} style={{ opacity: step >= 3 ? 1 : 0.15 }}>{step >= 3 ? NAME : "Untitled"}</p>
        <div className="mt-5 space-y-3"><i className="block h-2.5 w-full rounded bg-[#efe8d9]" /><i className="block h-2.5 w-11/12 rounded bg-[#efe8d9]" /><i className="block h-2.5 w-2/3 rounded bg-[#efe8d9]" /></div>
        <p className="mt-8 text-[12.5px] text-[#a59b85]">{step >= 4 ? "Saved in Handbook" : "New page"}</p>
      </div>
      <Cursor x={step === 0 ? 150 : 206} y={step === 0 ? 150 : 28} down={step === 1} hidden={step > 1} />
    </div>
  );
}

export function TreeSection() {
  return <Live className="max-sm:[zoom:0.9]">{(live) => <Tree live={live} />}</Live>;
}

/* ───────────── What teams write: a pinboard ───────────── */

const SHEETS: { title: string; line: string; kind: string; rot: number; tint: string }[] = [
  { title: "Handbook", line: "How we work, in one place.", kind: "text", rot: -2.2, tint: "#fff7d6" },
  { title: "Process for new clients", line: "The same steps, every time.", kind: "check", rot: 1.6, tint: "#e8f0ff" },
  { title: "Project brief", line: "What, why and by when.", kind: "table", rot: -1.2, tint: "#ffe9ef" },
  { title: "Meeting notes", line: "Decisions and who owns them.", kind: "text", rot: 2.1, tint: "#e6f7ee" },
  { title: "Playbook", line: "What to do when it goes wrong.", kind: "check", rot: -1.8, tint: "#f1e9ff" },
  { title: "Roadmap", line: "What we are building next.", kind: "table", rot: 1.1, tint: "#fff0e0" },
];

export function Pinboard() {
  return (
    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {SHEETS.map((s) => (
        <div key={s.title} className="group relative" style={{ transform: `rotate(${s.rot}deg)`, transition: `transform .45s ${EASE}` }}>
          <i className="absolute -top-3 left-1/2 z-10 h-6 w-16 -translate-x-1/2 -rotate-3 rounded-sm bg-[#e9d9a8]/80 shadow-sm" />
          <div className="rounded-xl border border-[#e9e1d1] p-5 pt-7 shadow-[0_24px_50px_-28px_rgb(60_50_20_/_0.5)] transition-all duration-500 group-hover:-translate-y-2 group-hover:rotate-[-1deg] group-hover:shadow-[0_36px_60px_-28px_rgb(60_50_20_/_0.6)]" style={{ background: s.tint }}>
            <p className={`${HEAD} text-[22px] leading-tight text-[#1d1a12]`}>{s.title}</p>
            <p className="mt-1 text-[13.5px] text-[#6d654f]">{s.line}</p>
            <div className="mt-4 space-y-2">
              {s.kind === "text" && <><i className="block h-2 w-full rounded bg-black/10" /><i className="block h-2 w-11/12 rounded bg-black/10" /><i className="block h-2 w-3/5 rounded bg-black/10" /></>}
              {s.kind === "check" && [0, 1, 2].map((k) => <p key={k} className="flex items-center gap-2"><span className={`flex h-4 w-4 items-center justify-center rounded border-2 ${k < 2 ? "border-indigo-500 bg-indigo-500 text-white" : "border-black/20"}`}>{k < 2 && <Check className="h-3 w-3" strokeWidth={3.5} />}</span><i className="block h-2 flex-1 rounded bg-black/10" /></p>)}
              {s.kind === "table" && [0, 1, 2].map((k) => <p key={k} className="grid grid-cols-3 gap-2"><i className="h-2.5 rounded bg-black/15" /><i className="h-2.5 rounded bg-black/10" /><i className="h-2.5 rounded bg-black/10" /></p>)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────── Next to the work: one workspace, the page beside the board ───────────── */

const MODULES: [string, typeof FileText][] = [["CRM", Target], ["Work", FolderKanban], ["Pages", FileText], ["Inbox", Inbox], ["Chat", MessagesSquare]];

function Switch({ live }: { live: boolean }) {
  const [i] = useStepper(3, 2600, live);
  const active = ["Work", "Pages", "Inbox"][i];
  return (
    <div className={`${PAPER} grid overflow-hidden sm:grid-cols-[170px_1fr]`}>
      <aside className="border-b border-[#efe8d9] bg-[#fcfaf5] p-3 sm:border-b-0 sm:border-r">
        {MODULES.map(([n, Icon]) => <p key={n} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors duration-500 ${n === active ? "bg-indigo-50 font-semibold text-indigo-700" : "text-[#6d654f]"}`}><Icon className="h-4 w-4" />{n}</p>)}
      </aside>
      <div className="relative min-h-[250px] p-6">
        {[0, 1, 2].map((k) => (
          <div key={k} className="absolute inset-6 transition-all duration-700" style={{ opacity: i === k ? 1 : 0, transform: i === k ? "none" : "translateY(10px)", pointerEvents: "none" }}>
            {k === 0 && <div className="grid grid-cols-3 gap-3">{["To do", "Doing", "Done"].map((c, ci) => <div key={c} className="rounded-xl bg-[#f7f2e6] p-2.5"><p className="mb-2 text-[11px] font-semibold text-[#8c8268]">{c}</p>{Array.from({ length: 2 - (ci === 2 ? 1 : 0) }, (_, x) => <p key={x} className="mb-2 flex items-center gap-2 rounded-lg bg-white p-2 text-[11.5px] shadow-sm"><Avatar name={`${c}${x}`} i={ci + x} size={18} />Task</p>)}</div>)}</div>}
            {k === 1 && <div><p className={`${HEAD} text-[24px] text-[#1d1a12]`}>Client onboarding</p><div className="mt-4 space-y-2.5"><i className="block h-2.5 w-full rounded bg-[#efe8d9]" /><i className="block h-2.5 w-5/6 rounded bg-[#efe8d9]" /><i className="block h-2.5 w-2/3 rounded bg-[#efe8d9]" /></div></div>}
            {k === 2 && <div className="space-y-2">{["Yusuf Khan", "Meera Rao", "Dev Patel"].map((n, x) => <p key={n} className="flex items-center gap-3 rounded-xl border border-[#efe8d9] bg-[#fdfbf7] p-3 text-[12.5px]"><Avatar name={n} i={x + 2} size={26} /><b className="font-semibold">{n}</b><span className="truncate text-[#8c8268]">Re: your question</span></p>)}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SwitchSection() {
  return <Live className="max-sm:[zoom:0.9]">{(live) => <Switch live={live} />}</Live>;
}
