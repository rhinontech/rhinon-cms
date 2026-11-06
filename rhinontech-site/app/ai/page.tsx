import type { Metadata } from "next";
import { Check, FileText, Eye, Sparkles, SlidersHorizontal } from "lucide-react";
import { links } from "@/components/site";
import { bySlug } from "@/content/products";
import { Aurora, Button, Eyebrow, IconTile, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { Spot } from "@/components/Spot";
import { Typewriter } from "@/components/Typewriter";
import { CtaBand } from "@/components/blocks";

export const metadata: Metadata = {
  title: "Rhinon AI",
  description: "AI built into your CRM, outreach, chatbot and HR. It researches, drafts, answers and rewrites, and you approve before anything goes out.",
  alternates: { canonical: "/ai" },
};

const USES = [
  {
    slug: "crm",
    title: "Research every lead before you reach out.",
    body: "Rhinon AI reads a lead's website and the web, then saves a short description, recent news and the likely pain point right on the lead.",
    label: "Researching Lumen Foods",
    text: "Lumen Foods is a regional grocery chain that opened two stores in Pune this quarter. Likely pain: stock reporting across a growing number of locations.",
    points: ["Company description and recent news", "Likely pain point", "Saved on the lead for your whole team"],
  },
  {
    slug: "outreach",
    title: "A sales agent that remembers how you sell.",
    body: "Teach it your ideal customer and your voice. It drafts the next email for each lead based on what has already happened, and waits for your approval.",
    label: "Drafting for Priya Nair",
    text: "Hi Priya, congrats on the two new Pune stores. Most ops heads I talk to are buried in stock reports at that stage. Worth 15 minutes to see how we cut that down to one dashboard?",
    points: ["Short, direct emails", "Follows up based on lead history", "Every draft waits for your review"],
  },
  {
    slug: "chatbot",
    title: "A website assistant that answers from your content.",
    body: "Train it on your site and documents. It answers visitors at any hour, saves their details as leads, and brings in your team when a person is needed.",
    label: "Replying to a website visitor",
    text: "Yes, every new customer gets a guided setup and a call with our team. Would you like me to connect you with Ana now?",
    points: ["Trained on your site and documents", "Live handover to your team", "Leads saved to the CRM"],
  },
  {
    slug: "hr",
    title: "Rewrite any sentence in a letter.",
    body: "Select a sentence in an offer letter or NDA template and ask AI to rewrite it. Make it warmer, shorter or more formal without leaving the editor.",
    label: "Offer letter · warmer tone",
    text: "We are delighted to offer you the role of Product Designer, and we cannot wait to welcome you to the team on 1 December.",
    points: ["Works on any selected sentence", "Reusable letter templates", "You choose what to keep"],
  },
] as const;

const CONTROL = [
  { icon: Eye, title: "You approve first", body: "Outreach drafts are saved for your review. Nothing is sent without you." },
  { icon: FileText, title: "Grounded in your content", body: "The chatbot answers from your own site and documents, not from guesses." },
  { icon: SlidersHorizontal, title: "You set the rules", body: "Edit the sales memory that guides every draft: who you sell to and how you sound." },
];

export default function AiPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-night pb-28 pt-20 text-white sm:pt-28">
        <Aurora dark />
        <div className="relative mx-auto max-w-[1240px] px-5 text-center">
          <Reveal>
            <Eyebrow dark>Rhinon AI</Eyebrow>
            <h1 className="font-display mx-auto mt-7 max-w-[940px] text-[46px] font-semibold leading-[0.98] sm:text-[84px]">
              AI that works <span className="text-aurora-soft">where you work.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-[640px] text-[18px] leading-8 text-white/65 sm:text-[20px]">
              Rhinon AI is built into your CRM, outreach, chatbot and HR. It does the first draft and the boring research, and you make the call.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button href={links.signup} arrow>Get started free</Button>
              <Button href={links.call} variant="glass">Book a demo</Button>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] space-y-28 px-5 py-28 sm:space-y-40 sm:py-36">
        {USES.map((u, i) => {
          const p = bySlug(u.slug)!;
          return (
            <div key={u.slug} className={`grid items-center gap-12 lg:grid-cols-2 lg:gap-20 ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
              <Reveal>
                <IconTile icon={p.icon} tone={p.tone} size={52} />
                <h2 className="font-display mt-6 text-[34px] font-semibold leading-[1.06] sm:text-[46px]">{u.title}</h2>
                <p className="mt-5 text-[17px] leading-8 text-ink-soft">{u.body}</p>
                <ul className="mt-7 space-y-3">
                  {u.points.map((t) => (
                    <li key={t} className="flex items-center gap-3 text-[16px]"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white" style={{ background: p.tone[0] }}><Check className="h-3 w-3" strokeWidth={3} /></span>{t}</li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={120}>
                <div className="noise relative overflow-hidden rounded-[32px] bg-night p-6 text-white sm:p-8">
                  <Aurora dark tones={[p.tone[0], p.tone[1], "#ff5fb0"]} />
                  <div className="relative rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur">
                    <p className="mb-3 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[#b9a6ff]"><Sparkles className="h-3.5 w-3.5" />{u.label}</p>
                    <Typewriter text={u.text} speed={22} className="min-h-[130px] text-[16px] leading-7 text-white/90" />
                  </div>
                </div>
              </Reveal>
            </div>
          );
        })}
      </section>

      <section className="border-y border-line bg-soft/60 py-24 sm:py-28">
        <div className="mx-auto max-w-[1240px] px-5">
          <Reveal><SectionHead eyebrow="In your control" title={<>AI proposes. <span className="text-aurora">You decide.</span></>} /></Reveal>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {CONTROL.map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 100}>
                <Spot className="h-full p-7">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet/10 text-violet"><Icon className="h-5 w-5" /></span>
                  <p className="font-display mt-5 text-[22px] font-semibold">{title}</p>
                  <p className="mt-2 text-[15.5px] leading-7 text-ink-soft">{body}</p>
                </Spot>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand title={<>Put AI to work, <span className="text-aurora-soft">free.</span></>} sub="The AI in the CRM, outreach and HR is part of the free workspace." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "See all products", href: "/product" }} />
    </>
  );
}
