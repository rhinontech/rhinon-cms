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
    question: "What information should I enter?",
    answer: "Include who the email is for, why you are writing, one relevant detail, and the next step you want. The text is sent to Google's Gemini model to generate the draft, so avoid confidential or sensitive information.",
  },
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
