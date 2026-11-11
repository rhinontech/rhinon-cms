"use client";

import { useEffect, useRef, useState } from "react";
import { Check, FileText, Lock, Mail, PenLine, Sparkles, Wrench } from "lucide-react";
import { Avatar, Pill } from "@/components/mockPrimitives";
import { AutoTabs, Cursor, Live, Ring, TypeText, useReducedMotion, useStepper } from "@/components/motion";

const CARD = "rounded-3xl border border-fuchsia-100 bg-white shadow-[0_40px_90px_-40px_rgb(190_60_190_/_0.4)]";
const GRAD = "linear-gradient(135deg, #ff5fb0, #7c5cff)";

/* ───────────── Hero: a hire travelling the path from offer to day one ───────────── */

const PATH = "M 30 205 C 150 205, 170 75, 300 75 S 470 225, 600 205 S 760 65, 880 85 S 965 175, 985 130";
const STOPS = ["Offer sent", "Signed", "Onboarding link", "Profile done", "Company email", "Day one"];
const NOTES = ["Offer letter sent to Aarav", "Signed with a typed signature", "A link to set up his own profile", "Profile and documents complete", "aarav@acme.rhinontech.in created", "Welcome aboard, Aarav"];
const LABEL_AT: [number, number][] = [[0, 20], [0, -46], [58, -42], [0, 20], [0, -46], [0, 24]];
const JOURNEY_TIMING: readonly number[] = [1600, 2000, 2000, 2000, 2000, 3800];

function Journey({ live }: { live: boolean }) {
  const reduced = useReducedMotion();
  const [step] = useStepper(6, JOURNEY_TIMING, live);
  const pathRef = useRef<SVGPathElement>(null);
  const lenRef = useRef(0);
  const [total, setTotal] = useState(0);
  const [stops, setStops] = useState<{ x: number; y: number }[]>([]);
  const [pos, setPos] = useState({ x: 30, y: 205, len: 0 });

  useEffect(() => {
    const p = pathRef.current;
    if (!p) return;
    const t = p.getTotalLength();
    setTotal(t);
    setStops(STOPS.map((_, i) => { const pt = p.getPointAtLength((i / 5) * t); return { x: pt.x, y: pt.y }; }));
  }, []);

  useEffect(() => {
    const p = pathRef.current;
    if (!p || !total) return;
    const target = (step / 5) * total;
    if (step === 0 || reduced) {
      lenRef.current = target;
      const pt = p.getPointAtLength(target);
      setPos({ x: pt.x, y: pt.y, len: target });
      return;
    }
    const from = lenRef.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / 1400);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const L = from + (target - from) * e;
      lenRef.current = L;
      const pt = p.getPointAtLength(L);
      setPos({ x: pt.x, y: pt.y, len: L });
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step, total, reduced]);

  const pct = (x: number, y: number) => ({ left: `${(x / 1010) * 100}%`, top: `${(y / 270) * 100}%` });
  return (
    <div>
      <div className="relative mx-auto aspect-[1010/270] w-full max-w-[1100px]">
        <svg viewBox="0 0 1010 270" className="absolute inset-0 h-full w-full" fill="none" aria-hidden>
          <defs><linearGradient id="hr-grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ff5fb0" /><stop offset="1" stopColor="#7c5cff" /></linearGradient></defs>
          <path ref={pathRef} d={PATH} stroke="#eadcf5" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 12" />
          {total > 0 && <path d={PATH} stroke="url(#hr-grad)" strokeWidth="6" strokeLinecap="round" strokeDasharray={total} strokeDashoffset={total - pos.len} />}
        </svg>
        {stops.map((s, i) => (
          <div key={STOPS[i]} className="absolute" style={pct(s.x, s.y)}>
            <span className={`absolute -left-[11px] -top-[11px] flex h-[22px] w-[22px] items-center justify-center rounded-full border-[3px] transition-all duration-500 ${i <= step ? "scale-110 border-white text-white shadow-[0_8px_20px_-4px_rgb(190_60_190_/_0.7)]" : "border-[#eadcf5] bg-white"}`} style={i <= step ? { background: GRAD } : undefined}>{i <= step && <Check className="h-3 w-3" strokeWidth={4} />}</span>
            <span className={`absolute left-1/2 hidden w-28 -translate-x-1/2 text-center text-[12.5px] font-semibold transition-colors duration-500 sm:block ${i <= step ? "text-ink" : "text-muted"}`} style={{ top: LABEL_AT[i][1], marginLeft: LABEL_AT[i][0] }}>{STOPS[i]}</span>
          </div>
        ))}
        <div className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={pct(pos.x, pos.y)}>
          <span className="absolute inset-0 -m-2 rounded-full bg-fuchsia-300/40 blur-md" />
          <Avatar name="Aarav Mehta" i={3} size={42} />
          <span key={step} className="pop-in absolute bottom-[52px] left-1/2 hidden w-max max-w-[220px] -translate-x-1/2 rounded-xl bg-ink px-3 py-2 text-[12px] font-medium text-white shadow-xl sm:block">{NOTES[step]}</span>
        </div>
      </div>
      <p className="mt-4 text-center text-[14px] font-medium text-ink-soft sm:hidden">{STOPS[step]}: {NOTES[step]}</p>
    </div>
  );
}

