import type { Metadata } from "next";
import { Aurora, Button, Eyebrow, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { CtaBand } from "@/components/blocks";
import { links } from "@/components/site";
import { bySlug } from "@/content/products";
import { Crumb, PairsWith, ProductFaq } from "@/components/product/shared";
import { ComposerHero, FeedSection, FlowSection, LinkedInSection, MemorySection, ScheduleSection } from "@/components/product/outreach";

const p = bySlug("outreach")!;

export const metadata: Metadata = {
  title: "Outreach: AI cold email that sounds like you wrote it",
  description: "Write one email. AI researches each lead, tailors the message and queues it on your schedule. You approve before anything goes out.",
  alternates: { canonical: "/product/outreach" },
};

const FAQ = [
  { q: "Will it send emails without my approval?", a: "No. Drafts are saved for your review, and you decide what goes out." },
  { q: "Can I control how many emails go out a day?", a: "Yes. Each campaign has a daily limit, a send time and the days it runs. Pause or resume it whenever you like." },
  { q: "Can I try an email before it reaches anyone?", a: "Yes. Send a test to yourself and see exactly what a lead would see." },
  { q: "Does it handle LinkedIn too?", a: "Yes. Plan and publish LinkedIn posts, videos and articles from the same place, with AI help." },
  { q: "Is Outreach free?", a: "Yes. Everything in Rhinon Tech except the AI website chatbot is free for your whole team." },
];

export default function OutreachPage() {
  return (
    <div className="bg-night text-white">
      {/* Hero: centred, with the composer doing its job underneath */}
      <section className="relative overflow-hidden pb-24 pt-14 sm:pt-20">
        <Aurora dark tones={["#7c5cff", "#e04dd6", "#2f5bff"]} />
        <div className="relative mx-auto max-w-[1240px] px-5 text-center">
          <Reveal>
            <Crumb slug="outreach" dark center />
            <h1 className="font-display mx-auto mt-6 max-w-[900px] text-balance text-[44px] font-semibold leading-[1] sm:text-[76px]">
              Cold email that sounds like <span className="text-aurora-soft">you wrote it.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-[620px] text-[18px] leading-8 text-white/65 sm:text-[20px]">
              Write one email. AI researches each lead, tailors the message and queues it on your schedule. You approve before anything goes out.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button href={links.signup} arrow>Get started free</Button>
              <Button href={links.call} variant="glass">Book a demo</Button>
            </div>
          </Reveal>
        </div>
        <div className="relative mt-16 px-5"><Reveal delay={150}><ComposerHero /></Reveal></div>
      </section>

      {/* Flow */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:py-32">
        <Reveal><SectionHead dark eyebrow="How it works" title={<>From research to reply, <span className="text-aurora-soft">all in one line.</span></>} sub="Every lead goes through the same careful path. The only step that needs you is the one that should." /></Reveal>
        <div className="mt-20"><FlowSection /></div>
      </section>

      {/* Schedule */}
      <section className="relative border-y border-white/10 bg-[#070d2b] py-24 sm:py-32">
        <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <Eyebrow dark>Your schedule</Eyebrow>
            <h2 className="font-display mt-5 text-balance text-[38px] font-semibold leading-[1.04] sm:text-[52px]">Set the days, the time and the <span className="text-aurora-soft">limit.</span></h2>
            <p className="mt-5 max-w-[460px] text-[17px] leading-8 text-white/65">Pick which days a campaign runs, what time it sends and how many emails go out a day. It keeps to the plan, and you can pause it whenever you like.</p>
          </Reveal>
          <Reveal delay={120}><ScheduleSection /></Reveal>
        </div>
      </section>

      {/* Engagement */}
      <section className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 py-24 sm:py-32 lg:grid-cols-[1.05fr_0.95fr]">
        <Reveal className="order-2 lg:order-1"><FeedSection /></Reveal>
        <Reveal delay={120} className="order-1 lg:order-2">
          <Eyebrow dark>Engagement</Eyebrow>
          <h2 className="font-display mt-5 text-balance text-[38px] font-semibold leading-[1.04] sm:text-[52px]">See who opened, who visited and who <span className="text-aurora-soft">replied.</span></h2>
          <p className="mt-5 max-w-[460px] text-[17px] leading-8 text-white/65">Opens and replies show up on the lead as they happen. Bounces and unsubscribes are marked automatically, so you never email someone who asked you to stop.</p>
        </Reveal>
      </section>

      {/* Memory */}
      <section className="relative border-y border-white/10 bg-[#070d2b] py-24 sm:py-32">
        <div className="mx-auto max-w-[1240px] px-5">
          <Reveal><SectionHead dark eyebrow="Rhinon AI" title={<>A sales agent with a <span className="text-aurora-soft">memory.</span></>} sub="Teach it who you sell to and how you sound. It uses that on every draft, and writes the next email based on what has already happened with each lead." /></Reveal>
          <div className="mt-16"><MemorySection /></div>
        </div>
      </section>

      {/* LinkedIn */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:py-32">
        <Reveal><SectionHead dark eyebrow="Beyond email" title={<>Plan LinkedIn from the <span className="text-aurora-soft">same place.</span></>} sub="Posts, videos and articles, drafted with AI help and published through LinkedIn when you say so." /></Reveal>
        <div className="mt-14"><LinkedInSection /></div>
      </section>

      <PairsWith dark items={[
        { slug: "crm", line: "Every send and reply updates the lead." },
        { slug: "inbox", line: "Replies come back to your shared inbox." },
        { slug: "chatbot", line: "Warm up leads that visit your site." },
      ]} />
      <ProductFaq dark title="Outreach questions, answered." items={FAQ} />
      <CtaBand tone={p.tone} title={<>Write one email. <span className="text-aurora-soft">Reach everyone.</span></>} sub="Set up your first campaign in a few minutes. No credit card, no time limit." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "See all products", href: "/product" }} />
      <div className="h-24" />
    </div>
  );
}
