"use client";

import { useEffect, useState } from "react";
import { BookOpen, Check, FileText, Globe, Mic, MessageCircle, PhoneOff, Sparkles, Ticket, Volume2 } from "lucide-react";
import { Avatar, Pill } from "@/components/ProductMocks";
import { Cursor, Live, TypeText, useReducedMotion, useStepper } from "@/components/motion";

const CARD_BASE = "rounded-3xl border bg-white shadow-[0_40px_90px_-40px_rgb(255_95_140_/_0.45)]";
const CARD = `${CARD_BASE} border-orange-100`;
const GRAD = "linear-gradient(135deg, #ff8a4c, #ff5fb0)";

/* ───────────── Hero: a website with the widget answering a visitor ───────────── */

type Msg = { who: "v" | "b" | "sys"; text: string; from: number; src?: string };
const THREAD: Msg[] = [
  { who: "v", text: "Do you do full-home projects?", from: 2 },
  { who: "b", text: "Yes. We take a home from first sketch to handover.", from: 4, src: "Source: Services page" },
  { who: "v", text: "Can I talk to someone?", from: 5 },
  { who: "b", text: "Of course. Connecting you with Ana now.", from: 6 },
  { who: "sys", text: "Ana joined the chat", from: 6 },
];
const SITE_TIMING: readonly number[] = [1500, 1000, 1000, 1100, 1500, 1200, 1500, 3600];

