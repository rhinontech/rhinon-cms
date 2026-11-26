import { ArrowRight, Check, KeyRound, Route, Sparkles, Tag } from "lucide-react";
import { links, pageMeta } from "@/components/site";
import { Aurora, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { CtaBand, Faq } from "@/components/blocks";
import { ProofStrip } from "@/components/depth";
import { JsonLd, breadcrumbNode, faqNode, graphJsonLd } from "@/components/schema";

/*
 * Who builds Rhinon Tech and why. Facts only: no invented founding dates, headcounts or
 * customer numbers (docs/RHINONTECH_WEBSITE_REVAMP.md §2.6).
 */

export const metadata = pageMeta({
  title: "About",
  description: "Rhinon Tech is built by Rhinon Labs, a services business that runs its own agency on it. Why we built an AI CRM for service businesses, and what we believe.",
  path: "/about",
});

const BEFORE = [
  "Leads in one tool, cold email in another",
  "Won deals retyped into a project app",
  "Client updates scattered across WhatsApp and email",
  "HR and leave in spreadsheets",
];

const BELIEFS = [
  { icon: Route, title: "One record, start to finish", body: "A client should move from first chat to finished project without anyone copying their details from tool to tool." },
  { icon: Sparkles, title: "AI that you approve", body: "The AI drafts, researches and answers from your own content. What goes out to a client is your call." },
  { icon: Tag, title: "Limits you can read", body: "Free means up to 5 people, 50 emails and 20 AI drafts a day. We would rather say it plainly than surprise you later." },
  { icon: KeyRound, title: "Your data is yours", body: "Every workspace is isolated, connected accounts are encrypted, and you can export or delete your data whenever you like." },
];

/** Dated releases (see /changelog), so the story has facts, not adjectives. */
const TIMELINE = [
  { when: "July 2026", what: "AI-drafted outreach, spreadsheet lead import and e-signed offer letters." },
  { when: "August 2026", what: "Deals, pipelines and CRM reports; duplicate detection; meeting scheduling." },
  { when: "September 2026", what: "Self-serve sign-up: any team can create its own isolated workspace." },
  { when: "October 2026", what: "The AI Agent for websites, team chat, two-factor sign-in and data export." },
  { when: "November 2026", what: "Sprints, video calls and a built-in calendar." },
];

const FAQ = [
  { q: "Who makes Rhinon Tech?", a: "Rhinon Labs, which builds custom CRMs, AI automation and dashboards for growing companies, and runs its own agency on Rhinon Tech." },
  { q: "Is Rhinon Tech built in India?", a: "Yes. It is built in India and used by teams anywhere." },
  { q: "Can you build something custom for us?", a: "Rhinon Labs takes on custom CRM, AI and dashboard work. Contact us and tell us what you need." },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative pb-20 pt-16 sm:pt-24">
        <Aurora />
        <div className="relative mx-auto max-w-[1240px] px-5">
          <SectionHead as="h1" eyebrow="About" title={<>We build the tools we run <span className="text-aurora">our own agency on.</span></>} sub="Rhinon Tech is made by Rhinon Labs. We build custom CRMs, AI automation and dashboards for growing companies, and every lead, campaign and client project of ours runs on Rhinon Tech." />
        </div>
      </section>

      <section className="border-t border-line py-24 sm:py-28">
        <div className="mx-auto grid max-w-[1240px] gap-14 px-5 lg:grid-cols-[1fr_1fr]">
          <Reveal>
            <SectionHead eyebrow="Why we built it" title="The way most service businesses run is held together with copy and paste." />
            <p className="mt-6 max-w-[560px] text-[17px] leading-8 text-ink-soft">We lived it. Like most agencies, we had a CRM, a cold-email tool, a project app, WhatsApp groups for clients and spreadsheets for the team. Every hand-off between them lost something. So we built one workspace where a lead becomes a deal, the deal becomes a project, and the client follows it in their own portal. Now we offer it to other service businesses.</p>
          </Reveal>
          <Reveal delay={120}>
            <div className="rounded-[28px] border border-line bg-white/70 p-8">
              <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-muted">What we replaced</p>
              <ul className="mt-6 space-y-4">
                {BEFORE.map((t) => (
                  <li key={t} className="flex items-start gap-3 text-[16px] text-ink-soft"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-500" strokeWidth={3} />{t}</li>
                ))}
              </ul>
              <a href={links.labs} className="mt-8 inline-flex items-center gap-1.5 text-[15px] font-semibold underline underline-offset-4">Visit rhinonlabs.com <ArrowRight className="h-4 w-4" /></a>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-line bg-soft/60 py-24 sm:py-28">
        <div className="mx-auto max-w-[1240px] px-5">
          <Reveal><SectionHead eyebrow="What we believe" title="Four rules we build by." /></Reveal>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BELIEFS.map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 90}>
                <div className="lt-card h-full rounded-2xl bg-white p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet/10 text-violet"><Icon className="h-5 w-5" /></span>
                  <p className="font-display mt-5 text-[20px] font-semibold">{title}</p>
                  <p className="mt-2 text-[14.5px] leading-6 text-ink-soft">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <ProofStrip count={6} />

      <section className="border-t border-line bg-soft/60 py-24 sm:py-28">
        <div className="mx-auto max-w-[900px] px-5">
          <Reveal><SectionHead eyebrow="How it grew" title="Shipped, month by month." sub="Every line below is live in the product. The full list is on the changelog." /></Reveal>
          <ol className="relative mt-12 space-y-3 before:absolute before:bottom-6 before:left-[7px] before:top-6 before:w-px before:bg-line">
            {TIMELINE.map((m, i) => (
              <Reveal key={m.when} delay={i * 70}>
                <li className="relative flex gap-5 pl-0">
                  <span className="relative z-10 mt-6 h-[15px] w-[15px] shrink-0 rounded-full border-[3px] border-white bg-brand shadow" />
                  <span className="flex-1 rounded-2xl border border-line bg-white p-5"><span className="block font-mono text-[11px] uppercase tracking-[0.16em] text-muted">{m.when}</span><span className="mt-2 block text-[16px] leading-7">{m.what}</span></span>
                </li>
              </Reveal>
            ))}
          </ol>
          <a href="/changelog" className="mt-8 inline-flex text-[15px] font-semibold underline underline-offset-4">Read the changelog</a>
        </div>
      </section>

      <section className="border-t border-line py-24 sm:py-28">
        <div className="mx-auto max-w-[1240px] px-5">
          <SectionHead eyebrow="FAQ" title="About us, briefly." />
          <div className="mt-12"><Faq items={FAQ} /></div>
        </div>
      </section>

      <CtaBand title={<>Talk to the people <span className="text-aurora-soft">who build it.</span></>} sub="Questions, a custom need, or help moving from your current tools: we read every message." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "Contact us", href: links.contact }} />
      <JsonLd data={graphJsonLd([breadcrumbNode([{ name: "Home", path: "/" }, { name: "About", path: "/about" }]), faqNode(FAQ)])} />
    </>
  );
}
