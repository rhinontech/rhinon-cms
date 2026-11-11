import { Aurora, Button, Eyebrow, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { CtaBand } from "@/components/blocks";
import { links, pageMeta } from "@/components/site";
import { bySlug } from "@/content/products";
import { Crumb, PairsWith, ProductFaq } from "@/components/product/shared";
import { CyclesSection, GoalsSection, ReviewSection, RingsHero, TeamSection } from "@/components/product/performance";

const p = bySlug("performance")!;
const G = "italic";

export const metadata = pageMeta({
  title: "Performance: review cycles, goals and feedback",
  description: "Run quarterly, annual or probation review cycles. Set goals for each person, collect reviews from the right people and see progress across your team.",
  path: "/product/performance",
  hasOgImage: true,
});

const FAQ = [
  { q: "What kinds of review cycle are there?", a: "Quarterly, annual and probation cycles. You can start one in minutes and choose who takes part." },
  { q: "How do goals work?", a: "Each goal belongs to a cycle and a person, so it is reviewed and not forgotten. Progress is tracked as the cycle runs." },
  { q: "Who writes the reviews?", a: "Reviewers submit feedback on their reviewees, and managers get a team view that shows who has finished." },
  { q: "Does it connect to the rest of the record?", a: "Yes. Reviews and goals sit on the person's record next to their employment details and payroll setup." },
  { q: "Is Performance free?", a: "Yes. Everything in Rhinon Tech except the AI website chatbot is free for your whole team." },
];

export default function PerformancePage() {
  return (
    <div className="bg-[#030306] text-white">
      {/* Hero: copy left, three rings closing right */}
      <section className="relative overflow-hidden pb-24 pt-12 sm:pt-16">
        <Aurora dark tones={["#7c5cff", "#2f5bff", "#ff5fb0"]} />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 lg:grid-cols-[1fr_0.9fr]">
          <Reveal>
            <Crumb slug="performance" dark />
            <h1 className="font-display mt-6 text-balance text-[42px] font-semibold leading-[1.02] sm:text-[68px]">Reviews people <span className={G}>actually finish.</span></h1>
            <p className="mt-6 max-w-[520px] text-[18px] leading-8 text-white/65">Run quarterly, annual or probation review cycles. Set goals for each person, collect reviews from the right people and see progress across your team.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Button href={links.signup}>Get started free</Button><Button href={links.call} variant="glass">Book a demo</Button></div>
          </Reveal>
          <Reveal delay={140}><RingsHero /></Reveal>
        </div>
      </section>

      {/* Cycles */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:py-32">
        <Reveal><SectionHead dark eyebrow="Cycles" title={<>Pick a rhythm. <span className={G}>Start in minutes.</span></>} sub="Quarterly for regular check-ins, annual for the big picture, probation for new joiners." /></Reveal>
        <div className="mt-14"><CyclesSection /></div>
      </section>

      {/* Goals */}
      <section className="border-y border-white/10 bg-[#08080e] py-24 sm:py-32">
        <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <Eyebrow dark>Goals</Eyebrow>
            <h2 className="font-display mt-5 text-balance text-[38px] font-semibold leading-[1.04] sm:text-[52px]">Goals that <span className={G}>get reviewed.</span></h2>
            <p className="mt-5 max-w-[440px] text-[17px] leading-8 text-white/65">Every goal belongs to a cycle, so it is checked at review time and not forgotten in a document. Progress fills in as the work gets done.</p>
          </Reveal>
          <Reveal delay={120}><GoalsSection /></Reveal>
        </div>
      </section>

      {/* Review */}
      <section className="mx-auto max-w-[1000px] px-5 py-24 sm:py-32">
        <Reveal><SectionHead dark eyebrow="Feedback" title={<>From reviewer to reviewee, <span className={G}>in one flow.</span></>} sub="A review starts with a self review, moves to the manager and ends with a submission the person can read." /></Reveal>
        <div className="mt-14"><ReviewSection /></div>
      </section>

      {/* Team */}
      <section className="border-y border-white/10 bg-[#08080e] py-24 sm:py-32">
        <div className="mx-auto max-w-[1100px] px-5">
          <Reveal><SectionHead dark eyebrow="Team view" title={<>See who has finished, <span className={G}>and who has not.</span></>} sub="Managers get one view of the whole team, so a cycle never stalls without anyone noticing." /></Reveal>
          <div className="mt-14"><TeamSection /></div>
        </div>
      </section>

      <PairsWith dark items={[
        { slug: "hr", line: "Reviews sit on the employee record." },
        { slug: "payroll", line: "Bring appraisals into pay decisions." },
        { slug: "work", line: "Review the work that was actually done." },
      ]} />
      <ProductFaq dark title="Performance questions, answered." items={FAQ} />
      <CtaBand tone={p.tone} title={<>Make reviews <span className="text-aurora-soft">worth doing.</span></>} sub="Set up your workspace in a few minutes and bring your whole team. No credit card, no time limit." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "See all products", href: "/product" }} />
      <div className="h-24" />
    </div>
  );
}
