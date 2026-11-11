"use client";

import { useEffect, useState } from "react";
import { Bot, Check, FileSpreadsheet, Globe, Mail, MessageSquare, Sparkles, Target, type LucideIcon } from "lucide-react";
import { Avatar, Pill } from "@/components/mockPrimitives";
import { Confetti, CountTo, Cursor, Live, ScrollStory, TypeText, useReducedMotion, useStepper } from "@/components/motion";

const L = (n: number) => `₹${n.toFixed(1)}L`;
const EASE = "cubic-bezier(.55,.1,.25,1)";

/* ───────────── Hero: a deal that travels the board ───────────── */

type Deal = [name: string, value: number, source: string];
const BOARD: { name: string; color: string; deals: Deal[] }[] = [
  { name: "New", color: "#6b7494", deals: [["Cedar Finance", 4.4, "Campaign"]] },
  { name: "Qualified", color: "#2f5bff", deals: [["Northwind Labs", 2.4, "Inbound"], ["Bluepeak Retail", 5.6, "Referral"]] },
  { name: "Proposal", color: "#7c5cff", deals: [["Orbit Logistics", 3.5, "Website"]] },
  { name: "Won", color: "#10c98f", deals: [["Juniper Legal", 4.2, "Chatbot"]] },
];
const TRAVELER: Deal = ["Harbor & Co", 3.8, "Website"];
const BOARD_TIMING: readonly number[] = [1500, 1500, 1500, 3200, 1000];
const CARD_H = 72;
const GAP = 8;
const TOP = 44;

function DealCard({ deal, i, lift = false }: { deal: Deal; i: number; lift?: boolean }) {
  return (
    <div className={`rounded-xl border bg-white p-2.5 ${lift ? "border-violet/40 shadow-[0_18px_36px_-14px_rgb(91_92_255_/_0.55)]" : "border-line shadow-[0_1px_2px_rgb(10_17_40_/_0.04)]"}`} style={{ height: CARD_H }}>
      <p className="truncate text-[11.5px] font-semibold">{deal[0]}</p>
      <p className="font-display text-[15px] font-semibold tabular-nums leading-5">{L(deal[1])}</p>
      <div className="mt-1 flex items-center justify-between">
        <Avatar name={deal[0]} i={i} size={18} />
        <Pill color={lift ? "#7c5cff" : "#6b7494"}>{deal[2]}</Pill>
      </div>
    </div>
  );
}

function Board({ live }: { live: boolean }) {
  const [step] = useStepper(5, BOARD_TIMING, live);
  const col = Math.min(step, 3);
  const gone = step === 4;
  const [fire, setFire] = useState(0);
  useEffect(() => {
    if (step === 3) setFire((f) => f + 1);
  }, [step]);

  const top = TOP + BOARD[col].deals.length * (CARD_H + GAP);
  const left = `calc(${col} * (25% + 3px) + 8px)`;
  const total = (i: number) => BOARD[i].deals.reduce((n, d) => n + d[1], 0) + (col === i && !gone ? TRAVELER[1] : 0);
  const move = step === 0 ? "opacity .4s" : `left .95s ${EASE}, top .95s ${EASE}, opacity .4s`;

  return (
    <div className="window p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-display text-[18px] font-semibold">Pipeline</p>
        <span className="flex gap-2"><Pill color="#2f5bff">14 deals</Pill><Pill color="#10c98f"><span>Won <CountTo to={total(3)} format={L} /></span></Pill></span>
      </div>
      <div className="relative">
        <div className="grid grid-cols-4 gap-3">
          {BOARD.map((c, i) => (
            <div key={c.name} className="min-h-[310px] rounded-2xl bg-soft p-2">
              <div className="mb-2 flex h-7 items-center justify-between px-1">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold"><i className="h-2 w-2 rounded-full" style={{ background: c.color }} />{c.name}</span>
                <CountTo to={total(i)} format={L} className="text-[10.5px] text-muted" />
              </div>
              <div className="space-y-2">{c.deals.map((d, k) => <DealCard key={d[0]} deal={d} i={i + k} />)}</div>
            </div>
          ))}
        </div>
        <div className="absolute z-20" style={{ left, top, width: "calc(25% - 25px)", opacity: gone ? 0 : 1, transform: step < 3 ? "rotate(-2.5deg)" : "none", transition: move }}>
          <DealCard deal={TRAVELER} i={5} lift={step < 3} />
        </div>
        <Cursor x={`calc(${col} * (25% + 3px) + 15%)`} y={top + 34} down={step < 3} hidden={gone} />
        <Confetti fire={fire} at={{ left: "88%", top: "62%" }} />
      </div>
    </div>
  );
}

export function PipelineHero() {
  return (
    <Live className="max-sm:[zoom:0.62]">
      {(live) => <Board live={live} />}
    </Live>
  );
}

