import Link from "next/link";
import { ChevronRight, Square } from "lucide-react";
import { links, pageMeta } from "@/components/site";
import { Aurora, Button, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { CtaBand, Faq } from "@/components/blocks";
import { GetStartedButton } from "@/components/forms/GetStartedButton";
import { JsonLd, breadcrumbNode, faqNode, graphJsonLd } from "@/components/schema";

/*
 * A free, useful template for "client onboarding" (keyword map §3.2). The checklist must stand
 * on its own; Rhinon is offered as one way to run it, not a requirement to read it.
 */

export const metadata = pageMeta({
  title: "Client Onboarding Checklist for Agencies (Free Template)",
  description: "A free client onboarding checklist for agencies and service businesses: 24 steps from signed deal to first delivery, in five phases you can copy or run as a project.",
  path: "/templates/client-onboarding-checklist",
});

const PHASES = [
  { name: "1. Before kick-off", why: "Everything you need from the deal before the client meets the delivery team.", items: ["Confirm scope, deliverables and what is out of scope in writing", "Agree the start date, milestones and how changes are handled", "Name one decision-maker and one day-to-day contact on the client side", "Collect billing details and confirm payment terms", "Hand the brief and every sales note to the delivery lead"] },
  { name: "2. Access and assets", why: "Most delays in the first two weeks come from waiting for logins and files.", items: ["List every account, tool and login you need, and who owns each", "Request brand assets, existing documents and previous work", "Agree where files will be shared and who can see them", "Check that you have what you need to start, before the kick-off call"] },
  { name: "3. Kick-off call", why: "One meeting to agree how you will work, not just what you will do.", items: ["Walk through goals, scope, timeline and milestones", "Agree how and how often you will report progress", "Confirm the channel for questions and requests, and expected reply times", "Introduce the team and who does what", "Send a short written summary within a day"] },
  { name: "4. Set up the project", why: "Turn what was agreed into a plan everyone can see.", items: ["Create the project with phases and tasks from the agreed scope", "Assign owners and due dates to the first two weeks of work", "Share a progress view with the client", "Write the brief and key decisions down where the team works"] },
  { name: "5. First delivery", why: "The first two weeks set the client's expectations for the rest of the work.", items: ["Deliver something visible early, even if small", "Send the first progress update on the day you agreed", "Ask how onboarding went and what to change", "Book the first review and schedule regular check-ins", "Note any scope questions before they become changes", "Thank the client's team for their time and access"] },
];

const COUNT = PHASES.reduce((n, p) => n + p.items.length, 0);

const FAQ = [
  { q: "What is client onboarding?", a: "The steps between a client signing and the first piece of work being delivered: confirming scope, getting access, a kick-off call, setting up the project and a first early delivery." },
  { q: "How long should client onboarding take?", a: "For most agency and service projects, one to two weeks. The biggest delays usually come from waiting for access and assets, which is why they come before the kick-off call in this checklist." },
  { q: "Can I run this checklist in Rhinon Tech?", a: "Yes. Create a project from a won deal, add each step as a task, and share the client portal so the client sees the same plan." },
];

export default function ClientOnboardingChecklist() {
  return (
    <>
      <section className="relative pb-20 pt-12 sm:pt-16">
        <Aurora />
        <div className="relative mx-auto max-w-[1240px] px-5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13.5px] text-muted">
            <span>Templates</span><ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-ink">Client onboarding checklist</span>
          </nav>
          <h1 className="font-display mt-6 max-w-[920px] text-balance text-[40px] font-semibold leading-[1.04] sm:text-[62px]">Client onboarding checklist for agencies</h1>
          <p className="mt-6 max-w-[720px] text-[18px] leading-8 text-ink-soft">{COUNT} steps from signed deal to first delivery, in five phases. Copy it into any tool, or run it as a project in Rhinon with a portal your client can follow.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <GetStartedButton placement="Template: client onboarding" />
            <Button href="/features/client-portal" variant="soft">See the client portal</Button>
          </div>
        </div>
      </section>

      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto max-w-[900px] space-y-12 px-5">
          {PHASES.map((p) => (
            <Reveal key={p.name}>
              <div>
                <h2 className="font-display text-[30px] font-semibold sm:text-[36px]">{p.name}</h2>
                <p className="mt-2 text-[16px] leading-7 text-ink-soft">{p.why}</p>
                <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white">
                  {p.items.map((it) => (
                    <li key={it} className="flex items-start gap-3 px-5 py-4 text-[16px] leading-7"><Square className="mt-1 h-4 w-4 shrink-0 text-muted" />{it}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-soft/60 py-20 sm:py-24">
        <div className="mx-auto max-w-[900px] px-5">
          <SectionHead eyebrow="Run it in Rhinon" title="Turn the checklist into a project." />
          <ol className="mt-8 list-decimal space-y-3 pl-5 text-[16px] leading-7 text-ink-soft">
            <li>Convert the won deal into a project, so the client and the brief come with it.</li>
            <li>Add each step as a task, grouped by phase, and assign the first two weeks.</li>
            <li>Share the client portal so the client sees the same plan and sends requests there.</li>
          </ol>
          <Link href="/features/crm-with-project-management" className="mt-6 inline-flex text-[15px] font-semibold underline underline-offset-4">How deals become projects</Link>
        </div>
      </section>

      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5">
          <SectionHead eyebrow="FAQ" title="Client onboarding: questions." />
          <div className="mt-12"><Faq items={FAQ} /></div>
        </div>
      </section>

      <CtaBand title={<>Onboard your next client <span className="text-aurora-soft">in Rhinon.</span></>} sub="Free for up to 5 people. No credit card, no time limit." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "Book a demo", href: links.call }} />
      <JsonLd data={graphJsonLd([breadcrumbNode([{ name: "Home", path: "/" }, { name: "Client onboarding checklist", path: "/templates/client-onboarding-checklist" }]), faqNode(FAQ)])} />
    </>
  );
}
