import Link from "next/link";
import { ArrowUpRight, Check, ChevronDown, Minus } from "lucide-react";
import { CAPABILITIES, CAPABILITY_GROUPS, capabilitiesIn } from "@/content/capabilities";
import { PRODUCTS } from "@/content/products";
import { IconTile } from "@/components/ui";
import { ProofStrip } from "@/components/depth";
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
  { q: "Do I need a credit card to start?", a: "No. Create a workspace and invite up to 5 people without a card." },
  { q: "Is there a time limit on the Free plan?", a: "No. Free stays free for up to 5 people; there is no trial clock." },
  { q: "Can I take my data with me?", a: "Yes. You can export your leads as a spreadsheet, export your data or delete your workspace at any time." },
  { q: "Who builds Rhinon Tech?", a: "Rhinon Labs. We build custom CRMs, AI automation and dashboards for growing companies, and we run our own agency on Rhinon Tech." },
];

const FIT = [
  { who: "A founder or small team trying it out", plan: "Free", why: "Every product except the AI Agent, for up to 5 people." },
  { who: "A 5-person agency that wants website leads answered", plan: "Starter", why: "The AI Agent is on Starter, with 1,000 replies a day." },
  { who: "A team of 6 to 25 people", plan: "Starter", why: "Free stops at 5 people; Starter covers up to 25." },
  { who: "A team sending cold email at volume", plan: "Starter", why: "500 emails and 200 AI drafts a day, from your own domain." },
  { who: "More than 25 people, or several brands", plan: "Enterprise", why: "No seat, email or AI caps, and up to 3 AI Agents." },
];

const ENTERPRISE_FEATURES = ["Everything in Starter", "Unlimited people, emails and AI drafts", "Up to 3 AI Agents across your brands", "Priority help from the team that builds it"];

export default function PricingPage() {
  return (
    <>
      <section className="relative pb-24 pt-16 sm:pt-24">
        <Aurora />
        <div className="relative mx-auto max-w-[1240px] px-5">
          <SectionHead as="h1" center eyebrow="Pricing" title={<>Free for up to 5 people. <span className="text-aurora">Grow when you are ready.</span></>} sub="Start with the whole workspace, no trial clock and no credit card. Move to Starter when your team grows or you want the AI Agent on your website." />
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

      <section className="border-b border-line py-12 sm:py-14">
        <div className="mx-auto max-w-[1000px] px-5">
          <details className="group">
            <summary className="mx-auto flex w-fit cursor-pointer list-none items-center gap-2 rounded-xl border border-line bg-white px-5 py-3 text-[15px] font-semibold hover:border-ink/20 [&::-webkit-details-marker]:hidden">
              Compare all {CAPABILITIES.length} features <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-10 overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-left text-[14.5px]">
                <caption className="sr-only">Every feature by plan</caption>
                <thead className="sticky top-0 bg-white">
                  <tr className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-muted">
                    <th scope="col" className="px-4 py-3 font-medium">Feature</th>
                    <th scope="col" className="w-[18%] px-4 py-3 text-center font-medium">Free</th>
                    <th scope="col" className="w-[18%] bg-[#f5f3ff] px-4 py-3 text-center font-medium text-[#5b3df5]">Starter</th>
                    <th scope="col" className="w-[18%] px-4 py-3 text-center font-medium">Enterprise</th>
                  </tr>
                </thead>
                {CAPABILITY_GROUPS.map((g) => (
                  <tbody key={g.name}>
                    <tr><th colSpan={4} scope="colgroup" className="px-4 pb-2 pt-8 text-left font-display text-[18px] font-bold tracking-[-0.02em]">{g.name}</th></tr>
                    {capabilitiesIn(g.name).map((cap) => (
                      <tr key={cap.label} className="border-t border-line">
                        <th scope="row" className="px-4 py-3 font-medium text-ink-soft">{cap.label}</th>
                        <td className="px-4 py-3 text-center">{cap.paid ? <Minus className="mx-auto h-4 w-4 text-muted" aria-label="Not included" /> : <Check className="mx-auto h-4 w-4 text-emerald-600" strokeWidth={3} aria-label="Included" />}</td>
                        <td className="bg-[#f5f3ff] px-4 py-3 text-center"><Check className="mx-auto h-4 w-4 text-emerald-600" strokeWidth={3} aria-label="Included" /></td>
                        <td className="px-4 py-3 text-center"><Check className="mx-auto h-4 w-4 text-emerald-600" strokeWidth={3} aria-label="Included" /></td>
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
              <p className="mt-5 text-[13.5px] text-muted">Daily limits apply on Free and Starter; see the plan limits above.</p>
            </div>
          </details>
        </div>
      </section>

      <section className="py-24 sm:py-28">
        <div className="mx-auto max-w-[1240px] px-5">
          <Reveal><SectionHead eyebrow="By product" title="What is free, product by product." sub="Only one product is paid. Everything else works on Free, within the plan's daily limits." /></Reveal>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((pr) => (
              <Link key={pr.slug} href={`/product/${pr.slug}`} className="group flex items-center gap-3.5 rounded-2xl border border-line bg-white p-4 hover:border-ink/20">
                <IconTile icon={pr.icon} tone={pr.tone} size={38} />
                <span className="min-w-0 flex-1"><span className="block text-[15.5px] font-semibold">{pr.name}</span><span className="block truncate text-[13.5px] text-ink-soft">{pr.short}</span></span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold ${pr.premium ? "bg-pink/15 text-pink" : "bg-emerald-50 text-emerald-700"}`}>{pr.premium ? "Starter" : "Free"}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-soft/60 py-24 sm:py-28">
        <div className="mx-auto max-w-[1000px] px-5">
          <Reveal><SectionHead eyebrow="Which plan" title="Pick by what your team needs." /></Reveal>
          <Spot className="mt-12 overflow-x-auto !rounded-3xl">
            <table className="w-full min-w-[620px] text-left text-[15px]">
              <caption className="sr-only">Which plan fits which team</caption>
              <thead className="bg-soft text-[12px] font-semibold uppercase tracking-wider text-muted">
                <tr><th scope="col" className="px-5 py-3">If you are</th><th scope="col" className="px-5 py-3">Plan</th><th scope="col" className="px-5 py-3">Why</th></tr>
              </thead>
              <tbody>
                {FIT.map((f) => (
                  <tr key={f.who} className="border-t border-line align-top">
                    <th scope="row" className="px-5 py-4 font-medium">{f.who}</th>
                    <td className="px-5 py-4 font-semibold text-brand">{f.plan}</td>
                    <td className="px-5 py-4 text-ink-soft">{f.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Spot>
          <div className="mt-10 flex flex-wrap items-center gap-2.5">
            <span className="text-[14.5px] text-muted">Weighing up prices?</span>
            {[["zoho-alternative", "Zoho One"], ["hubspot-alternative", "HubSpot"], ["pipedrive-alternative", "Pipedrive"], ["freshsales-alternative", "Freshsales"]].map(([slug, name]) => (
              <Link key={slug} href={`/compare/${slug}`} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-[14px] font-semibold hover:border-ink/20">vs {name}<ArrowUpRight className="h-3.5 w-3.5 text-muted" /></Link>
            ))}
          </div>
        </div>
      </section>

      <ProofStrip />

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
