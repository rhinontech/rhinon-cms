import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { links, pageMeta } from "@/components/site";
import { COMPARISONS } from "@/content/compare";
import { Aurora, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { CtaBand, Faq } from "@/components/blocks";
import { Spot } from "@/components/Spot";
import { JsonLd, breadcrumbNode, faqNode, graphJsonLd } from "@/components/schema";

const FAQ = [
  { q: "Where do the facts about other products come from?", a: "From each company's own website, read on the date shown on its page and linked as a source. If their page did not show a feature, we mark it \"Not listed\", never \"No\"." },
  { q: "Do you say when a competitor is the better choice?", a: "Yes. Every comparison lists the teams that should pick the other tool, and says what it does better." },
  { q: "How often are comparisons updated?", a: "We re-check the facts at least every quarter and update the date on the page. If something is out of date, tell us and we will fix it." },
  { q: "Can I try Rhinon Tech next to my current tool?", a: "Yes. It is free for up to 5 people with no card, so you can run one client or one pipeline in it before deciding." },
];

const MARK = { yes: "Yes", partial: "Partly", no: "No", unlisted: "Not listed" } as const;

export const metadata = pageMeta({
  title: "Compare Rhinon Tech",
  description: "Honest comparisons of Rhinon Tech with Zoho, HubSpot, Odoo, ClickUp, monday.com, Notion, Slack, Pipedrive, Freshsales and more, including when each one is the better choice.",
  path: "/compare",
});

export default function CompareHub() {
  return (
    <>
      <section className="relative pb-20 pt-16 sm:pt-24">
        <Aurora />
        <div className="relative mx-auto max-w-[1240px] px-5">
          <SectionHead as="h1" eyebrow="Compare" title={<>How Rhinon Tech compares, <span className="text-aurora">honestly.</span></>} sub="Each page says what the other tool does better, as well as what we do. Facts about other products come from their own websites, with the date we checked." />
        </div>
      </section>
      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto grid max-w-[1240px] gap-4 px-5 sm:grid-cols-2 lg:grid-cols-3">
          {COMPARISONS.map((c, i) => (
            <Reveal key={c.slug} delay={(i % 3) * 90}>
              <Link href={`/compare/${c.slug}`} className="lt-card group flex h-full flex-col rounded-2xl p-6">
                <span className="flex items-start justify-between gap-4">
                  <span className="font-display text-[24px] font-semibold leading-tight">Rhinon Tech vs {c.competitor}</span>
                  <ArrowUpRight className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
                <span className="mt-3 text-[15px] leading-6 text-ink-soft">{c.chooseRhinon[0]}.</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="border-t border-line bg-soft/60 py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5">
          <Reveal><SectionHead eyebrow="At a glance" title="Every comparison on one table." sub="Facts from each company's own pages on the date we checked. Open a comparison for the details and sources." /></Reveal>
          <Spot className="mt-12 overflow-x-auto !rounded-3xl">
            <table className="w-full min-w-[860px] text-left text-[14.5px]">
              <caption className="sr-only">Summary of every Rhinon Tech comparison</caption>
              <thead className="bg-soft text-[12px] font-semibold uppercase tracking-wider text-muted">
                <tr><th scope="col" className="px-5 py-3">Tool</th><th scope="col" className="px-5 py-3">Pick it if</th><th scope="col" className="px-5 py-3">Free plan</th><th scope="col" className="px-5 py-3">CRM</th><th scope="col" className="px-5 py-3">Projects</th><th scope="col" className="px-5 py-3">Checked</th></tr>
              </thead>
              <tbody>
                {COMPARISONS.map((c) => (
                  <tr key={c.slug} className="border-t border-line align-top">
                    <th scope="row" className="px-5 py-4 font-semibold"><Link href={`/compare/${c.slug}`} className="underline-offset-4 hover:underline">{c.competitor}</Link></th>
                    <td className="max-w-[340px] px-5 py-4 text-ink-soft">{c.chooseThem[0]}</td>
                    <td className="px-5 py-4">{MARK[c.them.free?.mark ?? "unlisted"]}</td>
                    <td className="px-5 py-4">{MARK[c.them.crm?.mark ?? "unlisted"]}</td>
                    <td className="px-5 py-4">{MARK[c.them.projects?.mark ?? "unlisted"]}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-muted">{c.lastChecked}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Spot>
          <p className="mt-4 text-[13.5px] text-muted">Rhinon Tech: free plan for up to 5 people, CRM yes, projects yes. &quot;Not listed&quot; means the company&apos;s pages did not show it when we checked.</p>
        </div>
      </section>
      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-5 lg:grid-cols-3">
          {[
            { t: "Their facts, from their pages", b: "Every claim about another product links to the page we read it on, with the date." },
            { t: "When they are better, we say so", b: "Each page lists the teams that should pick the other tool, and why." },
            { t: "Our facts, from the product", b: "Rhinon's column matches what the product does today, including what is not built yet." },
          ].map((m, i) => (
            <Reveal key={m.t} delay={i * 90}><p className="font-display text-[22px] font-semibold">{m.t}</p><p className="mt-3 text-[15.5px] leading-7 text-ink-soft">{m.b}</p></Reveal>
          ))}
        </div>
      </section>
      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5">
          <SectionHead eyebrow="FAQ" title="How we compare." />
          <div className="mt-12"><Faq items={FAQ} /></div>
        </div>
      </section>
      <CtaBand title={<>See it for <span className="text-aurora-soft">yourself.</span></>} sub="The fastest comparison is your own: set up a free workspace for up to 5 people in a few minutes." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "Book a demo", href: links.call }} />
      <JsonLd data={graphJsonLd([breadcrumbNode([{ name: "Home", path: "/" }, { name: "Compare", path: "/compare" }]), faqNode(FAQ)])} />
    </>
  );
}
