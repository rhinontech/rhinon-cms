import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmailWriterForm } from "@/components/forms/EmailWriterForm";
import { Aurora, Eyebrow, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { pageMeta } from "@/components/site";
import { JsonLd, breadcrumbNode, faqNode, graphJsonLd } from "@/components/schema";

export const metadata = pageMeta({
  title: "Free AI Email Writer",
  description: "Write a tailored cold email, follow-up or meeting request with AI. Choose the purpose and tone, then review and copy your draft.",
  path: "/tools/ai-email-writer",
});

const FAQ = [
  {
    question: "Is the AI email writer free?",
    answer: "Yes. You can create up to three drafts a day without signing up.",
  },
  {
    question: "Will it send the email for me?",
    answer: "No. It creates a draft for you to review and copy. Rhinon Outreach helps you send approved emails as a sequence.",
  },
  {
    question: "How long should a cold email be?",
    answer: "Short enough to read on a phone without scrolling: a few sentences that cover their situation, your reason for writing and one ask.",
  },
  {
    question: "How many follow-ups should I send?",
    answer: "Two or three, a few days apart, each adding something new. Stop if they ask you to.",
  },
  {
    question: "What information should I enter?",
    answer: "Include who the email is for, why you are writing, one relevant detail, and the next step you want. The text is sent to Google's Gemini model to generate the draft, so avoid confidential or sensitive information.",
  },
];

/** Worked examples. Names and companies are made up; the structure is what to copy. */
const EXAMPLES = [
  {
    who: "An agency writing to a D2C brand",
    subject: "Your new product pages",
    body: "Hi Meera,\n\nI saw Lotus & Leaf launched three new product pages last week. The photography is lovely, but the pages take a while to load on mobile, which is where most D2C shoppers buy.\n\nWe rebuilt product pages for two skincare brands this year with the same goal. Would a 15-minute call next week be useful to see what we changed?\n\nThanks,\nArjun",
  },
  {
    who: "An IT services firm writing to an operations head",
    subject: "Spreadsheet approvals at Northline",
    body: "Hi Daniel,\n\nYour job post for an operations analyst mentions managing approvals across several spreadsheets. We build small internal tools that replace exactly that kind of workflow, usually in four to six weeks.\n\nIf it would help, I can send a one-page outline of how we would approach it. Worth a look?\n\nBest,\nPriya",
  },
  {
    who: "A consultant following up after an event",
    subject: "Following up from the founders' meetup",
    body: "Hi Sana,\n\nGood to meet you at Thursday's meetup. You mentioned hiring your first sales lead next quarter. I have helped three founders write the first sales playbook before that hire starts.\n\nHappy to share the outline I use, no strings attached. Shall I send it over?\n\nRegards,\nKaran",
  },
];

const MISTAKES = [
  ["Writing about yourself first", "Open with their situation. Your company belongs in one sentence, after the reason you are writing."],
  ["Inventing a connection", "Never claim a referral, a result or a mutual contact you do not have. It ends the conversation when they check."],
  ["Asking for too much", "A 45-minute demo is a big ask from a stranger. A reply, a short call or permission to send something is easier to say yes to."],
  ["Following up with \"just checking in\"", "Each follow-up should add something: a useful link, a short example or a simpler ask."],
  ["Sending without reading", "AI drafts can be confidently wrong about a detail. Read every draft before it goes out."],
];

export default function AiEmailWriterPage() {
  return (
    <>
      <section className="relative overflow-hidden px-5 pb-20 pt-14 sm:pt-20">
        <Aurora />
        <div className="relative mx-auto max-w-[1100px]">
          <Reveal>
            <Eyebrow>Free writing tool</Eyebrow>
            <h1 className="font-display mt-3 text-balance text-[40px] font-semibold leading-[1.04] sm:text-[60px]">Free AI Email Writer</h1>
            <p className="mt-4 max-w-[720px] text-[16px] leading-7 text-ink-soft sm:text-[18px]">
              Write a first outreach email, a follow-up, a reply or a meeting request. Set the tone, add your context and review the draft before copying it.
            </p>
            <p className="mt-3 text-[13px] text-muted">Three drafts a day · No account needed · You decide what gets sent</p>
          </Reveal>
          <div className="mt-10"><EmailWriterForm /></div>
        </div>
      </section>

      <section className="border-y border-line bg-white px-5 py-20 sm:py-24">
        <div className="mx-auto grid max-w-[1100px] gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <SectionHead
              eyebrow="A better first draft"
              title="How to write a useful cold email"
              sub="AI can help shape the words. A clear reason for writing is what makes the message relevant."
            />
          </Reveal>
          <div className="space-y-5">
            {[
              ["Start with the recipient", "Name their role or situation so the draft has a clear audience."],
              ["Give one real reason", "Share a specific, accurate detail about why you are getting in touch. Never invent a connection or result."],
              ["Make one small ask", "Ask for one next step, such as a short call or a reply. Keep the rest of the message focused."],
            ].map(([title, description], index) => (
              <Reveal key={title} delay={index * 70}>
                <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">0{index + 1}</p>
                  <h2 className="font-display mt-2 text-[20px] font-semibold">{title}</h2>
                  <p className="mt-2 text-[14.5px] leading-7 text-ink-soft">{description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-soft/60 px-5 py-20 sm:py-24">
        <div className="mx-auto max-w-[1100px]">
          <Reveal><SectionHead eyebrow="Examples" title="Three cold emails, by kind of business" sub="Names and companies are made up. Notice the shape: their situation, one real reason, one small ask." /></Reveal>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {EXAMPLES.map((e, i) => (
              <Reveal key={e.who} delay={i * 80}>
                <div className="h-full rounded-2xl border border-line bg-white p-6">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">{e.who}</p>
                  <p className="mt-4 text-[14px]"><span className="text-muted">Subject:</span> <span className="font-semibold">{e.subject}</span></p>
                  <p className="mt-4 whitespace-pre-line text-[14.5px] leading-7 text-ink-soft">{e.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:py-24">
        <div className="mx-auto grid max-w-[1100px] gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionHead eyebrow="Subject lines" title="Short, specific and about them" />
            <ul className="mt-8 space-y-3 text-[15.5px] leading-7 text-ink-soft">
              <li>Keep it to a few words that could only be about this person, such as their product, a role they are hiring or an event you both attended.</li>
              <li>Skip clickbait and false urgency. &ldquo;Quick question&rdquo; tells them nothing.</li>
              <li>Write it last, once you know what the email is actually about.</li>
            </ul>
            <h3 className="font-display mt-12 text-[24px] font-semibold">Following up</h3>
            <p className="mt-4 text-[15.5px] leading-7 text-ink-soft">Busy people often reply to a follow-up rather than the first email. Space follow-ups a few days apart, make each one shorter than the last, and stop after two or three. If someone asks you to stop, stop.</p>
          </Reveal>
          <Reveal delay={120}>
            <SectionHead eyebrow="Mistakes" title="Five things that get emails ignored" />
            <ol className="mt-8 space-y-4">
              {MISTAKES.map(([t, b], i) => (
                <li key={t} className="flex gap-4"><span className="font-display flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-white">{i + 1}</span><span><span className="block font-semibold">{t}</span><span className="mt-1 block text-[15px] leading-7 text-ink-soft">{b}</span></span></li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-line px-5 py-20 sm:py-24">
        <div className="mx-auto max-w-[1100px]">
          <Reveal><SectionHead eyebrow="From one email to a sequence" title="When you are writing to more than a few people" sub="Rhinon Outreach does what this tool does for every lead in a list: it researches each one, drafts a personal email and waits for your approval. Then it follows up on a schedule with waits, if/then branches and A/B splits." /></Reveal>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/product/outreach" className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[14.5px] font-semibold text-white">See Rhinon Outreach <ArrowRight className="h-4 w-4" /></Link>
            <span className="self-center text-[14px] text-muted">Free for up to 5 people, with 50 emails and 20 AI drafts a day.</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-5 py-20 sm:py-24">
        <Reveal>
          <SectionHead eyebrow="Email writer FAQs" title="A few things to know" />
        </Reveal>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {FAQ.map(({ question, answer }) => (
            <details key={question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold marker:hidden">
                {question}
                <span aria-hidden className="text-muted transition-transform group-open:rotate-90">›</span>
              </summary>
              <p className="mt-3 max-w-[760px] text-[14.5px] leading-7 text-ink-soft">{answer}</p>
            </details>
          ))}
        </div>
        <Link href="/product/outreach" className="mt-8 inline-flex items-center gap-2 text-[14px] font-semibold text-violet hover:underline">
          Explore Rhinon Outreach <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
      <JsonLd data={graphJsonLd([breadcrumbNode([{ name: "Home", path: "/" }, { name: "AI email writer", path: "/tools/ai-email-writer" }]), faqNode(FAQ.map((f) => ({ q: f.question, a: f.answer })))])} />
    </>
  );
}
