"use client";

import { Check, Star } from "lucide-react";
import { Avatar, Pill } from "@/components/mockPrimitives";
import { AutoTabs, CountTo, Live, Ring, TypeText, useStepper } from "@/components/motion";

const GLASS = "rounded-3xl border border-white/10 bg-white/[0.045] backdrop-blur-md";
const EASE = "cubic-bezier(.4,.1,.2,1)";
const RING_COLORS: [string, string][] = [["#ff5fb0", "#ff9bd2"], ["#7c5cff", "#b9a6ff"], ["#2cd3ff", "#8fe9ff"]];

/* ───────────── Hero: three rings closing ───────────── */

const RINGS_NOW: [string, number][] = [["Goals", 0.78], ["Reviews", 0.64], ["Feedback", 0.92]];

function Rings({ live }: { live: boolean }) {
  const [step] = useStepper(2, [1300, 6200], live);
  const full = step === 1;
  const avg = Math.round((RINGS_NOW.reduce((n, r) => n + r[1], 0) / 3) * 100);
  const size = 380;
  return (
    <div className="relative mx-auto flex w-full max-w-[460px] flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <span aria-hidden className="absolute inset-8 rounded-full bg-violet/25 blur-3xl" />
        {RINGS_NOW.map(([name, v], i) => {
          const stroke = 26;
          const gap = 12;
          const r = size / 2 - stroke / 2 - i * (stroke + gap);
          const c = 2 * Math.PI * r;
          return (
            <svg key={name} width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden>
              <defs><linearGradient id={`pr-${i}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={RING_COLORS[i][0]} /><stop offset="1" stopColor={RING_COLORS[i][1]} /></linearGradient></defs>
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(255 255 255 / 0.07)" strokeWidth={stroke} />
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#pr-${i})`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - (full ? v : 0.04))} style={{ transition: `stroke-dashoffset 1.6s ${EASE} ${i * 160}ms`, filter: `drop-shadow(0 0 10px ${RING_COLORS[i][0]}88)` }} />
            </svg>
          );
        })}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">Q3 review cycle</span>
          <b className="font-display text-[64px] font-semibold leading-none text-white"><CountTo to={full ? avg : 0} run={live} duration={1800} />%</b>
          <span className="text-[12.5px] text-white/50">complete</span>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-4">
        {RINGS_NOW.map(([n, v], i) => <span key={n} className="flex items-center gap-2 text-[13px] text-white/70"><i className="h-2.5 w-2.5 rounded-full" style={{ background: RING_COLORS[i][0] }} />{n} <b className="tabular-nums text-white"><CountTo to={full ? v * 100 : 0} run={live} duration={1800} />%</b></span>)}
      </div>
    </div>
  );
}

export function RingsHero() {
  return <Live className="max-sm:[zoom:0.8]">{(live) => <Rings live={live} />}</Live>;
}

/* ───────────── Cycles: three kinds, one tab each ───────────── */

const CYCLE_TABS = [
  { title: "Quarterly", body: "A regular check-in on goals and growth." },
  { title: "Annual", body: "The big review, once a year." },
  { title: "Probation", body: "A review before someone is confirmed." },
];

function Cycle({ tab }: { tab: number }) {
  const show = (k: number) => ({ opacity: tab === k ? 1 : 0, transform: tab === k ? "none" : "translateY(14px)", transition: `all .6s ${EASE}`, pointerEvents: "none" as const });
  return (
    <div className={`${GLASS} relative h-[230px] p-6 sm:p-8`}>
      <div className="absolute inset-6 flex items-center sm:inset-8" style={show(0)}>
        <div className="grid w-full grid-cols-4 gap-3">{["Q1", "Q2", "Q3", "Q4"].map((q, i) => <div key={q} className={`rounded-2xl border p-4 text-center transition-all duration-700 ${i === 2 ? "border-violet/60 bg-violet/20" : i < 2 ? "border-white/10 bg-white/[0.06]" : "border-dashed border-white/10"}`} style={{ transitionDelay: `${i * 90}ms`, transform: tab === 0 ? "none" : "scale(.94)" }}><b className="font-display block text-[26px] font-semibold text-white">{q}</b><span className="text-[11.5px] text-white/50">{i < 2 ? "Reviewed" : i === 2 ? "In progress" : "Coming up"}</span></div>)}</div>
      </div>
      <div className="absolute inset-6 flex flex-col justify-center sm:inset-8" style={show(1)}>
        <div className="grid grid-cols-12 gap-1.5">{Array.from({ length: 12 }, (_, i) => <i key={i} className="block h-10 rounded-lg" style={{ background: i < 10 ? "linear-gradient(180deg, #8f7bff, #5b46d6)" : "rgb(255 255 255 / 0.08)", opacity: tab === 1 ? 1 : 0, transform: tab === 1 ? "none" : "scaleY(.3)", transition: `all .6s ${EASE} ${i * 40}ms` }} />)}</div>
        <p className="mt-4 flex items-center justify-between text-[13px] text-white/55"><span>January</span><span className="flex items-center gap-1.5 font-semibold text-white"><Star className="h-4 w-4 text-amber" fill="currentColor" />Annual review in December</span></p>
      </div>
      <div className="absolute inset-6 flex flex-col justify-center sm:inset-8" style={show(2)}>
        <p className="mb-4 flex items-center justify-between text-[13px] text-white/55"><span>Day 1</span><span>Day 90</span></p>
        <div className="relative h-3 rounded-full bg-white/10"><i className="absolute inset-y-0 left-0 block rounded-full bg-gradient-to-r from-cyan to-violet" style={{ width: tab === 2 ? "66%" : "0%", transition: "width 1.4s cubic-bezier(.3,.7,.2,1)" }} /><i className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_24px_6px_rgb(124_92_255_/_0.7)]" style={{ left: tab === 2 ? "66%" : "0%", transition: "left 1.4s cubic-bezier(.3,.7,.2,1)" }} /></div>
        <p className="mt-5 text-[14px] text-white/70">Probation review: <b className="text-white">in 30 days</b></p>
      </div>
    </div>
  );
}

