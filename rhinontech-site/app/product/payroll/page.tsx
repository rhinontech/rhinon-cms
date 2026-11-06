import type { Metadata } from "next";
import { Aurora, Button, Eyebrow, IconTile, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { CtaBand } from "@/components/blocks";
import { links } from "@/components/site";
import { bySlug } from "@/content/products";
import { Crumb, PairsWith, ProductFaq } from "@/components/product/shared";
import { PayslipFan, RunSection, StructureSection, WallSection } from "@/components/product/payroll";

const p = bySlug("payroll")!;
const G = "italic";

export const metadata: Metadata = {
  title: "Payroll: monthly runs and payslips, built for India",
  description: "Salary structures live on each person's record. Start a monthly run, check the numbers and mark it paid. Payslips are generated for everyone.",
  alternates: { canonical: "/product/payroll" },
};

const FAQ = [
  { q: "Does it handle Indian deductions?", a: "Yes. Payroll supports PF, PT and TDS configuration, and amounts are in ₹." },
  { q: "How does a run work?", a: "Start a monthly run, review gross and net across your team, process it and mark it paid. It moves from draft to processed to paid." },
  { q: "Where does the salary structure live?", a: "On each person's record: basic, HRA, travel, medical and other components, with deductions configured per person." },
  { q: "Who can see payroll?", a: "Only roles you give access to. You choose who can view payroll and who can run it." },
  { q: "Is Payroll free?", a: "Yes. Everything in Rhinon Tech except the AI website chatbot is free for your whole team." },
];

export default function PayrollPage() {
  return (
    <div className="bg-white">
      {/* Hero: copy left, a fan of payslips right */}
      <section className="relative pb-24 pt-12 sm:pt-16">
        <Aurora tones={["#ffb547", "#ff8a4c", "#ff5fb0"]} />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 lg:grid-cols-[1.05fr_0.95fr]">
          <Reveal>
            <Crumb slug="payroll" />
            <div className="mt-6"><IconTile icon={p.icon} tone={p.tone} size={56} /></div>
            <h1 className="font-display mt-6 text-balance text-[42px] font-semibold leading-[1.02] sm:text-[64px]">Run payroll in the time it takes <span className={G}>to review it.</span></h1>
            <p className="mt-6 max-w-[520px] text-[18px] leading-8 text-ink-soft">Salary structures live on each person's record. Start a monthly run, check the numbers and mark it paid. Payslips are generated for everyone.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Button href={links.signup} arrow>Get started free</Button><Button href={links.call} variant="ghost">Book a demo</Button></div>
            <p className="mt-5 flex flex-wrap gap-2 text-[12px] font-semibold">{["₹ amounts", "PF", "PT", "TDS"].map((c) => <span key={c} className="rounded-full border border-amber-200 bg-white px-3 py-1 text-amber-800">{c}</span>)}</p>
          </Reveal>
          <Reveal delay={140}><PayslipFan /></Reveal>
        </div>
      </section>

      {/* The run */}
      <section className="border-y border-line bg-soft/60 py-24 sm:py-32">
        <div className="mx-auto max-w-[1100px] px-5">
          <Reveal><SectionHead eyebrow="The run" title={<>Draft, processed, paid. <span className={G}>Three steps.</span></>} sub="Each run moves through the same three stages, and the numbers lock when you process it." /></Reveal>
          <div className="mt-14"><RunSection /></div>
        </div>
      </section>

      {/* Structure */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:py-32">
        <Reveal><SectionHead eyebrow="Structure" title={<>Set a salary up once. <span className={G}>It carries into every run.</span></>} sub="Basic, HRA, travel, medical and other components, with PF, PT and TDS configured per person." /></Reveal>
        <div className="mt-14"><StructureSection /></div>
      </section>

      {/* Payslips */}
      <section className="border-y border-line bg-soft/60 py-24 sm:py-32">
        <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <Eyebrow>Payslips</Eyebrow>
            <h2 className="font-display mt-5 text-balance text-[38px] font-semibold leading-[1.04] sm:text-[52px]">A payslip for <span className={G}>everyone, at once.</span></h2>
            <p className="mt-5 max-w-[440px] text-[17px] leading-8 text-ink-soft">When the run is paid, every employee gets their payslip. You do not build them one by one, and you do not chase anyone for a copy.</p>
          </Reveal>
          <Reveal delay={120}><WallSection /></Reveal>
        </div>
      </section>

      <PairsWith items={[
        { slug: "hr", line: "Salary setup lives on the employee record." },
        { slug: "attendance", line: "Attendance and leave inform the month." },
        { slug: "performance", line: "Bring appraisals into pay decisions." },
      ]} />
      <ProductFaq title="Payroll questions, answered." items={FAQ} />
      <CtaBand tone={p.tone} title={<>Close the month <span className="text-aurora-soft">with confidence.</span></>} sub="Set up your workspace in a few minutes and bring your whole team. No credit card, no time limit." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "See all products", href: "/product" }} />
    </div>
  );
}
