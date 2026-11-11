import { Check } from "lucide-react";
import { Aurora, Button, Eyebrow, IconTile, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { CtaBand } from "@/components/blocks";
import { links, pageMeta } from "@/components/site";
import { CHATBOT_FEATURES } from "@/content/plans";
import { bySlug } from "@/content/products";
import { Crumb, PairsWith, ProductFaq } from "@/components/product/shared";
import { HandoverSection, InstallSection, SiteHero, TicketSection, TrainSection, VoiceSection } from "@/components/product/chatbot";

const p = bySlug("chatbot")!;
const GRAD = "italic";

export const metadata = pageMeta({
  title: "AI Website Chatbot Trained on Your Content",
  description: "AI website chatbot software trained on your site and docs. Answer visitors day and night, capture CRM leads and hand over live.",
  path: "/product/chatbot",
  hasOgImage: true,
});

const FAQ = [
  { q: "How do I add it to my site?", a: "Paste one line of code before the closing body tag. The same snippet adds visitor analytics." },
  { q: "What does it answer from?", a: "Your website and the documents you upload. It answers from your own content, and says so when it does not know." },
  { q: "Can a person take over a conversation?", a: "Yes. Your team gets the live chat with its full history, and can call the visitor from the dashboard." },
  { q: "Where do the leads go?", a: "Details a visitor shares are saved straight to your CRM, so the follow-up starts with context." },
  { q: "Is the chatbot free?", a: "It is the one paid product in Rhinon Tech. Everything else is free. Talk to us and we will give you a clear price." },
];

export default function ChatbotPage() {
  return (
    <div className="bg-white">
      {/* Hero: a sunset gradient and a real-looking site */}
      <section className="relative pb-24 pt-12 sm:pt-16">
        <Aurora tones={["#ff8a4c", "#ff5fb0", "#ffb547"]} />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-14 px-5 lg:grid-cols-[0.92fr_1.08fr]">
          <Reveal>
            <Crumb slug="chatbot" />
            <div className="mt-6 flex items-center gap-3"><IconTile icon={p.icon} tone={p.tone} size={56} /><span className="rounded-full bg-pink/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-pink">Premium</span></div>
            <h1 className="font-display mt-6 text-balance text-[42px] font-semibold leading-[1.02] sm:text-[64px]">
              A chatbot that answers like <span className={GRAD}>your best salesperson.</span>
            </h1>
            <p className="mt-6 max-w-[520px] text-[18px] leading-8 text-ink-soft">
              Train it on your website and documents in minutes. It answers visitors day and night, saves their details to the CRM and hands over to your team in live chat or a voice call.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href={links.call}>Talk to us</Button>
              <Button href={links.signup} variant="soft">Start with the free modules</Button>
            </div>
            <p className="mt-5 text-[13.5px] text-muted">The AI chatbot is the one paid product. Everything else is free.</p>
          </Reveal>
          <Reveal delay={140}><SiteHero /></Reveal>
        </div>
      </section>

      {/* Train */}
      <section className="border-t border-line py-24 sm:py-32">
        <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <Eyebrow>Train it</Eyebrow>
            <h2 className="font-display mt-5 text-balance text-[38px] font-semibold leading-[1.04] sm:text-[52px]">Point it at your site. It <span className={GRAD}>learns the rest.</span></h2>
            <p className="mt-5 max-w-[460px] text-[17px] leading-8 text-ink-soft">Give it your website and upload your documents. It answers from your own content, so visitors get your answers and not guesses. You can be live in minutes.</p>
          </Reveal>
          <Reveal delay={120}><TrainSection /></Reveal>
        </div>
      </section>

      {/* Handover */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:py-32">
        <Reveal><SectionHead eyebrow="Live handover" title={<>A person steps in when <span className={GRAD}>it matters.</span></>} sub="The bot handles the easy questions. When a visitor wants a human, your team takes over in the same conversation, with everything that was said." /></Reveal>
        <div className="mt-14"><HandoverSection /></div>
      </section>

      {/* Voice */}
      <section className="relative overflow-hidden bg-[#0b0b14] py-24 text-white sm:py-32">
        <Aurora dark tones={["#ff8a4c", "#ff5fb0", "#7c5cff"]} />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 lg:grid-cols-[1fr_0.9fr]">
          <Reveal>
            <Eyebrow dark>Voice calls</Eyebrow>
            <h2 className="font-display mt-5 text-balance text-[38px] font-semibold leading-[1.04] sm:text-[52px]">Calls, not just <span className="italic">chats.</span></h2>
            <p className="mt-5 max-w-[480px] text-[17px] leading-8 text-white/65">Some conversations are better spoken. Your team can call a visitor straight from the dashboard, without leaving the conversation or asking for a phone number first.</p>
          </Reveal>
          <Reveal delay={120}><VoiceSection /></Reveal>
        </div>
      </section>

      {/* Tickets */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:py-32">
        <Reveal><SectionHead eyebrow="Tickets and help center" title={<>Every question makes the next one <span className={GRAD}>easier.</span></>} sub="Turn a conversation into a ticket, and the answer into a help center article. The next visitor finds it before they have to ask." /></Reveal>
        <div className="mt-14"><TicketSection /></div>
      </section>

      {/* Install */}
      <section className="border-t border-line py-24 sm:py-32">
        <div className="mx-auto max-w-[1240px] px-5">
          <Reveal><SectionHead eyebrow="Install" title={<>One line of code. <span className={GRAD}>That is the whole setup.</span></>} sub="Paste it on your site and the assistant appears. No developer, no plugin." /></Reveal>
          <div className="mt-14"><InstallSection /></div>
        </div>
      </section>

      {/* The paid product, said plainly */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:py-28">
        <Reveal>
          <div className="beam relative overflow-hidden rounded-[32px] bg-[#0b0b14] p-8 text-white sm:p-12">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr]">
              <div>
                <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-[#ffb27a]">The one paid product</p>
                <h2 className="font-display mt-4 text-balance text-[34px] font-semibold leading-[1.06] sm:text-[46px]">Everything else is free. <span className="italic">This is worth paying for.</span></h2>
                <p className="mt-4 max-w-[460px] text-[16px] leading-7 text-white/65">Pricing depends on your site and what you need, so we talk first and give you a clear number.</p>
                <div className="mt-7 flex flex-wrap gap-3"><Button href={links.call} arrow>Book a call</Button></div>
              </div>
              <ul className="space-y-3.5">
                {CHATBOT_FEATURES.map((f) => <li key={f} className="flex items-center gap-3 text-[16px] text-white/90"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff8a4c] to-[#ff5fb0] text-white"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>{f}</li>)}
              </ul>
            </div>
          </div>
        </Reveal>
      </section>

      <PairsWith items={[
        { slug: "crm", line: "Every chat lead is saved to your pipeline." },
        { slug: "inbox", line: "Follow up by email from the same place." },
        { slug: "outreach", line: "Warm leads can join a campaign." },
      ]} />
      <ProductFaq slug="chatbot" title="Chatbot questions, answered." items={FAQ} />
      <CtaBand tone={p.tone} title={<>Put an assistant on <span className="text-aurora-soft">your website.</span></>} sub="Tell us about your site and we will set up your chatbot with you." primary={{ label: "Book a call", href: links.call }} secondary={{ label: "See all products", href: "/product" }} />
    </div>
  );
}