export function CyclesSection() {
  return <AutoTabs dark items={CYCLE_TABS} interval={4600} tone={["#b9a6ff", "#8fb0ff"]} visual={(i) => <Cycle tab={i} />} />;
}

/* ───────────── Goals: bars filling, one more arriving ───────────── */

const GOALS: [string, number, number, string][] = [
  ["Ship the new onboarding flow", 85, 4, "#34e3ad"],
  ["Cut support replies to two hours", 60, 2, "#b9a6ff"],
  ["Run the Q3 customer survey", 100, 3, "#ff9bd2"],
  ["Document the handover process", 35, 5, "#8fe9ff"],
];
const GOAL_TIMING: readonly number[] = [900, 1100, 1100, 1100, 1100, 4000];

function Goals({ live }: { live: boolean }) {
  const [step] = useStepper(6, GOAL_TIMING, live);
  return (
    <div className={`${GLASS} p-5 sm:p-7`}>
      <div className="mb-4 flex items-center justify-between"><b className="font-display text-[20px] font-semibold text-white">Ana's goals · Q3</b><Pill color="#b9a6ff">{step >= 5 ? "5 goals" : "4 goals"}</Pill></div>
      <div className="space-y-3">
        {step >= 5 && <div key="new" className="slide-in flex items-center gap-4 rounded-2xl border border-violet/50 bg-violet/15 p-4"><Avatar name="Ana Silva" i={4} size={34} /><span className="flex-1 text-[14.5px] font-semibold text-white">Mentor two new joiners</span><Pill color="#b9a6ff">New</Pill></div>}
        {GOALS.map(([title, pct, who, color], k) => {
          const on = step > k;
          return (
            <div key={title} className={`rounded-2xl border p-4 transition-all duration-700 ${on && pct === 100 ? "border-emerald-400/50 bg-emerald-400/10 shadow-[0_0_40px_-10px_rgb(52_227_173_/_0.5)]" : "border-white/10 bg-white/[0.04]"}`}>
              <div className="flex items-center gap-3"><Avatar name={["Ana Silva", "Yusuf Khan", "Dev Patel", "Meera Rao", "Sara Lin", "Anil Shah"][who]} i={who} size={30} /><span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold text-white">{title}</span>{on && pct === 100 && <span className="pop-in flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-ink"><Check className="h-3.5 w-3.5" strokeWidth={3.5} /></span>}<b className="w-12 text-right text-[14px] tabular-nums text-white"><CountTo to={on ? pct : 0} run={live} duration={1000} />%</b></div>
              <div className="relative mt-3 h-2.5 rounded-full bg-white/10"><i className="absolute inset-y-0 left-0 block rounded-full" style={{ width: on ? `${pct}%` : "0%", background: color, boxShadow: `0 0 18px ${color}88`, transition: `width 1.1s ${EASE}` }} />{[25, 50, 75].map((m) => <i key={m} className="absolute top-0 h-full w-[2px] bg-[#0a0720]/70" style={{ left: `${m}%` }} />)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function GoalsSection() {
  return <Live>{(live) => <Goals live={live} />}</Live>;
}

/* ───────────── Review: a reviewer writes, stars fill, it submits ───────────── */

const REVIEW_TIMING: readonly number[] = [1500, 3200, 1800, 4000];
const FEEDBACK = "Dev owned the checkout rebuild end to end. Calm under pressure, and always helps the team.";

function Review({ live }: { live: boolean }) {
  const [step] = useStepper(4, REVIEW_TIMING, live);
  const stars = step >= 2 ? 4 : 0;
  const steps = ["Self review", "Manager review", "Submitted"];
  const at = step === 0 ? 0 : step <= 2 ? 1 : 2;
  return (
    <div className={`${GLASS} p-5 sm:p-8`}>
      <div className="flex items-center">
        {steps.map((s, k) => (
          <div key={s} className="flex flex-1 items-center last:flex-none">
            <span className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold transition-all duration-500" style={{ background: k <= at ? "linear-gradient(135deg, #7c5cff, #2f5bff)" : "rgb(255 255 255 / 0.08)", color: k <= at ? "#fff" : "#ffffff66", boxShadow: k === at ? "0 0 24px rgb(124 92 255 / 0.8)" : "none" }}>{k < at ? <Check className="h-4 w-4" strokeWidth={3.5} /> : k + 1}</span><b className={`hidden text-[13px] font-semibold sm:block ${k <= at ? "text-white" : "text-white/40"}`}>{s}</b></span>
            {k < 2 && <span className="mx-3 h-[3px] flex-1 overflow-hidden rounded-full bg-white/10"><i className="block h-full rounded-full bg-gradient-to-r from-violet to-electric transition-all duration-1000" style={{ width: k < at ? "100%" : "0%" }} /></span>}
          </div>
        ))}
      </div>
      <div className="mt-8 grid items-center gap-5 md:grid-cols-[auto_1fr_auto]">
        <div className="flex flex-col items-center text-center"><Avatar name="Meera Rao" i={5} size={64} /><b className="mt-2 text-[14px] font-semibold text-white">Meera Rao</b><span className="text-[12px] text-white/45">Reviewer</span></div>
        <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-black/30 p-4">
          <p className="min-h-[72px] text-[14.5px] leading-6 text-white/90"><TypeText text={FEEDBACK} run={step >= 1} speed={30} /></p>
          <p className="mt-3 flex items-center gap-1">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-6 w-6 transition-all duration-500" style={{ color: i < stars ? "#ffb547" : "#ffffff30", fill: i < stars ? "#ffb547" : "transparent", transform: i < stars ? "scale(1.08)" : "none", transitionDelay: `${i * 120}ms` }} />)}</p>
        </div>
        <div className="flex flex-col items-center text-center"><Avatar name="Dev Patel" i={2} size={64} /><b className="mt-2 text-[14px] font-semibold text-white">Dev Patel</b><span className="text-[12px] text-white/45">Reviewee</span></div>
      </div>
      <p className="mt-6 h-6 text-center text-[13.5px] font-medium text-emerald-300">{step >= 3 && <span className="pop-in inline-flex items-center gap-1.5"><Check className="h-4 w-4" strokeWidth={3} />Review submitted to Dev</span>}</p>
    </div>
  );
}

export function ReviewSection() {
  return <Live>{(live) => <Review live={live} />}</Live>;
}

/* ───────────── Team view: who has finished what ───────────── */

const COLS = ["Goals set", "Self review", "Manager review", "Done"];
const TEAM: [string, number, number][] = [["Ana Silva", 4, 4], ["Meera Rao", 4, 5], ["Yusuf Khan", 3, 2], ["Dev Patel", 2, 3], ["Sara Lin", 1, 1]];
const MAX_STEP = 7;

function Team({ live }: { live: boolean }) {
  const [step] = useStepper(MAX_STEP + 2, [900, 520, 520, 520, 520, 520, 520, 520, 4200], live);
  const done = TEAM.reduce((n, [, c], r) => n + Array.from({ length: c }).filter((_, k) => k + r <= step - 1).length, 0);
  const pct = Math.round((done / (TEAM.length * COLS.length)) * 100);
  return (
    <div className={`${GLASS} grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto]`}>
      <div className="overflow-x-auto">
        <div className="min-w-[520px]">
          <div className="grid grid-cols-[130px_repeat(4,1fr)] gap-2 pb-2 font-mono text-[10.5px] uppercase tracking-wide text-white/40"><span />{COLS.map((c) => <span key={c} className="text-center">{c}</span>)}</div>
          {TEAM.map(([n, c, tone], r) => (
            <div key={n} className="grid grid-cols-[130px_repeat(4,1fr)] items-center gap-2 border-t border-white/5 py-2">
              <span className="flex items-center gap-2 text-[13px] font-semibold text-white"><Avatar name={n} i={tone} size={26} />{n.split(" ")[0]}</span>
              {COLS.map((_, k) => {
                const on = k < c && k + r <= step - 1;
                return <span key={k} className="mx-auto flex h-9 w-full max-w-[92px] items-center justify-center rounded-xl transition-all duration-500" style={{ background: on ? (k === 3 ? "linear-gradient(135deg, #34e3ad, #2cd3ff)" : "linear-gradient(135deg, #7c5cff, #4d7bff)") : "rgb(255 255 255 / 0.05)", transform: on ? "scale(1)" : "scale(.9)", boxShadow: on ? "0 8px 20px -8px rgb(124 92 255 / 0.8)" : "none" }}>{on && <Check className="pop-in h-4 w-4 text-white" strokeWidth={3.5} />}</span>;
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center rounded-2xl bg-black/25 p-6">
        <Ring value={pct / 100} size={150} stroke={14} from="#b9a6ff" to="#2cd3ff" track="rgb(255 255 255 / 0.09)" duration={700}><b className="font-display text-[36px] font-semibold text-white"><CountTo to={pct} run={live} duration={700} />%</b></Ring>
        <p className="mt-3 text-[13px] text-white/55">of the team's steps done</p>
      </div>
    </div>
  );
}

export function TeamSection() {
  return <Live>{(live) => <Team live={live} />}</Live>;
}
