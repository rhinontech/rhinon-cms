"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Avatar, Pill } from "@/components/ProductMocks";
import { Confetti, CountTo, Cursor, Live, useStepper } from "@/components/motion";

const INR = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const SHEET = "rounded-3xl border border-amber-100 bg-white shadow-[0_40px_90px_-40px_rgb(200_120_20_/_0.45)]";
const GRAD = "linear-gradient(135deg, #ffb547, #ff8a4c)";
const EASE = "cubic-bezier(.4,.1,.2,1)";

/* ───────────── Hero: a fan of payslips, the front one counting up ───────────── */

const SLIPS: { name: string; role: string; gross: number; ded: number; tone: number }[] = [
  { name: "Ana Silva", role: "Engineering", gross: 95000, ded: 9800, tone: 4 },
  { name: "Yusuf Khan", role: "Sales", gross: 82000, ded: 8100, tone: 2 },
  { name: "Meera Rao", role: "Design", gross: 110000, ded: 12400, tone: 5 },
];
const SLOT: { x: number; y: number; r: number; s: number; z: number }[] = [
  { x: 0, y: 0, r: 0, s: 1, z: 30 },
  { x: 58, y: 14, r: 6, s: 0.94, z: 20 },
  { x: -58, y: 26, r: -7, s: 0.88, z: 10 },
];

function Slip({ slip, front, live }: { slip: (typeof SLIPS)[number]; front: boolean; live: boolean }) {
  const lines: [string, number, boolean][] = [["Basic", slip.gross * 0.5, false], ["HRA", slip.gross * 0.2, false], ["Travel, medical and other", slip.gross * 0.3, false], ["PF, PT and TDS", -slip.ded, true]];
  return (
    <div className="h-full rounded-[24px] border border-amber-100 bg-white p-6 shadow-[0_40px_80px_-30px_rgb(200_120_20_/_0.55)]">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-3"><Avatar name={slip.name} i={slip.tone} size={40} /><span><b className="block text-[15px] font-semibold leading-4">{slip.name}</b><span className="text-[12px] text-muted">{slip.role} · October</span></span></span>
        <Pill color="#10c98f">Paid</Pill>
      </div>
      <div className="mt-5 space-y-2.5 border-t border-dashed border-amber-200 pt-4">
        {lines.map(([k, v, neg]) => <p key={k} className="flex justify-between text-[13px]"><span className="text-ink-soft">{k}</span><b className={`tabular-nums font-semibold ${neg ? "text-rose-500" : ""}`}>{neg ? "−" : ""}{INR(Math.abs(v))}</b></p>)}
      </div>
      <div className="mt-4 rounded-2xl bg-amber-50 p-4">
        <p className="font-mono text-[10.5px] uppercase tracking-wider text-amber-700">Net pay</p>
        <p className="font-display text-[40px] font-semibold leading-none">{front ? <CountTo to={slip.gross - slip.ded} run={live} format={INR} /> : INR(slip.gross - slip.ded)}</p>
      </div>
    </div>
  );
}

function Fan({ live }: { live: boolean }) {
  const [front] = useStepper(3, 3400, live);
  return (
    <div className="relative mx-auto h-[430px] w-full max-w-[420px]">
      {SLIPS.map((slip, i) => {
        const slot = SLOT[(i - front + 3) % 3];
        return (
          <div key={slip.name} className="absolute left-1/2 top-4 h-[372px] w-[320px] -ml-[160px]" style={{ zIndex: slot.z, transform: `translate(${slot.x}px, ${slot.y}px) rotate(${slot.r}deg) scale(${slot.s})`, transition: `transform .9s ${EASE}`, opacity: slot.z === 10 ? 0.85 : 1 }}>
            <Slip slip={slip} front={(i - front + 3) % 3 === 0} live={live} />
          </div>
        );
      })}
    </div>
  );
}

export function PayslipFan() {
  return <Live className="max-sm:[zoom:0.85]">{(live) => <Fan live={live} />}</Live>;
}

/* ───────────── The run: draft, processed, paid ───────────── */

const RUN_TIMING: readonly number[] = [2000, 1100, 2000, 1100, 4200];
const STAGES = [["Draft", "#8a93b2"], ["Processed", "#7c5cff"], ["Paid", "#10c98f"]] as const;
const TEAM: [string, number, number][] = [["Ana Silva", 95000, 9800], ["Yusuf Khan", 82000, 8100], ["Meera Rao", 110000, 12400], ["Dev Patel", 64000, 5900]];
const GROSS = TEAM.reduce((n, r) => n + r[1], 0);
const DED = TEAM.reduce((n, r) => n + r[2], 0);

