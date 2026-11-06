import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, KeyRound, Lock, Phone, Sparkles, Users } from "lucide-react";
import { links } from "@/components/site";
import { PRODUCTS, bySlug, type Product } from "@/content/products";
import { CHATBOT_FEATURES, FREE_FEATURES } from "@/content/plans";
import { Aurora, Button, Eyebrow, IconTile, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { Spot } from "@/components/Spot";
import { Counter } from "@/components/Counter";
import { Typewriter } from "@/components/Typewriter";
import { HeroWorkspace } from "@/components/HeroWorkspace";
import { Orbit } from "@/components/Orbit";
import { ProductMock } from "@/components/ProductMocks";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const REPLACES = [
  ["crm", "Your CRM"], ["outreach", "Your cold-email tool"], ["inbox", "Your shared inbox"], ["chatbot", "Your live-chat widget"],
  ["work", "Your project tracker"], ["chat", "Your team chat"], ["pages", "Your docs and wiki"], ["hr", "Your HR software"],
  ["payroll", "Your payroll spreadsheet"], ["attendance", "Your leave tracker"], ["performance", "Your review forms"],
] as const;

/* ───────────────────────── Hero ───────────────────────── */

function Hero() {
  return (
    <section className="relative pt-14 sm:pt-20">
      <Aurora />
      <div className="relative mx-auto max-w-[1240px] px-5 text-center">
        <Reveal>
          <Link href="/ai" className="group inline-flex items-center gap-2 rounded-full bg-white/80 py-1.5 pl-1.5 pr-4 text-[13.5px] font-medium ring-1 ring-line backdrop-blur transition-shadow hover:shadow-[0_10px_30px_-12px_rgb(100_80_255_/_0.5)]">
            <span className="rounded-full bg-gradient-to-r from-electric to-violet px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">New</span>
            Rhinon AI is now in every module
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="font-display mx-auto mt-7 max-w-[1000px] text-[46px] font-semibold leading-[0.98] sm:text-[84px]">
            The workspace that <br className="hidden sm:block" /><span className="text-aurora">runs your whole company.</span>
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mx-auto mt-7 max-w-[640px] text-[18px] leading-8 text-ink-soft sm:text-[20px]">
            CRM, cold email, shared inbox, projects, chat and HR in one place, with AI built into every part. Free for your whole team.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button href={links.signup} arrow>Get started free</Button>
            <Button href={links.call} variant="ghost">Book a demo</Button>
          </div>
          <p className="mt-4 text-[13.5px] text-muted">Free forever. No credit card. Only the AI website chatbot is paid.</p>
        </Reveal>
      </div>
      <div className="relative mt-16 px-5 pb-24 sm:mt-20 sm:pb-32">
        <HeroWorkspace />
      </div>
    </section>
  );
}

/* ───────────────────────── Replaces ───────────────────────── */

function Replaces() {
  const row = (
    <div className="flex shrink-0 items-center gap-3 pr-3">
      {REPLACES.map(([slug, label]) => {
        const p = bySlug(slug)!;
        return (
          <span key={slug} className="flex items-center gap-2.5 rounded-full border border-line bg-white py-2 pl-2 pr-5 text-[15px] font-medium text-ink-soft">
            <IconTile icon={p.icon} tone={p.tone} size={28} />
            <span className="decoration-pink/70 decoration-2 [text-decoration-line:line-through]">{label}</span>
          </span>
        );
      })}
    </div>
  );
  return (
    <section className="border-y border-line bg-soft/60 py-9">
      <p className="mb-6 text-center font-mono text-[12px] uppercase tracking-[0.18em] text-muted">One login replaces</p>
      <div className="marquee-wrap overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
        <div className="marquee">{row}{row}</div>
      </div>
    </section>
  );
}

/* ───────────────────────── Bento ───────────────────────── */

const SPAN: Record<string, string> = {
  crm: "lg:col-span-2 lg:row-span-2",
  outreach: "lg:col-span-2",
  pages: "lg:col-span-2",
};

/** Small extra visuals for the wide one-row tiles. */
function TileExtra({ slug }: { slug: string }) {
  if (slug === "outreach") {
    return (
      <span className="mt-auto flex gap-6 pt-5">
        {[["Sent", "4,812"], ["Opened", "41%"], ["Replied", "6.2%"]].map(([k, v]) => (
          <span key={k}><span className="block text-[11px] text-muted">{k}</span><span className="font-display text-[22px] font-semibold tabular-nums">{v}</span></span>
        ))}
        <span className="ml-auto hidden items-end gap-1 sm:flex">
          {[30, 44, 38, 58, 52, 74, 68, 90].map((h, i) => (
            <i key={i} className="bar w-2.5 rounded-t-[3px]" style={{ height: h * 0.5, animationDelay: `${i * 70}ms`, background: i > 5 ? "linear-gradient(to top,#7c5cff,#e04dd6)" : "#e6e9f4" }} />
          ))}
        </span>
      </span>
    );
  }
  if (slug === "pages") {
    return (
      <span className="mt-auto flex flex-wrap gap-2 pt-5 text-[12px] font-medium text-ink-soft">
        {["Handbook", "Onboarding", "Policies", "Project briefs"].map((t) => <span key={t} className="rounded-lg bg-soft px-2.5 py-1">{t}</span>)}
      </span>
    );
  }
  return null;
}

function Tile({ p }: { p: Product }) {
  return (
    <Spot href={`/product/${p.slug}`} className={`group flex flex-col overflow-hidden p-6 ${SPAN[p.slug] ?? ""}`}>
      <span className="flex items-start justify-between">
        <IconTile icon={p.icon} tone={p.tone} size={44} />
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-all duration-300 group-hover:border-transparent group-hover:bg-ink group-hover:text-white">
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </span>
      <span className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: p.tone[0] }}>{p.group}</span>
      <span className="font-display mt-1 flex items-center gap-2 text-[24px] font-semibold leading-tight">
        {p.name}
        {p.premium && <span className="rounded-full bg-pink/15 px-2 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wide text-pink">Premium</span>}
      </span>
      <span className="mt-1.5 text-[15px] leading-6 text-ink-soft">{p.short}</span>
      <TileExtra slug={p.slug} />
      {p.slug === "crm" && (
        <span className="mt-6 block min-h-0 flex-1 overflow-hidden rounded-t-2xl border border-b-0 border-line bg-white [mask-image:linear-gradient(to_bottom,#000_62%,transparent)]">
          <span className="block w-[112%] origin-top-left scale-[0.89]"><ProductMock k={p.mock} /></span>
        </span>
      )}
    </Spot>
  );
}

