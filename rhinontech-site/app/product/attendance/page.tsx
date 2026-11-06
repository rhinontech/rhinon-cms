import type { Metadata } from "next";
import { Aurora, Button, Eyebrow, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { CtaBand } from "@/components/blocks";
import { links } from "@/components/site";
import { bySlug } from "@/content/products";
import { Crumb, PairsWith, ProductFaq } from "@/components/product/shared";
import { CalSection, ClockHero, FixSection, HeatSection, LeaveSection, NightSection } from "@/components/product/attendance";

const p = bySlug("attendance")!;
const G = "bg-gradient-to-r from-[#14b8a6] to-[#2cd3ff] bg-clip-text text-transparent";
const GL = "bg-gradient-to-r from-[#34e3ad] to-[#7ff0ff] bg-clip-text text-transparent";

export const metadata: Metadata = {
  title: "Attendance & Leave: clock in, request leave, approve in a tap",
  description: "Clock in and out from the dashboard, request leave, and let managers approve in a tap. Balances and a team calendar keep everyone planning from the same facts.",
  alternates: { canonical: "/product/attendance" },
};

const FAQ = [
  { q: "Can employees fix a missed clock-in or clock-out?", a: "Yes. They file a regularization request and a manager approves it." },
  { q: "What happens if someone forgets to clock out?", a: "Open sessions close automatically at night, so a forgotten clock-out never runs on. The employee can then request a correction." },
  { q: "Can I set up my own leave types?", a: "Yes. Define the leave types you offer, give each person a balance, and managers approve or decline with a note." },
  { q: "Is there a shared calendar?", a: "Yes. Approved leave shows on a team calendar, so everyone can plan around who is away." },
  { q: "Is Attendance free?", a: "Yes. Everything in Rhinon Tech except the AI website chatbot is free for your whole team." },
];

export default function AttendancePage() {
  return (
    <div className="bg-[#f4fbfa]">
      {/* Hero: a dark teal room with a clock-in ring */}
      <section className="relative overflow-hidden bg-[#04201f] pb-24 pt-12 text-white sm:pt-16">
        <Aurora dark tones={["#10c98f", "#2cd3ff", "#14b8a6"]} />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 lg:grid-cols-[1fr_0.9fr]">
          <Reveal>
            <Crumb slug="attendance" dark />
            <h1 className="font-display mt-6 text-balance text-[42px] font-semibold leading-[1.02] sm:text-[66px]">Know who is in, <span className={GL}>and who is away.</span></h1>
            <p className="mt-6 max-w-[520px] text-[18px] leading-8 text-white/65">Clock in and out from the dashboard, request leave, and let managers approve in a tap. Balances and a team calendar keep everyone planning from the same facts.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Button href={links.signup} arrow>Get started free</Button><Button href={links.call} variant="glass">Book a demo</Button></div>
          </Reveal>
          <Reveal delay={140}><ClockHero /></Reveal>
        </div>
      </section>

      {/* Heatmap */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:py-32">
        <Reveal><SectionHead eyebrow="Your month" title={<>Every day has a status. <span className={G}>See the month at a glance.</span></>} sub="Present, absent, holiday, leave or weekend. A calendar paints itself, and a glance tells you how the month went." /></Reveal>
        <div className="mt-14"><HeatSection /></div>
      </section>

      {/* Leave */}
      <section className="border-y border-teal-100 bg-white/60 py-24 sm:py-32">
        <div className="mx-auto max-w-[1240px] px-5">
          <Reveal><SectionHead eyebrow="Leave" title={<>Request, approve, <span className={G}>done.</span></>} sub="Employees file a request. Managers approve or decline with a note. The balance updates the moment they do." /></Reveal>
          <div className="mt-14"><LeaveSection /></div>
        </div>
      </section>

      {/* Missed punch */}
      <section className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 py-24 sm:py-32 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <Eyebrow>Corrections</Eyebrow>
          <h2 className="font-display mt-5 text-balance text-[38px] font-semibold leading-[1.04] sm:text-[52px]">Missed a punch? <span className={G}>Fix it properly.</span></h2>
          <p className="mt-5 max-w-[440px] text-[17px] leading-8 text-ink-soft">When someone forgets to clock out, they file a regularization request and a manager approves it. The record stays honest, and nobody edits hours behind the scenes.</p>
        </Reveal>
        <Reveal delay={120}><FixSection /></Reveal>
      </section>

      {/* Night */}
      <section className="border-y border-teal-100 bg-white/60 py-24 sm:py-32">
        <div className="mx-auto max-w-[1100px] px-5">
          <Reveal><SectionHead eyebrow="Every night" title={<>Open sessions close <span className={G}>at 10 pm.</span></>} sub="A forgotten clock-out never runs overnight. Anything still open is closed automatically, ready for a correction if it is needed." /></Reveal>
          <div className="mt-14"><NightSection /></div>
        </div>
      </section>

      {/* Calendar */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:py-32">
        <Reveal><SectionHead eyebrow="Team calendar" title={<>Plan around <span className={G}>who is out.</span></>} sub="Approved leave lands on a shared calendar, so a quick look tells you who is away before you plan the week." /></Reveal>
        <div className="mt-14"><CalSection /></div>
      </section>

      <PairsWith items={[
        { slug: "payroll", line: "Feeds the monthly payroll run." },
        { slug: "hr", line: "Part of every employee record." },
        { slug: "work", line: "Plan work around who is away." },
      ]} />
      <ProductFaq title="Attendance questions, answered." items={FAQ} />
      <CtaBand tone={p.tone} title={<>Make attendance <span className="text-aurora-soft">effortless.</span></>} sub="Set up your workspace in a few minutes and bring your whole team. No credit card, no time limit." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "See all products", href: "/product" }} />
    </div>
  );
}