function Site({ live }: { live: boolean }) {
  const [step] = useStepper(8, SITE_TIMING, live);
  const open = step >= 1;
  return (
    <div className="window relative h-[430px] sm:h-[460px]">
      <div className="flex items-center gap-3 border-b border-line bg-soft/80 px-4 py-2.5">
        <span className="flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b]" /><i className="h-2.5 w-2.5 rounded-full bg-[#ffc14d]" /><i className="h-2.5 w-2.5 rounded-full bg-[#3ddc84]" /></span>
        <span className="mx-auto flex h-6 w-full max-w-[220px] items-center justify-center rounded-md bg-white font-mono text-[10.5px] text-muted ring-1 ring-line">willowinteriors.in</span>
        <span className="w-10" />
      </div>
      <div className="p-5">
        <div className="flex items-center gap-3"><i className="h-7 w-7 rounded-lg bg-emerald-400" /><b className="text-[14px]">Willow Interiors</b><span className="ml-auto hidden gap-4 text-[12px] text-muted sm:flex"><span>Services</span><span>Projects</span><span>Contact</span></span></div>
        <div className="mt-6 grid gap-5 sm:grid-cols-[1.1fr_0.9fr]">
          <div><i className="block h-5 w-5/6 rounded bg-ink/15" /><i className="mt-2.5 block h-5 w-2/3 rounded bg-ink/15" /><i className="mt-5 block h-2 w-full rounded bg-line" /><i className="mt-2 block h-2 w-11/12 rounded bg-line" /><i className="mt-6 block h-9 w-28 rounded-lg bg-emerald-400/80" /></div>
          <div className="hidden h-36 rounded-2xl bg-gradient-to-br from-amber-200 via-orange-200 to-rose-200 sm:block" />
        </div>
      </div>
      {/* the widget */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-3">
        <div className="origin-bottom-right overflow-hidden rounded-2xl border border-line bg-white shadow-[0_30px_70px_-20px_rgb(20_20_60_/_0.45)] transition-all duration-500" style={{ width: 262, opacity: open ? 1 : 0, transform: open ? "scale(1)" : "scale(.7)" }}>
          <div className="flex items-center gap-2.5 px-3.5 py-3 text-white" style={{ background: GRAD }}>
            {step >= 6 ? <Avatar name="Ana Silva" i={4} size={28} /> : <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25"><Sparkles className="h-4 w-4" /></span>}
            <span><b className="block text-[12.5px] leading-4">{step >= 6 ? "Ana · Willow team" : "Willow assistant"}</b><span className="text-[10.5px] opacity-85">● Online</span></span>
          </div>
          <div className="min-h-[200px] space-y-2 p-3 text-[11.5px] leading-[17px]">
            {THREAD.filter((m) => step >= m.from).map((m) =>
              m.who === "sys" ? <p key={m.text} className="pop-in text-center text-[10.5px] font-medium text-emerald-600">{m.text}</p>
              : <div key={m.text} className={`pop-in max-w-[88%] rounded-2xl px-3 py-2 ${m.who === "v" ? "ml-auto rounded-br-sm bg-ink text-white" : "rounded-bl-sm bg-soft"}`}>{m.text}{m.src && <span className="mt-1 block text-[9.5px] text-muted">{m.src}</span>}</div>,
            )}
            {step === 3 && <div className="dots w-fit rounded-2xl rounded-bl-sm bg-soft px-3 py-2.5 text-muted"><i>•</i><i>•</i><i>•</i></div>}
          </div>
        </div>
        <span className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_16px_34px_-8px_rgb(255_95_140_/_0.8)] ${step === 0 ? "ring-out" : ""}`} style={{ background: GRAD }}><MessageCircle className="h-6 w-6" /></span>
      </div>
      {step >= 7 && (
        <div className="pop-in glass-chip absolute bottom-24 left-4 flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 sm:left-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-4 w-4" /></span>
          <span className="text-[12px] leading-4"><b className="block font-semibold">New lead saved to CRM</b><span className="text-muted">Chloe Martin · Willow Interiors</span></span>
        </div>
      )}
    </div>
  );
}

export function SiteHero() {
  return <Live className="max-sm:[zoom:0.8]">{(live) => <Site live={live} />}</Live>;
}

/* ───────────── Train it: a site and documents become knowledge ───────────── */

const SOURCES: [string, string][] = [["Home page", "page"], ["Services", "page"], ["Pricing", "page"], ["FAQ", "page"], ["Care guide.pdf", "doc"]];
const TRAIN_TIMING: readonly number[] = [900, 1500, 1000, 3300, 3200];

function Train({ live }: { live: boolean }) {
  const [step] = useStepper(5, TRAIN_TIMING, live);
  const go = step >= 3;
  return (
    <div className={`${CARD} p-5 sm:p-7`}>
      <div className="relative flex flex-wrap items-center gap-3">
        <div className="flex min-w-[220px] flex-1 items-center gap-2.5 rounded-xl border border-line bg-soft/70 px-4 py-3"><Globe className="h-4 w-4 text-muted" /><span className="text-[15px] font-medium"><TypeText text="willowinteriors.in" run={step >= 1} speed={70} /></span></div>
        <span className={`flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold text-white transition-transform duration-200 ${step === 2 ? "scale-95" : ""}`} style={{ background: GRAD }}><Sparkles className="h-4 w-4" />{go ? "Training…" : "Train my bot"}</span>
        <Cursor x="calc(100% - 70px)" y={step >= 2 ? 22 : 70} down={step === 2} hidden={step < 1 || step > 2} />
      </div>
      <div className="mt-6 space-y-2.5">
        {SOURCES.map(([name, kind], k) => (
          <div key={`${name}-${go}`} className={`${go ? "slide-in" : "opacity-0"} flex items-center gap-3 rounded-xl border border-[#f3e7df] bg-[#fffaf6] px-3.5 py-3`} style={{ "--d": `${k * 380}ms` } as React.CSSProperties}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-orange-500 ring-1 ring-orange-100">{kind === "doc" ? <FileText className="h-4 w-4" /> : <Globe className="h-4 w-4" />}</span>
            <span className="w-28 shrink-0 truncate text-[13.5px] font-semibold">{name}</span>
            <i className="block h-1.5 flex-1 overflow-hidden rounded-full bg-orange-100"><b className="block h-full rounded-full" style={{ width: go ? "100%" : "0%", background: GRAD, transition: `width 900ms ease-out ${k * 380 + 250}ms` }} /></i>
            {step >= 4 ? <Check className="pop-in h-4 w-4 text-emerald-500" strokeWidth={3} /> : <span className="h-4 w-4" />}
          </div>
        ))}
      </div>
      <div className="mt-5 h-10">{step >= 4 && <p className="pop-in flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-[13px] font-semibold text-emerald-700"><Sparkles className="h-4 w-4" />Ready. Ask it anything about your business.</p>}</div>
    </div>
  );
}

