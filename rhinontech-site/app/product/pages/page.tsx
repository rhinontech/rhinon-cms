import type { Metadata } from "next";
import { Aurora, Button, Eyebrow, IconTile, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { CtaBand } from "@/components/blocks";
import { links } from "@/components/site";
import { bySlug } from "@/content/products";
import { Crumb, PairsWith, ProductFaq } from "@/components/product/shared";
import { DocHero, Pinboard, SwitchSection, TreeSection } from "@/components/product/pages";

const p = bySlug("pages")!;
const HEAD = "font-display font-medium";
const INDIGO = "text-indigo-600 underline decoration-wavy decoration-indigo-300 decoration-[3px] underline-offset-[10px]";

export const metadata: Metadata = {
  title: "Pages: your team's knowledge, written down once",
  description: "Nested pages for processes, plans, briefs and notes. Write them where the work happens, and find them again in a tree that makes sense.",
  alternates: { canonical: "/product/pages" },
};

const FAQ = [
  { q: "What is Pages for?", a: "Processes, plans, briefs and notes: anything your team should write down once and find again. It sits in the same workspace as your projects and customers." },
  { q: "Can I nest pages?", a: "Yes. Pages nest in a tree, so a handbook can hold policies, and a project folder can hold its briefs." },
  { q: "How do I start a page?", a: "Create one in a click and start typing. It begins as Untitled and takes its name from you." },
  { q: "Is Pages free?", a: "Yes. Everything in Rhinon Tech except the AI website chatbot is free for your whole team." },
];

export default function PagesPage() {
  return (
    <div className="relative bg-white [background-image:radial-gradient(#e2d9c5_1px,transparent_1px)] [background-size:24px_24px]">
      {/* Hero: a serif headline and a page being written */}
      <section className="relative pb-24 pt-12 sm:pt-16">
        <Aurora tones={["#4f6bff", "#a78bfa", "#ffb547"]} />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-14 px-5 lg:grid-cols-[0.95fr_1.05fr]">
          <Reveal>
            <Crumb slug="pages" />
            <div className="mt-6"><IconTile icon={p.icon} tone={p.tone} size={56} /></div>
            <h1 className={`${HEAD} mt-6 text-balance text-[40px] leading-[1.05] text-[#1d1a12] sm:text-[56px]`}>Your team's knowledge,<br className="hidden sm:block" /> <span className={`${INDIGO} sm:whitespace-nowrap`}>written down once.</span></h1>
            <p className="mt-6 max-w-[500px] text-[18px] leading-8 text-[#5d5640]">Nested pages for processes, plans, briefs and notes. Write them where the work happens, and find them again in a tree that makes sense.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Button href={links.signup}>Get started free</Button><Button href={links.call} variant="soft">Book a demo</Button></div>
          </Reveal>
          <Reveal delay={140}><DocHero /></Reveal>
        </div>
      </section>

      {/* Tree */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:py-28">
        <Reveal className="text-center"><Eyebrow>A tree that grows</Eyebrow><h2 className={`${HEAD} mx-auto mt-5 max-w-[760px] text-balance text-[38px] leading-[1.05] text-[#1d1a12] sm:text-[56px]`}>Start with <span className={INDIGO}>Untitled.</span> Nest from there.</h2><p className="mx-auto mt-5 max-w-[560px] text-[17px] leading-8 text-[#5d5640]">Create a page in a click, name it, and it takes its place in the tree. Handbooks hold policies. Projects hold briefs.</p></Reveal>
        <div className="mx-auto mt-14 max-w-[900px]"><TreeSection /></div>
      </section>

      {/* Pinboard */}
      <section className="border-t border-line py-24 sm:py-28">
        <div className="mx-auto max-w-[1240px] px-5">
          <Reveal className="mb-16 text-center"><Eyebrow>What teams keep here</Eyebrow><h2 className={`${HEAD} mx-auto mt-5 max-w-[760px] text-balance text-[38px] leading-[1.05] text-[#1d1a12] sm:text-[56px]`}>The things that should <span className={INDIGO}>outlast a chat.</span></h2></Reveal>
          <Reveal delay={100}><Pinboard /></Reveal>
        </div>
      </section>

      {/* Same workspace */}
      <section className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 py-24 sm:py-28 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <Eyebrow>Next to the work</Eyebrow>
          <h2 className={`${HEAD} mt-5 text-balance text-[38px] leading-[1.05] text-[#1d1a12] sm:text-[52px]`}>One workspace, <span className={INDIGO}>one click away.</span></h2>
          <p className="mt-5 max-w-[440px] text-[17px] leading-8 text-[#5d5640]">Pages sits in the same sidebar as your projects, your inbox and your customers. Moving between a brief and the board it describes takes one click.</p>
        </Reveal>
        <Reveal delay={120}><SwitchSection /></Reveal>
      </section>

      <PairsWith items={[
        { slug: "work", line: "Keep briefs and notes in the same workspace." },
        { slug: "hr", line: "Keep your handbook and policies in one place." },
        { slug: "chat", line: "Talk about a page with the people it affects." },
      ]} />
      <ProductFaq title="Pages questions, answered." items={FAQ} />
      <CtaBand tone={p.tone} title={<>Write it down <span className="text-aurora-soft">once.</span></>} sub="Set up your workspace in a few minutes and bring your whole team. No credit card, no time limit." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "See all products", href: "/product" }} />
    </div>
  );
}
