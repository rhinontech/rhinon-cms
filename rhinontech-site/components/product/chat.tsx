"use client";

import { useEffect, useState } from "react";
import { Bell, Camera, Check, Headphones, Hash, Mic, MonitorUp, PhoneOff, SmilePlus, Video } from "lucide-react";
import { Avatar } from "@/components/ProductMocks";
import { Cursor, Live, TypeText, useStepper } from "@/components/motion";

const GLASS = "rounded-3xl border border-white/10 bg-white/[0.045] backdrop-blur-md";
const EASE = "cubic-bezier(.4,.1,.2,1)";

/* ───────────── Hero: a conversation playing out ───────────── */

const CHAT_TIMING: readonly number[] = [1300, 1400, 1400, 1500, 1600, 1900, 4000];

function Msg({ name, i, time, children, reactions }: { name: string; i: number; time: string; children: React.ReactNode; reactions?: React.ReactNode }) {
  return (
    <div className="slide-in flex gap-3">
      <Avatar name={name} i={i} size={34} />
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-white">{name}<span className="ml-2 text-[11px] font-normal text-white/40">{time}</span></p>
        <p className="mt-0.5 text-[14px] leading-6 text-white/85">{children}</p>
        {reactions}
      </div>
    </div>
  );
}

function Window({ live }: { live: boolean }) {
  const [step] = useStepper(7, CHAT_TIMING, live);
  const thread = step >= 5;
  return (
    <div className="mx-auto w-full max-w-[1080px] rounded-[30px] bg-gradient-to-br from-cyan via-electric to-violet p-[1.5px] shadow-[0_60px_140px_-30px_rgb(47_91_255_/_0.65)]">
      <div className="relative overflow-hidden rounded-[29px] bg-[#09102c]">
        <div className="grid min-h-[430px] sm:grid-cols-[190px_1fr]">
          <aside className="hidden border-r border-white/10 bg-white/[0.03] p-3 sm:block">
            <p className="px-2 pb-1.5 pt-1 font-mono text-[10px] uppercase tracking-wider text-white/40">Channels</p>
            {[["general", 0], ["design", 0], ["sales", step >= 5 ? 4 : 3]].map(([c, n], i) => (
              <p key={c as string} className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] ${i === 1 ? "bg-white/10 font-semibold text-white" : "text-white/60"}`}><Hash className="h-3.5 w-3.5" />{c}{(n as number) > 0 && <span key={n as number} className="pop-in ml-auto rounded-full bg-pink px-1.5 text-[10px] font-bold text-white">{n}</span>}</p>
            ))}
            <p className="px-2 pb-1.5 pt-4 font-mono text-[10px] uppercase tracking-wider text-white/40">Direct</p>
            {[["Ana Silva", 4, "#34e3ad"], ["Yusuf Khan", 2, "#34e3ad"], ["Dev Patel", 3, "#ffb547"]].map(([n, i, c]) => <p key={n as string} className="flex items-center gap-2 px-2 py-1.5 text-[13px] text-white/60"><span className="relative"><Avatar name={n as string} i={i as number} size={22} /><i className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[#09102c]" style={{ background: c as string }} /></span>{(n as string).split(" ")[0]}</p>)}
          </aside>
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
              <span className="flex items-center gap-2 text-[15px] font-semibold text-white"><Hash className="h-4 w-4 text-white/50" />design<span className="text-[12px] font-normal text-white/40">4 members</span></span>
              <span className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white"><Headphones className="h-3.5 w-3.5" />Join call</span>
            </div>
            <div className="relative flex-1">
              <div className="space-y-5 p-5">
                <Msg name="Ana Silva" i={4} time="11:42" reactions={step >= 2 ? <div className="mt-2 flex gap-1.5">{[["👍", 2], ["🎉", 1]].map(([e, n], k) => <span key={e as string} className="pop-in flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[12px] text-white" style={{ animationDelay: `${k * 160}ms` }}>{e}<b className="text-[11px]">{n}</b></span>)}<span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/15 text-white/50"><SmilePlus className="h-3.5 w-3.5" /></span></div> : null}>The new landing page is ready for review.</Msg>
                {step >= 1 && <Msg name="Yusuf Khan" i={2} time="11:43">Looks great. Can we ship it on Friday?</Msg>}
                {step === 3 && <div className="flex items-center gap-3"><Avatar name="Dev Patel" i={3} size={34} /><span className="dots rounded-full bg-white/10 px-3.5 py-2 text-white/60"><i>•</i><i>•</i><i>•</i></span></div>}
                {step >= 4 && <Msg name="Dev Patel" i={3} time="11:44"><span className="rounded bg-electric/25 px-1 text-[#9db8ff]">@Ana</span> can you share the preview link?</Msg>}
              </div>
              <div className="absolute inset-y-0 right-0 hidden w-[44%] border-l border-white/10 bg-[#0c1535] p-4 shadow-[-20px_0_40px_-20px_rgb(0_0_0_/_0.6)] md:block" style={{ transform: thread ? "none" : "translateX(105%)", transition: `transform .7s ${EASE}` }}>
                <p className="flex items-center justify-between text-[13px] font-semibold text-white">Thread<span className="text-[11px] font-normal text-white/40">2 replies</span></p>
                <div className="mt-4 space-y-4">
                  <Msg name="Ana Silva" i={4} time="11:46">Here you go. Staging is live.</Msg>
                  <Msg name="Dev Patel" i={3} time="11:47">Perfect. Looks good to me.</Msg>
                </div>
              </div>
            </div>
            <div className="m-4 mt-0 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-[13px] text-white/40">Message #design<span className="ml-auto flex gap-2 text-white/40"><Video className="h-4 w-4" /><Mic className="h-4 w-4" /></span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChatHero() {
  return <Live className="max-sm:[zoom:0.78]">{(live) => <Window live={live} />}</Live>;
}

/* ───────────── Bento: six small demos, each its own thing ───────────── */

function Card({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div className={`${GLASS} flex flex-col p-6`}>
      <p className="font-display text-[21px] font-semibold text-white">{title}</p>
      <p className="mt-1.5 text-[14.5px] leading-6 text-white/55">{body}</p>
      <div className="mt-6 flex-1 rounded-2xl border border-white/10 bg-black/25 p-4">{children}</div>
    </div>
  );
}

function Channels({ live }: { live: boolean }) {
  const [tick] = useStepper(1000000, 1500, live);
  const names = ["general", "design", "sales", "support"];
  return (
    <div className="space-y-1">
      {names.map((n, k) => {
        const count = (tick + k * 2) % 5;
        const hot = tick % 4 === k;
        return <p key={n} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] transition-colors duration-500 ${hot ? "bg-white/10 text-white" : "text-white/60"}`}><Hash className="h-3.5 w-3.5" />{n}{count > 0 && <span key={count} className="pop-in ml-auto rounded-full bg-pink px-1.5 text-[10px] font-bold text-white">{count}</span>}</p>;
      })}
    </div>
  );
}

