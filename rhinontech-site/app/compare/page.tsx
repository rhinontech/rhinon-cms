import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { links, pageMeta } from "@/components/site";
import { COMPARISONS } from "@/content/compare";
import { Aurora, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { CtaBand } from "@/components/blocks";
import { JsonLd, breadcrumbNode, graphJsonLd } from "@/components/schema";

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
      <CtaBand title={<>See it for <span className="text-aurora-soft">yourself.</span></>} sub="The fastest comparison is your own: set up a free workspace for up to 5 people in a few minutes." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "Book a demo", href: links.call }} />
      <JsonLd data={graphJsonLd([breadcrumbNode([{ name: "Home", path: "/" }, { name: "Compare", path: "/compare" }])])} />
    </>
  );
}
