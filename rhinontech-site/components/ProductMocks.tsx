import { Check, CheckCheck, Hash, Mic, Search, Sparkles, Video } from "lucide-react";
import type { MockKey } from "@/content/products";

/**
 * The product, drawn in code: sharp at any size and never anyone's real data.
 * These are illustrations of the app's screens, not screenshots.
 */

const PAL = ["#7c5cff", "#ff8a4c", "#2f5bff", "#ff5fb0", "#10c98f", "#f5a524"];

export function Avatar({ name, i = 0, size = 26 }: { name: string; i?: number; size?: number }) {
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-white"
      style={{ width: size, height: size, fontSize: size * 0.38, background: PAL[i % PAL.length] }}
    >
      {initials}
    </span>
  );
}

export function Pill({ children, color = "#7c5cff" }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-4"
      style={{ color, background: `${color}1a` }}
    >
      {children}
    </span>
  );
}

/** The browser-style chrome every illustration sits in. */
export function AppWindow({ children, url = "rhinontech.in", className = "" }: { children: React.ReactNode; url?: string; className?: string }) {
  return (
    <div className={`window ${className}`}>
      <div className="flex items-center gap-3 border-b border-line bg-soft/80 px-4 py-2.5">
        <span className="flex gap-1.5">
          <i className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b]" />
          <i className="h-2.5 w-2.5 rounded-full bg-[#ffc14d]" />
          <i className="h-2.5 w-2.5 rounded-full bg-[#3ddc84]" />
        </span>
        <span className="mx-auto flex h-6 w-full max-w-[260px] items-center justify-center rounded-md bg-white font-mono text-[10.5px] text-muted ring-1 ring-line">
          {url}
        </span>
        <span className="w-10" />
      </div>
      {children}
    </div>
  );
}

const card = "rounded-xl border border-line bg-white shadow-[0_1px_2px_rgb(10_17_40_/_0.04)]";
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

/* ─────────────────────────── CRM ─────────────────────────── */

