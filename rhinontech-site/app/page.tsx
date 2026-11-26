import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Briefcase, Check, Code2, KeyRound, Lock, Phone, Scale, Sparkles, UsersRound } from "lucide-react";
import { links, pageMeta } from "@/components/site";
import { PRODUCTS, bySlug, byGroup } from "@/content/products";
import { FREE_FEATURES, STARTER_FEATURES } from "@/content/plans";
import { Button, IconTile } from "@/components/ui";
import { Glow, H2, Kicker, LightSection, MONO } from "@/components/light";
import { Reveal } from "@/components/Reveal";
import { Typewriter } from "@/components/Typewriter";
import { HeroWorkspace } from "@/components/HeroWorkspace";
import { GetStartedButton } from "@/components/forms/GetStartedButton";
import { Faq } from "@/components/blocks";
import { JsonLd, faqNode, graphJsonLd, softwareAppNode } from "@/components/schema";

/*
 * The home page tells one story: a service business winning a client, delivering the work and
 * keeping the client (docs/RHINONTECH_WEBSITE_REVAMP.md §5.1). Every claim here must match the
 * product today; see the claims register in §2.6 before adding one.
 */

export const metadata = pageMeta({
  title: "AI CRM for Agencies & Service Businesses",
  description: "Capture leads with an AI website agent, follow up with AI-written emails and turn won deals into projects clients can track. Free for up to 5 people.",
  path: "/",
});

const REPLACES = [
  ["crm", "Your CRM"], ["ai-agent", "Your live-chat widget"], ["outreach", "Your cold-email tool"], ["inbox", "Scattered client email"],
  ["projects", "Your project tracker"], ["chat", "Your team chat"], ["docs", "Your docs and wiki"], ["hr", "Your HR software"],
  ["payroll", "Your payroll spreadsheet"], ["attendance", "Your leave tracker"], ["performance", "Your review forms"],
] as const;

/* ───────────────────────── Hero ───────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pt-16 sm:pt-24">
      <div className="lt-grid pointer-events-none absolute inset-0" />
      <Glow className="left-1/2 top-[30%] h-[560px] w-[900px] -translate-x-1/2" />
      <div className="relative mx-auto max-w-[1240px] text-center">
        <p className="lt-badge inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[14px] font-medium">
          <Sparkles className="h-3.5 w-3.5 text-violet" />
          The AI CRM for agencies and service businesses
        </p>
        <h1 className="font-display mx-auto mt-8 max-w-[1080px] text-balance text-[44px] font-semibold leading-[1.02] sm:text-[80px]">
          Win clients. Deliver the work. <em className="font-semibold">Keep them coming back.</em>
        </h1>
        <p className="mx-auto mt-7 max-w-[720px] text-[17px] leading-8 text-ink-soft sm:text-[19px]">
          Rhinon answers your website visitors with an AI agent, writes your follow-up emails, and turns every won deal into a project your client can track. Team chat, docs and HR are included.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <GetStartedButton placement="Home hero" />
          <Button href={links.call} variant="soft">Book a demo</Button>
        </div>
        <p className="mt-4 text-[13.5px] text-muted">Free for up to 5 people · No credit card</p>
      </div>
      <div className="relative mt-16 pb-24 sm:mt-20 sm:pb-32">
        <div className="mx-auto max-w-[1180px]">
          <div aria-hidden className="pointer-events-none absolute inset-x-[10%] top-6 h-[60%] rounded-full bg-[#7c5cff]/[0.14] blur-[110px]" />
          <HeroWorkspace />
        </div>
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
            <span className="decoration-ink/40 decoration-1 [text-decoration-line:line-through]">{label}</span>
          </span>
        );
      })}
    </div>
  );
  return (
    <section className="border-y border-line py-9">
      <p className={`${MONO} mb-6 text-center text-muted`}>One workspace replaces</p>
      <div className="marquee-wrap overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
        <div className="marquee">{row}{row}</div>
      </div>
    </section>
  );
}

/* ───────────────────────── The loop: win → deliver → keep ───────────────────────── */

