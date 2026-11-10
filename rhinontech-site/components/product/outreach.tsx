"use client";

import { useEffect, useState } from "react";
import { Check, Eye, Globe, MessageSquare, PenLine, Search, Send, Sparkles, type LucideIcon } from "lucide-react";
import { Avatar } from "@/components/ProductMocks";
import { CountTo, Cursor, Live, TypeText, useStepper } from "@/components/motion";

const GLASS = "rounded-3xl border border-white/10 bg-white/[0.045] backdrop-blur-md";

/* ───────────── Hero: research, draft, approve, send ───────────── */

const LEADS: [string, string][] = [["Priya Nair", "Lumen Foods"], ["Yusuf Khan", "Northwind Labs"], ["Chloe Martin", "Willow Interiors"], ["Dev Patel", "Orbit Logistics"]];
const SUBJECT = "Quick question about stock reports";
const BODY = "Hi Priya, congrats on the two new Pune stores. Most ops heads I talk to are buried in stock reports at that stage. Worth 15 minutes to see how we cut that down to one dashboard?";
const COMPOSER_TIMING: readonly number[] = [650, 1700, 4300, 1700, 1700, 2700];

function Composer({ live }: { live: boolean }) {
  const [step] = useStepper(6, COMPOSER_TIMING, live);
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    if (step === 0) setCycle((c) => c + 1);
  }, [step]);
  const typing = step >= 2;
  const ready = step >= 3;
  const queued = step === 4;
  const sent = step === 5;
  const status = step <= 1 ? ["Researching lumenfoods.in", "#f5a524"] : step === 2 ? ["Drafting in your voice", "#7c5cff"] : step === 3 ? ["Ready for your review", "#2cd3ff"] : step === 4 ? ["Queued for 10:00", "#10c98f"] : ["Sent", "#10c98f"];
  return (
    <div className="relative mx-auto w-full max-w-[1040px] rounded-[28px] border border-white/15 bg-[#0b1233]/80 p-3 shadow-[0_60px_120px_-30px_rgb(124_92_255_/_0.55)] backdrop-blur-xl sm:p-4" style={{ opacity: step === 0 ? 0 : 1, transition: "opacity .5s" }}>
      <div className="grid gap-3 sm:grid-cols-[0.62fr_1.38fr]">
        <div className={`${GLASS} hidden p-3 sm:block`}>
          <p className="mb-2 px-1 font-mono text-[10.5px] uppercase tracking-wider text-white/45">Q3 Founder Outreach</p>
          {LEADS.map(([name, co], i) => (
            <div key={name} className={`flex items-center gap-2.5 rounded-xl p-2 transition-colors ${i === 0 ? "bg-white/10" : ""}`}>
              <Avatar name={name} i={i} size={28} />
              <span className="min-w-0 flex-1"><b className="block truncate text-[12.5px] font-semibold leading-4 text-white">{name}</b><span className="text-[11px] text-white/45">{co}</span></span>
              {i === 0 && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: sent ? "#10c98f26" : "#ffffff14", color: sent ? "#34e3ad" : "#ffffffaa" }}>{sent ? "Sent" : queued ? "Queued" : "Draft"}</span>}
            </div>
          ))}
          <div className="mt-3 rounded-xl bg-white/[0.05] p-2.5">
            <div className="flex justify-between text-[11px] text-white/55"><span>Sent today</span><span className="tabular-nums text-white"><CountTo to={sent ? 42 : 41} run={live} /> / 50</span></div>
            <i className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/10"><b className="block h-full rounded-full bg-gradient-to-r from-violet to-pink transition-all duration-700" style={{ width: sent ? "84%" : "82%" }} /></i>
          </div>
        </div>
        <div className={`${GLASS} relative p-4 sm:p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-[13px] font-semibold text-white"><Sparkles className="h-4 w-4 text-[#b9a6ff]" />AI draft for Priya Nair</span>
            <span key={step} className="pop-in rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ color: status[1], background: `${status[1]}22` }}>{status[0]}</span>
          </div>
          <div className="mt-3 flex min-h-[28px] flex-wrap gap-2">
            {["Website scanned", "2 news items", "Likely pain found"].map((c, k) => (
              <span key={`${cycle}-${c}`} className="pop-in flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] text-white/75" style={{ animationDelay: `${k * 380}ms` }}><Check className="h-3 w-3 text-emerald-400" />{c}</span>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-[12px] text-white/45">Subject</p>
            <p className="mt-0.5 min-h-[22px] text-[14.5px] font-semibold text-white"><TypeText text={SUBJECT} run={typing} speed={20} /></p>
            <div className="my-3 h-px bg-white/10" />
            <p className="min-h-[96px] text-[14px] leading-6 text-white/85 sm:min-h-[72px]"><TypeText text={BODY} run={typing} speed={19} /></p>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="hidden text-[12px] text-white/45 sm:block">Under 120 words. Nothing sends until you approve.</span>
            <span className={`ml-auto flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all duration-300 ${step >= 4 ? "bg-emerald-500 text-white" : ready ? "bg-white text-ink" : "bg-white/10 text-white/40"}`} style={{ transform: step === 4 ? "scale(.95)" : "none" }}>
              {step >= 4 ? <><Check className="h-4 w-4" />Queued</> : <>Approve and schedule</>}
            </span>
          </div>
          {step === 4 && <Send key="plane" className="fly-out pointer-events-none absolute bottom-6 right-24 z-30 h-6 w-6 text-white" />}
          <Cursor x="calc(100% - 96px)" y={ready ? "calc(100% - 34px)" : "calc(100% - 140px)"} down={step === 4} hidden={!ready} />
        </div>
      </div>
    </div>
  );
}

export function ComposerHero() {
  return <Live className="max-sm:[zoom:0.8]">{(live) => <Composer live={live} />}</Live>;
}

/* ───────────── Flow: research to reply, a pulse running through ───────────── */

const NODES: { icon: LucideIcon; title: string; line: string; detail: string }[] = [
  { icon: Search, title: "Research", line: "Reading lumenfoods.in", detail: "Company, news, likely pain" },
  { icon: PenLine, title: "Draft", line: "Writing in your voice", detail: "Short, plain and direct" },
  { icon: Eye, title: "Review", line: "Waiting for you", detail: "Approve it or edit it" },
  { icon: Send, title: "Send", line: "Tuesday at 10:00", detail: "Inside your daily limit" },
  { icon: MessageSquare, title: "Reply", line: "Priya replied", detail: "The lead updates itself" },
];

function Flow({ live }: { live: boolean }) {
  const [step] = useStepper(5, 1700, live);
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-[10%] right-[10%] top-[34px] hidden h-[3px] rounded-full bg-white/10 md:block">
        <i className="absolute inset-y-0 left-0 block rounded-full bg-gradient-to-r from-electric via-violet to-pink transition-[width] duration-[1200ms] ease-out" style={{ width: `${(step / 4) * 100}%` }} />
        <i className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_24px_6px_rgb(124_92_255_/_0.8)] transition-[left] duration-[1200ms] ease-out" style={{ left: `${(step / 4) * 100}%` }} />
      </div>
      <div className="grid gap-4 md:grid-cols-5">
        {NODES.map(({ icon: Icon, title, line, detail }, k) => {
          const on = k === step;
          const done = k < step;
          return (
            <div key={title} className="relative text-center">
              <span className={`relative z-10 mx-auto flex h-[68px] w-[68px] items-center justify-center rounded-2xl border transition-all duration-500 ${on ? "scale-110 border-white/40 bg-gradient-to-br from-violet to-pink text-white shadow-[0_20px_50px_-10px_rgb(224_77_214_/_0.7)]" : done ? "border-violet/50 bg-violet/20 text-white" : "border-white/10 bg-[#0d1438] text-white/55"}`}>
                <Icon className="h-7 w-7" />
              </span>
              <p className="font-display mt-4 text-[22px] font-semibold text-white">{title}</p>
              <p className={`mt-1 text-[14px] transition-colors duration-500 ${on ? "text-[#c9bcff]" : "text-white/55"}`}>{on ? line : detail}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FlowSection() {
  return <Live>{(live) => <Flow live={live} />}</Live>;
}

/* ───────────── Schedule: days, a send time and a daily limit ───────────── */

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const SCHEDULE_TIMING: readonly number[] = [900, 520, 520, 520, 520, 520, 1100, 3400];

function Schedule({ live }: { live: boolean }) {
  const [step] = useStepper(8, SCHEDULE_TIMING, live);
  const daysOn = Math.min(5, Math.max(0, step));
  const set = step >= 6;
  const limit = step >= 7 ? 50 : 20;
  return (
    <div className={`${GLASS} grid gap-8 p-6 sm:p-8 md:grid-cols-[1fr_auto]`}>
      <div className="space-y-8">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">Send on</p>
          <div className="mt-3 flex gap-2.5">
            {DAYS.map((d, i) => (
              <span key={i} className={`flex h-11 w-11 items-center justify-center rounded-full text-[14px] font-semibold transition-all duration-300 sm:h-12 sm:w-12 ${i < daysOn ? "scale-105 bg-gradient-to-br from-violet to-pink text-white shadow-[0_10px_24px_-8px_rgb(224_77_214_/_0.8)]" : "border border-white/15 text-white/45"}`}>{d}</span>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-end justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">Daily limit</p>
            <p className="font-display text-[34px] font-semibold leading-none text-white"><CountTo to={limit} run={live} duration={900} /><span className="ml-1 text-[14px] font-medium text-white/45">emails</span></p>
          </div>
          <div className="relative mt-4 h-2 rounded-full bg-white/10">
            <i className="absolute inset-y-0 left-0 block rounded-full bg-gradient-to-r from-electric to-violet transition-all duration-[900ms]" style={{ width: `${limit}%` }} />
            <i className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_6px_16px_rgb(0_0_0_/_0.45)] transition-all duration-[900ms]" style={{ left: `${limit}%` }} />
          </div>
        </div>
        <p className={`flex items-center gap-2 text-[14px] transition-colors duration-500 ${step >= 7 ? "text-emerald-300" : "text-white/40"}`}><Check className="h-4 w-4" />{step >= 7 ? "Next run: tomorrow at 10:00. Pause or resume any time." : "Setting up the run…"}</p>
      </div>
      <div className="mx-auto flex flex-col items-center">
        <svg viewBox="0 0 120 120" className="h-[180px] w-[180px]" aria-hidden>
          <circle cx="60" cy="60" r="54" fill="rgb(255 255 255 / 0.04)" stroke="rgb(255 255 255 / 0.18)" strokeWidth="1.5" />
          {Array.from({ length: 12 }, (_, i) => <line key={i} x1="60" y1="10" x2="60" y2={i % 3 === 0 ? 20 : 15} stroke="rgb(255 255 255 / 0.4)" strokeWidth={i % 3 === 0 ? 2 : 1} transform={`rotate(${i * 30} 60 60)`} />)}
          <line x1="60" y1="60" x2="60" y2="20" stroke="#fff" strokeWidth="3" strokeLinecap="round" style={{ transformOrigin: "60px 60px", transform: `rotate(${set ? 0 : -150}deg)`, transition: "transform 1.1s cubic-bezier(.4,.1,.2,1)" }} />
          <line x1="60" y1="60" x2="60" y2="34" stroke="#b9a6ff" strokeWidth="4" strokeLinecap="round" style={{ transformOrigin: "60px 60px", transform: `rotate(${set ? -60 : 110}deg)`, transition: "transform 1.1s cubic-bezier(.4,.1,.2,1)" }} />
          <circle cx="60" cy="60" r="4" fill="#fff" />
        </svg>
        <p className="font-display mt-2 text-[28px] font-semibold text-white">{set ? "10:00 am" : "--:--"}</p>
        <p className="text-[12px] text-white/45">Send time</p>
      </div>
    </div>
  );
}

export function ScheduleSection() {
  return <Live>{(live) => <Schedule live={live} />}</Live>;
}

/* ───────────── Engagement: a live feed ───────────── */

const EVENTS: [LucideIcon, string, string, string][] = [
  [Eye, "Priya opened your email", "Lumen Foods", "#9a7bff"],
  [Globe, "Yusuf visited your pricing page", "Northwind Labs", "#4d7bff"],
  [MessageSquare, "Chloe replied", "“Can we talk Thursday?”", "#34e3ad"],
  [Eye, "Dev opened your email", "Orbit Logistics", "#9a7bff"],
  [Send, "Email 2 sent to Sara Lin", "Harbor & Co", "#ff7cc4"],
  [MessageSquare, "Meera replied", "“Please send the details”", "#34e3ad"],
  [Globe, "Anil visited your site", "Bluepeak Retail", "#4d7bff"],
  [Eye, "Ravi opened your email", "Cedar Finance", "#9a7bff"],
];
const SLOT_H = 80;
const SLOT_OPACITY = [1, 0.92, 0.72, 0.5, 0.3, 0];

function Feed({ live }: { live: boolean }) {
  const [tick] = useStepper(1000000, 1600, live);
  return (
    <div className={`${GLASS} p-5 sm:p-6`}>
      <div className="mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-white"><i className="ping-soft relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />Live activity</span>
        <span className="text-[12px] text-white/45">Q3 Founder Outreach</span>
      </div>
      <div className="relative overflow-hidden" style={{ height: SLOT_H * 5 }}>
        {SLOT_OPACITY.map((_, slot) => {
          const idx = tick - slot;
          if (idx < 0) return null;
          const [Icon, text, sub, color] = EVENTS[idx % EVENTS.length];
          return (
            <div key={idx} className="absolute inset-x-0 transition-all duration-700 ease-out" style={{ top: slot * SLOT_H, opacity: SLOT_OPACITY[slot] }}>
              <div className={`${slot === 0 ? "slide-in" : ""} flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.05] p-3.5`}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}26`, color }}><Icon className="h-5 w-5" /></span>
                <span className="min-w-0"><b className="block truncate text-[14px] font-semibold text-white">{text}</b><span className="text-[12.5px] text-white/50">{sub}</span></span>
                <span className="ml-auto text-[11px] text-white/35">just now</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-5 text-center">
        {[["Sent", 4812, "", 0], ["Opened", 41, "%", 0], ["Replied", 6.2, "%", 1]].map(([k, v, suf, dec]) => (
          <div key={k as string}>
            <p className="font-display text-[26px] font-semibold text-white"><CountTo to={v as number} run={live} format={(n) => (dec ? n.toFixed(1) : Math.round(n).toLocaleString("en-IN")) + suf} /></p>
            <p className="text-[12px] text-white/45">{k}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeedSection() {
  return <Live>{(live) => <Feed live={live} />}</Live>;
}

/* ───────────── Memory: what the agent knows, and where the lead is ───────────── */

const MEMORY: [string, string][] = [
  ["Ideal customer", "Ops heads at retail and logistics firms with 50 to 500 people."],
  ["Pain patterns", "Stock reports, manual reconciliation, no single view of the day."],
  ["Voice", "Short, direct, no buzzwords. Sound like a person."],
];
const LADDER: [string, string, string][] = [
  ["Stage 0", "No activity yet", "A short introduction"],
  ["Stage 1", "First email sent", "A gentle follow-up"],
  ["Stage 2", "Opened, no reply", "A follow-up that adds value"],
  ["Stage 3", "Replied", "A reply that moves to a call"],
  ["Stage 4", "Interested", "Hand over to your team"],
  ["Stage 5", "In conversation", "The agent steps back"],
];
const MEMORY_TIMING: readonly number[] = [2700, 2700, 2700, 1300, 1300, 1300, 1300, 1300, 1300, 2400];

function Memory({ live }: { live: boolean }) {
  const [step] = useStepper(10, MEMORY_TIMING, live);
  const rung = Math.min(5, Math.max(0, step - 3));
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className={`${GLASS} p-5 sm:p-6`}>
        <div className="mb-4 flex items-center justify-between"><span className="flex items-center gap-2 text-[13px] font-semibold text-white"><Sparkles className="h-4 w-4 text-[#b9a6ff]" />Sales memory</span><span className="text-[11px] text-white/40">You edit it any time</span></div>
        <div className="space-y-3">
          {MEMORY.map(([k, v], i) => (
            <div key={k} className="rounded-2xl border border-white/10 bg-black/25 p-3.5">
              <p className="font-mono text-[10.5px] uppercase tracking-wider text-white/45">{k}</p>
              <p className="mt-1 min-h-[42px] text-[14px] leading-[21px] text-white/90"><TypeText text={v} run={step >= i || step >= 3} speed={18} /></p>
            </div>
          ))}
        </div>
      </div>
      <div className={`${GLASS} p-5 sm:p-6`}>
        <div className="mb-4 flex items-center justify-between"><span className="text-[13px] font-semibold text-white">What the agent sees</span><span className="text-[11px] text-white/40">Example lead</span></div>
        <ul className="space-y-1.5">
          {LADDER.map(([s, hist, next], k) => {
            const on = k === rung && step >= 3;
            const done = k < rung && step >= 3;
            return (
              <li key={s} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-500 ${on ? "border-violet/60 bg-violet/15" : "border-transparent"}`}>
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-500 ${on ? "bg-gradient-to-br from-violet to-pink text-white" : done ? "bg-violet/30 text-white" : "bg-white/10 text-white/45"}`}>{done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : k}</span>
                <span className="min-w-0 flex-1"><b className={`block text-[13.5px] font-semibold ${on ? "text-white" : "text-white/70"}`}>{s}: {hist}</b>{on && <span className="slide-in text-[12.5px] text-[#c9bcff]">Next draft: {next}</span>}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function MemorySection() {
  return <Live>{(live) => <Memory live={live} />}</Live>;
}

/* ───────────── LinkedIn: three kinds of post moving to live ───────────── */

const POSTS: [string, string][] = [["Post", "Three things ops heads told us this quarter."], ["Video", "A 60-second tour of the pipeline."], ["Article", "Why stock reports eat your Monday."]];
const POST_STATES: [string, string][] = [["Draft", "#f5a524"], ["Scheduled", "#4d7bff"], ["Published", "#34e3ad"]];

function LinkedIn({ live }: { live: boolean }) {
  const [i] = useStepper(3, 1900, live);
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {POSTS.map(([kind, title], k) => {
        const state = POST_STATES[(i + k) % 3];
        return (
          <div key={kind} className={`${GLASS} p-5`}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-white/45">{kind}</span>
              <span key={`${i}-${k}`} className="pop-in rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ color: state[1], background: `${state[1]}22` }}>{state[0]}</span>
            </div>
            <p className="font-display mt-4 min-h-[56px] text-[19px] font-semibold leading-snug text-white">{title}</p>
            <div className="mt-4 space-y-1.5"><i className="block h-1.5 w-full rounded bg-white/10" /><i className="block h-1.5 w-4/5 rounded bg-white/10" /></div>
            <i className="mt-5 block h-1 overflow-hidden rounded-full bg-white/10"><b className="block h-full rounded-full transition-all duration-700" style={{ width: `${((i + k) % 3 + 1) * 33.4}%`, background: state[1] }} /></i>
          </div>
        );
      })}
    </div>
  );
}

export function LinkedInSection() {
  return <Live>{(live) => <LinkedIn live={live} />}</Live>;
}