export function JourneyHero() {
  return <Live>{(live) => <Journey live={live} />}</Live>;
}

/* ───────────── Signature: drawn, then typed ───────────── */

const SIGN_TIMING: readonly number[] = [1100, 2400, 1900, 1000, 3800];
const SIG_PATH = "M8 62 C 26 8, 46 6, 40 52 S 76 28, 92 18 S 116 62, 146 34 S 186 20, 214 48";

function Signature({ live }: { live: boolean }) {
  const [step] = useStepper(5, SIGN_TIMING, live);
  const drawn = step <= 2;
  const stamped = step === 2 || step === 4;
  return (
    <div className={`${CARD} relative mx-auto w-full max-w-[520px] p-6 sm:p-8`}>
      <div className="flex items-center justify-between"><b className="font-display text-[18px] font-semibold">Offer letter</b><span className="flex rounded-full bg-fuchsia-50 p-1 text-[12px] font-semibold">{["Drawn", "Typed"].map((t, k) => <span key={t} className={`rounded-full px-3 py-1 transition-all duration-300 ${(k === 0) === drawn ? "bg-white text-ink shadow-sm" : "text-muted"}`}>{t}</span>)}</span></div>
      <div className="mt-5 space-y-2.5"><i className="block h-2 w-full rounded bg-fuchsia-100/80" /><i className="block h-2 w-11/12 rounded bg-fuchsia-100/80" /><i className="block h-2 w-5/6 rounded bg-fuchsia-100/80" /><i className="block h-2 w-2/3 rounded bg-fuchsia-100/80" /></div>
      <div className="relative mt-8 h-24 border-b-2 border-dashed border-fuchsia-200">
        <span className="absolute -bottom-6 left-0 font-mono text-[10.5px] uppercase tracking-wider text-muted">Signature</span>
        {drawn ? (
          <svg viewBox="0 0 230 80" className="absolute bottom-1 left-2 h-20 w-56" fill="none" aria-hidden><path d={SIG_PATH} pathLength={1} stroke="#4a2fa8" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1} style={{ strokeDashoffset: step >= 1 ? 0 : 1, transition: step === 0 ? "none" : "stroke-dashoffset 2.1s cubic-bezier(.5,0,.3,1)" }} /></svg>
        ) : (
          <p className="font-signature absolute bottom-1 left-3 text-[46px] leading-none text-[#4a2fa8]"><TypeText text="Aarav Mehta" run={step >= 4} speed={90} /></p>
        )}
        {stamped && <span key={step} className="stamp-in absolute -top-2 right-0 flex items-center gap-1.5 rounded-lg border-2 border-emerald-500 px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-wider text-emerald-600"><Check className="h-4 w-4" strokeWidth={3.5} />Signed</span>}
      </div>
      <p className="mt-9 text-[12.5px] text-muted">{step >= 3 ? "Or a typed signature. Either one is accepted." : "Candidates sign in the browser. No account needed."}</p>
    </div>
  );
}

export function SignatureSection() {
  return <Live>{(live) => <Signature live={live} />}</Live>;
}

