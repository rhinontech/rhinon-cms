import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { links, pageMeta } from "@/components/site";
import { SOLUTIONS } from "@/content/solutions";
import { Aurora, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { CtaBand } from "@/components/blocks";
import { JsonLd, breadcrumbNode, graphJsonLd } from "@/components/schema";

export const metadata = pageMeta({
  title: "Solutions for Service Businesses",
  description: "How agencies, consultancies, IT and software services firms, professional services teams and startups use Rhinon Tech to win clients and deliver their work.",
  path: "/solutions",
});

export default function SolutionsHub() {
  return (
    <>
      <section className="relative pb-20 pt-16 sm:pt-24">
        <Aurora />
        <div className="relative mx-auto max-w-[1240px] px-5">
          <SectionHead as="h1" eyebrow="Solutions" title={<>Built for businesses that <span className="text-aurora">sell their expertise.</span></>} sub="Teams of 5 to 50 that win clients and then do the work for them. Pick the one closest to you." />
        </div>
      </section>
      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto grid max-w-[1240px] gap-4 px-5 sm:grid-cols-2 lg:grid-cols-3">
          {SOLUTIONS.map((s, i) => (
            <Reveal key={s.slug} delay={(i % 3) * 90}>
              <Link href={`/solutions/${s.slug}`} className="lt-card group flex h-full flex-col rounded-2xl p-6">
                <span className="flex items-start justify-between gap-4">
                  <span className="font-display text-[26px] font-semibold">{s.name}</span>
                  <ArrowUpRight className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
                <span className="mt-3 text-[15px] leading-6 text-ink-soft">{s.short}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      <CtaBand title={<>Start with <span className="text-aurora-soft">your workflow.</span></>} sub="Set up a workspace in a few minutes and invite up to 5 people free." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "Book a demo", href: links.call }} />
      <JsonLd data={graphJsonLd([breadcrumbNode([{ name: "Home", path: "/" }, { name: "Solutions", path: "/solutions" }])])} />
    </>
  );
}
