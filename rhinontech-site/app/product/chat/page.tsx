import type { Metadata } from "next";
import { Aurora, Button, Eyebrow, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { CtaBand } from "@/components/blocks";
import { links } from "@/components/site";
import { bySlug } from "@/content/products";
import { Crumb, PairsWith, ProductFaq } from "@/components/product/shared";
import { BentoSection, CallSection, ChatHero, GuestSection } from "@/components/product/chat";

const p = bySlug("chat")!;
const G = "italic";

export const metadata: Metadata = {
  title: "Team Chat & Meetings: talk it through without leaving the work",
  description: "Message your team, start a group call, or share a meeting link with someone outside the company. All of it lives next to your projects and your customers.",
  alternates: { canonical: "/product/chat" },
};

const FAQ = [
  { q: "Can people outside my company join a meeting?", a: "Yes. Share a meeting link and guests can join without an account." },
  { q: "Can I call more than one person?", a: "Yes. Start a group call with voice and video from any conversation." },
  { q: "Do I need another chat app?", a: "No. Chat, calls and meeting links are part of the workspace, next to your projects and customers." },
  { q: "Is chat free?", a: "Yes. Everything in Rhinon Tech except the AI website chatbot is free for your whole team." },
];

export default function ChatPage() {
  return (
    <div className="bg-[#050b24] text-white">
      {/* Hero: a dark conversation with a glowing frame */}
      <section className="relative overflow-hidden pb-24 pt-14 sm:pt-20">
        <Aurora dark tones={["#2f5bff", "#2cd3ff", "#7c5cff"]} />
        <div className="relative mx-auto max-w-[1240px] px-5 text-center">
          <Reveal>
            <Crumb slug="chat" dark center />
            <h1 className="font-display mx-auto mt-6 max-w-[900px] text-balance text-[44px] font-semibold leading-[1] sm:text-[76px]">Talk it through, <span className={G}>without leaving the work.</span></h1>
            <p className="mx-auto mt-6 max-w-[620px] text-[18px] leading-8 text-white/65 sm:text-[20px]">Message your team, start a group call, or share a meeting link with someone outside the company. All of it lives next to your projects and your customers.</p>
            <div className="mt-9 flex flex-wrap justify-center gap-3"><Button href={links.signup} arrow>Get started free</Button><Button href={links.call} variant="glass">Book a demo</Button></div>
          </Reveal>
        </div>
        <div className="relative mt-16 px-5"><Reveal delay={150}><ChatHero /></Reveal></div>
      </section>

      {/* Bento */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:py-32">
        <Reveal><SectionHead dark eyebrow="Everything chat should be" title={<>Small things, <span className={G}>done properly.</span></>} sub="Six details that make a conversation feel natural. Each one plays below." /></Reveal>
        <div className="mt-16"><BentoSection /></div>
      </section>

      {/* Call */}
      <section className="relative border-y border-white/10 bg-[#070e2c] py-24 sm:py-32">
        <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal>
            <Eyebrow dark>Group calls</Eyebrow>
            <h2 className="font-display mt-5 text-balance text-[38px] font-semibold leading-[1.04] sm:text-[52px]">One click from a <span className={G}>conversation to a call.</span></h2>
            <p className="mt-5 max-w-[460px] text-[17px] leading-8 text-white/65">Start a voice or video call from any chat and bring in as many people as you need. When the call ends, you are still in the conversation.</p>
          </Reveal>
          <Reveal delay={120}><CallSection /></Reveal>
        </div>
      </section>

      {/* Guest */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:py-32">
        <Reveal><SectionHead dark eyebrow="Meeting links" title={<>Anyone can join. <span className={G}>No account needed.</span></>} sub="Create a meeting, copy the link and share it with a client or a candidate. They click, and they are in." /></Reveal>
        <div className="mt-16"><GuestSection /></div>
      </section>

      <PairsWith dark items={[
        { slug: "work", line: "Discuss the project you are working on." },
        { slug: "hr", line: "Run interviews and one-to-ones in a call." },
        { slug: "crm", line: "Take sales calls from the lead record." },
      ]} />
      <ProductFaq dark title="Chat questions, answered." items={FAQ} />
      <CtaBand tone={p.tone} title={<>Keep the conversation <span className="text-aurora-soft">with the work.</span></>} sub="Set up your workspace in a few minutes and bring your whole team. No credit card, no time limit." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "See all products", href: "/product" }} />
      <div className="h-24" />
    </div>
  );
}
