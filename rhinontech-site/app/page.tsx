import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Search, Sparkles, UserCheck } from "lucide-react";
import { links, pageMeta } from "@/components/site";
import { bySlug } from "@/content/products";
import { SOLUTIONS } from "@/content/solutions";
import { SOLUTION_DEPTH } from "@/content/solutionDepth";
import { CAPABILITIES } from "@/content/capabilities";
import { PROOF_AS_OF, PROOF_FIGURES } from "@/content/proof";
import { FREE_FEATURES, STARTER_FEATURES } from "@/content/plans";
import { Button, IconTile, SectionHead } from "@/components/ui";
import { H2, Kicker, LightSection, MONO } from "@/components/light";
import { Reveal } from "@/components/Reveal";
import { Typewriter } from "@/components/Typewriter";
import { HeroWorkspace } from "@/components/HeroWorkspace";
import { GetStartedButton } from "@/components/forms/GetStartedButton";
import { CtaBand, Faq } from "@/components/blocks";
import { CapabilityGrid, DarkCell, DarkPanel, RingBadge, StatRow, TrustStrip } from "@/components/kit";
import { TabExplorer } from "@/components/TabExplorer";
import { MascotReveal } from "@/components/MascotReveal";
import { AppWindow, ProductMock } from "@/components/ProductMocks";
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
      <div className="relative mx-auto max-w-[1240px] text-center">
        <RingBadge><Sparkles className="h-3.5 w-3.5 text-violet" />The AI CRM for agencies and service businesses</RingBadge>
        <h1 className="font-display mx-auto mt-8 max-w-[1080px] text-balance text-[44px] leading-[1.02] sm:text-[80px]">
          Win clients. Deliver the work. Keep them coming back.
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
        <div className="relative mx-auto max-w-[1240px]">
          {/* The vivid plate sits behind the workspace, so its floating chips can overhang it. */}
          <div aria-hidden className="stage absolute inset-x-0 bottom-[-28px] top-[14%] sm:top-[18%]" />
          <div className="relative px-3 sm:px-8"><HeroWorkspace /></div>
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
      <div className="hair mt-14 lg:grid-cols-3">
        {LOOP.map((s, i) => (
          <Reveal key={s.n} delay={i * 120}>
            <div className="flex h-full flex-col p-7">
              <p className="font-mono text-[11.5px] font-medium uppercase tracking-[0.14em] text-[#5b3df5]">{s.n} · {s.group}</p>
              <p className="font-display mt-3 text-[24px] font-bold leading-tight tracking-[-0.035em]">{s.title}</p>
              <p className="mt-3 text-[15px] leading-7 text-ink-soft">{s.body}</p>
              <div className="mt-6 flex-1 rounded-2xl bg-[#f5f6fb] p-4"><LoopArtifact step={i as 0 | 1 | 2} /></div>
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

/* ───────────────────────── Everything included ───────────────────────── */

function Everything() {
  return (
    <LightSection border>
      <Reveal><SectionHead center eyebrow="Everything included" title="Everything a service business runs on, in one workspace." sub={`${CAPABILITIES.length} things Rhinon does today, from the first website chat to the last payslip. Count them against the tools you pay for now.`} /></Reveal>
      <div className="mt-16"><CapabilityGrid /></div>
      <p className="mt-8 text-center text-[14px] text-muted">Everything is free for up to 5 people, except the items marked Starter.</p>
    </LightSection>
  );
}

/* ───────────────────────── AI (dark panel) ───────────────────────── */

const AI_CARDS = [
  { slug: "ai-agent", label: "Answers from your content", body: "The AI Agent replies from your own site, files and help articles, and says so when it does not know.", tag: "Replying to a website visitor", text: "Yes, every new client gets a kick-off call and a project portal. Would you like me to book a call with Ana this week?" },
  { slug: "outreach", label: "Writes the first line", body: "Outreach drafts a personal email for each lead, from research on their company and role.", tag: "Drafting for Priya Nair", text: "Hi Priya, congrats on opening the second clinic. Most practices we work with outgrow their booking site at that stage. Worth 15 minutes to see what we built for Northwind Dental?" },
  { slug: "hr", label: "Rewrites any sentence", body: "Select a sentence in an offer letter or NDA and ask for a warmer, shorter or more formal version.", tag: "Offer letter · warmer tone", text: "We are delighted to offer you the role of Product Designer, and we cannot wait to welcome you to the team on 1 December." },
] as const;

function AiPanel() {
  return (
    <DarkPanel>
      <Reveal><SectionHead dark center eyebrow="Rhinon AI" title="AI that does the legwork. You keep the final say." sub="It answers visitors, researches leads, drafts emails and rewrites letters inside the tools you already use. Nothing goes out without you." /></Reveal>
      <div className="hair hair-dark mt-16 sm:grid-cols-2 lg:grid-cols-3">
        {AI_CARDS.map((c, i) => (
          <DarkCell key={c.slug} label={c.label} body={c.body}>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className={`${MONO} mb-2.5 flex items-center gap-1.5 text-[#b9a6ff]`}><Sparkles className="h-3.5 w-3.5" />{c.tag}</p>
              <Typewriter text={c.text} className="min-h-[124px] text-[14px] leading-6 text-white/85" speed={20 + i * 4} />
            </div>
          </DarkCell>
        ))}
        <DarkCell label="Researches every lead" body="Before it drafts, Outreach looks up the company and the person, so the first line is about them.">
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-[13px]">
            <p className="flex items-center gap-2 text-white/80"><Search className="h-3.5 w-3.5 text-[#b9a6ff]" />Northwind Dental · Pune</p>
            <p className="rounded-lg bg-white/[0.06] px-3 py-2 text-white/70">Opened a second clinic this quarter</p>
            <p className="rounded-lg bg-white/[0.06] px-3 py-2 text-white/70">Priya Nair · Practice owner</p>
          </div>
        </DarkCell>
        <DarkCell label="Hands over to a person" body="When a visitor needs a human, your team picks up the live chat with its full history.">
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-[13px]">
            <p className="w-fit rounded-2xl rounded-tl-sm bg-white/[0.08] px-3 py-2 text-white/80">Can I talk to someone about pricing?</p>
            <p className="flex items-center gap-2 text-emerald-300"><UserCheck className="h-3.5 w-3.5" />Ana joined the chat</p>
          </div>
        </DarkCell>
        <DarkCell label="Nothing sends without you" body="Every AI draft waits for approval. Edit a line, approve, or throw it away.">
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-[13px]">
            {["Priya Nair", "Yusuf Khan", "Chloe Martin"].map((n, i) => (
              <p key={n} className="flex items-center justify-between rounded-lg bg-white/[0.06] px-3 py-2 text-white/80">{n}<span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${i === 0 ? "bg-white text-[#0a1128]" : "bg-white/10 text-white/60"}`}>{i === 0 ? "Approve" : "In review"}</span></p>
            ))}
          </div>
        </DarkCell>
      </div>
      <div className="mt-12 text-center"><Button href="/ai" variant="glass" arrow>See Rhinon AI</Button></div>
    </DarkPanel>
  );
}

/* ───────────────────────── Built for (tabs) ───────────────────────── */

function BuiltFor() {
  const tabs = SOLUTIONS.map((s) => {
    const d = SOLUTION_DEPTH[s.slug];
    const products = [...new Set(s.workflow.map((w) => w.product))].map((slug) => bySlug(slug)!);
    return {
      id: s.slug,
      label: s.name,
      panel: (
        <div className="surface grid items-center gap-10 p-7 sm:p-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="font-mono text-[11.5px] font-medium uppercase tracking-[0.14em] text-[#5b3df5]">{s.short}</p>
            <h3 className="font-display mt-3 text-balance text-[30px] font-bold leading-[1.06] tracking-[-0.04em] sm:text-[40px]">{s.h1}</h3>
            <p className="mt-4 text-[16px] leading-7 text-ink-soft">{s.sub}</p>
            <ul className="mt-6 space-y-2.5">
              {s.workflow.slice(0, 4).map((w) => <li key={w.stage + w.line} className="flex gap-2.5 text-[15px] leading-6"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} /><span><b className="font-semibold">{w.stage}.</b> <span className="text-ink-soft">{w.line}</span></span></li>)}
            </ul>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Uses</span>
              {products.map((p) => <span key={p.slug} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white py-1 pl-1 pr-2.5 text-[12.5px] font-semibold"><IconTile icon={p.icon} tone={p.tone} size={20} />{p.name}</span>)}
            </div>
            <Link href={`/solutions/${s.slug}`} className="mt-7 inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink hover:text-[#5b3df5]">Rhinon for {s.name.toLowerCase()} <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {d && <AppWindow><ProductMock k={d.hero} /></AppWindow>}
        </div>
      ),
    };
  });
  return (
    <LightSection>
      <Reveal><SectionHead center eyebrow="Built for" title="Businesses that sell their expertise." sub="Teams of 5 to 50 who win clients and then do the work for them. Pick the one closest to you." /></Reveal>
      <div className="mt-12"><TabExplorer label="Kinds of service business" tabs={tabs} /></div>
    </LightSection>
  );
}

/* ───────────────────────── Proof and trust ───────────────────────── */

function Proof() {
  return (
    <LightSection border>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <Reveal><SectionHead eyebrow="We use it ourselves" title="Rhinon Labs runs its own agency on Rhinon Tech." sub="We are a services business too. Our leads, campaigns, client projects and the chat on rhinonlabs.com all run on it, so we feel every rough edge first." /></Reveal>
        <Button href="/customers/rhinon-labs" variant="soft" arrow>Read the case study</Button>
      </div>
      <div className="mt-12"><StatRow items={PROOF_FIGURES.slice(0, 4).map((f) => ({ label: f.label, value: f.big, note: f.note }))} footnote={`Counted in our own workspace on ${PROOF_AS_OF}. Customer stories will appear here once customers give us permission.`} /></div>
      <div className="mt-20 flex flex-wrap items-end justify-between gap-6">
        <Reveal><SectionHead eyebrow="Security" title="Your data, kept yours." sub="Every workspace is kept separate, roles are checked on the server, and you can take your data with you." /></Reveal>
        <Link href="/security" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink hover:text-[#5b3df5]">How we protect your data <ArrowUpRight className="h-4 w-4" /></Link>
      </div>
      <div className="mt-10"><TrustStrip /></div>
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

export default function Home() {
  return (
    <>
      <Hero />
      <Replaces />
      <Loop />
      <Everything />
      <MascotReveal />
      <AiPanel />
      <BuiltFor />
      <Proof />
      <PricingTeaser />
      <HomeFaq />
      <CtaBand title="Win your next client here." sub="Set up your workspace in a few minutes and invite up to 5 people free. No credit card, no time limit." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "Book a demo", href: links.call }} peek="crm" placement="Home final CTA" />
      <JsonLd data={graphJsonLd([softwareAppNode(), faqNode(FAQ)])} />
    </>
  );
}