function Reactions({ live }: { live: boolean }) {
  const [s] = useStepper(5, [1100, 800, 800, 800, 1800], live);
  const all: [string, number][] = [["👍", 3], ["🎉", 2], ["❤️", 1], ["🚀", 4]];
  return (
    <div>
      <p className="rounded-2xl rounded-tl-sm bg-white/10 px-3.5 py-2.5 text-[13px] text-white/90">We shipped it. Thank you all.</p>
      <div className="mt-3 flex min-h-[30px] flex-wrap gap-1.5">{all.slice(0, s).map(([e, n]) => <span key={e} className="pop-in flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[13px] text-white">{e}<b className="text-[11px]">{n}</b></span>)}</div>
    </div>
  );
}

function Threads({ live }: { live: boolean }) {
  const [s] = useStepper(2, [1800, 3400], live);
  return (
    <div>
      <p className="flex items-center gap-2 text-[13px] text-white/90"><Avatar name="Ana Silva" i={4} size={24} />Can we move the review to Thursday?</p>
      <p className="ml-8 mt-2 text-[12px] font-medium text-[#9db8ff]">{s === 1 ? "Hide replies" : "3 replies"}</p>
      <div className="ml-8 grid overflow-hidden transition-all duration-500" style={{ gridTemplateRows: s === 1 ? "1fr" : "0fr" }}>
        <div className="min-h-0 space-y-2 overflow-hidden pt-2">{[["Yusuf Khan", 2, "Works for me."], ["Dev Patel", 3, "Thursday is fine."], ["Meera Rao", 5, "Booked it."]].map(([n, i, t]) => <p key={n as string} className="flex items-center gap-2 text-[12.5px] text-white/70"><Avatar name={n as string} i={i as number} size={20} />{t}</p>)}</div>
      </div>
    </div>
  );
}

