import type { Metadata } from "next";
import { Aurora, Button, Eyebrow, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { CtaBand } from "@/components/blocks";
import { links } from "@/components/site";
import { bySlug } from "@/content/products";
import { Crumb, PairsWith, ProductFaq } from "@/components/product/shared";
import { JourneyHero, OffboardSection, PhoneSection, RecordSection, RewriteSection, SignatureSection } from "@/components/product/hr";

const p = bySlug("hr")!;
const G = "bg-gradient-to-r from-[#ff5fb0] to-[#7c5cff] bg-clip-text text-transparent";

export const metadata: Metadata = {
  title: "HR & People: onboarding, records, offer letters and e-signing",
  description: "A directory, a full record for every person, an onboarding flow for new hires and offer letters signed inside the app.",
  alternates: { canonical: "/product/hr" },
};

const FAQ = [
  { q: "Do candidates need an account to sign?", a: "No. They open a link and sign with a typed or drawn signature." },
  { q: "What happens when a new hire starts?", a: "You create the employee, they get a company email and an onboarding link, and they complete their own profile." },
  { q: "What goes on an employee record?", a: "Employment type, schedule, location, compensation, salary structure, bank and statutory details, and uploaded documents." },
  { q: "What happens when someone leaves?", a: "Mark them inactive and their company email and tool access are closed. Their record stays for your files." },
  { q: "Is HR free?", a: "Yes. Everything in Rhinon Tech except the AI website chatbot is free for your whole team." },
];

export default function HrPage() {
  return (
    <div className="bg-[#fcf8ff]">
      {/* Hero: centred, with a hire travelling from offer to day one */}
      <section className="relative pb-20 pt-12 sm:pt-16">
        <Aurora tones={["#ff5fb0", "#7c5cff", "#2f5bff"]} />
        <div className="relative mx-auto max-w-[1240px] px-5 text-center">
          <Reveal>
            <Crumb slug="hr" center />
            <h1 className="font-display mx-auto mt-6 max-w-[900px] text-balance text-[42px] font-semibold leading-[1] sm:text-[72px]">Hire, onboard and sign, <span className={G}>all in one flow.</span></h1>
            <p className="mx-auto mt-6 max-w-[640px] text-[18px] leading-8 text-ink-soft sm:text-[20px]">A directory, a full record for every person, an onboarding flow for new hires and offer letters signed inside the app. Then the same record feeds payroll.</p>
            <div className="mt-9 flex flex-wrap justify-center gap-3"><Button href={links.signup} arrow>Get started free</Button><Button href={links.call} variant="ghost">Book a demo</Button></div>
          </Reveal>
        </div>
        <div className="relative mx-auto mt-20 max-w-[1240px] px-5"><Reveal delay={150}><JourneyHero /></Reveal></div>
      </section>

      {/* Signature */}
      <section className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 py-24 sm:py-28 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal>
          <Eyebrow>E-signing</Eyebrow>
          <h2 className="font-display mt-5 text-balance text-[38px] font-semibold leading-[1.04] sm:text-[52px]">Offer letters that <span className={G}>sign themselves.</span></h2>
          <p className="mt-5 max-w-[460px] text-[17px] leading-8 text-ink-soft">Edit the letter, send it, and the candidate signs in the browser with a drawn or typed signature. Offer letters and NDAs both work the same way.</p>
        </Reveal>
        <Reveal delay={120}><SignatureSection /></Reveal>
      </section>

      {/* Phone */}
      <section className="border-y border-fuchsia-100 bg-fuchsia-50/50 py-24 sm:py-28">
        <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal className="order-2 lg:order-1"><PhoneSection /></Reveal>
          <Reveal delay={120} className="order-1 lg:order-2">
            <Eyebrow>Onboarding</Eyebrow>
            <h2 className="font-display mt-5 text-balance text-[38px] font-semibold leading-[1.04] sm:text-[52px]">New hires fill in <span className={G}>their own details.</span></h2>
            <p className="mt-5 max-w-[460px] text-[17px] leading-8 text-ink-soft">Create an employee and they get a company email and a link. They set their own password and complete their profile, so you are not typing it in for them.</p>
          </Reveal>
        </div>
      </section>

      {/* Record */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:py-32">
        <Reveal><SectionHead eyebrow="The record" title={<>One record per person, <span className={G}>complete.</span></>} sub="Everything about a person lives in one place, and the same record feeds attendance, leave and payroll." /></Reveal>
        <div className="mt-14"><RecordSection /></div>
      </section>

      {/* Rewrite */}
      <section className="border-y border-fuchsia-100 bg-fuchsia-50/50 py-24 sm:py-28">
        <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal>
            <Eyebrow>Rhinon AI</Eyebrow>
            <h2 className="font-display mt-5 text-balance text-[38px] font-semibold leading-[1.04] sm:text-[52px]">Select a sentence. <span className={G}>Pick a tone.</span></h2>
            <p className="mt-5 max-w-[460px] text-[17px] leading-8 text-ink-soft">Rewrite any sentence in a letter template with AI, warmer, shorter or more formal, without leaving the editor. You choose what to keep.</p>
          </Reveal>
          <Reveal delay={120}><RewriteSection /></Reveal>
        </div>
      </section>

      {/* Offboarding */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:py-32">
        <Reveal><SectionHead eyebrow="Offboarding" title={<>When someone leaves, <span className={G}>it closes cleanly.</span></>} sub="Mark a person inactive and their company email and tool access are closed. The record is archived for your files." /></Reveal>
        <div className="mt-14"><OffboardSection /></div>
      </section>

      <PairsWith items={[
        { slug: "payroll", line: "Salary setup flows into payroll." },
        { slug: "attendance", line: "Attendance and leave follow the same record." },
        { slug: "performance", line: "Reviews attach to each person." },
      ]} />
      <ProductFaq title="HR questions, answered." items={FAQ} />
      <CtaBand tone={p.tone} title={<>Welcome people <span className="text-aurora-soft">properly.</span></>} sub="Set up your workspace in a few minutes and bring your whole team. No credit card, no time limit." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "See all products", href: "/product" }} />
    </div>
  );
}
