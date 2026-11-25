import { Check, X } from "lucide-react";
import { Aurora, Button, IconTile, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { CtaBand } from "@/components/blocks";
import { links, pageMeta } from "@/components/site";
import { bySlug } from "@/content/products";
import { Crumb, PairsWith, ProductFaq } from "@/components/product/shared";
import { AddressSection, InboxZeroHero } from "@/components/product/inbox";

const p = bySlug("inbox")!;

export const metadata = pageMeta({
  title: "Team Email Inbox Next to Your CRM",
  description: "Team email next to your CRM: send and reply from shared addresses like support@, keep internal notes on threads and see bounces. Free for up to 5 people.",
  path: "/product/inbox",
  hasOgImage: true,
});

// Claims here must match the live Inbox (launch review G2.3): per-address mailboxes, shared
// addresses handed to one person at a time, internal notes, folders, bounces. No thread assignment yet.
const BEFORE = [
  "Client email scattered across personal accounts",
  "A support address tied to one person's login",
  "Forwarding a thread just to ask a colleague",
  "Bounced emails nobody notices",
  "Email in one tool, the client's deal in another",
];
const AFTER = [
  "Team email in the same workspace as your CRM",
  "support@ handed to a teammate, with its history",
  "Internal notes your team sees and the client doesn't",
  "Bounces collected in one list",
  "Folders and attachments, like any mailbox",
];

const FAQ = [
  { q: "Who can see what?", a: "Each person sees their own address and any shared addresses assigned to them. Roles decide who can read and who can send." },
  { q: "Can a teammate take over an address like support@?", a: "Yes. A shared address belongs to one person at a time; hand it to someone else and its whole history moves with it. Assigning single threads to different people isn't available yet." },
  { q: "Which address do I send from?", a: "Your workspace address, or your own domain once you connect it in Settings." },
  { q: "Is the inbox free?", a: "Yes. Everything in Rhinon Tech except the AI Agent is free for up to 5 people." },
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
              Your team's email, <span className="italic">next to your CRM.</span>
            </h1>
            <p className="mt-6 max-w-[500px] text-[18px] leading-8 text-ink-soft">
              Send and reply from your team's addresses, keep internal notes on every thread, and hand an address like support@ to whoever looks after it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href={links.signup}>Get started free</Button>
              <Button href={links.call} variant="soft">Book a demo</Button>
            </div>
          </Reveal>
          <Reveal delay={140}><InboxZeroHero /></Reveal>
        </div>
      </section>

      {/* Before and after */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:py-28">
        <Reveal><SectionHead eyebrow="Why team email" title={<>Stop losing client mail in <span className="italic">someone's mailbox.</span></>} /></Reveal>
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

      {/* Address */}
      <section className="border-t border-line py-24 sm:py-28">
        <div className="mx-auto max-w-[1240px] px-5">
          <Reveal><SectionHead eyebrow="Shared addresses" title={<>One address, <span className="italic">handed to the right person.</span></>} sub="Create support@ or hello@ and give it to whoever handles it. Hand it to someone else later and the whole history goes with it." /></Reveal>
          <div className="mt-14"><AddressSection /></div>
        </div>
      </section>

      <PairsWith items={[
        { slug: "outreach", line: "Send campaigns from the same addresses." },
        { slug: "crm", line: "Link a conversation to its lead." },
        { slug: "ai-agent", line: "Website chats and tickets live next door." },
      ]} />
      <ProductFaq slug="inbox" title="Inbox questions, answered." items={FAQ} />
      <CtaBand tone={p.tone} title={<>Keep client email <span className="text-aurora-soft">with the client.</span></>} sub="Set up your workspace in a few minutes and invite up to 5 people free. No credit card, no time limit." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "See all products", href: "/product" }} />
    </div>
  );
}
