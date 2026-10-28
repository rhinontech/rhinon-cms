import Image from "next/image";
import {
  ArrowRight, ArrowUpRight, Bot, CalendarDays, Check, FileSignature, Mail, Send, ShieldCheck, Users, Zap, Phone,
} from "lucide-react";
import { links } from "@/components/site";
import { Reveal } from "@/components/Reveal";
import { CampaignCard, ChatCard, CheckTile, ComposeCard, EventCard, PayslipCard, PipelineCard, ProjectCard } from "@/components/Mocks";

/* ───────────────────────── small pieces ───────────────────────── */

function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <Image src={light ? "/logo-light.png" : "/logo-dark.png"} alt="" width={30} height={30} />
      <span className={`font-display text-[19px] font-semibold ${light ? "text-white" : "text-ink"}`}>Rhinon Tech</span>
    </span>
  );
}

function CTA({ href, children, light = false }: { href: string; children: React.ReactNode; light?: boolean }) {
  return (
    <a
      href={href}
      className={`lift group inline-flex items-center gap-2 rounded-lg px-5 py-3 text-[15px] font-medium transition ${
        light ? "bg-white text-ink hover:bg-zinc-100" : "bg-ink text-white hover:bg-black"
      }`}
    >
      {children}
      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </a>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-[14px] font-medium text-accent">
      <span className="text-[15px] leading-none">✳</span>
      {children}
    </p>
  );
}

/** Bold white strokes over the gradient, like hand-drawn arcs. */
function Arcs({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 300" fill="none" className={`pointer-events-none absolute ${className}`} aria-hidden>
      <path d="M60 300C80 170 170 70 300 30" stroke="white" strokeOpacity="0.85" strokeWidth="10" strokeLinecap="round" className="arc" />
      <path d="M115 300C135 200 205 120 320 85" stroke="white" strokeOpacity="0.85" strokeWidth="10" strokeLinecap="round" className="arc" />
    </svg>
  );
}

/** A small hand-drawn loop. */
function Loop({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 50" fill="none" className={`pointer-events-none absolute ${className}`} aria-hidden>
      <path d="M4 34c14-26 34-26 30-6-3 15-20 8-10-8 10-16 34-16 34 6 0 16-18 10-8-6 9-14 34-14 40 6 4 12 14 16 26 10" stroke="white" strokeWidth="4" strokeLinecap="round" className="arc" />
    </svg>
  );
}

/** Three short strokes, the "spark" mark next to a card. */
function Spark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={`pointer-events-none absolute ${className}`} aria-hidden>
      <path d="M6 12l8 6M10 30l9-6M20 4l2 10" stroke="#111114" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}



/* ───────────────────────── content ───────────────────────── */

const REPLACES = ["Your CRM", "Your cold-email tool", "Your shared inbox", "Your project tracker", "Your HR software"];

const ROWS = [
  {
    tag: "CRM",
    title: "Every lead and deal, finally in one list.",
    body: "Import a spreadsheet or let leads come in from your website. Stages, owners, deals and every email on one timeline, so nobody asks “where are we with them?” again.",
    mock: <PipelineCard />,
    float: <EventCard title="Deal moved to Won 🎉" name="Ana Silva" detail="Juniper Legal · ₹4.2L" i={4} />,
    panel: "gradient-panel",
  },
  {
    tag: "AI outreach",
    title: "Cold email that sounds like you wrote it.",
    body: "Write one email. AI tailors it for each lead, sends on your schedule and shows who opened, who visited your site and who replied. Send yourself a test before anyone else sees it.",
    mock: <ComposeCard />,
    float: <CheckTile>Reply from <b className="font-semibold text-ink">Yusuf Khan</b></CheckTile>,
    panel: "gradient-panel-alt",
  },
  {
    tag: "Website chatbot · Premium",
    title: "A chatbot that answers like your best salesperson.",
    body: "Train it on your website and documents in minutes. It answers visitors day and night, saves their details to the CRM and hands over to your team in live chat, or a voice call.",
    mock: <ChatCard />,
    float: <EventCard title="New lead from chat" name="Chloe Martin" detail="Willow Interiors · demo booked" i={3} />,
    panel: "gradient-panel",
  },
  {
    tag: "Projects",
    title: "Deliver client work without the chaos.",
    body: "Tasks, boards, timelines, files and a calendar for every project, plus a private portal where clients follow progress and send change requests.",
    mock: <ProjectCard />,
    float: <CheckTile>Client approved <b className="font-semibold text-ink">Homepage</b></CheckTile>,
    panel: "gradient-panel-alt",
  },
];

