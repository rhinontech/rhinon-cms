"use client";

import { useEffect, useState } from "react";
import { Check, Mail, Target } from "lucide-react";
import { Avatar, Pill } from "@/components/ProductMocks";
import { Confetti, CountTo, Live, Ring, TypeText, useReducedMotion, useStepper } from "@/components/motion";

const SHEET = "rounded-3xl border border-[#e9e3d8] bg-white shadow-[0_40px_90px_-40px_rgb(20_60_140_/_0.35)]";
const SLIDE = "all .65s cubic-bezier(.4,.1,.2,1)";

/* ───────────── Hero: inbox zero, one conversation at a time ───────────── */

const MAILS: [name: string, subject: string, priority: string, color: string][] = [
  ["Yusuf Khan", "Re: Quick question on pricing", "High", "#ff5fb0"],
  ["Meera Rao", "Invoice for September", "Normal", "#2f9bff"],
  ["Dev Patel", "Can we move our call?", "Normal", "#2f9bff"],
  ["Sara Lin", "Please resend the contract", "Normal", "#2f9bff"],
  ["Anil Shah", "We are not receiving your emails", "High", "#ff5fb0"],
  ["Ravi Menon", "Thanks, all sorted", "Low", "#8a93b2"],
];
const ROW = 64;
const ZERO_TIMING: readonly number[] = [1500, 1200, 1200, 1200, 1200, 1200, 3600];

function Zero({ live }: { live: boolean }) {
  const [r] = useStepper(7, ZERO_TIMING, live);
  const [fire, setFire] = useState(0);
  useEffect(() => {
    if (r === 6) setFire((f) => f + 1);
  }, [r]);
  const open = 6 - r;
  return (
    <div className={`${SHEET} grid gap-2 p-4 sm:grid-cols-[1fr_190px] sm:p-5`}>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-[18px] font-semibold">Inbox</p>
          <Pill color="#2f9bff">Shared with your team</Pill>
        </div>
        <div className="relative" style={{ height: ROW * 6 }}>
          {MAILS.map(([name, subject, prio, color], i) => {
            const resolved = i < r;
            const top = i === r;
            return (
              <div key={name} className="absolute inset-x-0" style={{ top: Math.max(0, i - r) * ROW, height: ROW - 8, transform: resolved ? "translateX(115%)" : "none", opacity: resolved ? 0 : 1, transition: SLIDE }}>
                <div className={`flex h-full items-center gap-3 rounded-2xl border px-3.5 transition-colors duration-500 ${top ? "border-sky-300/70 bg-sky-50" : "border-[#eee9df] bg-[#fdfcfa]"}`}>
                  <Avatar name={name} i={i} size={32} />
                  <span className="min-w-0 flex-1"><b className="block truncate text-[13px] font-semibold leading-4">{name}</b><span className="block truncate text-[12px] text-muted">{subject}</span></span>
                  {top ? <span key={r} className="pop-in flex items-center gap-1.5 rounded-full bg-white px-2 py-1 text-[10.5px] font-semibold text-sky-700 ring-1 ring-sky-200"><Avatar name="Ana Silva" i={4} size={16} />Ana</span> : <Pill color={color}>{prio}</Pill>}
                </div>
              </div>
            );
          })}
          {r === 6 && <div className="pop-in absolute inset-0 flex flex-col items-center justify-center text-center"><p className="font-display text-[34px] font-semibold">Inbox zero.</p><p className="mt-1 text-[14px] text-muted">Every conversation answered and closed.</p></div>}
        </div>
      </div>
      <div className="relative flex flex-col items-center justify-center rounded-2xl bg-[#f4f9ff] p-4">
        <Ring value={open / 6} size={150} stroke={12} from="#2cd3ff" to="#2f5bff" track="rgb(47 91 255 / 0.12)">
          {open === 0 ? <Check className="pop-in h-12 w-12 text-emerald-500" strokeWidth={3} /> : <span className="text-center"><CountTo to={open} run={live} className="font-display block text-[44px] font-semibold leading-none" /><span className="text-[12px] text-muted">open</span></span>}
        </Ring>
        <p className="mt-4 text-center text-[12.5px] text-ink-soft">{open === 0 ? "Nothing waiting" : "waiting for a reply"}</p>
        <Confetti fire={fire} at={{ left: "50%", top: "40%" }} />
      </div>
    </div>
  );
}