/* ───────────── Sources converge into one list ───────────── */

const SOURCES: { label: string; icon: LucideIcon; color: string; y: number }[] = [
  { label: "CSV import", icon: FileSpreadsheet, color: "#10c98f", y: 14 },
  { label: "Website form", icon: Globe, color: "#2f5bff", y: 38 },
  { label: "AI chatbot", icon: Bot, color: "#ff8a4c", y: 62 },
  { label: "Campaign reply", icon: Mail, color: "#7c5cff", y: 86 },
];
const ARRIVALS: [string, string, number][] = [
  ["Orbit Logistics", "CSV import", 3],
  ["Priya Nair", "Website form", 0],
  ["Chloe Martin", "AI chatbot", 1],
  ["Dev Patel", "Campaign reply", 2],
];
const MERGE_TIMING: readonly number[] = [1200, 1200, 1200, 1200, 3200];

function HubCard({ step }: { step: number }) {
  const shown = Math.min(step + 1, 4);
  const merged = step >= 4;
  return (
    <div className="h-full rounded-2xl border border-line bg-white p-3.5 shadow-[0_30px_60px_-30px_rgb(60_50_200_/_0.45)]">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[12.5px] font-semibold"><Target className="h-3.5 w-3.5 text-electric" />Leads</span>
        <Pill color="#2f5bff">{shown} new</Pill>
      </div>
      <div className="space-y-2">
        {ARRIVALS.slice(0, shown).map(([name, src, tone], k) => (
          <div key={name} className={`slide-in flex items-center gap-2.5 rounded-xl border bg-soft/60 p-2 ${merged && k === 1 ? "border-emerald-400/70 ring-4 ring-emerald-400/15" : "border-line"}`}>
            <Avatar name={name} i={tone} size={26} />
            <span className="min-w-0 flex-1"><b className="block truncate text-[12px] font-semibold leading-4">{name}</b><span className="text-[10.5px] text-muted">{src}</span></span>
            {merged && k === 1 ? <Pill color="#10c98f">2 enquiries</Pill> : <Pill color="#2f5bff">New</Pill>}
          </div>
        ))}
      </div>
      {merged && (
        <p className="pop-in mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-2 text-[11px] font-medium text-emerald-800">
          <Check className="h-3.5 w-3.5 shrink-0" />Priya wrote again. Added to her lead, no duplicate.
        </p>
      )}
    </div>
  );
}

function Converge({ live }: { live: boolean }) {
  const reduced = useReducedMotion();
  const [step] = useStepper(5, MERGE_TIMING, live);
  return (
    <>
      <div className="relative mx-auto hidden aspect-[2/1] w-full max-w-[980px] md:block">
        <svg viewBox="0 0 800 400" className="absolute inset-0 h-full w-full" fill="none" aria-hidden>
          {SOURCES.map((s, i) => {
            const y = s.y * 4;
            const d = `M216 ${y} C 350 ${y}, 350 200, 478 200`;
            return (
              <g key={s.label}>
                <path d={d} stroke={s.color} strokeOpacity="0.3" strokeWidth="2" strokeDasharray="4 7" />
                {!reduced && live && <circle r="5.5" fill={s.color}><animateMotion dur="2.4s" begin={`${i * 0.6}s`} repeatCount="indefinite" path={d} /></circle>}
              </g>
            );
          })}
        </svg>
        {SOURCES.map(({ label, icon: Icon, color, y }) => (
          <span key={label} className="absolute left-0 flex w-[27%] -translate-y-1/2 items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-2.5 shadow-sm" style={{ top: `${y}%` }}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: color }}><Icon className="h-4 w-4" /></span>
            <span className="truncate text-[13px] font-semibold">{label}</span>
          </span>
        ))}
        <div className="absolute right-0 top-[4%] h-[92%] w-[40%]"><HubCard step={step} /></div>
      </div>
      <div className="md:hidden">
        <div className="mb-4 flex flex-wrap justify-center gap-2">
          {SOURCES.map(({ label, icon: Icon, color }) => (
            <span key={label} className="flex items-center gap-2 rounded-full border border-line bg-white py-1.5 pl-1.5 pr-3 text-[13px] font-semibold"><span className="flex h-6 w-6 items-center justify-center rounded-full text-white" style={{ background: color }}><Icon className="h-3.5 w-3.5" /></span>{label}</span>
          ))}
        </div>
        <HubCard step={step} />
      </div>
    </>
  );
}

export function ConvergeSection() {
  return <Live>{(live) => <Converge live={live} />}</Live>;
}

/* ───────────── Lifecycle: one lead, scrolled through five stages ───────────── */