function Bento() {
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-28 sm:py-36">
      <Reveal><SectionHead eyebrow="The platform" title={<>Eleven products. <span className="text-aurora">One login.</span></>} sub="Sell, deliver and run your team in the same place. Each product is useful on its own, and better together." /></Reveal>
      <div className="mt-16 grid auto-rows-[minmax(250px,auto)] gap-4 sm:grid-cols-2 lg:auto-rows-[260px] lg:grid-cols-4">
        {PRODUCTS.map((p) => <Tile key={p.slug} p={p} />)}
      </div>
    </section>
  );
}

/* ───────────────────────── One brain ───────────────────────── */

function OneBrain() {
  return (
    <section className="relative overflow-hidden bg-soft py-28 sm:py-36">
      <div aria-hidden className="grid-lines absolute inset-0 opacity-60" />
      <div className="relative mx-auto grid max-w-[1240px] items-center gap-16 px-5 lg:grid-cols-[1fr_1.1fr]">
        <Reveal>
          <Eyebrow>Connected by design</Eyebrow>
          <h2 className="font-display mt-5 text-[40px] font-semibold leading-[1.04] sm:text-[56px]">
            One workspace, <span className="text-aurora">one memory.</span>
          </h2>
          <p className="mt-5 max-w-[500px] text-[18px] leading-8 text-ink-soft">
            A lead becomes a project. A hire becomes a payslip. A chat becomes a ticket. Because everything lives in one place, nothing gets re-typed, exported or lost between tools.
          </p>
          <ul className="mt-8 space-y-3.5">
            {["A website visitor becomes a lead, then a deal, then a client project.", "A new hire's record feeds attendance, leave and payroll.", "Replies to your campaigns land in the same inbox as support."].map((t) => (
              <li key={t} className="flex gap-3 text-[16px] leading-7">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet/15 text-violet"><Check className="h-3 w-3" strokeWidth={3} /></span>{t}
              </li>
            ))}
          </ul>
          <div className="mt-10"><Button href="/product" variant="ghost" arrow>Explore all products</Button></div>
        </Reveal>
        <Reveal delay={150}><Orbit /></Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── AI ───────────────────────── */

const AI_CARDS = [
  { slug: "outreach", title: "Writes the first line", label: "Drafting for Priya Nair", text: "Hi Priya, congrats on the two new Pune stores. Most ops heads I talk to are buried in stock reports at that stage. Worth 15 minutes to see how we cut that down to one dashboard?" },
  { slug: "chatbot", title: "Answers from your content", label: "Replying to a website visitor", text: "Yes, every new customer gets a guided setup and a call with our team. Would you like me to connect you with Ana now?" },
  { slug: "hr", title: "Rewrites any sentence", label: "Offer letter · warmer tone", text: "We are delighted to offer you the role of Product Designer, and we cannot wait to welcome you to the team on 1 December." },
] as const;

function AiSection() {
  return (
    <section className="relative overflow-hidden bg-night py-28 text-white sm:py-36">
      <Aurora dark tones={["#2f5bff", "#7c5cff", "#ff5fb0"]} />
      <div className="relative mx-auto max-w-[1240px] px-5">
        <Reveal><SectionHead dark eyebrow="Rhinon AI" title={<>Built in, <span className="text-aurora-soft">not bolted on.</span></>} sub="The AI works inside the modules you already use. It researches, drafts, answers and rewrites, and you stay in charge of what goes out." /></Reveal>
        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {AI_CARDS.map((c, i) => {
            const p = bySlug(c.slug)!;
            return (
              <Reveal key={c.slug} delay={i * 120}>
                <Spot dark className="flex h-full flex-col p-6">
                  <IconTile icon={p.icon} tone={p.tone} size={42} />
                  <p className="font-display mt-5 text-[24px] font-semibold">{c.title}</p>
                  <p className="mt-1 text-[14px] text-white/55">{p.name}</p>
                  <div className="mt-6 flex-1 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="mb-2.5 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[#b9a6ff]"><Sparkles className="h-3.5 w-3.5" />{c.label}</p>
                    <Typewriter text={c.text} className="min-h-[148px] text-[14.5px] leading-6 text-white/85" speed={20 + i * 4} />
                  </div>
                </Spot>
              </Reveal>
            );
          })}
        </div>
        <Reveal delay={200}>
          <p className="mt-10 text-center text-[15px] text-white/55">Drafts wait for your approval. Nothing is sent without you.</p>
          <div className="mt-6 flex justify-center"><Button href="/ai" variant="glass" arrow>See Rhinon AI</Button></div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── Numbers ───────────────────────── */

function Numbers() {
  const items = [
    { big: <Counter to={11} />, label: "products in one workspace" },
    { big: <Counter to={1} />, label: "login for your whole team" },
    { big: "₹0", label: "to start, with no time limit" },
    { big: "24/7", label: "answers from your AI chatbot" },
  ];
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-24">
      <div className="grid grid-cols-2 gap-y-12 lg:grid-cols-4">
        {items.map((it, i) => (
          <Reveal key={i} delay={i * 90} className="text-center">
            <p className="font-display text-aurora text-[56px] font-semibold leading-none sm:text-[76px]">{it.big}</p>
            <p className="mx-auto mt-3 max-w-[200px] text-[15px] leading-6 text-ink-soft">{it.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── Trust ───────────────────────── */

function Trust() {
  const items = [
    { icon: Lock, title: "Your data stays yours", body: "Every workspace is isolated, and connected accounts are encrypted." },
    { icon: KeyRound, title: "Roles you control", body: "Choose who sees payroll, CRM or the inbox, action by action." },
    { icon: Phone, title: "People, not tickets", body: "Questions or a custom need? Talk to the team that built it." },
  ];
  return (
    <section className="border-y border-line bg-soft/60 py-24">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-5 lg:grid-cols-[1fr_1.5fr]">
        <Reveal>
          <Eyebrow>Who builds it</Eyebrow>
          <h2 className="font-display mt-5 text-[38px] font-semibold leading-[1.06] sm:text-[48px]">Made by Rhinon Labs. Used by us every day.</h2>
          <p className="mt-5 text-[17px] leading-8 text-ink-soft">We build custom CRMs, AI automation and dashboards for growing companies, and we run our own business on Rhinon Tech.</p>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-[15px] font-medium">
            <a href={links.labs} className="inline-flex items-center gap-1.5 underline underline-offset-4">Visit rhinonlabs.com <ArrowRight className="h-4 w-4" /></a>
            <Link href="/security" className="inline-flex items-center gap-1.5 underline underline-offset-4">How we protect your data <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-3">
          {items.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 110}>
              <Spot className="h-full p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet/10 text-violet"><Icon className="h-5 w-5" /></span>
                <p className="mt-5 text-[17px] font-semibold">{title}</p>
                <p className="mt-2 text-[14.5px] leading-6 text-ink-soft">{body}</p>
              </Spot>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Pricing ───────────────────────── */

function PricingTeaser() {
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-28 sm:py-36">
      <Reveal><SectionHead eyebrow="Pricing" title={<>Free for everything. <span className="text-aurora">Pay only for the chatbot.</span></>} /></Reveal>
      <div className="mx-auto mt-16 grid max-w-[940px] gap-5 md:grid-cols-2">
        <Reveal>
          <div className="spot h-full p-8">
            <p className="font-display text-[22px] font-semibold">Free</p>
            <p className="font-display mt-2 text-[56px] font-semibold leading-none">₹0</p>
            <p className="mt-2 text-[14px] text-muted">For your whole team, with no time limit.</p>
            <ul className="mt-7 space-y-3 text-[15px]">
              {FREE_FEATURES.map((f) => <li key={f} className="flex gap-2.5"><Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-emerald-500" />{f}</li>)}
            </ul>
            <div className="mt-8"><Button href={links.signup} arrow>Get started free</Button></div>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="beam h-full rounded-[24px] bg-night p-8 text-white shadow-[0_40px_80px_-30px_rgb(80_60_220_/_0.55)]">
            <p className="font-display flex items-center gap-2 text-[22px] font-semibold">AI Chatbot <span className="rounded-full bg-pink/20 px-2 py-0.5 font-sans text-[11px] font-semibold uppercase tracking-wide text-pink">Premium</span></p>
            <p className="font-display text-aurora-soft mt-2 text-[44px] font-semibold leading-[1.15]">Talk to us</p>
            <p className="mt-2 text-[14px] text-white/55">Everything in Free, plus your AI website assistant.</p>
            <ul className="mt-7 space-y-3 text-[15px] text-white/85">
              {CHATBOT_FEATURES.map((f) => <li key={f} className="flex gap-2.5"><Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#b9a6ff]" />{f}</li>)}
            </ul>
            <div className="mt-8"><Button href={links.call} variant="glass" arrow>Book a call</Button></div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── Final CTA ───────────────────────── */

function FinalCta() {
  return (
    <section className="px-5 pb-24 sm:pb-32">
      <Reveal className="noise relative mx-auto max-w-[1240px] overflow-hidden rounded-[40px] bg-night px-6 py-24 text-center text-white sm:py-32">
        <Aurora dark tones={["#2f5bff", "#7c5cff", "#ff5fb0"]} />
        <Image src="/brand/mark-white.png" alt="" width={520} height={520} aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 w-[420px] opacity-[0.06]" />
        <div className="relative">
          <h2 className="font-display mx-auto max-w-[820px] text-[42px] font-semibold leading-[1.02] sm:text-[72px]">
            Run your whole company from <span className="text-aurora-soft">one tab.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-[520px] text-[18px] leading-8 text-white/65">Set up your workspace in a few minutes and bring your whole team. No credit card, no time limit.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button href={links.signup} arrow>Get started free</Button>
            <Button href={links.call} variant="glass">Book a demo</Button>
          </div>
          <p className="mt-5 flex items-center justify-center gap-1.5 text-[13px] text-white/45"><Users className="h-3.5 w-3.5" />Built for teams of any size</p>
        </div>
      </Reveal>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Replaces />
      <Bento />
      <OneBrain />
      <AiSection />
      <Numbers />
      <Trust />
      <PricingTeaser />
      <FinalCta />
    </>
  );
}
