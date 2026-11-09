"use client";

import { useEffect, useState } from "react";
import { Check, Moon } from "lucide-react";
import { Avatar, Pill } from "@/components/ProductMocks";
import { CountTo, Cursor, Live, Ring, TypeText, useStepper } from "@/components/motion";

const SHEET = "rounded-3xl border border-teal-100 bg-white shadow-[0_40px_90px_-40px_rgb(10_120_110_/_0.45)]";
const EASE = "cubic-bezier(.4,.1,.2,1)";
const hms = (s: number) => [Math.floor(s / 3600), Math.floor((s % 3600) / 60), Math.floor(s % 60)].map((n) => String(n).padStart(2, "0")).join(":");

/* ───────────── Hero: clock in, a day passes, clock out ───────────── */

const CLOCK_TIMING: readonly number[] = [1800, 1000, 5000, 1000, 4000];

function Clock({ live }: { live: boolean }) {
  const [step] = useStepper(5, CLOCK_TIMING, live);
  const working = step === 2;
  const value = [0, 0.03, 0.68, 0.68, 1][step];
  const secs = [0, 0, 16330, 16330, 29520][step];
  const label = step <= 1 ? "Not clocked in" : step <= 3 ? "Working" : "Clocked out";
  const tone = step <= 1 ? "#8fb7b0" : step <= 3 ? "#34e3ad" : "#9db8ff";
  return (
    <div className="relative mx-auto flex w-full max-w-[420px] flex-col items-center rounded-[36px] border border-white/10 bg-white/[0.05] p-8 backdrop-blur-md">
      <Ring value={value} size={280} stroke={18} from="#34e3ad" to="#2cd3ff" track="rgb(255 255 255 / 0.09)" duration={working ? 4600 : 900}>
        <span className="text-center">
          <span key={label} className="pop-in inline-block rounded-full px-3 py-1 text-[11.5px] font-semibold" style={{ color: tone, background: `${tone}22` }}>{label}</span>
          <b className="font-display mt-3 block text-[44px] font-semibold leading-none text-white"><CountTo to={secs} run={live} duration={working ? 4600 : 900} format={hms} /></b>
          <span className="mt-2 block text-[12.5px] text-white/50">{step === 4 ? "8h 12m today" : "Today"}</span>
        </span>
      </Ring>
      <span className={`mt-7 flex h-12 w-48 items-center justify-center rounded-2xl text-[15px] font-semibold text-white transition-all duration-300 ${step === 1 || step === 3 ? "scale-95" : ""}`} style={{ background: step >= 2 && step <= 3 ? "#f43f5e" : step === 4 ? "#2a3b52" : "linear-gradient(135deg, #10c98f, #2cd3ff)" }}>{step >= 4 ? "See you tomorrow" : step >= 2 ? "Clock out" : "Clock in"}</span>
      <Cursor x="58%" y={step === 0 ? 400 : 360} down={step === 1 || step === 3} hidden={step === 0 || step === 2 || step === 4} />
    </div>
  );
}

export function ClockHero() {
  return <Live className="max-sm:[zoom:0.85]">{(live) => <Clock live={live} />}</Live>;
}

/* ───────────── Heatmap: a month painting itself ───────────── */

type Day = { n: number; kind: "present" | "weekend" | "holiday" | "leave" | "absent" | "none" };
const KINDS: Record<Exclude<Day["kind"], "none">, [string, string]> = { present: ["#10c98f", "Present"], weekend: ["#dbe5e3", "Weekend"], holiday: ["#ff5fb0", "Holiday"], leave: ["#ffb547", "Leave"], absent: ["#f43f5e", "Absent"] };
const MONTH: Day[] = Array.from({ length: 35 }, (_, i) => {
  const n = i + 1;
  if (n > 30) return { n: 0, kind: "none" };
  const col = i % 7;
  if (col === 0 || col === 6) return { n, kind: "weekend" };
  if (n === 11) return { n, kind: "holiday" };
  if (n === 18 || n === 19) return { n, kind: "leave" };
  if (n === 24) return { n, kind: "absent" };
  return { n, kind: "present" };
});
const COUNTS = (Object.keys(KINDS) as (keyof typeof KINDS)[]).map((k) => [k, MONTH.filter((d) => d.kind === k).length] as const);
const TIPS: [number, string][] = [[4, "Wed 4 · Present · 9h 04m"], [11, "Wed 11 · Holiday"], [18, "Wed 18 · Leave"], [24, "Tue 24 · Absent"], [26, "Thu 26 · Present · 8h 47m"]];

