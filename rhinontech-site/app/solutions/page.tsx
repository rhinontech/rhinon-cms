import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { links, pageMeta } from "@/components/site";
import { SOLUTIONS } from "@/content/solutions";
import { Aurora, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { CtaBand, Faq } from "@/components/blocks";
import { FitBlock, LifecycleFlow, ProofStrip } from "@/components/depth";
import { bySlug } from "@/content/products";
import { IconTile } from "@/components/ui";
import { JsonLd, breadcrumbNode, faqNode, graphJsonLd } from "@/components/schema";

const FAQ = [
  { q: "What kind of business is Rhinon Tech for?", a: "Service businesses of 5 to 50 people that win clients and then deliver work for them: agencies, consultancies, IT and software services firms, professional services teams and founder-led startups." },
  { q: "Do I have to use every product?", a: "No. Start with the CRM, or only Projects, and add the rest when you need them. They share one login and one record per client." },
  { q: "Is there a version for my industry?", a: "Every workspace has the same products; the solution pages show how each kind of business sets them up, such as pipeline stages and project views." },
  { q: "How much does it cost?", a: "Free for up to 5 people, with every product except the AI Agent. Starter covers up to 25 people and adds the AI Agent, priced with you." },
  { q: "Is it only for Indian businesses?", a: "No. Rhinon Tech is built in India and works for teams anywhere. Deal values work in your currency, including ₹." },
];

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
                <span className="mt-4 text-[14.5px] leading-6"><span className="font-semibold">The problem we hear most:</span> <span className="text-ink-soft">{s.pains[0].title.toLowerCase()}.</span></span>
                <span className="mt-auto flex flex-wrap gap-1.5 pt-5">
                  {[...new Set(s.workflow.map((w) => w.product))].map((slug) => { const pr = bySlug(slug)!; return <span key={slug} className="flex items-center gap-1.5 rounded-full border border-line bg-white py-1 pl-1 pr-2.5 text-[12.5px] font-semibold"><IconTile icon={pr.icon} tone={pr.tone} size={20} />{pr.name}</span>; })}
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      <LifecycleFlow />
      <FitBlock good={["You win clients and then deliver projects for them", "You are a team of 5 to 50 people", "You want sales, delivery and the team in one workspace", "You want AI to answer visitors and draft follow-ups, with a person approving"]} />
      <ProofStrip soft />
      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5">
          <SectionHead eyebrow="FAQ" title="Questions before you pick." />
          <div className="mt-12"><Faq items={FAQ} /></div>
        </div>
      </section>
      <CtaBand title={<>Start with <span className="text-aurora-soft">your workflow.</span></>} sub="Set up a workspace in a few minutes and invite up to 5 people free." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "Book a demo", href: links.call }} />
      <JsonLd data={graphJsonLd([breadcrumbNode([{ name: "Home", path: "/" }, { name: "Solutions", path: "/solutions" }]), faqNode(FAQ)])} />
    </>
  );
}
