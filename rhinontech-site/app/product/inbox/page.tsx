import type { Metadata } from "next";
import { Check, X } from "lucide-react";
import { Aurora, Button, Eyebrow, IconTile, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { CtaBand } from "@/components/blocks";
import { links } from "@/components/site";
import { bySlug } from "@/content/products";
import { Crumb, PairsWith, ProductFaq } from "@/components/product/shared";
import { AddressSection, InboxZeroHero, PrioritySection, RiverSection, ThreadSection } from "@/components/product/inbox";

const p = bySlug("inbox")!;

export const metadata: Metadata = {
  title: "Inbox: one shared inbox for your whole team",
  description: "Replies to your campaigns and mail to your support address land in one shared inbox, threaded, assigned and tracked until it is done.",
  alternates: { canonical: "/product/inbox" },
};

const BEFORE = [
  "Replies buried in one person's mailbox",
  "Nobody sure who already answered",
  "Threads forwarded back and forth",
  "Urgent mail waiting for someone to notice",
  "Customers writing to a person who is away",
];
const AFTER = [
  "Every conversation in one shared inbox",
  "A clear owner on every thread",
  "Replies, assignments and status on one page",
  "Priority puts urgent mail at the top",
  "A company address, not one person's",
];

const FAQ = [
  { q: "Who can see the inbox?", a: "Whoever your roles allow. You choose who can read, reply and assign conversations." },
  { q: "Where do the replies to my campaigns go?", a: "Into the inbox. Replies to Outreach campaigns arrive inside the platform, next to the lead they belong to." },
  { q: "What address do customers write to?", a: "Every workspace gets its own company address, so customers write to your team and not to one person's mailbox." },
  { q: "Is the inbox free?", a: "Yes. Everything in Rhinon Tech except the AI website chatbot is free for your whole team." },
];

export default function InboxPage() {
  return (
    <div className="bg-white">
      {/* Hero: copy left, an inbox clearing itself right */}
      <section className="relative pb-24 pt-12 sm:pt-16">
        <Aurora tones={["#2cd3ff", "#2f5bff", "#7c5cff"]} />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-14 px-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <Crumb slug="inbox" />
            <div className="mt-6"><IconTile icon={p.icon} tone={p.tone} size={56} /></div>
            <h1 className="font-display mt-6 text-balance text-[42px] font-semibold leading-[1.02] sm:text-[60px]">
              One inbox for your <span className="italic">whole team.</span>
            </h1>
            <p className="mt-6 max-w-[500px] text-[18px] leading-8 text-ink-soft">
              Replies to your campaigns and mail to your support address land in one shared inbox, threaded, assigned and tracked until it is done.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href={links.signup} arrow>Get started free</Button>
              <Button href={links.call} variant="ghost">Book a demo</Button>
            </div>
          </Reveal>
          <Reveal delay={140}><InboxZeroHero /></Reveal>
        </div>
      </section>

      {/* Before and after */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:py-28">
        <Reveal><SectionHead eyebrow="Why a shared inbox" title={<>Stop losing mail in <span className="italic">someone's mailbox.</span></>} /></Reveal>
        <div className="mt-16 grid gap-5 md:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-[28px] border border-line bg-white/60 p-7 sm:p-9">
              <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-muted">Before</p>
              <div className="mt-6 space-y-4">
                {BEFORE.map((t, i) => (
                  <Reveal key={t} delay={i * 80}><p className="flex items-start gap-3 text-[16px] text-muted"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-500"><X className="h-3.5 w-3.5" strokeWidth={3} /></span><span className="line-through decoration-rose-300">{t}</span></p></Reveal>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="h-full rounded-[28px] border border-sky-200 bg-white p-7 shadow-[0_40px_80px_-40px_rgb(47_91_255_/_0.45)] sm:p-9">
              <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-electric">With Rhinon Inbox</p>
              <div className="mt-6 space-y-4">
                {AFTER.map((t, i) => (
                  <Reveal key={t} delay={200 + i * 90}><p className="flex items-start gap-3 text-[16px] font-medium"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan to-electric text-white"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>{t}</p></Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Status */}
      <section className="border-y border-line bg-soft/60 py-24 sm:py-28">
        <div className="mx-auto max-w-[1240px] px-5">
          <Reveal><SectionHead eyebrow="Every conversation has a status" title={<>From open to closed, <span className="italic">nothing stalls.</span></>} sub="Open, in progress, resolved, closed. Everyone sees where each thread stands." /></Reveal>
          <div className="mt-14"><RiverSection /></div>
        </div>
      </section>

      {/* Priority */}
      <section className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 py-24 sm:py-28 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal>
          <Eyebrow>Priority</Eyebrow>
          <h2 className="font-display mt-5 text-balance text-[38px] font-semibold leading-[1.04] sm:text-[52px]">Urgent mail <span className="italic">jumps the queue.</span></h2>
          <p className="mt-5 max-w-[460px] text-[17px] leading-8 text-ink-soft">Mark a conversation from low to urgent, and the inbox sorts itself. Assign it to a teammate and they see it right away.</p>
        </Reveal>
        <Reveal delay={120}><PrioritySection /></Reveal>
      </section>

      {/* Address */}
      <section className="border-y border-line bg-soft/60 py-24 sm:py-28">
        <div className="mx-auto max-w-[1240px] px-5">
          <Reveal><SectionHead eyebrow="Your address" title={<>Customers write to <span className="italic">your team.</span></>} sub="Every workspace gets its own company address. Whatever lands there reaches the people who should see it." /></Reveal>
          <div className="mt-14"><AddressSection /></div>
        </div>
      </section>

      {/* Replies stay with the lead */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:py-28">
        <Reveal><SectionHead eyebrow="Connected" title={<>Replies stay with <span className="italic">the lead.</span></>} sub="When someone answers a campaign, the reply lands in the inbox and the lead updates itself." /></Reveal>
        <div className="mt-14"><ThreadSection /></div>
      </section>

      <PairsWith items={[
        { slug: "outreach", line: "Replies to your campaigns arrive here." },
        { slug: "crm", line: "Link a conversation to its lead." },
        { slug: "chatbot", line: "Chat tickets and email in one view of support." },
      ]} />
      <ProductFaq title="Inbox questions, answered." items={FAQ} />
      <CtaBand tone={p.tone} title={<>Get to <span className="text-aurora-soft">inbox zero.</span></>} sub="Set up your shared inbox in a few minutes and bring your whole team. No credit card, no time limit." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "See all products", href: "/product" }} />
    </div>
  );
}
