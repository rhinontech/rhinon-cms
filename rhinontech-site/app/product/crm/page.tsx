import type { Metadata } from "next";
import { Aurora, Button, Eyebrow, IconTile, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { CtaBand } from "@/components/blocks";
import { links } from "@/components/site";
import { bySlug } from "@/content/products";
import { Crumb, PairsWith, ProductFaq } from "@/components/product/shared";
import { BarsSection, ConvergeSection, LifecycleStory, PipelineHero, ScanSection } from "@/components/product/crm";

const p = bySlug("crm")!;

export const metadata: Metadata = {
  title: "CRM: every lead and deal in one list",
  description: "Import leads, capture them from your website, and follow each one from first hello to won deal. Free for your whole team.",
  alternates: { canonical: "/product/crm" },
};

const FAQ = [
  { q: "Can I import my existing contacts?", a: "Yes. Upload a CSV and your leads appear in the pipeline with their details." },
  { q: "Do website enquiries show up by themselves?", a: "Yes. Forms on your website can post straight into the CRM, and the AI chatbot saves the visitors it talks to." },
  { q: "What happens when the same person writes twice?", a: "The new enquiry is added to the lead you already have, so you never end up with a duplicate." },
  { q: "Is the CRM free?", a: "Yes. Everything in Rhinon Tech except the AI website chatbot is free for your whole team, with no time limit." },
];

export default function CrmPage() {
  return (
    <>
      {/* Hero: copy on the left, a deal travelling the board on the right */}
      <section className="relative pb-24 pt-12 sm:pt-16">
        <Aurora tones={["#2f5bff", "#7c5cff", "#2cd3ff"]} />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-14 px-5 lg:grid-cols-[1fr_1fr]">
          <Reveal>
            <Crumb slug="crm" />
            <div className="mt-6"><IconTile icon={p.icon} tone={p.tone} size={56} /></div>
            <h1 className="font-display mt-6 text-[40px] font-semibold leading-[1.02] sm:text-[54px]">
              Every lead and deal, <span className="text-aurora">finally in one list.</span>
            </h1>
            <p className="mt-6 max-w-[520px] text-[18px] leading-8 text-ink-soft">
              Import a spreadsheet or let leads flow in from your website. Stages, owners and every conversation on one timeline, so nobody asks “where are we with them?” again.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href={links.signup} arrow>Get started free</Button>
              <Button href={links.call} variant="ghost">Book a demo</Button>
            </div>
            <p className="mt-5 text-[13.5px] text-muted">Free for your whole team. No credit card.</p>
          </Reveal>
          <Reveal delay={140}><PipelineHero /></Reveal>
        </div>
      </section>

      {/* Capture */}
      <section className="border-y border-line bg-soft/60 py-24 sm:py-32">
        <div className="mx-auto max-w-[1240px] px-5">
          <Reveal><SectionHead eyebrow="Capture" title={<>Leads from everywhere. <span className="text-aurora">One list.</span></>} sub="Import a CSV, point your website forms at it, or let the chatbot do the talking. Every lead lands in the same pipeline, and a repeat enquiry joins the lead you already have." /></Reveal>
          <div className="mt-16"><ConvergeSection /></div>
        </div>
      </section>

      {/* Lifecycle */}
      <section className="relative bg-night pt-24 text-white sm:pt-32">
        <Aurora dark tones={["#2f5bff", "#7c5cff", "#2cd3ff"]} />
        <div className="relative mx-auto max-w-[1240px] px-5">
          <Reveal><SectionHead dark eyebrow="Lifecycle" title={<>Follow one lead from hello to <span className="text-aurora-soft">deal.</span></>} sub="Scroll to move Priya through the pipeline. Her stage updates itself as things happen." /></Reveal>
          <div className="mt-16 pb-24"><LifecycleStory /></div>
        </div>
      </section>

      {/* Research */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:py-32">
        <Reveal><SectionHead eyebrow="Rhinon AI" title={<>Research before you <span className="text-aurora">reach out.</span></>} sub="Rhinon AI reads the lead's website and the web, then saves a short description, recent news and the likely pain point on the lead. Every email starts with something real." /></Reveal>
        <div className="mt-16"><ScanSection /></div>
      </section>

      {/* Value */}
      <section className="border-y border-line bg-soft/60 py-24 sm:py-32">
        <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-5 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <Eyebrow>Deals you can see</Eyebrow>
            <h2 className="font-display mt-5 text-[38px] font-semibold leading-[1.04] sm:text-[52px]">Know where the <span className="text-aurora">money is.</span></h2>
            <p className="mt-5 max-w-[460px] text-[17px] leading-8 text-ink-soft">Deal value is tracked by stage, so a glance tells you what is open, what is close and what is won. Switch the period and the whole picture moves with you.</p>
          </Reveal>
          <Reveal delay={120}><BarsSection /></Reveal>
        </div>
      </section>

      <PairsWith items={[
        { slug: "outreach", line: "Turn a list into a campaign in one click." },
        { slug: "inbox", line: "Replies land on the lead's timeline." },
        { slug: "chatbot", line: "Chat visitors become leads automatically." },
      ]} />
      <ProductFaq title="CRM questions, answered." items={FAQ} />
      <CtaBand tone={p.tone} title={<>Start with the CRM, <span className="text-aurora-soft">free.</span></>} sub="Set up your workspace in a few minutes and bring your whole team. No credit card, no time limit." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "See all products", href: "/product" }} />
    </>
  );
}
