import type { Metadata } from "next";
import { Check } from "lucide-react";
import { links } from "@/components/site";
import { Button } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { ProductFaq } from "@/components/product/shared";
import { Orbit, SkillRows, TaskFeed, UseCases, type UseCase } from "@/components/ai/sections";

export const metadata: Metadata = {
  title: "Rhinon AI",
  description: "AI built into your CRM, outreach, chatbot and HR. It researches, drafts, answers and rewrites, and you approve before anything goes out.",
  alternates: { canonical: "/ai" },
};

const MONO = "font-mono text-[11px] uppercase tracking-[0.2em]";

const CASES: UseCase[] = [
  { tab: "Research every lead", line: "It reads their site and the web, then saves what matters.", label: "Researching Lumen Foods", text: "Lumen Foods is a regional grocery chain that opened two stores in Pune this quarter. Likely pain: stock reporting across a growing number of locations." },
  { tab: "A sales agent with memory", line: "Teach it who you sell to and how you sound.", label: "Drafting for Priya Nair", text: "Hi Priya, congrats on the two new Pune stores. Most ops heads I talk to are buried in stock reports at that stage. Worth 15 minutes to see how we cut that down to one dashboard?" },
  { tab: "A website assistant", line: "Answers from your own site and documents.", label: "Replying to a website visitor", text: "Yes, every new customer gets a guided setup and a call with our team. Would you like me to connect you with Ana now?" },
  { tab: "Rewrite any sentence", line: "Offer letters and NDAs, without leaving the editor.", label: "Offer letter · warmer tone", text: "We are delighted to offer you the role of Product Designer, and we cannot wait to welcome you to the team on 1 December." },
];

const PILLARS = [
  { n: "01", t: "Research", rows: [["Lead research", "Reads a lead's website and the web, saves the findings on the lead"], ["Recent news", "Pulls what changed at the company lately"], ["Likely pain", "Names the problem you are most likely to solve"], ["Shared", "Everyone on the team sees the same notes"]] },
  { n: "02", t: "Outreach", rows: [["Sales memory", "Your ideal customer and your voice, in one place you edit"], ["Next email", "Drafted from what has already happened with that lead"], ["Follow-ups", "Based on opens, replies and history"], ["Approval", "Every draft waits for your review"]] },
  { n: "03", t: "Chatbot", rows: [["Your content", "Trained on your site and documents"], ["Any hour", "Answers visitors while you are away"], ["Lead capture", "Saves details straight into the CRM"], ["Live handover", "Brings in a person when one is needed"]] },
  { n: "04", t: "People", rows: [["Rewrite", "Select a sentence in a letter and ask for a new version"], ["Templates", "Reusable offer letter and NDA blocks"], ["Tone", "Warmer, shorter or more formal"], ["Your call", "You choose what to keep"]] },
];

const CONTROL = [
  ["You approve first", "Outreach drafts are saved for your review. Nothing is sent without you."],
  ["Grounded in your content", "The chatbot answers from your own site and documents, not from guesses."],
  ["You set the rules", "Edit the sales memory that guides every draft: who you sell to and how you sound."],
];

const FAQ = [
  { q: "Does Rhinon AI send emails on its own?", a: "No. Outreach drafts are saved for your review, and nothing goes out until you approve it." },
  { q: "What does the website chatbot answer from?", a: "Your own website and documents. You train it on them, and it hands the chat to a person when one is needed." },
  { q: "Is it free?", a: "The AI in the CRM, outreach and HR is part of the free workspace. Only the AI website chatbot is a paid plan." },
  { q: "Which AI model does it use?", a: "Rhinon AI runs on Google's Gemini models." },
];

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`relative px-5 py-24 sm:py-32 ${className}`}><div className="mx-auto max-w-[1240px]">{children}</div></section>;
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-[36px] font-semibold leading-[1.04] text-white sm:text-[60px]">{children}</h2>;
}