function CrmMock() {
  const cols = [
    { name: "Qualified", color: "#2f5bff", total: "₹6.8L", deals: [["Northwind Labs", "₹2.4L", 0, "Inbound"], ["Cedar Finance", "₹4.4L", 2, "Campaign"]] },
    { name: "Proposal", color: "#7c5cff", total: "₹9.1L", deals: [["Bluepeak Retail", "₹5.6L", 1, "Referral"], ["Orbit Logistics", "₹3.5L", 3, "Website"]] },
    { name: "Won", color: "#10c98f", total: "₹4.2L", deals: [["Juniper Legal", "₹4.2L", 4, "Chatbot"]] },
  ] as const;
  return (
    <div className="p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <p className="font-display mr-2 text-[18px] font-semibold">Pipeline</p>
        <Pill color="#2f5bff">12 deals</Pill>
        <Pill color="#10c98f">₹20.1L open</Pill>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {cols.map((col, ci) => (
          <div key={col.name} className="rounded-2xl bg-soft p-2.5">
            <div className="mb-2.5 flex items-center justify-between px-1">
              <span className="flex items-center gap-1.5 text-[11.5px] font-semibold">
                <i className="h-2 w-2 rounded-full" style={{ background: col.color }} />
                {col.name}
              </span>
              <span className="text-[11px] tabular-nums text-muted">{col.total}</span>
            </div>
            <div className="space-y-2">
              {col.deals.map(([name, amount, tone, source], di) => (
                <div key={name} className={`${card} line-in p-3`} style={delay(ci * 120 + di * 140)}>
                  <p className="text-[12.5px] font-semibold">{name}</p>
                  <p className="font-display mt-0.5 text-[16px] font-semibold tabular-nums">{amount}</p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <Avatar name={name} i={tone} size={22} />
                    <Pill color={col.color}>{source}</Pill>
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

/* ─────────────────────────── Outreach ─────────────────────────── */

function OutreachMock() {
  const bars = [18, 26, 22, 34, 41, 38, 52, 47, 61, 58, 72, 69];
  const leads = [["Priya Nair", "Replied", "#10c98f"], ["Yusuf Khan", "Opened", "#7c5cff"], ["Chloe Martin", "Sent", "#2f5bff"], ["Dev Patel", "Draft", "#f5a524"]];
  return (
    <div className="p-4 sm:p-5">
      <div className="grid grid-cols-[1.2fr_1fr] gap-3">
        <div className={`${card} p-3.5`}>
          <div className="flex items-center justify-between">
            <p className="text-[12.5px] font-semibold">Q3 Founder Outreach</p>
            <Pill color="#10c98f">● Live</Pill>
          </div>
          <div className="mt-3 flex items-end gap-4">
            {[["Sent", "4,812"], ["Opened", "41%"], ["Replied", "6.2%"]].map(([k, v]) => (
              <div key={k}>
                <p className="text-[10.5px] text-muted">{k}</p>
                <p className="font-display text-[17px] font-semibold tabular-nums">{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex h-12 items-end gap-1">
            {bars.map((b, i) => (
              <span key={i} className="bar flex-1 rounded-t-[3px]" style={{ height: `${b}%`, animationDelay: `${i * 60}ms`, background: i > 8 ? "linear-gradient(to top,#7c5cff,#e04dd6)" : "#e6e9f4" }} />
            ))}
          </div>
        </div>
        <div className={`${card} p-3.5`}>
          <p className="mb-2 text-[11px] font-semibold text-muted">Leads</p>
          <div className="space-y-2">
            {leads.map(([n, s, c], i) => (
              <div key={n} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-[12px] font-medium"><Avatar name={n} i={i} size={20} />{n.split(" ")[0]}</span>
                <Pill color={c}>{s}</Pill>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={`${card} mt-3 p-4`}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-violet"><Sparkles className="h-3.5 w-3.5" />AI draft for Priya Nair</span>
          <Pill color="#f5a524">Waiting for your review</Pill>
        </div>
        <div className="mt-3 space-y-1.5 text-[12.5px] leading-5 text-ink-soft">
          <p className="line-in" style={delay(100)}>Hi Priya,</p>
          <p className="line-in" style={delay(500)}>Saw Lumen Foods opened two new stores in Pune this quarter. Congrats. Most ops heads I talk to are buried in stock reports at that stage.</p>
          <p className="line-in" style={delay(1000)}>Worth 15 minutes to see how we cut that down to one dashboard?</p>
        </div>
        <div className="mt-3 flex gap-2">
          <span className="rounded-lg bg-ink px-3 py-1.5 text-[11.5px] font-semibold text-white">Approve</span>
          <span className="rounded-lg border border-line px-3 py-1.5 text-[11.5px] font-semibold">Edit</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Inbox ─────────────────────────── */

function InboxMock() {
  const rows = [
    ["Yusuf Khan", "Re: Quick question on pricing", "High", "#ff5fb0", true],
    ["Meera Rao", "Invoice for September", "Normal", "#2f5bff", false],
    ["Dev Patel", "Can we move our call?", "Normal", "#2f5bff", false],
    ["Sara Lin", "Not interested, thanks", "Low", "#6b7494", false],
  ] as const;
  return (
    <div className="grid grid-cols-[0.95fr_1.05fr] gap-3 p-4 sm:p-5">
      <div className="space-y-1.5">
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-soft px-3 py-2 text-[11.5px] text-muted"><Search className="h-3.5 w-3.5" />Search conversations</div>
        {rows.map(([n, s, p, c, active], i) => (
          <div key={n} className={`line-in flex items-start gap-2.5 rounded-xl p-2.5 ${active ? "bg-violet/10 ring-1 ring-violet/30" : ""}`} style={delay(i * 90)}>
            <Avatar name={n} i={i + 1} size={28} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2"><b className="truncate text-[12px] font-semibold">{n}</b><Pill color={c}>{p}</Pill></span>
              <span className="block truncate text-[11.5px] text-muted">{s}</span>
            </span>
          </div>
        ))}
      </div>
      <div className={`${card} p-3.5`}>
        <div className="flex items-center justify-between border-b border-line pb-2.5">
          <p className="text-[12.5px] font-semibold">Re: Quick question on pricing</p>
          <Pill color="#2f5bff">In progress</Pill>
        </div>
        <div className="space-y-2.5 py-3 text-[12px] leading-5">
          <div className="line-in rounded-xl rounded-tl-sm bg-soft p-2.5" style={delay(150)}>Hi, thanks for reaching out. Is there a plan for a team of 25?</div>
          <div className="line-in ml-6 rounded-xl rounded-tr-sm bg-violet/10 p-2.5" style={delay(600)}>Yes. Everything is free for your whole team. Want a quick walkthrough?</div>
        </div>
        <div className="flex items-center justify-between border-t border-line pt-2.5 text-[11px] text-muted">
          <span className="flex items-center gap-1.5">Assigned to <Avatar name="Ana Silva" i={4} size={18} /> Ana</span>
          <CheckCheck className="h-4 w-4 text-emerald-500" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Chatbot ─────────────────────────── */

function ChatbotMock() {
  return (
    <div className="grid grid-cols-[1.25fr_0.75fr] gap-3 p-4 sm:p-5">
      <div className={`${card} overflow-hidden`}>
        <div className="flex items-center gap-2.5 bg-gradient-to-r from-orange-400 to-pink-500 px-3.5 py-3 text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25"><Sparkles className="h-4 w-4" /></span>
          <span><b className="block text-[12.5px] leading-4">Rhinon assistant</b><span className="text-[10.5px] opacity-80">● Online now</span></span>
        </div>
        <div className="space-y-2.5 p-3.5 text-[12px] leading-5">
          <div className="line-in ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm bg-ink px-3 py-2 text-white" style={delay(100)}>Do you help with onboarding?</div>
          <div className="line-in max-w-[88%] rounded-2xl rounded-bl-sm bg-soft px-3 py-2" style={delay(700)}>
            Yes. Every new customer gets a guided setup and a call with our team.
            <span className="mt-1.5 block text-[10px] text-muted">Source: Onboarding page</span>
          </div>
          <div className="line-in ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm bg-ink px-3 py-2 text-white" style={delay(1500)}>Can I talk to someone?</div>
          <div className="line-in max-w-[88%] rounded-2xl rounded-bl-sm bg-soft px-3 py-2" style={delay(2100)}>Of course. Connecting you with Ana now.</div>
        </div>
      </div>
      <div className="space-y-3">
        <div className={`${card} line-in p-3`} style={delay(2400)}>
          <Pill color="#10c98f">New lead</Pill>
          <p className="mt-2 text-[12.5px] font-semibold">Chloe Martin</p>
          <p className="text-[11px] text-muted">Willow Interiors</p>
          <p className="mt-2 flex items-center gap-1 text-[10.5px] text-emerald-600"><Check className="h-3 w-3" />Saved to CRM</p>
        </div>
        <div className={`${card} line-in p-3`} style={delay(2800)}>
          <p className="text-[11px] font-semibold text-muted">Live handover</p>
          <div className="mt-2 flex items-center gap-2"><Avatar name="Ana Silva" i={4} size={24} /><span className="text-[12px] font-medium">Ana joined</span></div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Work ─────────────────────────── */

function WorkMock() {
  const cols = [
    { name: "To do", color: "#6b7494", tasks: [["Write homepage brief", "Mon", "#f5a524"], ["Collect brand assets", "Tue", "#2f5bff"]] },
    { name: "In progress", color: "#7c5cff", tasks: [["Design landing page", "Wed", "#ff5fb0"], ["Set up analytics", "Thu", "#2f5bff"]] },
    { name: "Done", color: "#10c98f", tasks: [["Kick-off call", "Done", "#10c98f"]] },
  ] as const;
  return (
    <div className="p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-display text-[18px] font-semibold">Acme website</p>
        <span className="flex items-center gap-2 text-[11px] text-muted">
          <span className="h-1.5 w-24 overflow-hidden rounded-full bg-line"><i className="block h-full w-[72%] rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" /></span>72%
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {cols.map((col, ci) => (
          <div key={col.name} className="rounded-2xl bg-soft p-2.5">
            <p className="mb-2.5 flex items-center gap-1.5 px-1 text-[11.5px] font-semibold"><i className="h-2 w-2 rounded-full" style={{ background: col.color }} />{col.name}</p>
            <div className="space-y-2">
              {col.tasks.map(([t, d, c], ti) => (
                <div key={t} className={`${card} line-in p-3`} style={delay(ci * 120 + ti * 140)}>
                  <p className="text-[12px] font-semibold leading-4">{t}</p>
                  <div className="mt-2.5 flex items-center justify-between"><Avatar name={t} i={ci + ti} size={20} /><Pill color={c}>{d}</Pill></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3.5 py-2.5 text-[12px]">
        <span className="font-medium text-emerald-800">Client approved “Homepage”</span>
        <Pill color="#10c98f">via portal</Pill>
      </div>
    </div>
  );
}

/* ─────────────────────────── Team chat ─────────────────────────── */

function ChatMock() {
  const messages = [["Ana Silva", "New landing page is ready for review.", 3], ["Yusuf Khan", "Looks great. Can we ship it Friday?", 2], ["Ana Silva", "Yes. Hopping on a call to walk through it.", 3]] as const;
  return (
    <div className="grid grid-cols-[0.55fr_1.45fr] gap-3 p-4 sm:p-5">
      <div className="space-y-1 text-[12px]">
        <p className="px-2 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-muted">Channels</p>
        {["general", "design", "sales"].map((c, i) => (
          <p key={c} className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 ${i === 1 ? "bg-violet/10 font-semibold text-violet" : "text-ink-soft"}`}><Hash className="h-3.5 w-3.5" />{c}</p>
        ))}
        <p className="px-2 pb-1 pt-3 text-[10.5px] font-semibold uppercase tracking-wider text-muted">Direct</p>
        {["Ana Silva", "Yusuf Khan"].map((n, i) => (
          <p key={n} className="flex items-center gap-2 px-2 py-1 text-ink-soft"><Avatar name={n} i={i + 3} size={18} />{n.split(" ")[0]}</p>
        ))}
      </div>
      <div className={`${card} flex flex-col p-3.5`}>
        <div className="space-y-3 text-[12px] leading-5">
          {messages.map(([n, m, i], k) => (
            <div key={k} className="line-in flex gap-2.5" style={delay(k * 400)}>
              <Avatar name={n} i={i} size={26} />
              <span><b className="text-[12px] font-semibold">{n}</b><span className="block text-ink-soft">{m}</span></span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-ink px-3.5 py-2.5 text-white">
          <span className="flex items-center gap-2 text-[12px] font-medium">
            <span className="flex -space-x-1.5"><Avatar name="Ana Silva" i={3} size={20} /><Avatar name="Yusuf Khan" i={2} size={20} /><Avatar name="Dev Patel" i={4} size={20} /></span>
            Design review is live
          </span>
          <span className="flex items-center gap-1.5"><Mic className="h-3.5 w-3.5" /><Video className="h-3.5 w-3.5" /><span className="rounded-md bg-emerald-500 px-2 py-0.5 text-[10.5px] font-semibold">Join</span></span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── HR ─────────────────────────── */

function HrMock() {
  const steps = ["Onboarding link sent", "Profile completed", "Documents uploaded", "Offer letter signed", "Company email created"];
  return (
    <div className="grid grid-cols-[1fr_1fr] gap-3 p-4 sm:p-5">
      <div className={`${card} p-3.5`}>
        <div className="flex items-center gap-2.5">
          <Avatar name="Aarav Mehta" i={3} size={36} />
          <span><b className="block text-[13px] font-semibold">Aarav Mehta</b><span className="text-[11px] text-muted">Product Designer · Joins 1 Dec</span></span>
        </div>
        <ul className="mt-3.5 space-y-2">
          {steps.map((s, i) => (
            <li key={s} className="line-in flex items-center gap-2 text-[12px]" style={delay(i * 160)}>
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-3 w-3" /></span>{s}
            </li>
          ))}
        </ul>
      </div>
      <div className={`${card} p-3.5`}>
        <div className="flex items-center justify-between"><p className="text-[12.5px] font-semibold">Offer letter</p><Pill color="#10c98f">Signed</Pill></div>
        <div className="mt-3 space-y-1.5">
          <i className="block h-1.5 w-full rounded bg-line" /><i className="block h-1.5 w-[92%] rounded bg-line" /><i className="block h-1.5 w-[84%] rounded bg-line" /><i className="block h-1.5 w-[60%] rounded bg-line" />
        </div>
        <div className="mt-4 border-t border-dashed border-line pt-2.5">
          <p className="text-[10px] uppercase tracking-wider text-muted">Signature</p>
          <p className="mt-1 text-[22px] italic leading-6 text-brand" style={{ fontFamily: "'Snell Roundhand','Segoe Script','Brush Script MT',cursive" }}>Aarav Mehta</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Payroll ─────────────────────────── */

function PayrollMock() {
  const rows = [["Ana Silva", "₹95,000", "₹9,800", "₹85,200"], ["Yusuf Khan", "₹82,000", "₹8,100", "₹73,900"], ["Meera Rao", "₹1,10,000", "₹12,400", "₹97,600"], ["Dev Patel", "₹64,000", "₹5,900", "₹58,100"]];
  return (
    <div className="p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-display text-[18px] font-semibold">October payroll</p>
        <div className="flex items-center gap-1.5 text-[10.5px] font-semibold">
          <Pill color="#6b7494">Draft</Pill><span className="text-line">›</span><Pill color="#7c5cff">Processed</Pill><span className="text-line">›</span><Pill color="#10c98f">Paid</Pill>
        </div>
      </div>
      <div className={`${card} overflow-hidden`}>
        <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr] bg-soft px-3.5 py-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted"><span>Employee</span><span>Gross</span><span>Deductions</span><span className="text-right">Net</span></div>
        {rows.map(([n, g, d, net], i) => (
          <div key={n} className="line-in grid grid-cols-[1.3fr_1fr_1fr_1fr] items-center border-t border-line px-3.5 py-2.5 text-[12px] tabular-nums" style={delay(i * 120)}>
            <span className="flex items-center gap-2 font-medium"><Avatar name={n} i={i + 2} size={20} />{n.split(" ")[0]}</span><span>{g}</span><span className="text-muted">{d}</span><b className="text-right font-semibold">{net}</b>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[12px] text-muted">Net payable <b className="font-display text-[17px] text-ink">₹3,14,800</b></span>
        <span className="rounded-lg bg-ink px-3.5 py-2 text-[11.5px] font-semibold text-white">Mark as paid</span>
      </div>
    </div>
  );
}

/* ─────────────────────────── Attendance ─────────────────────────── */

function AttendanceMock() {
  const days = Array.from({ length: 35 }, (_, i) => i - 2);
  const colour = (d: number) => (d < 1 || d > 30 ? "transparent" : d % 7 === 0 || d % 7 === 6 ? "#e6e9f4" : d === 12 || d === 13 ? "#ffb547" : d === 21 ? "#ff5fb0" : "#10c98f");
  return (
    <div className="grid grid-cols-[1.1fr_0.9fr] gap-3 p-4 sm:p-5">
      <div className={`${card} p-3.5`}>
        <p className="mb-2.5 text-[12.5px] font-semibold">November</p>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d, i) => (
            <span key={i} className="flex aspect-square items-center justify-center rounded-md text-[10px] font-medium" style={{ background: colour(d), color: colour(d) === "#e6e9f4" ? "#6b7494" : "#fff" }}>{d > 0 && d <= 30 ? d : ""}</span>
          ))}
        </div>
        <p className="mt-3 flex gap-3 text-[10px] text-muted"><span>● Present</span><span className="text-amber">● Leave</span><span className="text-pink">● Holiday</span></p>
      </div>
      <div className="space-y-2.5">
        <p className="text-[11px] font-semibold text-muted">Leave requests</p>
        {[["Meera Rao", "2 days · Casual"], ["Dev Patel", "1 day · Sick"], ["Sara Lin", "5 days · Annual"]].map(([n, d], i) => (
          <div key={n} className={`${card} line-in p-2.5`} style={delay(i * 150)}>
            <div className="flex items-center gap-2"><Avatar name={n} i={i} size={22} /><span><b className="block text-[12px] font-semibold leading-4">{n}</b><span className="text-[10.5px] text-muted">{d}</span></span></div>
            <div className="mt-2 flex gap-1.5"><span className="rounded-md bg-emerald-500 px-2 py-1 text-[10.5px] font-semibold text-white">Approve</span><span className="rounded-md border border-line px-2 py-1 text-[10.5px] font-semibold">Decline</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── Performance ─────────────────────────── */

function PerformanceMock() {
  const goals = [["Ship the new onboarding flow", 85, "#10c98f"], ["Cut support replies to 2 hours", 60, "#7c5cff"], ["Mentor two new joiners", 40, "#ff8a4c"]] as const;
  const reviews = [["Ana", "Submitted", "#10c98f"], ["Yusuf", "In review", "#7c5cff"], ["Dev", "Pending", "#f5a524"]] as const;
  return (
    <div className="p-4 sm:p-5">
      <div className={`${card} p-3.5`}>
        <div className="flex items-center justify-between"><p className="font-display text-[16px] font-semibold">Q3 review cycle</p><Pill color="#7c5cff">Quarterly</Pill></div>
        <div className="mt-2.5 flex items-center gap-3"><span className="h-2 flex-1 overflow-hidden rounded-full bg-line"><i className="block h-full w-[72%] rounded-full bg-gradient-to-r from-violet to-electric" /></span><b className="text-[12px] tabular-nums">72% done</b></div>
      </div>
      <div className="mt-3 grid grid-cols-[1.25fr_0.75fr] gap-3">
        <div className={`${card} space-y-3 p-3.5`}>
          <p className="text-[11px] font-semibold text-muted">Goals</p>
          {goals.map(([g, p, c], i) => (
            <div key={g} className="line-in" style={delay(i * 140)}>
              <div className="flex justify-between text-[12px]"><span className="font-medium">{g}</span><span className="tabular-nums text-muted">{p}%</span></div>
              <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-line"><i className="block h-full rounded-full" style={{ width: `${p}%`, background: c }} /></span>
            </div>
          ))}
        </div>
        <div className={`${card} space-y-2.5 p-3.5`}>
          <p className="text-[11px] font-semibold text-muted">Reviews</p>
          {reviews.map(([n, s, c], i) => (
            <div key={n} className="flex items-center justify-between text-[12px]"><span className="flex items-center gap-2"><Avatar name={n} i={i + 3} size={20} />{n}</span><Pill color={c}>{s}</Pill></div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Pages ─────────────────────────── */

function PagesMock() {
  const tree = [["Handbook", 0], ["Onboarding", 1], ["Policies", 1], ["Project briefs", 0], ["Acme website", 1]] as const;
  const todo = [["Send welcome email", true], ["Create the project", true], ["Share the client portal link", false]] as const;
  return (
    <div className="grid grid-cols-[0.6fr_1.4fr] gap-3 p-4 sm:p-5">
      <div className="space-y-1 text-[12px]">
        {tree.map(([t, l], i) => (
          <p key={t} className={`rounded-lg px-2 py-1.5 ${i === 1 ? "bg-violet/10 font-semibold text-violet" : "text-ink-soft"}`} style={{ marginLeft: l * 14 }}>{l ? "↳ " : ""}{t}</p>
        ))}
      </div>
      <div className={`${card} p-4`}>
        <p className="font-display text-[20px] font-semibold">Client onboarding</p>
        <div className="mt-3 space-y-2">
          <i className="line-in block h-1.5 w-full rounded bg-line" style={delay(100)} />
          <i className="line-in block h-1.5 w-[90%] rounded bg-line" style={delay(250)} />
          <i className="line-in block h-1.5 w-[72%] rounded bg-line" style={delay(400)} />
        </div>
        <ul className="mt-4 space-y-2 text-[12px]">
          {todo.map(([t, done], i) => (
            <li key={t} className="line-in flex items-center gap-2" style={delay(550 + i * 150)}>
              <span className={`flex h-4 w-4 items-center justify-center rounded border ${done ? "border-violet bg-violet text-white" : "border-line"}`}>{done && <Check className="h-3 w-3" />}</span>
              <span className={done ? "text-muted line-through" : ""}>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const MOCKS: Record<MockKey, () => React.ReactElement> = {
  crm: CrmMock, outreach: OutreachMock, inbox: InboxMock, chatbot: ChatbotMock, work: WorkMock, chat: ChatMock,
  hr: HrMock, payroll: PayrollMock, attendance: AttendanceMock, performance: PerformanceMock, pages: PagesMock,
};

export function ProductMock({ k }: { k: MockKey }) {
  const Mock = MOCKS[k];
  // On phones, shrink the drawing instead of cramping it: zoom re-flows it into the extra room.
  return <div className="max-sm:[zoom:0.78]"><Mock /></div>;
}
