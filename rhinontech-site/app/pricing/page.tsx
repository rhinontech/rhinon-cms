import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { links } from "@/components/site";
import { PRODUCTS } from "@/content/products";
import { CHATBOT_FEATURES, FREE_FEATURES } from "@/content/plans";
import { Aurora, Button, IconTile, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { Spot } from "@/components/Spot";
import { CtaBand, Faq, faqJsonLd } from "@/components/blocks";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Rhinon Tech is free for your whole team, with no time limit. Only the AI website chatbot is a paid product.",
  alternates: { canonical: "/pricing" },
};

const FAQ = [
  { q: "Is Rhinon Tech really free?", a: "Yes. Every product except the AI website chatbot is free for your whole team, with no time limit and no credit card." },
  { q: "What does the chatbot cost?", a: "It depends on your site and what you need, so we talk first. Book a call and we will give you a clear price." },
  { q: "Can I use the free products without the chatbot?", a: "Yes. The chatbot is an add-on. The CRM, outreach, inbox, projects, chat, HR and payroll work on their own." },
  { q: "Who builds Rhinon Tech?", a: "Rhinon Labs. We build custom CRMs, AI automation and dashboards for growing companies, and we run our own business on Rhinon Tech." },
];

export default function PricingPage() {
  return (
    <>
      <section className="relative pb-24 pt-16 sm:pt-24">
        <Aurora />
        <div className="relative mx-auto max-w-[1240px] px-5">
          <Reveal><SectionHead eyebrow="Pricing" title={<>Free for everything. <span className="text-aurora">Pay only for the chatbot.</span></>} sub="No seats to count, no trial clock, no credit card. Start with the whole workspace and add the AI chatbot when you want it." /></Reveal>
          <div className="mx-auto mt-16 grid max-w-[960px] gap-5 md:grid-cols-2">
            <Reveal>
              <div className="spot h-full p-8">
                <p className="font-display text-[22px] font-semibold">Free</p>
                <p className="font-display mt-2 text-[60px] font-semibold leading-none">₹0</p>
                <p className="mt-2 text-[14px] text-muted">For your whole team, with no time limit.</p>
                <ul className="mt-7 space-y-3 text-[15px]">
                  {FREE_FEATURES.map((f) => <li key={f} className="flex gap-2.5"><Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-emerald-500" />{f}</li>)}
                </ul>
                <div className="mt-8"><Button href={links.signup} arrow>Get started free</Button></div>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="beam h-full rounded-[24px] bg-night p-8 text-white shadow-[0_40px_80px_-30px_rgb(80_60_220_/_0.55)]">
                <p className="font-display flex items-center gap-2 text-[22px] font-semibold">AI Chatbot <span className="rounded-full bg-pink/20 px-2 py-0.5 font-sans text-[11px] font-semibold uppercase tracking-wide text-pink">Premium</span></p>
                <p className="font-display text-aurora-soft mt-2 text-[48px] font-semibold leading-[1.15]">Talk to us</p>
                <p className="mt-2 text-[14px] text-white/55">Everything in Free, plus your AI website assistant.</p>
                <ul className="mt-7 space-y-3 text-[15px] text-white/85">
                  {CHATBOT_FEATURES.map((f) => <li key={f} className="flex gap-2.5"><Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#b9a6ff]" />{f}</li>)}
                </ul>
                <div className="mt-8"><Button href={links.call} variant="glass" arrow>Book a call</Button></div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-soft/60 py-24 sm:py-28">
        <div className="mx-auto max-w-[900px] px-5">
          <Reveal><SectionHead eyebrow="Compare" title="What is in each plan." /></Reveal>
          <Reveal delay={100}>
            <Spot className="mt-12 overflow-hidden !rounded-3xl">
              <div className="grid grid-cols-[1fr_90px_110px] items-center bg-soft px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted sm:grid-cols-[1fr_140px_160px]">
                <span>Product</span><span className="text-center">Free</span><span className="text-center">With chatbot</span>
              </div>
              {PRODUCTS.map((p) => (
                <div key={p.slug} className="grid grid-cols-[1fr_90px_110px] items-center border-t border-line px-5 py-3.5 sm:grid-cols-[1fr_140px_160px]">
                  <span className="flex items-center gap-3 text-[15px] font-medium"><IconTile icon={p.icon} tone={p.tone} size={32} />{p.name}</span>
                  <span className="flex justify-center">{p.premium ? <Minus className="h-4 w-4 text-muted" /> : <Check className="h-5 w-5 text-emerald-500" />}</span>
                  <span className="flex justify-center"><Check className="h-5 w-5 text-violet" /></span>
                </div>
              ))}
            </Spot>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-28 sm:py-32">
        <Reveal><SectionHead eyebrow="FAQ" title="Pricing questions, answered." /></Reveal>
        <div className="mt-14"><Faq items={FAQ} /></div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQ)) }} />
      </section>

      <CtaBand title={<>Start free. <span className="text-aurora-soft">Add AI when you are ready.</span></>} sub="Set up your workspace in a few minutes and bring your whole team." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "Book a call", href: links.call }} />
    </>
  );
}
