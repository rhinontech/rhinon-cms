import type { Metadata } from "next";
import { Aurora, Button, Eyebrow, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { CtaBand } from "@/components/blocks";
import { links } from "@/components/site";
import { bySlug } from "@/content/products";
import { Crumb, PairsWith, ProductFaq } from "@/components/product/shared";
import { AnatomySection, GanttHero, PortalSection, RingsSection, ViewsSection } from "@/components/product/work";

const p = bySlug("work")!;
const G = "bg-gradient-to-r from-[#10c98f] to-[#2bbfd6] bg-clip-text text-transparent";

export const metadata: Metadata = {
  title: "Work: projects, tasks and a portal your clients love",
  description: "Projects, tasks, boards and a calendar for every piece of work, plus a private portal where clients follow progress and send change requests.",
  alternates: { canonical: "/product/work" },
};

const FAQ = [
  { q: "Do my clients need an account?", a: "No. They open a private link to follow progress and send requests." },
  { q: "Can I keep a project private?", a: "Yes. A project can be visible to the whole workspace, to a team, or only to the people on it." },
  { q: "What can a task hold?", a: "Status, priority, estimates, due dates, recurrence, blockers, subtasks, comments and tags." },
  { q: "Which views are there?", a: "A list, a board, a calendar and a team view, plus views for your own tasks and everyone's." },
  { q: "Is Work free?", a: "Yes. Everything in Rhinon Tech except the AI website chatbot is free for your whole team." },
];

export default function WorkPage() {
  return (
    <div className="bg-[#f4fbf8]">
      {/* Hero: centred, with a timeline that builds itself */}
      <section className="relative pb-24 pt-12 sm:pt-16">
        <Aurora tones={["#10c98f", "#2bbfd6", "#2f9bff"]} />
        <div className="relative mx-auto max-w-[1240px] px-5 text-center">
          <Reveal>
            <Crumb slug="work" center />
            <h1 className="font-display mx-auto mt-6 max-w-[900px] text-balance text-[42px] font-semibold leading-[1] sm:text-[72px]">Deliver client work <span className={G}>without the chaos.</span></h1>
            <p className="mx-auto mt-6 max-w-[620px] text-[18px] leading-8 text-ink-soft sm:text-[20px]">Projects, tasks, boards and a calendar for every piece of work, plus a private portal where clients follow progress and send change requests.</p>
            <div className="mt-9 flex flex-wrap justify-center gap-3"><Button href={links.signup} arrow>Get started free</Button><Button href={links.call} variant="ghost">Book a demo</Button></div>
          </Reveal>
        </div>
        <div className="relative mt-14 px-5"><Reveal delay={150}><GanttHero /></Reveal></div>
      </section>

      {/* Task anatomy */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:py-32">
        <Reveal><SectionHead eyebrow="Tasks" title={<>One task, with <span className={G}>everything attached.</span></>} sub="Hover the list, or let it play. Each part lights up on the task it belongs to." /></Reveal>
        <div className="mt-16"><AnatomySection /></div>
      </section>

      {/* Views */}
      <section className="border-y border-emerald-100 bg-white/60 py-24 sm:py-32">
        <div className="mx-auto max-w-[1240px] px-5">
          <Reveal><SectionHead eyebrow="Views" title={<>The same work, <span className={G}>four ways.</span></>} sub="Switch the view and the tasks rearrange themselves. Nothing is copied, so nothing gets out of date." /></Reveal>
          <div className="mt-14"><ViewsSection /></div>
        </div>
      </section>

      {/* Portal */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:py-32">
        <Reveal><SectionHead eyebrow="Client portal" title={<>Clients follow along. <span className={G}>No login.</span></>} sub="Share a private link. Clients see how their project is going and send change requests, which land right on your board." /></Reveal>
        <div className="mt-14"><PortalSection /></div>
      </section>

      {/* Visibility */}
      <section className="border-y border-emerald-100 bg-white/60 py-24 sm:py-32">
        <div className="mx-auto max-w-[1240px] px-5">
          <Reveal className="mb-14"><Eyebrow>Visibility</Eyebrow><h2 className="font-display mt-5 max-w-[640px] text-balance text-[38px] font-semibold leading-[1.04] sm:text-[52px]">Open to everyone, a team, or <span className={G}>just the people on it.</span></h2></Reveal>
          <RingsSection />
        </div>
      </section>

      <PairsWith items={[
        { slug: "chat", line: "Talk about the work without switching tools." },
        { slug: "pages", line: "Keep briefs and notes in the same workspace." },
        { slug: "attendance", line: "Know who is working and who is away." },
      ]} />
      <ProductFaq title="Work questions, answered." items={FAQ} />
      <CtaBand tone={p.tone} title={<>Run your next project <span className="text-aurora-soft">here.</span></>} sub="Set up your workspace in a few minutes and bring your whole team. No credit card, no time limit." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "See all products", href: "/product" }} />
    </div>
  );
}