function Mentions({ live }: { live: boolean }) {
  const [s] = useStepper(4, [2300, 1500, 1500, 1800], live);
  return (
    <div className="relative min-h-[110px]">
      <p className="rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2.5 text-[13px] text-white/90">{s >= 2 ? <>Can you review this <span className="pop-in rounded bg-electric/30 px-1 text-[#9db8ff]">@Ana Silva</span></> : <>Can you review this <TypeText text="@an" run={s === 0 || s === 1} speed={140} /></>}</p>
      {s === 1 && <div className="pop-in absolute left-0 top-12 z-10 w-48 rounded-xl border border-white/15 bg-[#0e1740] p-1.5 shadow-xl"><p className="flex items-center gap-2 rounded-lg bg-electric/30 px-2 py-1.5 text-[12.5px] text-white"><Avatar name="Ana Silva" i={4} size={20} />Ana Silva</p><p className="flex items-center gap-2 px-2 py-1.5 text-[12.5px] text-white/60"><Avatar name="Anil Shah" i={1} size={20} />Anil Shah</p></div>}
      {s >= 3 && <p className="pop-in mt-3 flex items-center gap-1.5 text-[12px] text-emerald-300"><Check className="h-3.5 w-3.5" />Ana was notified</p>}
    </div>
  );
}

function Presence({ live }: { live: boolean }) {
  const [t] = useStepper(3, 1800, live);
  const states = [["#34e3ad", "Online"], ["#4d7bff", "In a call"], ["#ffb547", "Away"]];
  return (
    <div>
      <div className="flex gap-3">
        {["Ana Silva", "Yusuf Khan", "Dev Patel", "Meera Rao", "Sara Lin"].map((n, i) => {
          const st = states[(t + i) % 3];
          return <span key={n} className="relative"><Avatar name={n} i={i + 2} size={38} /><i className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-[#0b1233] transition-colors duration-500 ${st[1] === "Online" ? "ring-out" : ""}`} style={{ background: st[0] }}>{st[1] === "In a call" && <Headphones className="h-2.5 w-2.5 text-white" />}</i></span>;
        })}
      </div>
      <p className="mt-4 flex gap-4 text-[11.5px] text-white/50">{states.map(([c, l]) => <span key={l} className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: c }} />{l}</span>)}</p>
    </div>
  );
}

function Toasts({ live }: { live: boolean }) {
  const [tick] = useStepper(1000000, 1700, live);
  const items: [string, string][] = [["New message in #design", "Ana: Staging is live"], ["Yusuf mentioned you", "“Can you look at this?”"], ["Meeting starting", "Design review in 5 min"], ["Dev replied in a thread", "Perfect. Looks good"]];
  return (
    <div className="relative h-[156px] overflow-hidden">
      {[0, 1, 2].map((slot) => {
        const idx = tick - slot;
        if (idx < 0) return null;
        const [t, b] = items[idx % items.length];
        return <div key={idx} className="absolute inset-x-0 transition-all duration-700" style={{ top: slot * 52, opacity: 1 - slot * 0.3 }}><p className={`${slot === 0 ? "slide-in" : ""} flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2`}><Bell className="h-4 w-4 shrink-0 text-[#9db8ff]" /><span className="min-w-0 text-[12px] leading-4"><b className="block truncate text-white">{t}</b><span className="text-white/50">{b}</span></span></p></div>;
      })}
    </div>
  );
}

export function BentoSection() {
  return (
    <Live className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {(live) => (
        <>
          <Card title="Channels and DMs" body="A place for every team and every conversation, with unread counts."><Channels live={live} /></Card>
          <Card title="Reactions" body="Say yes without writing a reply."><Reactions live={live} /></Card>
          <Card title="Threads" body="Keep side conversations out of the main flow."><Threads live={live} /></Card>
          <Card title="@mentions" body="Pull the right person in, and they are told."><Mentions live={live} /></Card>
          <Card title="Presence" body="See who is around, in a call or away."><Presence live={live} /></Card>
          <Card title="Notifications" body="The important things reach you inside the app."><Toasts live={live} /></Card>
        </>
      )}
    </Live>
  );
}

/* ───────────── Group call: the speaker moves around the grid ───────────── */

const FACES: [string, string, string][] = [["Ana Silva", "#2f5bff", "#2cd3ff"], ["Yusuf Khan", "#7c5cff", "#e04dd6"], ["Dev Patel", "#ff8a4c", "#ff5fb0"], ["Meera Rao", "#10c98f", "#2cd3ff"]];