const INTEGRATIONS = [
  { name: "Gmail & Outlook", body: "Send campaigns and replies from your own mailbox.", icon: Mail, color: "text-rose-500" },
  { name: "Google Calendar", body: "Meetings and interviews land on your calendar.", icon: CalendarDays, color: "text-sky-500" },
  { name: "LinkedIn", body: "Plan and publish posts with AI help.", icon: Send, color: "text-blue-600" },
  { name: "Slack & GitHub", body: "New teammates get access on their first day.", icon: Zap, color: "text-violet-500" },
  { name: "Your website", body: "One line of code adds the chatbot and visitor analytics.", icon: Bot, color: "text-orange-500" },
  { name: "E-signatures", body: "Offer letters and NDAs signed inside the app.", icon: FileSignature, color: "text-emerald-500" },
];

/* ───────────────────────── page ───────────────────────── */

export default function Home() {
  return (
    <main className="overflow-x-clip">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-[76px] max-w-[1180px] items-center justify-between px-5">
          <Logo />
          <nav className="hidden items-center gap-9 text-[15px] text-ink md:flex">
            <a href="#product" className="hover:text-accent">Product</a>
            <a href="#pricing" className="hover:text-accent">Pricing</a>
            <a href="#integrations" className="hover:text-accent">Integrations</a>
            <a href={links.labs} className="hover:text-accent">Rhinon Labs</a>
          </nav>
          <div className="flex items-center gap-3">
            <a href={links.login} className="hidden text-[15px] hover:text-accent sm:block">Log in</a>
            <a href={links.signup} className="inline-flex items-center gap-2 rounded-lg border-2 border-ink px-4 py-2 text-[15px] font-medium hover:bg-ink hover:text-white">
              Start free <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="line-art absolute inset-x-0 top-0 h-[560px]" />
        <div className="relative mx-auto grid max-w-[1180px] items-center gap-16 px-5 pb-24 pt-16 lg:grid-cols-[1fr_1.08fr] lg:pt-24">
          <Reveal>
            <h1 className="font-display text-[48px] font-semibold leading-[1.02] sm:text-[66px]">
              Run your whole business from one workspace.
            </h1>
            <p className="mt-6 max-w-[470px] text-[18px] leading-8 text-ink-soft">
              CRM, cold email, shared inbox, projects and HR, together in one place. Free for your whole team.
            </p>
            <form action={links.signup} className="mt-9 flex max-w-[470px] flex-col gap-3 sm:flex-row">
              <input
                name="email"
                type="email"
                required
                placeholder="Enter your work email"
                className="h-[54px] w-full shrink-0 rounded-lg border border-zinc-300 sm:w-auto sm:flex-1 bg-white px-4 text-[15px] outline-none transition focus:border-ink"
              />
              <button className="h-[54px] rounded-lg bg-ink px-6 text-[15px] font-medium text-white hover:bg-black">Get started free</button>
            </form>
            <div className="mt-9">
              <p className="font-display text-[17px] font-semibold">Free forever, no credit card</p>
              <p className="mt-1.5 text-[14.5px] text-muted">Only the AI website chatbot is paid.</p>
            </div>
          </Reveal>

          {/* Hero visual: a gradient stage, the product, and events landing on it */}
          <Reveal className="relative mx-auto h-[500px] w-full max-w-[560px]" delay={150}>
            <div className="gradient-panel absolute right-0 top-4 h-[420px] w-[80%] overflow-hidden rounded-[32px]">
              <Arcs className="-right-6 -top-8 h-[280px] w-[320px]" />
            </div>
            <div className="absolute left-[6%] top-[130px] rotate-[-2deg]"><CampaignCard /></div>
            <div className="float-a absolute -left-2 top-0 sm:-left-6"><EventCard title="Reply received 🎉" name="Priya Nair" detail="Head of Ops, Lumen Foods" i={1} /></div>
            <Spark className="left-0 bottom-28 h-9 w-9 sm:-left-8" />
            <div className="float-b absolute bottom-2 right-0"><CheckTile>Meeting booked by <b className="font-semibold text-ink">Priya N.</b></CheckTile></div>
          </Reveal>
        </div>
      </section>

      {/* What it replaces, in place of a logo wall */}
      <section className="border-y border-line">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center gap-5 px-5 py-9 md:flex-row md:justify-between">
          <span className="text-[13px] font-medium uppercase tracking-[0.14em] text-muted">One login replaces</span>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {REPLACES.map((r) => (
              <span key={r} className="font-display text-[20px] font-semibold text-zinc-400 line-through decoration-accent/70 decoration-2">{r}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Product rows */}
      <section id="product" className="mx-auto max-w-[1180px] space-y-36 px-5 py-32">
        {ROWS.map((r, i) => (
          <div key={r.tag} className={`grid items-center gap-16 lg:grid-cols-2 ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
            <Reveal className="relative">
              <div className={`${r.panel} relative flex h-[460px] items-center justify-center overflow-hidden rounded-[32px]`}>
                <Arcs className={`${i % 2 ? "-left-10 -bottom-16 rotate-180" : "-right-8 -top-10"} h-[240px] w-[280px] opacity-80`} />
                <Loop className={`${i % 2 ? "right-8" : "left-8"} bottom-8 h-12 w-32`} />
                <div className={`relative ${i % 2 ? "rotate-[1.5deg]" : "rotate-[-1.5deg]"}`}>{r.mock}</div>
              </div>
              <div className={`${i % 2 ? "float-b -left-4" : "float-a -right-4"} absolute -bottom-7`}>{r.float}</div>
            </Reveal>
            <Reveal delay={120}>
              <Tag>{r.tag}</Tag>
              <h2 className="font-display mt-4 max-w-[480px] text-[38px] font-semibold leading-[1.08] sm:text-[46px]">{r.title}</h2>
              <p className="mt-5 max-w-[470px] text-[17px] leading-8 text-ink-soft">{r.body}</p>
              {i === 1 && <div className="mt-9"><CTA href={links.signup}>Get started now</CTA></div>}
            </Reveal>
          </div>
        ))}
      </section>

      {/* Dark band: team & payroll */}
      <section className="bg-night text-white">
        <div className="mx-auto grid max-w-[1180px] items-center gap-16 px-5 py-28 lg:grid-cols-2">
          <Reveal className="gradient-panel-alt relative flex h-[460px] items-center justify-center overflow-hidden rounded-[32px]">
            <Arcs className="-left-8 -bottom-14 h-[240px] w-[280px] rotate-180 opacity-80" />
            <div className="relative rotate-[-2deg]"><PayslipCard /></div>
          </Reveal>
          <div>
            <h2 className="font-display text-[40px] font-semibold leading-[1.06] sm:text-[52px]">Your team runs here too.</h2>
            <p className="mt-5 max-w-[460px] text-[17px] leading-8 text-zinc-300">
              Attendance, leave, payroll, reviews and documents, right next to the work. Send an offer letter for e-signature in the morning and run payroll in the afternoon.
            </p>
            <div className="mt-9"><CTA href={links.signup} light>Start free</CTA></div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-[1180px] px-5 py-32">
        <h2 className="font-display mx-auto max-w-[640px] text-center text-[40px] font-semibold leading-[1.08] sm:text-[52px]">
          Free for everything. Pay only for the chatbot.
        </h2>
        <div className="mx-auto mt-16 grid max-w-[880px] gap-5 md:grid-cols-2">
          <div className="lift rounded-xl border-2 border-ink p-8">
            <p className="font-display text-[22px] font-semibold">Free</p>
            <p className="font-display mt-2 text-[44px] font-semibold">₹0</p>
            <p className="text-[14px] text-muted">For your whole team, with no time limit.</p>
            <ul className="mt-7 space-y-3 text-[15px]">
              {["CRM, deals and pipeline", "AI email outreach", "Shared team inbox", "Projects and client portal", "Team, attendance, leave and payroll", "Automation and analytics"].map((f) => (
                <li key={f} className="flex gap-2.5"><Check className="mt-0.5 h-4.5 w-4.5 shrink-0 text-emerald-600" />{f}</li>
              ))}
            </ul>
            <div className="mt-8"><CTA href={links.signup}>Get started free</CTA></div>
          </div>
          <div className="lift gradient-panel rounded-xl p-[2px]">
            <div className="h-full rounded-[10px] bg-white p-8">
              <p className="font-display flex items-center gap-2 text-[22px] font-semibold">Chatbot <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[12px] font-medium text-accent">Premium</span></p>
              <p className="font-display mt-2 text-[44px] font-semibold">Talk to us</p>
              <p className="text-[14px] text-muted">Everything in Free, plus your AI website assistant.</p>
              <ul className="mt-7 space-y-3 text-[15px]">
                {["AI chatbot trained on your site and docs", "Live chat and handover to your team", "Voice calls from the website", "Tickets and a help center", "Leads saved straight to your CRM"].map((f) => (
                  <li key={f} className="flex gap-2.5"><Check className="mt-0.5 h-4.5 w-4.5 shrink-0 text-accent" />{f}</li>
                ))}
              </ul>
              <div className="mt-8"><CTA href={links.call}>Book a call</CTA></div>
            </div>
          </div>
        </div>
      </section>

      {/* Built by Rhinon Labs */}
      <section className="border-y border-line bg-[#fafafa] py-28">
        <div className="mx-auto max-w-[1180px] px-5">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <Tag>Who builds it</Tag>
              <h2 className="font-display mt-4 text-[38px] font-semibold leading-[1.08] sm:text-[44px]">Made by Rhinon Labs. Used by us every day.</h2>
              <p className="mt-5 text-[17px] leading-8 text-ink-soft">
                We build custom CRMs, AI automation and dashboards for growing companies, and we run our own business on Rhinon Tech.
              </p>
              <a href={links.labs} className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-medium underline underline-offset-4">Visit rhinonlabs.com <ArrowRight className="h-4 w-4" /></a>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, title: "Your data stays yours", body: "Every workspace is isolated, and connected accounts are encrypted." },
                { icon: Users, title: "Roles you control", body: "Choose who sees payroll, CRM or the inbox, action by action." },
                { icon: Phone, title: "People, not tickets", body: "Questions or a custom need? Talk to the team that built it." },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="lift rounded-xl border-2 border-ink bg-white p-6">
                  <Icon className="h-6 w-6 text-accent" />
                  <p className="mt-5 text-[16px] font-semibold">{title}</p>
                  <p className="mt-2 text-[14px] leading-6 text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="mx-auto max-w-[1180px] px-5 py-32">
        <h2 className="font-display text-center text-[40px] font-semibold sm:text-[48px]">Works with the tools you already use.</h2>
        <p className="mx-auto mt-4 max-w-[520px] text-center text-[17px] leading-8 text-ink-soft">Connect your mailbox, calendar and website. Everything else lives in one place.</p>
        <div className="mx-auto mt-16 grid max-w-[980px] gap-x-12 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {INTEGRATIONS.map(({ name, body, icon: Icon, color }) => (
            <div key={name} className="flex gap-4">
              <Icon className={`mt-0.5 h-6 w-6 shrink-0 ${color}`} />
              <span>
                <span className="block text-[16px] font-semibold">{name}</span>
                <span className="mt-1.5 block text-[14.5px] leading-6 text-ink-soft">{body}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Try it free */}
      <section className="relative mx-auto max-w-[1180px] px-5 pb-32 pt-8 text-center">
        <div className="gradient-panel absolute left-[6%] top-0 hidden h-24 w-24 rounded-full lg:block" />
        <div className="gradient-panel-alt absolute right-[8%] top-10 hidden h-20 w-20 rounded-full lg:block" />
        <div className="gradient-panel-alt absolute bottom-24 left-[14%] hidden h-14 w-28 rounded-full lg:block" />
        <div className="gradient-panel absolute bottom-16 right-[16%] hidden h-24 w-24 rounded-full lg:block" />
        <h2 className="font-display relative text-[48px] font-semibold sm:text-[64px]">Try it for free</h2>
        <p className="relative mx-auto mt-5 max-w-[460px] text-[17px] leading-8 text-ink-soft">
          Set up your workspace in a few minutes and bring your whole team. No credit card, no time limit.
        </p>
        <div className="relative mt-9"><CTA href={links.signup}>Get started now</CTA></div>
        <p className="relative mt-3 text-[13px] text-muted">No credit card required</p>
      </section>

      {/* Footer */}
      <footer className="bg-night text-white">
        <div className="mx-auto max-w-[1180px] px-5 pb-10 pt-20">
          <div className="grid gap-12 md:grid-cols-[1.4fr_1fr]">
            <div>
              <Logo light />
              <p className="font-display mt-8 max-w-[420px] text-[34px] font-semibold leading-[1.1]">The business software that just makes sense.</p>
            </div>
            <div className="grid grid-cols-2 gap-6 text-[14.5px] text-zinc-400">
              <div className="space-y-3">
                <p className="font-semibold text-white">Product</p>
                <a href="#product" className="block hover:text-white">Features</a>
                <a href="#pricing" className="block hover:text-white">Pricing</a>
                <a href="#integrations" className="block hover:text-white">Integrations</a>
                <a href={links.login} className="block hover:text-white">Log in</a>
              </div>
              <div className="space-y-3">
                <p className="font-semibold text-white">Company</p>
                <a href={links.labs} className="block hover:text-white">Rhinon Labs</a>
                <a href={links.contact} className="block hover:text-white">Contact</a>
                <a href={links.privacy} className="block hover:text-white">Privacy & terms</a>
              </div>
            </div>
          </div>
          <div className="mt-16 flex flex-col justify-between gap-2 border-t border-white/10 pt-6 text-[13px] text-zinc-500 sm:flex-row">
            <span>{`© ${new Date().getFullYear()} Rhinon Labs. All rights reserved.`}</span>
            <span>Made in India</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
