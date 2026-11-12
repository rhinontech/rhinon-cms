"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Live, TypeText, useStepper } from "@/components/motion";

/* Rhinon AI page. Dark, mono labels, one violet glow. All demo content is example data. */

const MONO = "font-mono text-[11px] uppercase tracking-[0.18em]";

/* ───────────── Hero visual: the orbit ───────────── */

const SOURCES = [
  ["crm", "lead replied"], ["gmail", "client reply in"], ["site", "visitor asked about pricing"], ["hr", "offer letter drafted"],
  ["crm", "Lumen Foods researched"], ["inbox", "meeting invite sent"], ["chat", "handover to Ana"], ["outreach", "draft ready"],
] as const;
const EVENTS = ["[ APPROVAL ] draft waiting for review", "[ MEMORY ] we sell to ops heads", "[ RESEARCH ] Lumen Foods opened two stores", "[ HANDOVER ] visitor passed to a person", "[ SAVED ] new lead from the website"];

const CORNERS = [
  { n: "01", t: "Research", rows: ["Reads the lead's website", "Finds recent news", "Spots the likely pain", "Saves it on the lead"], pos: "left-[3%] top-[3%]" },
  { n: "04", t: "Outreach", rows: ["Knows your ideal customer", "Drafts the next email", "Follows up by history", "Waits for your approval"], pos: "right-[3%] top-[8%]" },
  { n: "02", t: "Chatbot", rows: ["Trained on your content", "Answers at any hour", "Saves leads to the CRM", "Hands over to a person"], pos: "left-[6%] bottom-[2%]" },
  { n: "03", t: "People", rows: ["Rewrites any sentence", "Offer letters and NDAs", "Warmer, shorter, formal", "You keep what you like"], pos: "right-[6%] bottom-[2%]" },
];

function Chip({ a, b }: { a: string; b: string }) {
  return (
    <span className="mr-3 inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 font-mono text-[12.5px] text-white/70">
      <i className="h-2 w-2 rounded-full bg-[#8b7cff]" />{a}: <span className="text-white/90">{b}</span>
    </span>
  );
}