/* ───────────── Phone: a new hire sets up their own profile ───────────── */

const PHONE_TIMING: readonly number[] = [1300, 1900, 1900, 2300, 4200];
const FORM: [string, string][] = [["Full name", "Aarav Mehta"], ["Phone", "+91 98765 43210"], ["Emergency contact", "Neha Mehta"], ["Bank account", "•••• •••• 4821"]];

function Phone({ live }: { live: boolean }) {
  const [step] = useStepper(5, PHONE_TIMING, live);
  const filled = [step >= 1, step >= 2, step >= 3, step >= 3];
  return (
    <div className="relative mx-auto h-[604px] w-[290px] rounded-[46px] border-[10px] border-[#1c1633] bg-white shadow-[0_50px_100px_-30px_rgb(124_60_200_/_0.6)]">
      <span className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-[#1c1633]" />
      <div className="px-5 pt-12">
        <div className="flex items-center justify-between"><span><p className="text-[12px] text-muted">Welcome</p><p className="font-display text-[22px] font-semibold leading-tight">Aarav</p></span><Ring value={[0.05, 0.3, 0.55, 0.8, 1][step]} size={56} stroke={6} from="#ff5fb0" to="#7c5cff" track="rgb(124 92 255 / 0.12)"><span className="text-[11px] font-bold">{[0, 25, 50, 75, 100][step]}%</span></Ring></div>
        <div className="mt-5 space-y-3">
          {FORM.map(([label, value], k) => (
            <div key={label}>
              <p className="mb-1 text-[11px] font-semibold text-muted">{label}</p>
              <p className={`flex h-10 items-center rounded-xl border px-3 text-[13px] transition-colors duration-300 ${filled[k] ? "border-fuchsia-200 bg-fuchsia-50/60" : "border-line bg-soft/50"}`}><TypeText text={value} run={filled[k]} speed={38} /></p>
            </div>
          ))}
        </div>
        <span className={`mt-5 flex h-11 items-center justify-center rounded-xl text-[13.5px] font-semibold text-white transition-transform duration-200 ${step === 4 ? "scale-95" : ""}`} style={{ background: step >= 4 ? "#10c98f" : GRAD }}>{step >= 4 ? "Submitted" : "Submit"}</span>
      </div>
      {step >= 4 && (
        <div className="pop-in absolute inset-x-4 bottom-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 shadow-lg">
          <p className="flex items-center gap-2 text-[12.5px] font-semibold text-emerald-800"><Check className="h-4 w-4" strokeWidth={3} />You are all set</p>
          <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-emerald-700"><Mail className="h-3.5 w-3.5" />aarav@acme.rhinontech.in</p>
        </div>
      )}
    </div>
  );
}

export function PhoneSection() {
  return <Live>{(live) => <Phone live={live} />}</Live>;
}

/* ───────────── Record: one place for everything about a person ───────────── */

const RECORD_TABS = [
  { title: "Employment", body: "Type, schedule, location and start date." },
  { title: "Compensation", body: "Pay, variable pay and the salary structure." },
  { title: "Documents", body: "Letters and IDs in a secure vault." },
  { title: "Statutory IDs", body: "PAN, UAN and ESIC, kept with the person." },
];
const FILES: [string, string][] = [["Offer letter.pdf", "Signed"], ["NDA.pdf", "Signed"], ["ID proof.jpg", "Uploaded"], ["Appraisal letter.pdf", "Uploaded"]];

function Record({ tab }: { tab: number }) {
  const show = (k: number) => ({ opacity: tab === k ? 1 : 0, transform: tab === k ? "none" : "translateY(10px)", transition: "all .5s cubic-bezier(.4,.1,.2,1)", pointerEvents: "none" as const });
  return (
    <div className={`${CARD} mx-auto w-full max-w-[720px] p-6`}>
      <div className="flex items-center gap-4 border-b border-fuchsia-100 pb-5"><Avatar name="Aarav Mehta" i={3} size={52} /><span><b className="font-display block text-[20px] font-semibold leading-tight">Aarav Mehta</b><span className="text-[13px] text-muted">Product Designer · Bengaluru</span></span><Pill color="#10c98f">Active</Pill></div>
      <div className="relative mt-5 h-[210px]">
        <div className="absolute inset-0 grid gap-3 sm:grid-cols-2" style={show(0)}>{[["Type", "Full-time"], ["Schedule", "Mon to Fri, 9:30 to 18:30"], ["Location", "Bengaluru"], ["Joined", "1 December"]].map(([k, v]) => <div key={k} className="rounded-2xl bg-fuchsia-50/60 p-4"><p className="font-mono text-[10.5px] uppercase tracking-wider text-muted">{k}</p><p className="mt-1 text-[15px] font-semibold">{v}</p></div>)}</div>
        <div className="absolute inset-0" style={show(1)}>
          <div className="flex gap-6 text-[13px]"><span><p className="font-mono text-[10.5px] uppercase tracking-wider text-muted">Annual</p><p className="font-display text-[24px] font-semibold">₹12,00,000</p></span><span><p className="font-mono text-[10.5px] uppercase tracking-wider text-muted">Variable</p><p className="font-display text-[24px] font-semibold">₹1,20,000</p></span></div>
          <div className="mt-5 flex h-4 overflow-hidden rounded-full">{[["#ff5fb0", 50], ["#a76bff", 20], ["#7c5cff", 8], ["#4d7bff", 7], ["#2cd3ff", 15]].map(([c, w]) => <i key={c as string} className="block h-full" style={{ width: tab === 1 ? `${w}%` : "0%", background: c as string, transition: "width .9s cubic-bezier(.3,.7,.2,1)" }} />)}</div>
          <p className="mt-3 flex flex-wrap gap-x-4 text-[12px] text-muted">{["Basic", "HRA", "Travel", "Medical", "Other"].map((l) => <span key={l}>{l}</span>)}</p>
        </div>
        <div className="absolute inset-0 grid gap-2.5 sm:grid-cols-2" style={show(2)}>{FILES.map(([n, s]) => <p key={n} className="flex items-center gap-3 rounded-2xl border border-fuchsia-100 bg-[#fdf9ff] p-3.5 text-[13px]"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-fuchsia-500 ring-1 ring-fuchsia-100"><FileText className="h-4 w-4" /></span><span className="min-w-0 flex-1"><b className="block truncate font-semibold">{n}</b><span className="text-[11.5px] text-muted">{s}</span></span></p>)}</div>
        <div className="absolute inset-0 space-y-2.5" style={show(3)}>{[["PAN", "•••••••• 4F"], ["UAN", "•••• •••• 7821"], ["ESIC", "•••••• 0034"]].map(([k, v]) => <p key={k} className="flex items-center gap-3 rounded-2xl bg-fuchsia-50/60 px-4 py-3.5 text-[14px]"><Lock className="h-4 w-4 text-fuchsia-500" /><b className="w-12 font-semibold">{k}</b><span className="font-mono text-muted">{v}</span></p>)}</div>
      </div>
    </div>
  );
}

export function RecordSection() {
  return <AutoTabs items={RECORD_TABS} interval={4200} tone={["#ff5fb0", "#7c5cff"]} visual={(i) => <Record tab={i} />} />;
}

/* ───────────── AI rewrite: select a sentence, pick a tone ───────────── */

const REWRITE_TIMING: readonly number[] = [1500, 1200, 1300, 1100, 4200];
const BEFORE = "We are pleased to inform you that your application has been accepted.";
const AFTER = "We are delighted to offer you the role, and we cannot wait to have you on the team.";

function Rewrite({ live }: { live: boolean }) {
  const [step] = useStepper(5, REWRITE_TIMING, live);
  return (
    <div className={`${CARD} relative mx-auto w-full max-w-[620px] p-6 sm:p-8`}>
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Offer letter template</p>
      <p className="mt-4 text-[15px] leading-7 text-ink-soft">Dear Aarav,</p>
      <p className="relative mt-2 min-h-[84px] text-[17px] leading-8">
        {step < 4 ? <span className="rounded-md px-0.5 transition-all duration-700" style={{ background: step >= 1 ? "rgb(255 95 176 / 0.22)" : "transparent", boxShadow: step >= 1 ? "0 0 0 3px rgb(255 95 176 / 0.12)" : "none" }}>{BEFORE}</span> : <span className="rounded-md bg-emerald-100/70 px-0.5"><TypeText text={AFTER} run speed={24} /></span>}
      </p>
      <p className="mt-2 text-[15px] leading-7 text-ink-soft">Your start date is 1 December.</p>
      {(step === 2 || step === 3) && (
        <div className="pop-in absolute left-8 top-[172px] z-10 w-[220px] rounded-2xl border border-fuchsia-100 bg-white p-2 shadow-[0_24px_50px_-18px_rgb(120_60_200_/_0.5)]">
          <p className="flex items-center gap-1.5 px-2 pb-1.5 pt-1 text-[11px] font-semibold text-violet"><Sparkles className="h-3.5 w-3.5" />Rewrite with AI</p>
          {["Warmer", "Shorter", "More formal"].map((o, k) => <p key={o} className={`rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors duration-200 ${k === 0 && step === 3 ? "bg-fuchsia-100 text-fuchsia-700" : ""}`}>{o}</p>)}
        </div>
      )}
      <Cursor x={step === 2 ? 220 : 90} y={step === 2 ? 250 : 213} down={step === 3} hidden={step < 2 || step > 3} />
      <p className="mt-4 flex items-center gap-1.5 text-[12.5px] text-muted"><PenLine className="h-3.5 w-3.5" />{step >= 4 ? "Rewritten warmer. Keep it, or try another tone." : "Select any sentence and pick a tone."}</p>
    </div>
  );
}

export function RewriteSection() {
  return <Live>{(live) => <Rewrite live={live} />}</Live>;
}

/* ───────────── Offboarding: access closes cleanly ───────────── */

const OFF_TIMING: readonly number[] = [1700, 1200, 900, 900, 900, 3200];

function Offboard({ live }: { live: boolean }) {
  const [step] = useStepper(6, OFF_TIMING, live);
  const off = step >= 1;
  const items: [string, typeof Mail][] = [["Company email", Mail], ["Tool access", Wrench], ["Records", FileText]];
  return (
    <div className={`${CARD} relative mx-auto w-full max-w-[560px] p-6`}>
      <div className="flex items-center gap-4">
        <Avatar name="Aarav Mehta" i={3} size={48} />
        <span className="min-w-0 flex-1"><b className="font-display block text-[19px] font-semibold leading-tight">Aarav Mehta</b><span className="text-[13px] text-muted">Product Designer</span></span>
        <span className="flex items-center gap-2.5 text-[12.5px] font-semibold"><span className={off ? "text-muted" : "text-emerald-600"}>{off ? "Inactive" : "Active"}</span><span className="relative h-7 w-12 rounded-full transition-colors duration-500" style={{ background: off ? "#d8d0e8" : "#10c98f" }}><i className="absolute top-1 block h-5 w-5 rounded-full bg-white shadow transition-all duration-500" style={{ left: off ? 4 : 24 }} /></span></span>
      </div>
      <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
        {items.map(([label, Icon], k) => {
          const closed = step >= k + 2;
          return <div key={label} className={`rounded-2xl border p-4 transition-all duration-500 ${closed ? "border-line bg-soft text-muted" : "border-fuchsia-100 bg-[#fdf9ff]"}`}><Icon className={`h-5 w-5 ${closed ? "" : "text-fuchsia-500"}`} /><p className={`mt-3 text-[13px] font-semibold ${closed ? "line-through" : ""}`}>{label}</p><p className="mt-0.5 text-[11.5px]">{k === 2 ? (closed ? "Archived" : "Kept safe") : closed ? "Closed" : "Open"}</p></div>;
        })}
      </div>
      <p className="mt-5 h-6 text-[13px] font-medium text-emerald-700">{step >= 5 && <span className="pop-in flex items-center gap-1.5"><Check className="h-4 w-4" strokeWidth={3} />Offboarded cleanly. The record stays for your files.</span>}</p>
      <Cursor x={off ? "calc(100% - 52px)" : "calc(100% - 140px)"} y={off ? 40 : 100} down={step === 1} hidden={step > 1} />
    </div>
  );
}

export function OffboardSection() {
  return <Live>{(live) => <Offboard live={live} />}</Live>;
}
