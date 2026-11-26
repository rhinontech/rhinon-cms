import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, ChevronRight } from "lucide-react";
import { links, pageMeta } from "@/components/site";
import { SOLUTIONS, solutionBySlug } from "@/content/solutions";
import { comparisonBySlug } from "@/content/compare";
import { bySlug } from "@/content/products";
import { Aurora, Button, IconTile, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { CtaBand, Faq } from "@/components/blocks";
import { GetStartedButton } from "@/components/forms/GetStartedButton";
import { JsonLd, breadcrumbNode, faqNode, graphJsonLd } from "@/components/schema";

type Params = Promise<{ slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return SOLUTIONS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const s = solutionBySlug((await params).slug);
  if (!s) return {};
  return pageMeta({ title: s.metaTitle, description: s.metaDescription, path: `/solutions/${s.slug}` });
}

export default async function SolutionPage({ params }: { params: Params }) {
  const s = solutionBySlug((await params).slug);
  if (!s) notFound();
  const featured = [...new Set(s.workflow.map((w) => w.product))].map((slug) => bySlug(slug)!);

  return (
    <>
      <section className="relative pb-20 pt-12 sm:pt-16">
        <Aurora />
        <div className="relative mx-auto max-w-[1240px] px-5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13.5px] text-muted">
            <Link href="/solutions" className="hover:text-ink">Solutions</Link><ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-ink">{s.name}</span>
          </nav>
          <h1 className="font-display mt-6 max-w-[900px] text-balance text-[42px] font-semibold leading-[1.02] sm:text-[68px]">{s.h1}</h1>
          <p className="mt-6 max-w-[720px] text-[18px] leading-8 text-ink-soft">{s.sub}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <GetStartedButton placement={`Solution: ${s.name}`} />
            <Button href={links.call} variant="soft">Book a demo</Button>
          </div>
          <p className="mt-4 text-[13.5px] text-muted">Free for up to 5 people · No credit card</p>
          <ul className="mt-12 flex flex-wrap gap-2.5">
            {featured.map((p) => (
              <li key={p.slug}>
                <Link href={`/product/${p.slug}`} className="group flex items-center gap-2 rounded-full border border-line bg-white py-1.5 pl-1.5 pr-3.5 text-[14px] font-semibold hover:border-ink/20">
                  <IconTile icon={p.icon} tone={p.tone} size={26} />{p.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5">
          <Reveal><SectionHead eyebrow="What changes" title="The problems we hear most." /></Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {s.pains.map((p, i) => (
              <Reveal key={p.title} delay={i * 100}>
                <div className="lt-card h-full rounded-2xl p-7">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">0{i + 1}</p>
                  <p className="font-display mt-3 text-[22px] font-semibold leading-tight">{p.title}</p>
                  <p className="mt-3 text-[15px] leading-7 text-ink-soft">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-soft/60 py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5">
          <Reveal><SectionHead eyebrow="How it fits" title="Your workflow in Rhinon, step by step." sub="Each step is a product you can use today. Open any of them to see how it works." /></Reveal>
          <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {s.workflow.map((w, i) => {
              const p = bySlug(w.product)!;
              return (
                <Reveal key={w.stage + i} delay={(i % 3) * 90}>
                  <li className="h-full">
                    <Link href={`/product/${p.slug}`} className="group flex h-full flex-col rounded-2xl border border-line bg-white p-6 hover:border-ink/20">
                      <span className="flex items-center justify-between">
                        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">Step {i + 1} · {w.stage}</span>
                        <ArrowUpRight className="h-4 w-4 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </span>
                      <span className="mt-4 flex items-center gap-2.5 text-[17px] font-semibold"><IconTile icon={p.icon} tone={p.tone} size={30} />{p.name}</span>
                      <span className="mt-3 text-[15px] leading-6 text-ink-soft">{w.line}</span>
                    </Link>
                  </li>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-5 lg:grid-cols-2">
          <Reveal>
            <SectionHead eyebrow="Set up in an afternoon" title="A starting point that fits." />
            <ul className="mt-8 space-y-4">
              {s.setup.map((t) => <li key={t} className="flex gap-3 text-[16px] leading-7"><ArrowRight className="mt-1.5 h-4 w-4 shrink-0 text-brand" />{t}</li>)}
            </ul>
          </Reveal>
          <Reveal delay={120}>
            <SectionHead eyebrow="Weighing it up" title="Compared with tools you may use." />
            <ul className="mt-8 space-y-3">
              {s.compare.map((slug) => {
                const c = comparisonBySlug(slug);
                return c ? (
                  <li key={slug}>
                    <Link href={`/compare/${slug}`} className="group flex items-center justify-between rounded-2xl border border-line bg-white px-5 py-4 text-[16px] font-semibold hover:border-ink/20">
                      Rhinon Tech vs {c.competitor}
                      <ArrowUpRight className="h-4 w-4 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ) : null;
              })}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5">
          <SectionHead eyebrow="FAQ" title={`Questions from ${s.name.toLowerCase()}.`} />
          <div className="mt-12"><Faq items={s.faq} /></div>
        </div>
      </section>

      <CtaBand title={<>Built for <span className="text-aurora-soft">{s.name.toLowerCase()}.</span></>} sub="Set up a workspace in a few minutes and invite up to 5 people free. No credit card, no time limit." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "Book a demo", href: links.call }} />
      <JsonLd data={graphJsonLd([breadcrumbNode([{ name: "Home", path: "/" }, { name: "Solutions", path: "/solutions" }, { name: s.name, path: `/solutions/${s.slug}` }]), faqNode(s.faq)])} />
    </>
  );
}