export function Orbit() {
  return (
    <div className="relative mx-auto mt-14 h-[420px] w-full max-w-[1180px] sm:h-[600px]">
      {/* corner cards */}
      {CORNERS.map((c) => (
        <div key={c.n} className={`ai-card absolute hidden w-[270px] rounded-2xl p-5 opacity-60 hover:opacity-100 lg:block ${c.pos}`}>
          <p className={`${MONO} flex items-center gap-2 text-white/55`}><span className="rounded border border-white/15 px-1.5 py-0.5 text-white/40">{c.n}</span>{c.t}</p>
          <ul className="mt-4 space-y-3 border-t border-white/10 pt-4">
            {c.rows.map((r) => <li key={r} className="flex items-center gap-2.5 font-mono text-[12.5px] text-white/40"><i className="h-1.5 w-1.5 rounded-full bg-[#8b7cff]/70" />{r}</li>)}
          </ul>
        </div>
      ))}

      {/* left: sources flowing in */}
      <div className="absolute left-0 top-[46%] hidden w-[38%] -translate-y-1/2 space-y-3 overflow-hidden ai-fade-x md:block">
        {[0, 1, 2].map((row) => (
          <div key={row} className="ai-marq-rev" style={{ animationDuration: `${50 + row * 9}s` }}>
            {[...SOURCES, ...SOURCES].map((_, i) => { const [a, b] = SOURCES[(i + row * 3) % SOURCES.length]; return <Chip key={i} a={a} b={b} />; })}
          </div>
        ))}
      </div>

      {/* right: the memory ticker */}
      <div className="absolute right-0 top-[46%] hidden w-[34%] -translate-y-1/2 overflow-hidden ai-fade-x md:block">
        <div className="mb-1 pl-8 font-mono text-[12px] tracking-[0.25em] text-white/80">MEMORY</div>
        <div className="ai-marq" style={{ animationDuration: "38s" }}>
          {[...EVENTS, ...EVENTS].map((e, i) => <span key={i} className="mr-10 shrink-0 font-mono text-[13px] text-[#a99dff]">▸ {e}</span>)}
        </div>
      </div>

      {/* traveling dots on the spine */}
      <div className="absolute left-[8%] right-[8%] top-[46%] hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent md:block">
        <i className="ai-dot-r absolute top-[-2px] h-[5px] w-[5px] rounded-full bg-[#b9aeff]" />
        <i className="ai-dot-l absolute top-[-2px] h-[5px] w-[5px] rounded-full bg-[#b9aeff]" style={{ animationDelay: "1.2s" }} />
      </div>

      {/* labels */}
      <p className={`${MONO} absolute left-1/2 top-[6%] -translate-x-1/2 text-[13px] tracking-[0.3em] text-white/80`}>LEARNS YOUR BUSINESS</p>
      <span className="absolute left-1/2 top-[13%] h-[18%] w-px -translate-x-1/2 bg-gradient-to-b from-white/30 to-transparent" />

      {/* the orb: Rhinon AI is the mascot, in its own blue */}
      <div className="absolute left-1/2 top-[46%] h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 sm:h-[300px] sm:w-[300px]">
        {[0, 1, 2].map((i) => <span key={i} className="ai-ring absolute inset-0 rounded-full border border-[#4f86ff]/45" style={{ animationDelay: `${i * 1.4}s` }} />)}
        <span className="ai-sweep absolute -inset-16 rounded-full opacity-70" style={{ background: "conic-gradient(from 0deg, transparent 0deg, transparent 300deg, rgb(79 134 255 / 0.55) 360deg)", maskImage: "radial-gradient(circle, transparent 38%, #000 39%, #000 70%, transparent 71%)", WebkitMaskImage: "radial-gradient(circle, transparent 38%, #000 39%, #000 70%, transparent 71%)" }} />
        <div className="ai-orb absolute inset-[12%] flex flex-col items-center justify-center rounded-full border border-[#4f86ff]/60 bg-[radial-gradient(circle_at_50%_38%,#16408f,#060d24_72%)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/mascot.webp" alt="Rhinon AI, the Rhinon Tech mascot" width={420} height={560} className="mt-1 h-[132px] w-auto drop-shadow-[0_8px_18px_rgb(0_0_0_/_0.45)] sm:h-[172px]" />
          <span className="mt-1 font-mono text-[12.5px] tracking-[0.14em] text-white/85">Rhinon AI</span>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Use-case tabs ───────────── */

export interface UseCase { tab: string; line: string; label: string; text: string }

export function UseCases({ items }: { items: UseCase[] }) {
  return (
    <Live>
      {(live) => <UseCasesInner items={items} live={live} />}
    </Live>
  );
}

function UseCasesInner({ items, live }: { items: UseCase[]; live: boolean }) {
  const [auto, setAuto] = useStepper(items.length, 9000, live);
  const [pinned, setPinned] = useState<number | null>(null);
  const active = pinned ?? auto;
  const u = items[active];
  return (
    <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={it.tab}>
            <button
              type="button"
              onClick={() => { setPinned(i); setAuto(i); }}
              className={`ai-card relative w-full overflow-hidden rounded-2xl p-5 text-left ${active === i ? "!border-[#8b7cff]/60 !bg-white/[0.07]" : "opacity-70"}`}
            >
              <span className="block text-[18px] font-semibold text-white">{it.tab}</span>
              <span className="mt-1 block text-[14.5px] text-white/55">{it.line}</span>
              {active === i && pinned === null && <i key={auto} className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-[#8b7cff]" style={{ animation: "progress 9s linear forwards" }} />}
            </button>
          </li>
        ))}
      </ul>
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black p-6 sm:p-9">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#7c5cff]/30 blur-[90px]" />
        <div className="relative">
          <p className={`${MONO} flex items-center gap-2 text-[#b9a6ff]`}><Sparkles className="h-3.5 w-3.5" />{u.label}</p>
          <p key={active} className="mt-5 min-h-[150px] text-[19px] leading-8 text-white/90 sm:text-[22px] sm:leading-9">
            <TypeText text={u.text} run speed={20} />
          </p>
          <div className="mt-6 flex gap-2">
            {["Approve", "Edit", "Regenerate"].map((b, i) => <span key={b} className={`rounded-lg px-3.5 py-1.5 text-[13px] font-medium ${i === 0 ? "bg-white text-black" : "border border-white/15 text-white/70"}`}>{b}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Skills marquee ───────────── */

const SKILLS = [
  ["Research a lead", "Draft a first email", "Write a follow-up", "Answer a visitor", "Rewrite a sentence", "Summarise a thread"],
  ["Find the likely pain point", "Match your tone", "Save notes on the lead", "Hand over to a person", "Warm up a letter", "Shorten a draft"],
  ["Read a company website", "Suggest the next step", "Score a reply", "Draft an offer letter", "Explain a contract clause", "Plan a sequence"],
];

export function SkillRows() {
  return (
    <div className="space-y-3 overflow-hidden ai-fade-x">
      {SKILLS.map((row, r) => (
        <div key={r} className={r % 2 ? "ai-marq-rev" : "ai-marq"} style={{ animationDuration: `${44 + r * 8}s` }}>
          {[...row, ...row, ...row, ...row].map((s, i) => (
            <span key={i} className="mr-3 inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-[15px] text-white/80">
              <Sparkles className="h-3.5 w-3.5 text-[#8b7cff]" />{s}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ───────────── Tasks feed ───────────── */

const TASKS: [string, string, string][] = [
  ["Researched Lumen Foods", "Research", "9:02 AM"],
  ["Drafted a first email to Priya Nair", "Outreach", "9:04 AM"],
  ["Answered a pricing question on the site", "Chatbot", "9:11 AM"],
  ["Saved Ravi Menon as a new lead", "Chatbot", "9:12 AM"],
  ["Drafted a follow-up to Yusuf Khan", "Outreach", "9:20 AM"],
  ["Made an offer letter warmer", "People", "9:31 AM"],
  ["Summarised a long client thread", "Inbox", "9:44 AM"],
  ["Handed a visitor over to Ana", "Chatbot", "9:52 AM"],
];
const TASK_MS = Array.from({ length: TASKS.length + 3 }, (_, i) => (i < TASKS.length ? 1100 : 2400));

export function TaskFeed() {
  return <Live>{(live) => <TaskFeedInner live={live} />}</Live>;
}

function TaskFeedInner({ live }: { live: boolean }) {
  const [step] = useStepper(TASKS.length + 3, TASK_MS, live);
  const shown = Math.min(step, TASKS.length);
  return (
    <div className="ai-card rounded-[24px] p-5 sm:p-7">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[15px] font-semibold text-white">Rhinon AI, today</p>
        <span className="flex items-center gap-2 rounded-full bg-[#8b7cff]/15 px-3 py-1 font-mono text-[11px] text-[#c4baff]"><i className="ai-twinkle h-1.5 w-1.5 rounded-full bg-[#8b7cff]" />{shown} done</span>
      </div>
      <ul className="divide-y divide-white/[0.07]">
        {TASKS.map(([t, a, time], i) => (
          <li key={t} className="flex items-center gap-3 py-3 transition-all duration-500" style={{ opacity: i < shown ? 1 : 0.12, transform: i < shown ? "none" : "translateY(8px)" }}>
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${i < shown ? "bg-[#8b7cff] text-white" : "border border-white/20"}`}>{i < shown && <Check className="h-3 w-3" strokeWidth={3} />}</span>
            <span className="min-w-0 flex-1 truncate text-[14.5px] text-white/90">{t}</span>
            <span className="hidden font-mono text-[11px] text-white/40 sm:block">{a} · {time}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 font-mono text-[11px] text-white/35">Example activity</p>
    </div>
  );
}
