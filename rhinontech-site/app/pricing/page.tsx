import { Check } from "lucide-react";
import { links, pageMeta } from "@/components/site";
import { FREE_FEATURES, PLAN_LIMITS, STARTER_FEATURES } from "@/content/plans";
import { Aurora, Button, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { Spot } from "@/components/Spot";
import { CtaBand, Faq } from "@/components/blocks";
import { GetStartedButton } from "@/components/forms/GetStartedButton";
import { JsonLd, breadcrumbNode, faqNode, graphJsonLd, softwareAppNode } from "@/components/schema";

/*
 * Plans and limits mirror rhinontech/backend/src/config/plans.ts through content/plans.ts.
 * Paid plans say "Talk to us" until checkout exists (launch review G1.3).
 */

export const metadata = pageMeta({
  title: "Pricing",
  description: "Rhinon Tech is free for up to 5 people, with no time limit. Starter adds more people, higher limits and the AI Agent on your website.",
  path: "/pricing",
  hasOgImage: true,
});

const FAQ = [
  { q: "Is Rhinon Tech really free?", a: "Yes. Every product except the AI Agent is free for up to 5 people, with 50 emails and 20 AI drafts a day, no time limit and no credit card." },
  { q: "What happens when we add a sixth person?", a: "The Free plan stops at 5 people. Move to Starter for up to 25 people and higher daily limits. Book a call and we will set it up with you." },
  { q: "What does Starter cost?", a: "It depends on your team size and how much you use the AI Agent, so we talk first and give you a clear price before anything is set up." },
  { q: "Can I use the free products without the AI Agent?", a: "Yes. The AI Agent is part of the paid plans. The CRM, outreach, inbox, projects, chat, docs, HR and payroll all work without it." },
  { q: "Who builds Rhinon Tech?", a: "Rhinon Labs. We build custom CRMs, AI automation and dashboards for growing companies, and we run our own agency on Rhinon Tech." },
];

const ENTERPRISE_FEATURES = ["Everything in Starter", "Unlimited people, emails and AI drafts", "Up to 3 AI Agents across your brands", "Priority help from the team that builds it"];

export default function PricingPage() {
  return (
    <>
      <section className="relative pb-24 pt-16 sm:pt-24">
        <Aurora />
        <div className="relative mx-auto max-w-[1240px] px-5">
          <SectionHead as="h1" eyebrow="Pricing" title={<>Free for up to 5 people. <span className="text-aurora">Grow when you are ready.</span></>} sub="Start with the whole workspace, no trial clock and no credit card. Move to Starter when your team grows or you want the AI Agent on your website." />
          <div className="mt-16 grid gap-5 lg:grid-cols-3">
            <Reveal>
              <div className="spot flex h-full flex-col p-8">
                <p className="font-display text-[22px] font-semibold">Free</p>
                <p className="font-display mt-2 text-[56px] font-semibold leading-none">₹0</p>
                <p className="mt-2 text-[14px] text-muted">For up to 5 people, with no time limit.</p>
                <ul className="mt-7 flex-1 space-y-3 text-[15px]">
                  {FREE_FEATURES.map((f) => <li key={f} className="flex gap-2.5"><Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-emerald-500" />{f}</li>)}
                </ul>
                <div className="mt-8"><GetStartedButton placement="Pricing free plan" /></div>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="beam flex h-full flex-col rounded-[24px] bg-night p-8 text-white shadow-[0_40px_80px_-30px_rgb(0_44_112_/_0.55)]">
                <p className="font-display flex items-center gap-2 text-[22px] font-semibold">Starter <span className="rounded-full bg-white/15 px-2 py-0.5 font-sans text-[11px] font-semibold uppercase tracking-wide text-white/80">Most teams</span></p>
                <p className="font-display mt-2 text-[44px] font-semibold leading-[1.15]">Talk to us</p>
                <p className="mt-2 text-[14px] text-white/55">For growing teams, with the AI Agent on your website.</p>
                <ul className="mt-7 flex-1 space-y-3 text-[15px] text-white/85">
                  {STARTER_FEATURES.map((f) => <li key={f} className="flex gap-2.5"><Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#9fb4ff]" />{f}</li>)}
                </ul>
                <div className="mt-8"><Button href={links.call} variant="glass" arrow>Book a call</Button></div>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="spot flex h-full flex-col p-8">
                <p className="font-display text-[22px] font-semibold">Enterprise</p>
                <p className="font-display mt-2 text-[44px] font-semibold leading-[1.15]">Talk to us</p>
                <p className="mt-2 text-[14px] text-muted">For larger teams and several brands.</p>
                <ul className="mt-7 flex-1 space-y-3 text-[15px]">
                  {ENTERPRISE_FEATURES.map((f) => <li key={f} className="flex gap-2.5"><Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-emerald-500" />{f}</li>)}
                </ul>
                <div className="mt-8"><Button href={links.contact} variant="soft" arrow>Contact us</Button></div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-soft/60 py-24 sm:py-28">
        <div className="mx-auto max-w-[1000px] px-5">
          <Reveal><SectionHead eyebrow="Compare" title="What each plan includes." /></Reveal>
          <Reveal delay={100}>
            <Spot className="mt-12 overflow-x-auto !rounded-3xl">
              <table className="w-full min-w-[560px] text-left text-[15px]">
                <caption className="sr-only">Plan limits for Free, Starter and Enterprise</caption>
                <thead className="bg-soft text-[12px] font-semibold uppercase tracking-wider text-muted">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">Limit</th>
                    <th scope="col" className="px-5 py-3 text-center font-semibold">Free</th>
                    <th scope="col" className="px-5 py-3 text-center font-semibold">Starter</th>
                    <th scope="col" className="px-5 py-3 text-center font-semibold">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {PLAN_LIMITS.map((row) => (
                    <tr key={row.label} className="border-t border-line">
                      <th scope="row" className="px-5 py-3.5 font-medium">{row.label}</th>
                      <td className="px-5 py-3.5 text-center tabular-nums text-ink-soft">{row.free}</td>
                      <td className="px-5 py-3.5 text-center tabular-nums text-ink-soft">{row.starter}</td>
                      <td className="px-5 py-3.5 text-center tabular-nums text-ink-soft">{row.enterprise}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Spot>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-28 sm:py-32">
        <Reveal><SectionHead eyebrow="FAQ" title="Pricing questions, answered." /></Reveal>
        <div className="mt-14"><Faq items={FAQ} /></div>
        <JsonLd
          data={graphJsonLd([
            softwareAppNode(),
            breadcrumbNode([
              { name: "Home", path: "/" },
              { name: "Pricing", path: "/pricing" },
            ]),
            faqNode(FAQ),
          ])}
        />
      </section>

      <CtaBand title={<>Start free. <span className="text-aurora-soft">Grow when you are ready.</span></>} sub="Set up your workspace in a few minutes and invite up to 5 people free." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "Book a call", href: links.call }} />
    </>
  );
}