export function TrainSection() {
  return <Live className="max-sm:[zoom:0.88]">{(live) => <Train live={live} />}</Live>;
}

/* ───────────── Handover: from the bot to a person ───────────── */

const HAND_TIMING: readonly number[] = [1500, 1500, 1700, 1800, 1500, 1800, 3400];

function Handover({ live }: { live: boolean }) {
  const [step] = useStepper(7, HAND_TIMING, live);
  const human = step >= 4;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className={`${CARD} relative overflow-hidden`}>
        <div className="flex items-center gap-2.5 px-4 py-3 text-white" style={{ background: GRAD }}>
          {human ? <Avatar name="Ana Silva" i={4} size={30} /> : <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/25"><Sparkles className="h-4 w-4" /></span>}
          <span><b className="block text-[13px] leading-4">{human ? "Ana · Willow team" : "Willow assistant"}</b><span className="text-[11px] opacity-85">{human ? "Live with a person" : "AI assistant"}</span></span>
          <span className="ml-auto rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-semibold">Visitor view</span>
        </div>
        <div className="min-h-[250px] space-y-2.5 p-4 text-[13px]">
          <div className="pop-in ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm bg-ink px-3.5 py-2.5 text-white">Can I talk to someone?</div>
          {step >= 1 && <div className="pop-in w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-soft px-3.5 py-2.5">Sure. Bringing in a teammate now.</div>}
          {step >= 5 && <div className="pop-in w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-orange-50 px-3.5 py-2.5 ring-1 ring-orange-100">Hi Chloe, Ana here. How can I help?</div>}
        </div>
      </div>
      <div className={`${CARD} relative overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-line px-4 py-3"><b className="text-[13px] font-semibold">Live chats</b><Pill color={human ? "#10c98f" : "#ff8a4c"}>{human ? "You're live" : "1 waiting"}</Pill></div>
        <div className="min-h-[250px] p-4">
          <div className={`rounded-2xl border p-3.5 transition-all duration-500 ${step >= 2 && !human ? "border-orange-300 bg-orange-50 shadow-[0_16px_34px_-16px_rgb(255_138_76_/_0.7)]" : "border-line bg-soft/60"}`}>
            <div className="flex items-center gap-2.5"><Avatar name="Chloe Martin" i={1} size={32} /><span className="min-w-0 flex-1"><b className="block text-[13px] font-semibold leading-4">Chloe Martin</b><span className="text-[11.5px] text-muted">Asked for a person</span></span>{step >= 2 && !human && <span className="ring-out h-2.5 w-2.5 rounded-full bg-orange-500" />}</div>
            <div className="mt-3 flex gap-2"><span className={`rounded-lg px-3.5 py-2 text-[12px] font-semibold text-white transition-transform duration-200 ${step === 4 ? "scale-95" : ""}`} style={{ background: human ? "#10c98f" : GRAD }}>{human ? "Live" : "Take over"}</span><span className="rounded-lg border border-line bg-white px-3.5 py-2 text-[12px] font-semibold">View chat</span></div>
          </div>
          <p className="mt-3 text-[12px] text-muted">The full conversation comes with it, so nobody asks twice.</p>
        </div>
        <Cursor x={step >= 3 ? 58 : 190} y={step >= 3 ? 134 : 200} down={step === 4} hidden={step < 3 || step > 4} />
      </div>
    </div>
  );
}

export function HandoverSection() {
  return <Live>{(live) => <Handover live={live} />}</Live>;
}

/* ───────────── Voice: calling a visitor ───────────── */

const VOICE_TIMING: readonly number[] = [2400, 9000];
const BARS = [38, 62, 90, 50, 74, 100, 58, 84, 44, 68, 96, 52, 78, 40, 70, 92, 56, 64];

function Voice({ live }: { live: boolean }) {
  const reduced = useReducedMotion();
  const [step] = useStepper(2, VOICE_TIMING, live);
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (step !== 1 || !live) {
      setSec(0);
      return;
    }
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [step, live]);
  const talking = step === 1;
  const clock = `${String(Math.floor((reduced ? 42 : sec) / 60)).padStart(2, "0")}:${String((reduced ? 42 : sec) % 60).padStart(2, "0")}`;
  return (
    <div className="relative mx-auto w-full max-w-[420px] overflow-hidden rounded-[36px] bg-[#1a1030] p-7 text-white shadow-[0_60px_120px_-40px_rgb(255_95_140_/_0.6)]">
      <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-pink/40 blur-3xl" />
      <div aria-hidden className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-orange-400/30 blur-3xl" />
      <div className="relative flex flex-col items-center text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/55">{talking ? "Connected" : "Calling from your dashboard"}</p>
        <div className="relative mt-6 flex h-[120px] w-[120px] items-center justify-center">
          {!talking && [0, 0.6, 1.2].map((d) => <i key={d} className="ring-out absolute inset-0 rounded-full border-2 border-pink/60" style={{ animationDelay: `${d}s` }} />)}
          <Avatar name="Chloe Martin" i={1} size={96} />
        </div>
        <p className="font-display mt-5 text-[26px] font-semibold">Chloe Martin</p>
        <p className="mt-1 text-[14px] text-white/55">Visitor on willowinteriors.in</p>
        <p className="mt-4 font-mono text-[20px] tabular-nums text-white/90">{talking ? clock : "Ringing…"}</p>
        <div className="mt-5 flex h-12 items-center gap-[5px]">
          {BARS.map((h, i) => <i key={i} className={`block w-[5px] rounded-full ${talking ? "wave-bar" : ""}`} style={{ height: talking ? `${h}%` : "12%", background: GRAD, animationDelay: `${(i % 6) * 0.12}s`, animationDuration: `${0.8 + (i % 4) * 0.15}s`, transition: "height .5s" }} />)}
        </div>
        <div className="mt-6 flex items-center gap-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10"><Mic className="h-5 w-5" /></span>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 shadow-[0_14px_30px_-8px_rgb(244_63_94_/_0.8)]"><PhoneOff className="h-6 w-6" /></span>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10"><Volume2 className="h-5 w-5" /></span>
        </div>
      </div>
    </div>
  );
}

export function VoiceSection() {
  return <Live>{(live) => <Voice live={live} />}</Live>;
}

/* ───────────── Tickets: a chat becomes a ticket becomes an answer ───────────── */

function Flow({ live }: { live: boolean }) {
  const [step] = useStepper(4, 1900, live);
  const on = (k: number) => step >= k;
  const ring = (k: number) => `${CARD_BASE} transition-all duration-500 ${on(k) ? "border-orange-300" : "border-orange-100 opacity-60"}`;
  return (
    <div className="grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
      <div className={`${ring(0)} p-4`}>
        <p className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold text-orange-600"><MessageCircle className="h-3.5 w-3.5" />Chat</p>
        <div className="space-y-2 text-[12px]"><p className="ml-auto w-fit rounded-2xl rounded-br-sm bg-ink px-3 py-2 text-white">How do I change my delivery address?</p><p className="w-fit rounded-2xl rounded-bl-sm bg-soft px-3 py-2">I am not sure. I have passed this to the team.</p></div>
      </div>
      <Link2 on={on(1)} />
      <div className={`${ring(1)} p-4`}>
        <p className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold text-orange-600"><Ticket className="h-3.5 w-3.5" />Ticket #1042</p>
        <p className="text-[14px] font-semibold">Change delivery address</p>
        <div className="mt-3 flex flex-wrap items-center gap-2"><Pill color={on(2) ? "#10c98f" : "#ff8a4c"}>{on(2) ? "Resolved" : "Open"}</Pill><Pill color="#7c5cff">Assigned to Ana</Pill></div>
        <p className="mt-3 text-[11.5px] text-muted">Created from the conversation, with its history attached.</p>
      </div>
      <Link2 on={on(2)} />
      <div className={`${ring(2)} p-4`}>
        <p className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold text-orange-600"><BookOpen className="h-3.5 w-3.5" />Help center</p>
        <p className="text-[14px] font-semibold">How to change your delivery address</p>
        <div className="mt-3 space-y-1.5"><i className="block h-1.5 w-full rounded bg-line" /><i className="block h-1.5 w-5/6 rounded bg-line" /><i className="block h-1.5 w-2/3 rounded bg-line" /></div>
        <div className="mt-3"><Pill color={on(3) ? "#10c98f" : "#8a93b2"}>{on(3) ? "Published" : "Draft"}</Pill></div>
      </div>
    </div>
  );
}

function Link2({ on }: { on: boolean }) {
  return (
    <span className="relative hidden w-14 items-center md:flex" aria-hidden>
      <i className="h-[3px] w-full rounded-full bg-orange-100" />
      <i className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full transition-all duration-[1200ms]" style={{ width: on ? "100%" : "0%", background: GRAD }} />
    </span>
  );
}

export function TicketSection() {
  return <Live>{(live) => <Flow live={live} />}</Live>;
}

/* ───────────── One line: paste it and the widget appears ───────────── */

const CODE = `<script src="…" async></script>`;
const CODE_TIMING: readonly number[] = [2600, 1100, 3600];

function Install({ live }: { live: boolean }) {
  const [step] = useStepper(3, CODE_TIMING, live);
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    if (step === 0) setCycle((c) => c + 1);
  }, [step]);
  return (
    <div className="grid items-center gap-5 md:grid-cols-2">
      <div className="rounded-3xl bg-[#14142a] p-6 text-white shadow-[0_40px_80px_-40px_rgb(20_20_60_/_0.8)]">
        <div className="flex items-center justify-between"><span className="font-mono text-[11px] uppercase tracking-wider text-white/45">Before &lt;/body&gt;</span><span key={step === 1 ? "c" : "n"} className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${step === 1 ? "pop-in bg-emerald-500 text-white" : "bg-white/10 text-white/70"}`}>{step === 1 ? "Copied" : "Copy"}</span></div>
        <p className="mt-5 min-h-[28px] break-all font-mono text-[15px] text-[#ffb27a]"><TypeText key={cycle} text={CODE} run speed={70} /></p>
        <p className="mt-6 text-[13px] text-white/50">One line. The same snippet adds visitor analytics too.</p>
      </div>
      <div className="window relative h-[220px]">
        <div className="space-y-2.5 p-5"><i className="block h-4 w-3/5 rounded bg-ink/15" /><i className="block h-2 w-full rounded bg-line" /><i className="block h-2 w-5/6 rounded bg-line" /><i className="mt-4 block h-20 rounded-xl bg-gradient-to-br from-amber-100 to-rose-100" /></div>
        {step >= 2 && <span className="pop-in absolute bottom-4 right-4 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_16px_34px_-8px_rgb(255_95_140_/_0.8)]" style={{ background: GRAD }}><MessageCircle className="h-6 w-6" /></span>}
        {step >= 2 && <span className="pop-in absolute bottom-[78px] right-4 rounded-2xl rounded-br-sm bg-white px-3.5 py-2 text-[12px] font-medium shadow-lg ring-1 ring-line" style={{ animationDelay: "250ms" }}>Hi! Ask me anything.</span>}
      </div>
    </div>
  );
}

export function InstallSection() {
  return <Live>{(live) => <Install live={live} />}</Live>;
}