const LOOP = [
  {
    n: "01",
    group: "Win clients",
    title: "Every lead answered and followed up",
    body: "The AI Agent answers visitors from your own content and saves them to the CRM. Outreach drafts the follow-up; you approve it before it goes.",
    slugs: ["ai-agent", "crm", "outreach"],
  },
  {
    n: "02",
    group: "Deliver the work",
    title: "A won deal becomes a project",
    body: "Convert a won deal into a project in one click, with the client attached. Tasks, boards, docs and team chat sit in the same place.",
    slugs: ["projects", "docs", "chat"],
  },
  {
    n: "03",
    group: "Keep them coming back",
    title: "Clients see progress without a status call",
    body: "Each client follows their project's tasks in a portal and sends requests there. The AI Agent and your help center answer questions in between.",
    slugs: ["projects", "ai-agent"],
  },
] as const;

/** A small, static picture of each step, so the story reads at a glance. */
function LoopArtifact({ step }: { step: 0 | 1 | 2 }) {
  if (step === 0) {
    return (
      <div className="space-y-2.5 text-[13px]">
        <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-ink px-3 py-2 text-white">Do you build Webflow sites for clinics?</p>
        <p className="w-fit max-w-[85%] rounded-2xl rounded-tl-sm bg-soft px-3 py-2 text-ink-soft">Yes. We have built six. Shall I book a call with the team?</p>
        <p className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 font-medium"><span className="h-2 w-2 rounded-full bg-emerald-500" />New lead: Asha Rao · Saved to CRM</p>
      </div>
    );
  }
  if (step === 1) {
    return (
      <div className="space-y-2.5 text-[13px]">
        <p className="flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2 font-medium">Clinic website redesign <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Won</span></p>
        <p className="text-center text-[12px] font-semibold text-muted">↓ Convert to project</p>
        <p className="rounded-xl border border-line bg-white px-3 py-2"><b className="font-semibold">Project created</b><span className="block text-muted">Client attached · 6 tasks · Brief in Docs</span></p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-line bg-white p-3 text-[13px]">
      <p className="font-semibold">Client portal · Clinic website</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-soft"><div className="h-full w-[66%] rounded-full bg-[#0fa68e]" /></div>
      <p className="mt-2 flex justify-between text-muted"><span>Homepage design · Done</span><span>8 of 12 tasks</span></p>
      <p className="mt-3 rounded-lg bg-soft px-2.5 py-1.5 text-ink-soft">New request from Asha: add a booking form</p>
    </div>
  );
}

function Loop() {
  return (
    <LightSection>
      <Reveal>
        <Kicker>How it works</Kicker>
        <H2>From first chat<br className="hidden sm:block" /> to finished project.</H2>
        <p className="mt-5 max-w-[620px] text-[18px] leading-8 text-ink-soft">Most teams stitch this together from a CRM, a cold-email tool, a project app and WhatsApp. In Rhinon it is one record that moves along.</p>
      </Reveal>
      <div className="mt-14 grid gap-4 lg:grid-cols-3">
        {LOOP.map((s, i) => (
          <Reveal key={s.n} delay={i * 120}>
            <div className="lt-card flex h-full flex-col rounded-2xl p-6">
              <p className={`${MONO} text-muted`}>{s.n} · {s.group}</p>
              <p className="font-display mt-3 text-[24px] font-semibold leading-tight">{s.title}</p>
              <p className="mt-3 text-[15px] leading-7 text-ink-soft">{s.body}</p>
              <div className="mt-6 flex-1 rounded-2xl bg-soft/70 p-4"><LoopArtifact step={i as 0 | 1 | 2} /></div>
              <div className="mt-5 flex flex-wrap gap-2">
                {s.slugs.map((slug) => {
                  const p = bySlug(slug)!;
                  return (
                    <Link key={slug} href={`/product/${slug}`} className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-white py-1 pl-1 pr-3 text-[13px] font-semibold hover:border-ink/20">
                      <IconTile icon={p.icon} tone={p.tone} size={22} />{p.name}
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </LightSection>
  );
}

/* ───────────────────────── AI ───────────────────────── */

const AI_CARDS = [
  { slug: "ai-agent", title: "Answers from your content", label: "Replying to a website visitor", text: "Yes, every new client gets a kick-off call and a project portal. Would you like me to book a call with Ana this week?" },
  { slug: "outreach", title: "Writes the first line", label: "Drafting for Priya Nair", text: "Hi Priya, congrats on opening the second clinic. Most practices we work with outgrow their booking site at that stage. Worth 15 minutes to see what we built for Northwind Dental?" },
  { slug: "hr", title: "Rewrites any sentence", label: "Offer letter · warmer tone", text: "We are delighted to offer you the role of Product Designer, and we cannot wait to welcome you to the team on 1 December." },
] as const;

function AiSection() {
  return (
    <LightSection border className="overflow-hidden">
      <Glow className="left-1/2 top-0 h-[420px] w-[900px] -translate-x-1/2" />
      <div className="relative">
        <Reveal>
          <Kicker>Rhinon AI</Kicker>
          <H2>AI that does the legwork.<br className="hidden sm:block" /> You keep the final say.</H2>
          <p className="mt-5 max-w-[620px] text-[18px] leading-8 text-ink-soft">It answers visitors, researches leads, drafts emails and rewrites letters inside the tools you already use, and nothing goes out without you.</p>
        </Reveal>
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {AI_CARDS.map((c, i) => {
            const p = bySlug(c.slug)!;
            return (
              <Reveal key={c.slug} delay={i * 120}>
                <div className="lt-card flex h-full flex-col rounded-2xl p-6">
                  <IconTile icon={p.icon} tone={p.tone} size={42} />
                  <p className="font-display mt-5 text-[24px] font-semibold">{c.title}</p>
                  <p className="mt-1 text-[14px] text-muted">{p.name}</p>
                  <div className="mt-6 flex-1 rounded-2xl bg-[#0b0b14] p-4 text-white">
                    <p className={`${MONO} mb-2.5 flex items-center gap-1.5 text-[#b9a6ff]`}><Sparkles className="h-3.5 w-3.5" />{c.label}</p>
                    <Typewriter text={c.text} className="min-h-[148px] text-[14.5px] leading-6 text-white/85" speed={20 + i * 4} />
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
        <Reveal delay={200}>
          <p className="mt-10 text-[15px] text-muted">Drafts wait for your approval. Nothing is sent without you.</p>
          <div className="mt-5"><Button href="/ai" variant="soft" arrow>See Rhinon AI</Button></div>
        </Reveal>
      </div>
    </LightSection>
  );
}

/* ───────────────────────── Built for ───────────────────────── */

const BUILT_FOR = [
  { icon: Briefcase, href: "/solutions/agencies", title: "Agencies", body: "Pitches, retainers and client sign-offs, from the first enquiry to the final file." },
  { icon: Code2, href: "/solutions/it-services", title: "IT & software services", body: "From scoping call to sprint board without retyping the brief." },
  { icon: Scale, href: "/solutions/consultancies", title: "Consultancies", body: "Every engagement's documents, follow-ups and conversations in one place." },
  { icon: UsersRound, href: "/solutions/professional-services", title: "Professional services", body: "Each client's work and history on one timeline your whole team can see." },
];

function BuiltFor() {
  return (
    <LightSection border>
      <Reveal>
        <Kicker>Built for</Kicker>
        <H2>Businesses that sell<br className="hidden sm:block" /> their expertise.</H2>
        <p className="mt-5 max-w-[600px] text-[18px] leading-8 text-ink-soft">Teams of 5 to 50 who win clients and then do the work for them.</p>
      </Reveal>
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {BUILT_FOR.map(({ icon: Icon, href, title, body }, i) => (
          <Reveal key={title} delay={i * 90}>
            <Link href={href} className="lt-card group flex h-full flex-col rounded-2xl p-6">
              <span className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet/10 text-violet"><Icon className="h-5 w-5" /></span>
                <ArrowUpRight className="h-4 w-4 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
              <span className="font-display mt-5 text-[21px] font-semibold">{title}</span>
              <span className="mt-2 text-[14.5px] leading-6 text-ink-soft">{body}</span>
            </Link>
          </Reveal>
        ))}
      </div>
    </LightSection>
  );
}

/* ───────────────────────── Included for your team ───────────────────────── */

function Included() {
  const items = [bySlug("chat")!, bySlug("docs")!, ...byGroup("Run your team")];
  return (
    <LightSection border className="!py-20">
      <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <Kicker>Included for your team</Kicker>
          <p className="font-display mt-4 text-[32px] font-semibold leading-[1.08] sm:text-[42px]">Run the team behind the work, without five more tools.</p>
        </Reveal>
        <Reveal delay={120}>
          <ul className="flex flex-wrap gap-3">
            {items.map((p) => (
              <li key={p.slug}>
                <Link href={`/product/${p.slug}`} className="group flex items-center gap-2.5 rounded-full border border-line bg-white py-2 pl-2 pr-4 text-[15px] font-semibold hover:border-ink/20">
                  <IconTile icon={p.icon} tone={p.tone} size={28} />{p.name}
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[14px] text-muted">{PRODUCTS.length} products, one login. Use one or all of them.</p>
        </Reveal>
      </div>
    </LightSection>
  );
}

/* ───────────────────────── Trust ───────────────────────── */

function Trust() {
  const items = [
    { icon: Lock, title: "Your data stays yours", body: "Every workspace is isolated, connected accounts are encrypted, and you can export or delete your data." },
    { icon: KeyRound, title: "Roles you control", body: "Choose who sees payroll, the CRM or the inbox, action by action." },
    { icon: Phone, title: "People, not tickets", body: "Questions or a custom need? Talk to the team that built it." },
  ];
  return (
    <LightSection border>
      <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr]">
        <Reveal>
          <Kicker>Who builds it</Kicker>
          <H2 className="!text-[36px] sm:!text-[48px]">Rhinon Labs runs its own agency on it.</H2>
          <p className="mt-5 text-[17px] leading-8 text-ink-soft">We are a services business too. Our leads, campaigns, client projects and the chat on rhinonlabs.com all run on Rhinon Tech, so we feel every rough edge first.</p>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-[15px] font-medium">
            <Link href="/about" className="inline-flex items-center gap-1.5 underline underline-offset-4">About us <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/security" className="inline-flex items-center gap-1.5 underline underline-offset-4">How we protect your data <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-3">
          {items.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 110}>
              <div className="lt-card h-full rounded-2xl p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet/10 text-violet"><Icon className="h-5 w-5" /></span>
                <p className="mt-5 text-[17px] font-semibold">{title}</p>
                <p className="mt-2 text-[14.5px] leading-6 text-ink-soft">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </LightSection>
  );
}

/* ───────────────────────── Pricing ───────────────────────── */

function PricingTeaser() {
  return (
    <LightSection border>
      <Reveal>
        <Kicker>Pricing</Kicker>
        <H2>Free for up to 5 people.<br className="hidden sm:block" /> Grow when you are ready.</H2>
      </Reveal>
      <div className="mt-14 grid max-w-[940px] gap-4 md:grid-cols-2">
        <Reveal>
          <div className="lt-card h-full rounded-2xl p-8">
            <p className="font-display text-[22px] font-semibold">Free</p>
            <p className="font-display mt-2 text-[56px] font-semibold leading-none">₹0</p>
            <p className="mt-2 text-[14px] text-muted">For up to 5 people, with no time limit.</p>
            <ul className="mt-7 space-y-3 text-[15px]">
              {FREE_FEATURES.map((f) => <li key={f} className="flex gap-2.5"><Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-emerald-500" />{f}</li>)}
            </ul>
            <div className="mt-8"><GetStartedButton placement="Home pricing" /></div>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="relative h-full overflow-hidden rounded-2xl bg-[#0b0b14] p-8 text-white shadow-[0_40px_90px_-40px_rgb(0_44_112_/_0.7)]">
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[#2f5bff]/30 blur-[80px]" />
            <div className="relative">
              <p className="font-display text-[22px] font-semibold">Starter</p>
              <p className="font-display mt-2 text-[44px] font-semibold leading-[1.15]">Talk to us</p>
              <p className="mt-2 text-[14px] text-white/55">For growing teams, with the AI Agent on your website.</p>
              <ul className="mt-7 space-y-3 text-[15px] text-white/80">
                {STARTER_FEATURES.map((f) => <li key={f} className="flex gap-2.5"><Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#9fb4ff]" />{f}</li>)}
              </ul>
              <div className="mt-8"><Button href={links.call} variant="glass" arrow>Book a call</Button></div>
            </div>
          </div>
        </Reveal>
      </div>
      <Reveal delay={160}>
        <Link href="/pricing" className="mt-8 inline-flex items-center gap-1.5 text-[15px] font-semibold underline underline-offset-4">Compare all plans <ArrowRight className="h-4 w-4" /></Link>
      </Reveal>
    </LightSection>
  );
}

/* ───────────────────────── FAQ ───────────────────────── */

const FAQ = [
  { q: "What is Rhinon Tech?", a: "An AI CRM for service businesses. It captures leads with an AI agent on your website, drafts follow-up emails for you to approve, and turns won deals into projects your clients can follow, with team chat, docs and HR in the same workspace." },
  { q: "Who is it for?", a: "Agencies, IT and software services firms, consultancies and other teams of 5 to 50 people who win clients and then deliver projects for them." },
  { q: "Is it really free?", a: "Yes, for up to 5 people, with 50 emails and 20 AI drafts a day and no time limit. The AI Agent and larger teams are on the Starter plan." },
  { q: "How accurate is the AI?", a: "The AI Agent answers from your own website and documents, and says so when it does not know. Outreach drafts wait for your approval before anything is sent." },
  { q: "How is my data protected?", a: "Each workspace is isolated from every other, connected accounts are encrypted, and roles decide who sees what. You can export your data or delete your workspace at any time." },
  { q: "Can I move from my current tools?", a: "You can import leads from a spreadsheet today. Direct importers for tools like Zoho, HubSpot or ClickUp are not built yet, so book a demo and we will help you move." },
];

function HomeFaq() {
  return (
    <LightSection border>
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <Kicker>Questions</Kicker>
          <H2 className="!text-[36px] sm:!text-[48px]">Good questions, straight answers.</H2>
        </Reveal>
        <Reveal delay={120}><Faq items={FAQ} /></Reveal>
      </div>
    </LightSection>
  );
}

/* ───────────────────────── Final CTA ───────────────────────── */

function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-line px-5 py-28 text-center sm:py-40">
      <div className="lt-grid pointer-events-none absolute inset-0" />
      <Glow className="left-1/2 top-1/2 h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/2" />
      <Image src="/brand/mark-white.png" alt="Rhinon Tech logo" width={520} height={520} aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 w-[420px] opacity-[0.04] invert" />
      <Reveal className="relative">
        <h2 className="font-display mx-auto max-w-[900px] text-[40px] font-semibold leading-[1.02] sm:text-[76px]">Win your next client here.</h2>
        <p className="mx-auto mt-6 max-w-[520px] text-[18px] leading-8 text-ink-soft">Set up your workspace in a few minutes and invite up to 5 people free. No credit card, no time limit.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <GetStartedButton placement="Home final CTA" />
          <Button href={links.call} variant="soft">Book a demo</Button>
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
      <Loop />
      <AiSection />
      <BuiltFor />
      <Included />
      <Trust />
      <PricingTeaser />
      <HomeFaq />
      <FinalCta />
      <JsonLd data={graphJsonLd([softwareAppNode(), faqNode(FAQ)])} />
    </>
  );
}