function Tile({ name, from, to, speaking, guest = false }: { name: string; from: string; to: string; speaking: boolean; guest?: boolean }) {
  return (
    <div className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl transition-all duration-500 ${speaking ? "ring-[3px] ring-emerald-400" : "ring-1 ring-white/10"}`} style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
      <span className="font-display text-[34px] font-semibold text-white/90">{name.split(" ").map((p) => p[0]).join("")}</span>
      <span className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-black/40 px-2 py-1 text-[11px] font-medium text-white backdrop-blur"><Mic className="h-3 w-3" />{name}{guest && <b className="rounded bg-amber-400 px-1 text-[9px] text-black">Guest</b>}</span>
      {speaking && <span className="absolute right-2 top-2 flex h-5 items-end gap-[3px]">{[0, 1, 2, 3].map((b) => <i key={b} className="wave-bar block w-[3px] rounded-full bg-white" style={{ height: "100%", animationDelay: `${b * 0.12}s` }} />)}</span>}
    </div>
  );
}

function Call({ live }: { live: boolean }) {
  const [sp] = useStepper(4, 1900, live);
  return (
    <div className={`${GLASS} p-4 sm:p-5`}>
      <div className="mb-3 flex items-center justify-between text-[13px]"><span className="flex items-center gap-2 font-semibold text-white"><i className="ping-soft relative h-2 w-2 rounded-full bg-emerald-400" />Design review</span><span className="text-white/45">4 people</span></div>
      <div className="grid grid-cols-2 gap-3">{FACES.map(([n, a, b], i) => <Tile key={n} name={n} from={a} to={b} speaking={sp === i} />)}</div>
      <div className="mt-4 flex items-center justify-center gap-3">
        {[Mic, Camera, MonitorUp].map((I, i) => <span key={i} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white"><I className="h-[18px] w-[18px]" /></span>)}
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 text-white shadow-[0_14px_30px_-8px_rgb(244_63_94_/_0.8)]"><PhoneOff className="h-5 w-5" /></span>
      </div>
    </div>
  );
}

export function CallSection() {
  return <Live className="mx-auto w-full max-w-[560px]">{(live) => <Call live={live} />}</Live>;
}

/* ───────────── Meeting link: create it, share it, a guest joins ───────────── */

const LINK_TIMING: readonly number[] = [1000, 2400, 1400, 3800];
const LINK = "rhinontech.in/meet/design-review";

function Guest({ live }: { live: boolean }) {
  const [step] = useStepper(4, LINK_TIMING, live);
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    if (step === 0) setCycle((c) => c + 1);
  }, [step]);
  return (
    <div className="grid items-center gap-5 md:grid-cols-[1fr_auto_1fr]">
      <div className={`${GLASS} relative p-5`}>
        <p className="text-[12px] font-semibold uppercase tracking-wider text-white/45">You</p>
        <span className={`mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[13px] font-semibold text-ink transition-transform duration-200 ${step === 0 ? "scale-95" : ""}`}><Video className="h-4 w-4" />New meeting</span>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-3.5 py-3 font-mono text-[12.5px] text-[#9db8ff]"><span className="min-w-0 flex-1 truncate"><TypeText key={cycle} text={LINK} run={step >= 1} speed={55} /></span><span key={step >= 2 ? "c" : "n"} className={`shrink-0 rounded-md px-2 py-1 text-[10.5px] font-semibold ${step >= 2 ? "pop-in bg-emerald-500 text-white" : "bg-white/10 text-white/60"}`}>{step >= 2 ? "Copied" : "Copy"}</span></div>
        <Cursor x={step === 0 ? 70 : 190} y={step === 0 ? 62 : 150} down={step === 0} hidden={step > 1} />
      </div>
      <span className="hidden h-[3px] w-16 overflow-hidden rounded-full bg-white/10 md:block"><i className="block h-full rounded-full bg-gradient-to-r from-cyan to-electric transition-all duration-[1400ms]" style={{ width: step >= 2 ? "100%" : "0%" }} /></span>
      <div className={`${GLASS} p-4`}>
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-white/45">A guest, with no account</p>
        <div className="grid grid-cols-2 gap-2.5">
          {FACES.slice(0, 3).map(([n, a, b]) => <Tile key={n} name={n} from={a} to={b} speaking={false} />)}
          {step >= 3 ? <div className="pop-in"><Tile name="Priya Nair" from="#e0a94d" to="#ff8a4c" speaking guest /></div> : <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-white/15 text-[12px] text-white/35">Waiting for a guest</div>}
        </div>
      </div>
    </div>
  );
}

export function GuestSection() {
  return <Live>{(live) => <Guest live={live} />}</Live>;
}
