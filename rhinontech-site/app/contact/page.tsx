import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, LifeBuoy, Wrench } from "lucide-react";
import { Aurora, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { Spot } from "@/components/Spot";
import { ContactForm } from "@/components/forms/ContactForm";
import { links } from "@/components/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Ask a question, talk about pricing or the AI chatbot, or tell us what you need. We reply by email.",
  alternates: { canonical: "/contact" },
};

const WAYS = [
  { icon: CalendarDays, title: "Book a demo", body: "A 30 minute walk through the workspace, built around your team.", href: "/demo", tone: ["#2f5bff", "#7c5cff"] },
  { icon: LifeBuoy, title: "Already a customer?", body: "Log in to your workspace to use it, or to reach your own team.", href: links.login, tone: ["#10c98f", "#2cd3ff"] },
  { icon: Wrench, title: "Something custom?", body: "Rhinon Labs builds custom CRMs, automation and dashboards.", href: links.labs, tone: ["#ff8a4c", "#ff5fb0"] },
];

export default function ContactPage() {
  return (
    <>
      <section className="relative pb-24 pt-14 sm:pt-20">
        <Aurora />
        <div className="relative mx-auto max-w-[1240px] px-5">
          <Reveal><SectionHead eyebrow="Contact" title={<>We would love to <span className="text-aurora">hear from you.</span></>} sub="Ask a question, talk about pricing or the AI chatbot, or tell us what you need. We read every message and reply by email." /></Reveal>
          <div className="mt-16 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-4">
              {WAYS.map(({ icon: Icon, title, body, href, tone }, i) => {
                const inner = (
                  <>
                    <span className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: `linear-gradient(140deg, ${tone[0]}, ${tone[1]})` }}><Icon className="h-5 w-5" /></span><ArrowUpRight className="h-5 w-5 text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" /></span>
                    <span className="font-display mt-5 block text-[22px] font-semibold">{title}</span>
                    <span className="mt-1.5 block text-[15px] leading-6 text-ink-soft">{body}</span>
                  </>
                );
                return (
                  <Reveal key={title} delay={i * 90}>
                    {href.startsWith("/") ? <Spot href={href} className="group block p-6">{inner}</Spot> : <Spot className="group p-6"><a href={href} className="block">{inner}</a></Spot>}
                  </Reveal>
                );
              })}
            </div>
            <Reveal delay={120}><div className="window p-6 sm:p-9"><h2 className="font-display mb-6 text-[26px] font-semibold">Send us a message</h2><ContactForm /></div></Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
