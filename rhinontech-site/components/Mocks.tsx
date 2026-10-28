import { Check, CheckCheck, Paperclip, Sparkles, Wand2 } from "lucide-react";

/**
 * Product moments drawn in code: crisp at any size, and never anyone's real
 * data. Dark "app" cards sit on the gradient panels; light outlined cards
 * float over them as events.
 */

const TONES = ["bg-violet-500", "bg-orange-500", "bg-sky-500", "bg-pink-500", "bg-emerald-500", "bg-amber-500"];

export function Face({ name, i = 0, size = "h-8 w-8 text-[11px]" }: { name: string; i?: number; size?: string }) {
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2);
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-[#1c1c20] ${TONES[i % TONES.length]} ${size}`}>
      {initials}
    </span>
  );
}

function Dot({ className }: { className: string }) {
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${className}`} />;
}

/** Hero: a campaign's week, with a reply rate trend. */
export function CampaignCard() {
  const bars = [18, 26, 22, 34, 41, 38, 52, 47, 61, 58, 72, 69];
  return (
    <div className="dark-card w-[340px] rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold">Q3 Founder Outreach</span>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10.5px] font-medium text-emerald-300"><Dot className="bg-emerald-400" />Live</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[["Sent", "4,812"], ["Opened", "41%"], ["Replied", "6.2%"]].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-white/[0.05] px-3 py-2.5">
            <p className="text-[10.5px] text-zinc-400">{k}</p>
            <p className="mt-0.5 text-[17px] font-semibold tabular-nums">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex h-16 items-end gap-1.5">
        {bars.map((b, i) => (
          <span key={i} className={`bar flex-1 rounded-t-[3px] ${i > 8 ? "bg-gradient-to-t from-orange-500 to-amber-300" : "bg-white/15"}`} style={{ height: `${b}%`, animationDelay: `${400 + i * 70}ms` }} />
        ))}
      </div>
      <p className="mt-2 flex justify-between text-[10px] text-zinc-500"><span>12 weeks</span><span className="text-amber-300">Replies up 2.3×</span></p>
    </div>
  );
}

/** CRM: a pipeline board. */
export function PipelineCard() {
  const cols = [
    { name: "Qualified", total: "₹6.8L", deals: [["Northwind Labs", "₹2.4L", 0], ["Cedar Finance", "₹4.4L", 2]] },
    { name: "Proposal", total: "₹9.1L", deals: [["Bluepeak Retail", "₹5.6L", 1], ["Orbit Logistics", "₹3.5L", 3]] },
    { name: "Won", total: "₹4.2L", deals: [["Juniper Legal", "₹4.2L", 4]] },
  ] as const;
  return (
    <div className="dark-card w-[380px] rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-semibold">Sales pipeline</span>
        <span className="text-[11px] text-zinc-400">₹20.1L open</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {cols.map((c) => (
          <div key={c.name} className="rounded-xl bg-white/[0.04] p-2">
            <p className="flex items-center justify-between px-1 text-[10.5px] text-zinc-400"><span>{c.name}</span><span>{c.total}</span></p>
            <div className="mt-2 space-y-1.5">
              {c.deals.map(([co, v, i]) => (
                <div key={co} className={`rounded-lg p-2 ${c.name === "Won" ? "bg-emerald-400/15 ring-1 ring-emerald-400/30" : "bg-white/[0.07]"}`}>
                  <p className="truncate text-[11px] font-medium">{co}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[10.5px] tabular-nums text-zinc-300">{v}</span>
                    <Face name={co} i={i} size="h-4 w-4 text-[7px]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Outreach: one email being personalised by AI. */
export function ComposeCard() {
  return (
    <div className="dark-card w-[380px] rounded-2xl p-5 text-[12.5px] leading-6">
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-[11.5px]">
        <span className="text-zinc-400">To</span>
        <span className="rounded-full bg-white/10 px-2 py-0.5">priya@lumenfoods.example</span>
      </div>
      <p className="mt-3 text-zinc-300">Hi Priya,</p>
      <p className="mt-2 text-zinc-300">
        Saw that <span className="rounded bg-orange-500/25 px-1 text-orange-200">Lumen Foods just opened two new kitchens</span>. Teams growing that fast usually lose hours to follow-ups and reporting…
      </p>
      <div className="mt-4 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] text-orange-300"><Wand2 className="h-3.5 w-3.5" />Personalised for 627 leads</span>
        <span className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11.5px] font-semibold text-zinc-900"><Sparkles className="h-3.5 w-3.5" />Send test</span>
      </div>
    </div>
  );
}

/** Chatbot: a live conversation, mid-reply. */
export function ChatCard() {
  return (
    <div className="dark-card w-[320px] overflow-hidden rounded-2xl">
      <div className="flex items-center gap-3 bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-3.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-[13px] font-bold">R</span>
        <span>
          <span className="block text-[13px] font-semibold">Rhino Assistant</span>
          <span className="text-[10.5px] text-white/80">Replies instantly · 24/7</span>
        </span>
      </div>
      <div className="space-y-2.5 p-4 text-[12.5px] leading-5">
        <p className="ml-auto w-fit max-w-[78%] rounded-2xl rounded-br-md bg-white px-3 py-2 text-zinc-900">Do you integrate with Gmail?</p>
        <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-white/10 px-3 py-2">Yes, campaigns and replies go out from your own Gmail or Outlook. Want me to set up a quick demo?</p>
        <p className="ml-auto w-fit max-w-[78%] rounded-2xl rounded-br-md bg-white px-3 py-2 text-zinc-900">Please. Thursday?</p>
        <p className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md bg-white/10 px-3 py-2.5">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-300 [animation-delay:-0.2s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-300 [animation-delay:-0.1s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-300" />
        </p>
      </div>
      <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2.5 text-[11.5px] text-zinc-400">
        <Paperclip className="h-3.5 w-3.5" /> Type a message…
      </div>
    </div>
  );
}

/** Team: a payslip. */
export function PayslipCard() {
  const rows = [["Basic", "₹48,000"], ["HRA", "₹19,200"], ["Allowances", "₹21,600"], ["PF", "−₹6,400"]];
  return (
    <div className="dark-card w-[320px] rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <Face name="Devon Lane" i={0} size="h-10 w-10 text-[13px]" />
        <span className="flex-1">
          <span className="block text-[13px] font-semibold">Devon Lane</span>
          <span className="text-[11px] text-zinc-400">Payslip · October</span>
        </span>
        <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10.5px] font-medium text-emerald-300">Paid</span>
      </div>
      <div className="mt-4 space-y-2 border-y border-dashed border-white/15 py-3 text-[12px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between text-zinc-300"><span>{k}</span><span className="tabular-nums">{v}</span></div>
        ))}
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-[12px] text-zinc-400">Net pay</span>
        <span className="text-[20px] font-semibold tabular-nums">₹82,400</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[10.5px] text-zinc-300">
        <span className="rounded-lg bg-white/[0.05] px-2.5 py-2">22 / 22 days present</span>
        <span className="rounded-lg bg-white/[0.05] px-2.5 py-2">1 leave approved</span>
      </div>
    </div>
  );
}

/** Projects: a board with progress. */
export function ProjectCard() {
  const tasks = [
    ["Homepage design", "Done", 1],
    ["Payment integration", "In review", 2],
    ["Client feedback round", "In progress", 3],
  ] as const;
  return (
    <div className="light-card w-[340px] rounded-2xl p-5 text-zinc-900">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold">Website relaunch</span>
        <span className="flex -space-x-1.5">
          {["Lloyd Weber", "Mei Tan", "Rohan Iyer"].map((n, i) => <Face key={n} name={n} i={i + 2} size="h-6 w-6 text-[9px] ring-white" />)}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3 text-[11px] text-zinc-500">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100"><div className="h-full w-[68%] rounded-full bg-gradient-to-r from-violet-500 via-pink-500 to-orange-400" /></div>
        68%
      </div>
      <ul className="mt-4 space-y-2">
        {tasks.map(([t, s, i]) => (
          <li key={t} className="flex items-center gap-2.5 rounded-xl border border-zinc-200 px-3 py-2.5 text-[12px]">
            {s === "Done" ? <CheckCheck className="h-4 w-4 text-emerald-500" /> : <span className={`h-3.5 w-3.5 rounded-full border-2 ${s === "In review" ? "border-amber-400" : "border-sky-400"}`} />}
            <span className="flex-1 font-medium">{t}</span>
            <span className="text-[10.5px] text-zinc-500">{s}</span>
            <Face name={t} i={i} size="h-5 w-5 text-[8px] ring-white" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Outlined floating event card. */
export function EventCard({ title, name, detail, i = 1 }: { title: string; name: string; detail: string; i?: number }) {
  return (
    <div className="event w-[240px] p-4">
      <p className="text-[13.5px] font-semibold">{title}</p>
      <div className="mt-3 flex items-center gap-3 border-t-2 border-dashed border-zinc-200 pt-3">
        <Face name={name} i={i} size="h-10 w-10 text-[13px] ring-white" />
        <span className="text-[12.5px] leading-5"><b className="font-semibold">{name}</b><br /><span className="text-zinc-500">{detail}</span></span>
      </div>
    </div>
  );
}

/** The green check tile, from the reference. */
export function CheckTile({ children }: { children: React.ReactNode }) {
  return (
    <div className="event flex items-center gap-3 p-3 pr-6">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#22c55e] text-white"><Check className="h-6 w-6" strokeWidth={3} /></span>
      <span className="text-[13.5px] text-zinc-500">{children}</span>
    </div>
  );
}