function Run({ live }: { live: boolean }) {
  const [step] = useStepper(5, RUN_TIMING, live);
  const stage = step <= 1 ? 0 : step <= 3 ? 1 : 2;
  const [fire, setFire] = useState(0);
  useEffect(() => {
    if (step === 4) setFire((f) => f + 1);
  }, [step]);
  const locked = stage >= 1;
  return (
    <div className={`${SHEET} relative p-5 sm:p-8`}>
      <div className="flex items-center">
        {STAGES.map(([name, color], k) => (
          <div key={name} className="flex flex-1 items-center last:flex-none">
            <span className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold text-white transition-all duration-500" style={{ background: k <= stage ? color : "#e8e0d0", transform: k === stage ? "scale(1.12)" : "none", boxShadow: k === stage ? `0 10px 24px -6px ${color}` : "none" }}>{k < stage || step === 4 ? <Check className="h-4 w-4" strokeWidth={3.5} /> : k + 1}</span><b className={`hidden text-[14px] font-semibold sm:block ${k <= stage ? "text-ink" : "text-muted"}`}>{name}</b></span>
            {k < 2 && <span className="mx-3 h-[3px] flex-1 overflow-hidden rounded-full bg-amber-100"><i className="block h-full rounded-full transition-all duration-[900ms]" style={{ width: k < stage ? "100%" : "0%", background: GRAD }} /></span>}
          </div>
        ))}
      </div>
      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        {[["Gross", GROSS, false], ["Deductions", DED, true], ["Net payable", GROSS - DED, false]].map(([k, v, neg]) => (
          <div key={k as string} className={`rounded-2xl p-4 transition-colors duration-500 ${k === "Net payable" ? "bg-amber-50" : "bg-[#faf7f0]"}`}>
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted">{k as string}</p>
            <p className={`font-display mt-1 text-[28px] font-semibold leading-none ${neg ? "text-rose-500" : ""}`}><CountTo to={locked ? (v as number) : (v as number) * 0.96} run={live} format={(n) => `${neg ? "−" : ""}${INR(n)}`} /></p>
          </div>
        ))}
      </div>
      <div className="mt-5 overflow-hidden rounded-2xl border border-amber-100">
        {TEAM.map(([n, g, d], i) => (
          <div key={n} className="flex items-center gap-3 border-b border-amber-50 px-4 py-2.5 last:border-b-0">
            <Avatar name={n} i={i + 2} size={26} /><span className="flex-1 text-[13px] font-semibold">{n}</span>
            <span className="hidden text-[12.5px] tabular-nums text-muted sm:block">{INR(g)}</span>
            <b className="w-24 text-right text-[13px] tabular-nums">{INR(g - d)}</b>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <span key={stage} className="pop-in"><Pill color={STAGES[stage][1]}>{stage === 0 ? "Draft" : stage === 1 ? "Processed. Numbers locked." : "Paid. Payslips sent."}</Pill></span>
        <span className={`rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-300 ${step === 1 || step === 3 ? "scale-95" : ""}`} style={{ background: stage === 2 ? "#10c98f" : GRAD }}>{stage === 0 ? "Process run" : stage === 1 ? "Mark as paid" : "Paid ✓"}</span>
      </div>
      <Cursor x="calc(100% - 100px)" y="calc(100% - 38px)" down={step === 1 || step === 3} hidden={step === 0 || step === 2 || step === 4} />
      <Confetti fire={fire} at={{ left: "50%", top: "40%" }} />
    </div>
  );
}

export function RunSection() {
  return <Live className="max-sm:[zoom:0.82]">{(live) => <Run live={live} />}</Live>;
}

/* ───────────── Structure: salary components and deductions ───────────── */

const PARTS: [string, number, string][] = [["Basic", 50, "#ffb547"], ["HRA", 20, "#ff8a4c"], ["Travel", 8, "#ff5fb0"], ["Medical", 7, "#a76bff"], ["Other", 15, "#4d7bff"]];
const DEDUCT: [string, number, string][] = [["PF", 5700, "#ff8a4c"], ["PT", 200, "#ffb547"], ["TDS", 3900, "#a76bff"]];
const GROSS_ONE = 95000;

function Structure({ live }: { live: boolean }) {
  const [hot] = useStepper(5, 1900, live);
  const total = DEDUCT.reduce((n, d) => n + d[1], 0);
  const R = 62;
  const C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <div className={`${SHEET} p-6 sm:p-8`}>
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Salary structure · Ana Silva</p>
        <p className="font-display mt-1 text-[36px] font-semibold leading-none">{INR(GROSS_ONE)}<span className="ml-2 text-[14px] font-medium text-muted">a month</span></p>
        <div className="mt-7 flex h-14 gap-1 overflow-hidden rounded-2xl">
          {PARTS.map(([n, w, c], i) => <i key={n} className="block h-full rounded-lg" style={{ width: live ? `${w}%` : "0%", background: c, opacity: hot === i ? 1 : 0.45, transform: hot === i ? "scaleY(1.12)" : "none", transition: `width 1s ${EASE} ${i * 90}ms, opacity .5s, transform .5s` }} />)}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {PARTS.map(([n, w, c], i) => <div key={n} className={`rounded-xl border p-3 transition-all duration-500 ${hot === i ? "border-amber-300 bg-amber-50" : "border-transparent bg-[#faf7f0]"}`}><p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-muted"><i className="h-2 w-2 rounded-full" style={{ background: c }} />{n}</p><p className="mt-1 text-[14px] font-bold tabular-nums">{INR((GROSS_ONE * w) / 100)}</p></div>)}
        </div>
      </div>
      <div className={`${SHEET} flex flex-col items-center p-6 sm:p-8`}>
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Deductions</p>
        <div className="relative mt-4 h-[170px] w-[170px]">
          <svg viewBox="0 0 150 150" className="-rotate-90" aria-hidden>
            <circle cx="75" cy="75" r={R} fill="none" stroke="#f3ecde" strokeWidth="18" />
            {DEDUCT.map(([n, v, c]) => { const len = (v / total) * C; const el = <circle key={n} cx="75" cy="75" r={R} fill="none" stroke={c} strokeWidth="18" strokeDasharray={`${live ? len - 2 : 0} ${C}`} strokeDashoffset={-acc} style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.3,.7,.2,1)" }} />; acc += len; return el; })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-[11px] text-muted">Net pay</span><b className="font-display text-[22px] font-semibold"><CountTo to={GROSS_ONE - total} run={live} format={INR} /></b></div>
        </div>
        <div className="mt-5 w-full space-y-2">{DEDUCT.map(([n, v, c]) => <p key={n} className="flex items-center justify-between text-[13px]"><span className="flex items-center gap-2 font-semibold"><i className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />{n}</span><span className="tabular-nums text-muted">{INR(v)}</span></p>)}</div>
      </div>
    </div>
  );
}

export function StructureSection() {
  return <Live>{(live) => <Structure live={live} />}</Live>;
}

/* ───────────── Payslips for everyone: a wave of flips ───────────── */

const TILES: [string, number][] = [["Ana Silva", 85200], ["Yusuf Khan", 73900], ["Meera Rao", 97600], ["Dev Patel", 58100], ["Sara Lin", 66400], ["Anil Shah", 71200], ["Ravi Menon", 49800], ["Chloe Martin", 80300], ["Priya Nair", 90100], ["Neha Rao", 62700], ["Arjun Das", 77500], ["Isha Jain", 68900]];

function Wall({ live }: { live: boolean }) {
  const [flip] = useStepper(2, [900, 4200], live);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" style={{ perspective: 900 }}>
      {TILES.map(([n, v], i) => {
        const done = flip === 1;
        return (
          <div key={n} className="relative h-[104px]" style={{ transformStyle: "preserve-3d", transform: done ? "rotateY(180deg)" : "none", transition: `transform .7s ${EASE} ${((i % 4) + Math.floor(i / 4)) * 120}ms` }}>
            <div className="absolute inset-0 flex items-center gap-3 rounded-2xl border border-amber-100 bg-white p-3.5 shadow-sm" style={{ backfaceVisibility: "hidden" }}><Avatar name={n} i={i} size={36} /><span className="min-w-0"><b className="block truncate text-[13px] font-semibold">{n}</b><span className="text-[12px] tabular-nums text-muted">{INR(v)}</span></span></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}><Check className="h-6 w-6" strokeWidth={3} /><span className="text-[12.5px] font-semibold">Payslip sent</span></div>
          </div>
        );
      })}
    </div>
  );
}

export function WallSection() {
  return <Live>{(live) => <Wall live={live} />}</Live>;
}