function Heat({ live }: { live: boolean }) {
  const [painted, setPainted] = useState(false);
  const [tip] = useStepper(TIPS.length, 1900, live && painted);
  useEffect(() => {
    if (live) setPainted(true);
  }, [live]);
  return (
    <div className="grid items-center gap-6 lg:grid-cols-[1.25fr_0.75fr]">
      <div className={`${SHEET} p-5 sm:p-7`}>
        <div className="mb-4 flex items-center justify-between"><b className="font-display text-[20px] font-semibold">November</b><span className="rounded-full bg-teal-50 px-3 py-1 text-[11.5px] font-semibold text-teal-700">{TIPS[tip][1]}</span></div>
        <div className="mb-2 grid grid-cols-7 gap-2 text-center font-mono text-[10.5px] uppercase text-muted">{["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}</div>
        <div className="grid grid-cols-7 gap-2">
          {MONTH.map((d, i) => {
            if (d.kind === "none") return <i key={i} />;
            const [c] = KINDS[d.kind];
            const on = TIPS[tip][0] === d.n;
            return <span key={i} className="flex aspect-square items-center justify-center rounded-xl text-[12px] font-semibold" style={{ background: painted ? c : "#eef3f2", color: painted && d.kind !== "weekend" ? "#fff" : "#7d8f8c", transform: on ? "scale(1.14)" : painted ? "none" : "scale(.6)", boxShadow: on ? `0 12px 24px -8px ${c}` : "none", transition: `all .55s ${EASE} ${painted ? 0 : ((i % 7) + Math.floor(i / 7)) * 80}ms` }}>{d.n}</span>;
          })}
        </div>
      </div>
      <div className="space-y-2.5">
        {COUNTS.map(([k, n]) => <div key={k} className={`${SHEET} flex items-center gap-4 !rounded-2xl p-4`}><i className="h-9 w-9 rounded-xl" style={{ background: KINDS[k][0] }} /><span className="flex-1 text-[15px] font-semibold">{KINDS[k][1]}</span><CountTo to={n} run={live} className="font-display text-[28px] font-semibold" /></div>)}
      </div>
    </div>
  );
}

export function HeatSection() {
  return <Live>{(live) => <Heat live={live} />}</Live>;
}

/* ───────────── Leave: request, approve, balance updates ───────────── */

const LEAVE_TIMING: readonly number[] = [1500, 1500, 1700, 3600];

function Leave({ live }: { live: boolean }) {
  const [step] = useStepper(4, LEAVE_TIMING, live);
  const approved = step >= 2;
  return (
    <div className="grid items-center gap-4 md:grid-cols-[1fr_1fr_auto]">
      <div className={`${SHEET} p-5`}>
        <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted">Meera files a request</p>
        <div className="mt-3 rounded-2xl border border-teal-100 bg-teal-50/50 p-4 transition-all duration-700" style={{ opacity: step >= 0 ? 1 : 0, transform: approved ? "translateX(10px)" : "none" }}>
          <div className="flex items-center gap-3"><Avatar name="Meera Rao" i={5} size={36} /><span><b className="block text-[14px] font-semibold leading-4">Meera Rao</b><span className="text-[12px] text-muted">Casual leave · 2 days</span></span></div>
          <p className="mt-3 text-[12.5px] text-ink-soft">Wed 18 to Thu 19 November. Family event.</p>
        </div>
      </div>
      <div className={`${SHEET} relative p-5`}>
        <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted">Her manager decides</p>
        <div className={`mt-3 rounded-2xl border p-4 transition-all duration-500 ${approved ? "border-emerald-300 bg-emerald-50" : "border-teal-100 bg-white"}`}>
          <p className="text-[13.5px] font-semibold">{approved ? "Approved with a note: enjoy!" : "Waiting for your decision"}</p>
          <div className="mt-3 flex gap-2"><span className={`rounded-lg px-4 py-2 text-[12.5px] font-semibold text-white transition-all duration-300 ${step === 1 ? "scale-95" : ""}`} style={{ background: approved ? "#10c98f" : "#14b8a6" }}>{approved ? "Approved" : "Approve"}</span>{!approved && <span className="rounded-lg border border-line px-4 py-2 text-[12.5px] font-semibold">Decline</span>}</div>
        </div>
        <Cursor x={step >= 1 ? 62 : 190} y={step >= 1 ? 108 : 170} down={step === 1} hidden={step < 1 || step > 1} />
      </div>
      <div className={`${SHEET} flex flex-col items-center p-5`}>
        <Ring value={(approved ? 10 : 12) / 12} size={110} stroke={10} from="#14b8a6" to="#2cd3ff" track="rgb(20 184 166 / 0.12)"><span className="text-center"><CountTo to={approved ? 10 : 12} run={live} className="font-display block text-[30px] font-semibold leading-none" /><span className="text-[10.5px] text-muted">days left</span></span></Ring>
        <p className="mt-3 text-[12px] font-semibold text-muted">Casual balance</p>
      </div>
    </div>
  );
}

export function LeaveSection() {
  return <Live>{(live) => <Leave live={live} />}</Live>;
}

/* ───────────── Missed punch: fixed with a request ───────────── */

const FIX_TIMING: readonly number[] = [1800, 1900, 1700, 4000];

function Fix({ live }: { live: boolean }) {
  const [step] = useStepper(4, FIX_TIMING, live);
  const end = step >= 3 ? 75 : 100;
  return (
    <div className={`${SHEET} p-6 sm:p-8`}>
      <div className="flex flex-wrap items-center justify-between gap-3"><span className="flex items-center gap-3"><Avatar name="Dev Patel" i={2} size={38} /><span><b className="block text-[15px] font-semibold leading-4">Dev Patel</b><span className="text-[12.5px] text-muted">Tuesday 25 November</span></span></span>{step >= 3 ? <span className="pop-in"><Pill color="#10c98f">Corrected</Pill></span> : <Pill color="#f43f5e">Missed clock-out</Pill>}</div>
      <div className="mt-8">
        <div className="relative h-12 rounded-2xl bg-teal-50">
          <i className="absolute inset-y-0 left-[19.3%] block rounded-2xl" style={{ width: `${end - 19.3}%`, background: step >= 3 ? "linear-gradient(90deg, #10c98f, #2cd3ff)" : "linear-gradient(90deg, #10c98f, #f43f5e)", transition: `all 1s ${EASE}` }} />
          {step < 3 && <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-white/90 px-2 py-1 font-mono text-[10px] font-semibold text-rose-600">Closed at 10:00 pm</span>}
        </div>
        <div className="mt-2 flex justify-between font-mono text-[10.5px] text-muted"><span>6:00</span><span>10:00</span><span>14:00</span><span>18:00</span><span>22:00</span></div>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className={`rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition-all duration-300 ${step >= 1 ? "bg-teal-500" : "bg-teal-500/30"}`}>Request a correction</span>
        {step >= 1 && <span className="pop-in rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-[13px]"><TypeText text="Clock-out should be 6:00 pm" run={step >= 1} speed={34} /></span>}
        {step >= 2 && <span className="pop-in flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-[12.5px] font-semibold text-amber-800">{step >= 3 ? <><Check className="h-4 w-4 text-emerald-600" strokeWidth={3} />Approved by a manager</> : "Sent to a manager"}</span>}
      </div>
    </div>
  );
}

export function FixSection() {
  return <Live>{(live) => <Fix live={live} />}</Live>;
}

/* ───────────── Night: open sessions close at 10 pm ───────────── */

const NIGHT_TIMING: readonly number[] = [1400, 2200, 800, 800, 800, 3400];

function Night({ live }: { live: boolean }) {
  const [step] = useStepper(6, NIGHT_TIMING, live);
  const late = step >= 1;
  const people: [string, string][] = [["Ana Silva", "Clocked in 9:02 am"], ["Yusuf Khan", "Clocked in 9:40 am"], ["Meera Rao", "Clocked in 8:55 am"]];
  return (
    <div className="grid items-center gap-8 md:grid-cols-[auto_1fr]">
      <div className="mx-auto flex flex-col items-center rounded-[32px] bg-[#06211f] p-7 text-white shadow-[0_40px_90px_-40px_rgb(10_120_110_/_0.7)]">
        <svg viewBox="0 0 120 120" className="h-[170px] w-[170px]" aria-hidden>
          <circle cx="60" cy="60" r="54" fill="rgb(255 255 255 / 0.05)" stroke="rgb(255 255 255 / 0.2)" strokeWidth="1.5" />
          {Array.from({ length: 12 }, (_, i) => <line key={i} x1="60" y1="10" x2="60" y2={i % 3 === 0 ? 21 : 15} stroke="rgb(255 255 255 / 0.4)" strokeWidth={i % 3 === 0 ? 2 : 1} transform={`rotate(${i * 30} 60 60)`} />)}
          <line x1="60" y1="60" x2="60" y2="20" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          <line x1="60" y1="60" x2="60" y2="34" stroke="#34e3ad" strokeWidth="4" strokeLinecap="round" style={{ transformOrigin: "60px 60px", transform: `rotate(${late ? 300 : 210}deg)`, transition: "transform 2s cubic-bezier(.4,.1,.2,1)" }} />
          <circle cx="60" cy="60" r="4" fill="#fff" />
        </svg>
        <p className="font-display mt-3 flex items-center gap-2 text-[30px] font-semibold"><Moon className="h-6 w-6 text-[#9db8ff]" />{late ? "10:00 pm" : "7:00 pm"}</p>
      </div>
      <div className="space-y-2.5">
        {people.map(([n, t], k) => {
          const closed = step >= k + 2;
          return <div key={n} className={`${SHEET} flex items-center gap-4 !rounded-2xl p-4`}><Avatar name={n} i={k + 3} size={38} /><span className="flex-1"><b className="block text-[14.5px] font-semibold leading-4">{n}</b><span className="text-[12.5px] text-muted">{t}</span></span><span key={String(closed)} className="pop-in"><Pill color={closed ? "#8a93b2" : "#10c98f"}>{closed ? "Closed at 10:00 pm" : "Working"}</Pill></span></div>;
        })}
      </div>
    </div>
  );
}

export function NightSection() {
  return <Live>{(live) => <Night live={live} />}</Live>;
}

/* ───────────── Team calendar: who is out ───────────── */

const CAL_DAYS = ["Mon 17", "Tue 18", "Wed 19", "Thu 20", "Fri 21", "Mon 24", "Tue 25", "Wed 26", "Thu 27", "Fri 28"];
const OUT: { name: string; from: number; to: number; tone: number; color: string; kind: string }[] = [
  { name: "Meera Rao", from: 1, to: 2, tone: 5, color: "#ffb547", kind: "Casual" },
  { name: "Dev Patel", from: 3, to: 3, tone: 2, color: "#ff5fb0", kind: "Sick" },
  { name: "Sara Lin", from: 6, to: 9, tone: 1, color: "#14b8a6", kind: "Annual" },
  { name: "Anil Shah", from: 4, to: 5, tone: 3, color: "#7c5cff", kind: "Casual" },
];

function Cal({ live }: { live: boolean }) {
  const [step] = useStepper(6, [900, 800, 800, 800, 800, 3800], live);
  return (
    <div className={`${SHEET} overflow-hidden p-5 sm:p-6`}>
      <div className="grid grid-cols-[110px_1fr] gap-x-3 sm:grid-cols-[150px_1fr]">
        <span />
        <div className="grid grid-cols-10 text-center font-mono text-[9.5px] uppercase tracking-wide text-muted">{CAL_DAYS.map((d) => <span key={d}>{d}</span>)}</div>
        {OUT.map((o, k) => (
          <div key={o.name} className="contents">
            <span className="flex h-12 items-center gap-2.5 text-[13px] font-semibold"><Avatar name={o.name} i={o.tone} size={26} /><span className="hidden truncate sm:block">{o.name}</span></span>
            <div className="relative h-12 border-t border-teal-50"><div className="pointer-events-none absolute inset-0 grid grid-cols-10">{Array.from({ length: 10 }, (_, i) => <i key={i} className="border-l border-teal-50" />)}</div>
              <span className="absolute top-2 flex h-8 origin-left items-center rounded-lg px-2 text-[11px] font-semibold text-white" style={{ left: `${o.from * 10 + 0.6}%`, width: `${(o.to - o.from + 1) * 10 - 1.2}%`, background: o.color, transform: step > k ? "scaleX(1)" : "scaleX(0)", opacity: step > k ? 1 : 0, transition: `transform .6s ${EASE}, opacity .3s` }}>{o.kind}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[13px] text-muted">{step >= 5 ? "Four people are out across the next two weeks. The team plans around it." : "Approved leave lands on the shared calendar."}</p>
    </div>
  );
}

export function CalSection() {
  return <Live>{(live) => <Cal live={live} />}</Live>;
}
