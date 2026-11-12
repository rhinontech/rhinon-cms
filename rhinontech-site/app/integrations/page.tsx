import type { Metadata } from "next";
import Link from "next/link";
import { Bot, CalendarDays, FileSignature, Mail, Send, Zap, type LucideIcon } from "lucide-react";
import { links } from "@/components/site";
import { Aurora, Button, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { Spot } from "@/components/Spot";
import { CtaBand } from "@/components/blocks";

export const metadata: Metadata = {
  title: "Integrations",
  description: "Connect your mailbox, calendar, LinkedIn, Slack, GitHub and website. Everything else lives in one place.",
  alternates: { canonical: "/integrations" },
};

const ITEMS: { name: string; body: string; icon: LucideIcon; tone: [string, string] }[] = [
  { name: "Gmail & Outlook", body: "Send campaigns and replies from your own mailbox.", icon: Mail, tone: ["#ff5fb0", "#ff8a4c"] },
  { name: "Google Calendar", body: "Meetings and interviews land on your calendar.", icon: CalendarDays, tone: ["#2cd3ff", "#2f5bff"] },
  { name: "LinkedIn", body: "Plan and publish posts with AI help.", icon: Send, tone: ["#2f5bff", "#7c5cff"] },
  { name: "Slack & GitHub", body: "New teammates get access on their first day.", icon: Zap, tone: ["#7c5cff", "#e04dd6"] },
  { name: "Your website", body: "One line of code adds the chatbot and visitor analytics.", icon: Bot, tone: ["#ff8a4c", "#ffb547"] },
  { name: "E-signatures", body: "Offer letters and NDAs signed inside the app.", icon: FileSignature, tone: ["#10c98f", "#2cd3ff"] },
];

export default function IntegrationsPage() {
  return (
    <>
      <section className="relative pb-24 pt-16 sm:pt-24">
        <Aurora />
        <div className="relative mx-auto max-w-[1240px] px-5">
          <Reveal>
            <SectionHead eyebrow="Integrations" title={<>Works with the tools <span className="text-aurora">you already use.</span></>} sub="Connect your mailbox, calendar and website. Everything else lives in one place." />
          </Reveal>
          <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ITEMS.map(({ name, body, icon: Icon, tone }, i) => (
              <Reveal key={name} delay={(i % 3) * 90}>
                <Spot className="h-full p-7">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-white" style={{ background: `linear-gradient(140deg, ${tone[0]}, ${tone[1]})`, boxShadow: `0 12px 26px -12px ${tone[0]}` }}><Icon className="h-6 w-6" /></span>
                  <p className="font-display mt-6 text-[24px] font-semibold">{name}</p>
                  <p className="mt-2 text-[15.5px] leading-7 text-ink-soft">{body}</p>
                </Spot>
              </Reveal>
            ))}
          </div>
          <Reveal delay={100}>
            <p className="mt-12 text-[15px] text-muted">Need something that is not here? <Link href="/contact" className="font-medium text-ink underline underline-offset-4">Tell us</Link>. We build custom integrations at Rhinon Labs.</p>
          </Reveal>
        </div>
      </section>
      <CtaBand title={<>Connect it all, <span className="text-aurora-soft">free.</span></>} sub="Set up your workspace in a few minutes and bring your whole team." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "See all products", href: "/product" }} />
    </>
  );
}