const STAGES = ["New", "Enriched", "Emailed", "Replied", "Interested"];
const STAGE_COLOR = ["#8a93b2", "#4d7bff", "#9a7bff", "#10c98f", "#ff5fb0"];
const EVENTS: [string, LucideIcon][] = [
  ["Added from the website form", Globe],
  ["Researched: grocery chain, two new stores in Pune", Sparkles],
  ["Email 1 sent and opened", Mail],
  ["Reply: “Sounds interesting. Thursday?”", MessageSquare],
  ["Marked interested. Deal created, ₹4.2L", Target],
];

function LeadCard({ stage }: { stage: number }) {
  return (
    <div className="mx-auto w-full max-w-[520px] rounded-3xl border border-white/15 bg-white p-5 text-ink shadow-[0_50px_100px_-30px_rgb(0_0_0_/_0.7)]">
      <div className="flex items-center gap-3">
        <Avatar name="Priya Nair" i={3} size={44} />
        <span className="min-w-0 flex-1"><b className="block text-[16px] font-semibold leading-5">Priya Nair</b><span className="text-[13px] text-muted">Head of Ops · Lumen Foods</span></span>
        <span key={stage} className="pop-in rounded-full px-3 py-1 text-[12px] font-semibold text-white" style={{ background: STAGE_COLOR[stage] }}>{STAGES[stage]}</span>
      </div>
      <div className="mt-5 flex items-center">
        {STAGES.map((s, k) => (
          <div key={s} className="flex flex-1 items-center last:flex-none">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all duration-500" style={{ borderColor: k <= stage ? STAGE_COLOR[k] : "#e6e9f4", background: k <= stage ? STAGE_COLOR[k] : "#fff", color: k <= stage ? "#fff" : "#b3bad1" }}>{k < stage ? <Check className="h-3 w-3" strokeWidth={3} /> : k + 1}</span>
            {k < STAGES.length - 1 && <span className="mx-1 h-[3px] flex-1 overflow-hidden rounded-full bg-line"><i className="block h-full rounded-full transition-all duration-700" style={{ width: k < stage ? "100%" : "0%", background: STAGE_COLOR[k] }} /></span>}
          </div>
        ))}
      </div>
      <ul className="mt-5 space-y-2.5 border-t border-line pt-4">
        {EVENTS.map(([text, Icon], k) => (
          <li key={text} className="flex items-center gap-3 text-[13.5px] transition-all duration-500" style={{ opacity: k <= stage ? 1 : 0.18, transform: k <= stage ? "none" : "translateY(6px)" }}>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: `${STAGE_COLOR[k]}1f`, color: STAGE_COLOR[k] }}><Icon className="h-3.5 w-3.5" /></span>
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}

const LIFECYCLE = [
  { kicker: "01 · New", title: "A lead arrives.", body: "From a CSV, a website form or the chatbot. It lands in the pipeline with its source attached." },
  { kicker: "02 · Enriched", title: "AI does the homework.", body: "Rhinon AI researches the company and saves a description, recent news and the likely pain point." },
  { kicker: "03 · Emailed", title: "The first email goes out.", body: "Drafted by AI, approved by you, sent on your schedule. Opens are tracked on the lead." },
  { kicker: "04 · Replied", title: "A reply moves it forward.", body: "Replies land in your inbox and update the lead on their own." },
  { kicker: "05 · Interested", title: "Your team takes over.", body: "Mark the interest, add a deal and keep going. Bounces and unsubscribes are handled for you." },
];

export function LifecycleStory() {
  return <ScrollStory dark tone="#8fb0ff" scenes={LIFECYCLE} visual={(i) => <div className="flex h-full items-center"><LeadCard stage={i} /></div>} />;
}

/* ───────────── Research: a scan of a website fills the lead in ───────────── */

const SCAN_TIMING: readonly number[] = [1400, 2600, 2600, 2600, 2800];
const FIELDS: [label: string, text: string][] = [
  ["Company", "Regional grocery chain with 14 stores across Maharashtra."],
  ["Recent news", "Opened two new stores in Pune this quarter."],
  ["Likely pain", "Stock reporting across a growing number of locations."],
];

function Scan({ live }: { live: boolean }) {
  const [step] = useStepper(5, SCAN_TIMING, live);
  const block = (k: number) => `rounded-lg transition-all duration-500 ${step === k ? "bg-electric/10 ring-2 ring-electric/60" : "bg-line/70"}`;
  return (
    <div className="grid items-stretch gap-4 md:grid-cols-[1.05fr_0.95fr]">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-white p-5 shadow-[0_30px_70px_-34px_rgb(40_30_140_/_0.4)]">
        <div className="flex items-center gap-3"><i className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400" /><i className="h-2 w-24 rounded bg-line" /><span className="ml-auto flex gap-2"><i className="h-2 w-10 rounded bg-line" /><i className="h-2 w-10 rounded bg-line" /></span></div>
        <div className="mt-5 space-y-2"><i className="block h-4 w-3/4 rounded bg-ink/15" /><i className="block h-4 w-1/2 rounded bg-ink/15" /></div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className={`h-24 p-3 ${block(1)}`}><i className="mb-2 block h-2 w-1/2 rounded bg-white/90" /><i className="mb-1.5 block h-1.5 w-full rounded bg-white/90" /><i className="block h-1.5 w-4/5 rounded bg-white/90" /></div>
          <div className={`h-24 p-3 ${block(2)}`}><i className="mb-2 block h-2 w-2/3 rounded bg-white/90" /><i className="mb-1.5 block h-1.5 w-full rounded bg-white/90" /><i className="block h-1.5 w-3/5 rounded bg-white/90" /></div>
          <div className={`h-24 p-3 ${block(3)}`}><i className="mb-2 block h-2 w-1/3 rounded bg-white/90" /><i className="mb-1.5 block h-1.5 w-full rounded bg-white/90" /><i className="block h-1.5 w-2/3 rounded bg-white/90" /></div>
        </div>
        <div className="mt-5 space-y-2"><i className="block h-2 w-full rounded bg-line" /><i className="block h-2 w-11/12 rounded bg-line" /><i className="block h-2 w-3/4 rounded bg-line" /></div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full"><div className="scan-line h-16 bg-gradient-to-b from-transparent via-electric/25 to-transparent" /></div>
        <span className="absolute bottom-3 right-3 rounded-full bg-night px-2.5 py-1 font-mono text-[10px] text-white/80">lumenfoods.in</span>
      </div>
      <div className="rounded-3xl border border-line bg-white p-5 shadow-[0_30px_70px_-34px_rgb(40_30_140_/_0.4)]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-violet"><Sparkles className="h-3.5 w-3.5" />Saved on the lead</span>
          {step === 4 ? <span className="pop-in"><Pill color="#10c98f">Done</Pill></span> : <Pill color="#f5a524">Researching</Pill>}
        </div>
        <div className="mt-4 space-y-3.5">
          {FIELDS.map(([label, text], k) => (
            <div key={label} className="rounded-xl bg-soft p-3">
              <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted">{label}</p>
              <p className="mt-1 min-h-[40px] text-[14px] leading-5"><TypeText text={text} run={step > k} speed={22} /></p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ScanSection() {
  return <Live>{(live) => <Scan live={live} />}</Live>;
}

/* ───────────── Deal value by stage, switching period ───────────── */

const PERIODS: { label: string; stages: [string, number, string][] }[] = [
  { label: "This month", stages: [["New", 8.6, "#8a93b2"], ["Qualified", 6.8, "#2f5bff"], ["Proposal", 9.1, "#7c5cff"], ["Won", 4.2, "#10c98f"]] },
  { label: "This quarter", stages: [["New", 14.2, "#8a93b2"], ["Qualified", 19.4, "#2f5bff"], ["Proposal", 16.8, "#7c5cff"], ["Won", 22.6, "#10c98f"]] },
];
const PERIOD_TIMING: readonly number[] = [3800, 3800];

function Bars({ live }: { live: boolean }) {
  const [p, setP] = useStepper(2, PERIOD_TIMING, live);
  const data = PERIODS[p];
  const max = Math.max(...data.stages.map((s) => s[1])) * 1.12;
  return (
    <div className="rounded-[32px] border border-line bg-white p-6 shadow-[0_40px_90px_-40px_rgb(40_30_140_/_0.45)] sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">Won value</p>
          <p className="font-display text-[44px] font-semibold leading-none text-emerald-600"><CountTo to={data.stages[3][1]} format={L} run={live} /></p>
        </div>
        <div className="flex rounded-full bg-soft p-1">
          {PERIODS.map((x, k) => (
            <button key={x.label} type="button" onClick={() => setP(k)} className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all ${k === p ? "bg-white text-ink shadow-sm" : "text-muted"}`}>{x.label}</button>
          ))}
        </div>
      </div>
      <div className="mt-8 grid h-[260px] grid-cols-4 items-end gap-4 sm:gap-8">
        {data.stages.map(([name, v, color], k) => (
          <div key={name} className="flex h-full flex-col justify-end">
            <CountTo to={v} format={L} run={live} className="mb-2 text-center text-[13px] font-semibold" />
            <div className="rounded-t-2xl" style={{ height: `${(v / max) * 100}%`, background: `linear-gradient(to top, ${color}, ${color}99)`, transition: `height 900ms cubic-bezier(.3,.7,.2,1) ${k * 90}ms`, boxShadow: `0 18px 30px -18px ${color}` }} />
            <span className="mt-3 text-center text-[12.5px] font-medium text-ink-soft">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BarsSection() {
  return <Live>{(live) => <Bars live={live} />}</Live>;
}