export function InboxZeroHero() {
  return <Live className="max-sm:[zoom:0.85]">{(live) => <Zero live={live} />}</Live>;
}

/* ───────────── Status river: tickets flowing across four lanes ───────────── */

const LANES: [string, string][] = [["Open", "#2f9bff"], ["In progress", "#7c5cff"], ["Resolved", "#10c98f"], ["Closed", "#8a93b2"]];
const TICKETS: [string, string][] = [["Pricing question", "Yusuf Khan"], ["Invoice request", "Meera Rao"], ["Call reschedule", "Dev Patel"], ["Contract resend", "Sara Lin"], ["Delivery delay", "Anil Shah"], ["Refund status", "Ravi Menon"], ["Login trouble", "Chloe Martin"]];
const CARD_H = 66;

function River({ live }: { live: boolean }) {
  const [tick] = useStepper(19, 1150, live);
  const lanes = TICKETS.map((_, k) => {
    const p = tick - k * 1.5;
    return p < 0 ? -1 : Math.min(3, Math.floor(p / 2));
  });
  const slots = lanes.map((lane, k) => (lane < 0 ? 0 : lanes.slice(0, k).filter((l) => l === lane).length));
  const counts = LANES.map((_, li) => lanes.filter((l) => l === li).length);
  const reset = tick === 0;
  return (
    <div className="grid grid-cols-4 gap-3">
      {LANES.map(([name, color], li) => (
        <div key={name} className="relative rounded-2xl bg-white/70 p-3 ring-1 ring-[#e9e3d8]" style={{ minHeight: 70 + 4 * (CARD_H + 6) }}>
          <div className="mb-3 flex items-center justify-between text-[12.5px] font-semibold"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: color }} />{name}</span><CountTo to={counts[li]} run={live} duration={500} className="text-muted" /></div>
        </div>
      ))}
      {TICKETS.map(([title, who], k) => {
        const lane = Math.max(0, lanes[k]);
        return (
          <div key={title} className="absolute" style={{ left: `calc(${lane} * (25% + 3px) + 10px)`, width: "calc(25% - 29px)", top: 48 + slots[k] * (CARD_H + 6), height: CARD_H, opacity: lanes[k] < 0 ? 0 : 1, transition: reset ? "opacity .3s" : SLIDE }}>
            <div className="h-full rounded-xl border border-[#e9e3d8] bg-white p-2.5 shadow-[0_10px_24px_-14px_rgb(20_60_140_/_0.4)]" style={{ borderLeft: `3px solid ${LANES[lane][1]}` }}>
              <p className="truncate text-[12px] font-semibold">{title}</p>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-muted"><Avatar name={who} i={k} size={16} />{who.split(" ")[0]}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function RiverSection() {
  return <Live className="relative max-sm:[zoom:0.6]">{(live) => <River live={live} />}</Live>;
}

/* ───────────── Priority: an urgent message jumps the queue ───────────── */

const QUEUE: [title: string, priority: string, color: string, sender: string][] = [
  ["Invoice for September", "Normal", "#2f9bff", "Meera Rao"],
  ["Can we move our call?", "Normal", "#2f9bff", "Dev Patel"],
  ["Please resend the contract", "Normal", "#2f9bff", "Sara Lin"],
  ["Thanks, all sorted", "Low", "#8a93b2", "Ravi Menon"],
];
const URGENT = "Checkout is down for a customer";
const PRIO_TIMING: readonly number[] = [1700, 1500, 1700, 2000, 2800];
const PRIO_ROW = 68;

function Priority({ live }: { live: boolean }) {
  const [step] = useStepper(5, PRIO_TIMING, live);
  const arrived = step >= 1;
  const top = step >= 2;
  const assigned = step >= 3;
  return (
    <div className={`${SHEET} p-4 sm:p-5`}>
      <div className="mb-3 flex items-center justify-between"><p className="font-display text-[17px] font-semibold">Sorted by priority</p><Pill color="#ff4d6d">{arrived ? "1 urgent" : "0 urgent"}</Pill></div>
      <div className="relative" style={{ height: PRIO_ROW * 5 }}>
        <div className="absolute inset-x-0" style={{ top: top ? 0 : 4 * PRIO_ROW, height: PRIO_ROW - 8, opacity: arrived ? 1 : 0, transform: arrived ? "none" : "translateY(12px)", transition: step === 0 ? "opacity .3s" : SLIDE, zIndex: 2 }}>
          <div className={`flex h-full items-center gap-3 rounded-2xl border px-3.5 transition-all duration-500 ${top ? "border-rose-300 bg-rose-50 shadow-[0_16px_36px_-18px_rgb(255_77_109_/_0.7)]" : "border-[#eee9df] bg-[#fdfcfa]"}`}>
            <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-[13px] font-bold text-white ${top && !assigned ? "ring-out" : ""}`}>!</span>
            <span className="min-w-0 flex-1"><b className="block truncate text-[13px] font-semibold">{URGENT}</b><span className="text-[12px] text-muted">{assigned ? "Assigned to Ana Silva" : "Just now"}</span></span>
            <Pill color="#ff4d6d">Urgent</Pill>
          </div>
        </div>
        {QUEUE.map(([title, prio, color, sender], i) => (
          <div key={title} className="absolute inset-x-0" style={{ top: (i + (top ? 1 : 0)) * PRIO_ROW, height: PRIO_ROW - 8, transition: SLIDE }}>
            <div className="flex h-full items-center gap-3 rounded-2xl border border-[#eee9df] bg-[#fdfcfa] px-3.5">
              <Avatar name={sender} i={i + 1} size={32} />
              <span className="min-w-0 flex-1"><b className="block truncate text-[13px] font-semibold">{title}</b><span className="text-[12px] text-muted">{sender} · waiting</span></span>
              <Pill color={color}>{prio}</Pill>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PrioritySection() {
  return <Live className="max-sm:[zoom:0.9]">{(live) => <Priority live={live} />}</Live>;
}

/* ───────────── Address: mail in, teammates out ───────────── */

const SENDERS: [string, number][] = [["Customer", 18], ["Campaign reply", 50], ["Vendor", 82]];
const TEAM: [string, string, number, number][] = [["Ana Silva", "Billing", 18, 4], ["Yusuf Khan", "Sales", 50, 2], ["Meera Rao", "Support", 82, 0]];

function Address({ live }: { live: boolean }) {
  const reduced = useReducedMotion();
  const [step] = useStepper(2, 4200, live);
  return (
    <div className="relative mx-auto hidden aspect-[16/7] w-full max-w-[980px] md:block">
      <svg viewBox="0 0 800 350" className="absolute inset-0 h-full w-full" fill="none" aria-hidden>
        {SENDERS.map(([, y], i) => {
          const d = `M150 ${y * 3.5} C 230 ${y * 3.5}, 250 175, 290 175`;
          return <g key={i}><path d={d} stroke="#2f9bff" strokeOpacity=".3" strokeWidth="2" strokeDasharray="4 7" />{!reduced && live && <circle r="5" fill="#2f9bff"><animateMotion dur="2.6s" begin={`${i * 0.5}s`} repeatCount="indefinite" path={d} /></circle>}</g>;
        })}
        {TEAM.map(([, , y], i) => {
          const d = `M510 175 C 550 175, 570 ${y * 3.5}, 650 ${y * 3.5}`;
          return <g key={i}><path d={d} stroke="#7c5cff" strokeOpacity=".3" strokeWidth="2" strokeDasharray="4 7" />{!reduced && live && <circle r="5" fill="#7c5cff"><animateMotion dur="2.6s" begin={`${1.3 + i * 0.5}s`} repeatCount="indefinite" path={d} /></circle>}</g>;
        })}
      </svg>
      {SENDERS.map(([label, y]) => (
        <span key={label} className="absolute left-0 flex w-[19%] -translate-y-1/2 items-center gap-2 rounded-xl border border-[#e9e3d8] bg-white px-3 py-2.5 text-[12.5px] font-semibold shadow-sm" style={{ top: `${y}%` }}><Mail className="h-4 w-4 text-sky-500" />{label}</span>
      ))}
      <div className="absolute left-[36%] top-1/2 w-[28%] -translate-y-1/2 rounded-2xl border border-sky-200 bg-white p-4 text-center shadow-[0_30px_60px_-26px_rgb(47_91_255_/_0.5)]">
        <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted">Your workspace address</p>
        <p className="mt-1.5 min-h-[24px] break-all text-[15px] font-semibold text-sky-700"><TypeText text="support@acme.rhinontech.in" run={live} speed={45} /></p>
      </div>
      {TEAM.map(([name, role, y, tone]) => (
        <span key={name} className="absolute right-0 flex w-[21%] -translate-y-1/2 items-center gap-2.5 rounded-xl border border-[#e9e3d8] bg-white px-2.5 py-2 shadow-sm" style={{ top: `${y}%` }}>
          <Avatar name={name} i={tone} size={30} />
          <span className="min-w-0"><b className="block truncate text-[12.5px] font-semibold leading-4">{name}</b><span className="text-[11px] text-muted">{role}</span></span>
        </span>
      ))}
      <span key={step} className="pop-in absolute right-[22%] top-[3%] rounded-full bg-violet/10 px-3 py-1 text-[11px] font-semibold text-violet">Assigned to Ana</span>
    </div>
  );
}

export function AddressSection() {
  return (
    <Live>
      {(live) => (
        <>
          <Address live={live} />
          <div className="md:hidden">
            <div className={`${SHEET} p-5 text-center`}>
              <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted">Your workspace address</p>
              <p className="mt-1.5 break-all text-[16px] font-semibold text-sky-700">support@acme.rhinontech.in</p>
              <p className="mt-3 text-[13px] text-ink-soft">Customers, campaign replies and vendors all write here. Your team picks them up.</p>
            </div>
          </div>
        </>
      )}
    </Live>
  );
}

/* ───────────── A reply lands on the lead ───────────── */

const LEAD_TIMING: readonly number[] = [1700, 1500, 3000];

function Thread({ live }: { live: boolean }) {
  const [step] = useStepper(3, LEAD_TIMING, live);
  return (
    <div className="grid items-center gap-4 md:grid-cols-[1fr_90px_1fr]">
      <div className={`${SHEET} p-4`}>
        <div className="mb-3 flex items-center gap-2 text-[12.5px] font-semibold"><Mail className="h-4 w-4 text-sky-500" />Inbox</div>
        <div className={`rounded-2xl border p-3.5 transition-all duration-500 ${step >= 1 ? "border-sky-300 bg-sky-50" : "border-[#eee9df] bg-[#fdfcfa]"}`}>
          <div className="flex items-center gap-2.5"><Avatar name="Priya Nair" i={3} size={30} /><span><b className="block text-[13px] font-semibold leading-4">Priya Nair</b><span className="text-[11.5px] text-muted">Re: Quick question about stock reports</span></span></div>
          <p className="mt-3 text-[13.5px] leading-6 text-ink-soft">“Sounds interesting. Can we talk on Thursday?”</p>
        </div>
      </div>
      <div className="relative hidden h-10 md:block">
        <i className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-sky-100" />
        <i className="absolute left-0 top-1/2 block h-[3px] -translate-y-1/2 rounded-full bg-gradient-to-r from-cyan to-electric transition-all duration-[1400ms]" style={{ width: step >= 1 ? "100%" : "0%" }} />
        <i className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-electric shadow-[0_0_18px_4px_rgb(47_91_255_/_0.5)] transition-all duration-[1400ms]" style={{ left: step >= 1 ? "calc(100% - 16px)" : "0%", opacity: step >= 1 ? 1 : 0.2 }} />
      </div>
      <div className={`${SHEET} p-4`}>
        <div className="mb-3 flex items-center gap-2 text-[12.5px] font-semibold"><Target className="h-4 w-4 text-electric" />CRM · Priya Nair</div>
        <ul className="space-y-2">
          {["Added from the website form", "Email 1 sent and opened"].map((t) => <li key={t} className="flex items-center gap-2.5 rounded-xl bg-[#f6f8fc] px-3 py-2.5 text-[12.5px] text-ink-soft"><Check className="h-3.5 w-3.5 text-emerald-500" />{t}</li>)}
          <li className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12.5px] font-semibold transition-all duration-500 ${step >= 2 ? "bg-sky-50 text-sky-800 ring-2 ring-sky-300" : "bg-[#f6f8fc] text-ink-soft opacity-30"}`}><Mail className="h-3.5 w-3.5" />Reply received. Lead marked Replied.</li>
        </ul>
      </div>
    </div>
  );
}

export function ThreadSection() {
  return <Live>{(live) => <Thread live={live} />}</Live>;
}