export default function AiPage() {
  return (
    <div className="bg-[#030306] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-10 pt-16 sm:pt-24">
        <div className="ai-grid pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute left-1/2 top-[38%] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[#5b4bff]/20 blur-[140px]" />
        <div className="relative mx-auto max-w-[1240px] text-center">
          <Reveal>
            <span className="ai-badge inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[14px] font-medium">All new <b className="font-semibold">Rhinon AI</b></span>
            <h1 className="font-display mx-auto mt-8 max-w-[1000px] text-[46px] font-semibold leading-[1.02] sm:text-[88px]">
              AI that already knows<br />your <em className="font-semibold">company.</em>
            </h1>
            <ul className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[16px] text-white/65 sm:text-[18px]">
              {["Works inside your CRM, inbox and chat", "It drafts, you approve", "Grounded in your own content"].map((t) => (
                <li key={t} className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#7cf0a8]" strokeWidth={3} />{t}</li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button href={links.signup} variant="primary">Try Rhinon AI free</Button>
              <Button href={links.call} variant="glass">Book a demo</Button>
            </div>
            <p className="mt-4 text-[13.5px] text-white/40">No credit card required.</p>
            <p className={`${MONO} mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-white/50`}>
              {["CRM", "Outreach", "Inbox", "Chatbot", "HR"].map((m) => <span key={m}>{m}</span>)}
            </p>
          </Reveal>
          <Orbit />
        </div>
      </section>

      {/* Pillars */}
      <Section>
        <Reveal>
          <p className={`${MONO} text-white/45`}>Built into every module</p>
          <H2>One AI, working where<br className="hidden sm:block" /> your team already works.</H2>
        </Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p, i) => (
            <Reveal key={p.n} delay={i * 80}>
              <div className="ai-card h-full rounded-2xl p-6">
                <p className={`${MONO} flex items-center gap-2 text-white/55`}><span className="rounded border border-white/15 px-1.5 py-0.5 text-white/40">{p.n}</span>{p.t}</p>
                <ul className="mt-5 space-y-5 border-t border-white/10 pt-5">
                  {p.rows.map(([a, b]) => (
                    <li key={a}>
                      <p className="flex items-center gap-2 text-[15px] font-medium text-white"><i className="h-1.5 w-1.5 rounded-full bg-[#8b7cff]" />{a}</p>
                      <p className="mt-1 pl-3.5 text-[13.5px] leading-6 text-white/50">{b}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Use cases */}
      <Section className="border-t border-white/[0.06]">
        <Reveal>
          <p className={`${MONO} text-white/45`}>See it work</p>
          <H2>It already knows what<br className="hidden sm:block" /> to do. Watch.</H2>
          <p className="mt-5 max-w-[620px] text-[18px] leading-8 text-white/55">Pick a job. Rhinon AI writes the first version from what it knows about your leads, your site and your voice.</p>
        </Reveal>
        <div className="mt-14"><UseCases items={CASES} /></div>
      </Section>

      {/* Skills + feed */}
      <Section className="overflow-hidden border-t border-white/[0.06]">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1fr]">
          <Reveal>
            <p className={`${MONO} text-white/45`}>Always working</p>
            <H2>The boring first draft is done before you ask.</H2>
            <p className="mt-5 max-w-[520px] text-[18px] leading-8 text-white/55">Research, replies, rewrites and summaries happen in the background. You open the app to review, not to start from blank.</p>
          </Reveal>
          <Reveal delay={120}><TaskFeed /></Reveal>
        </div>
        <div className="mt-20"><SkillRows /></div>
      </Section>

      {/* Control */}
      <Section className="border-t border-white/[0.06]">
        <Reveal><p className={`${MONO} text-white/45`}>In your control</p><H2>AI proposes. You decide.</H2></Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {CONTROL.map(([t, b], i) => (
            <Reveal key={t} delay={i * 90}>
              <div className="ai-card h-full rounded-2xl p-7">
                <span className={`${MONO} text-[#8b7cff]`}>0{i + 1}</span>
                <p className="font-display mt-5 text-[24px] font-semibold">{t}</p>
                <p className="mt-2 text-[15.5px] leading-7 text-white/55">{b}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <ProductFaq title="Questions about Rhinon AI" items={FAQ} dark />

      {/* Final CTA */}
      <section className="relative overflow-hidden px-5 py-28 text-center sm:py-40">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5b4bff]/25 blur-[130px]" />
        <Reveal className="relative">
          <h2 className="font-display mx-auto max-w-[900px] text-[40px] font-semibold leading-[1.02] sm:text-[76px]">The best AI is the one that knows your work.</h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button href={links.signup}>Get started free</Button>
            <Button href={links.call} variant="glass">Book a demo</Button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
