import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check, ChevronRight } from "lucide-react";
import { links, pageMeta } from "@/components/site";
import { FEATURES, featureBySlug } from "@/content/features";
import { bySlug } from "@/content/products";
import { FEATURE_DEPTH } from "@/content/featureDepth";
import { solutionBySlug } from "@/content/solutions";
import { comparisonBySlug } from "@/content/compare";
import { ProductStage } from "@/components/kit";
import { Aurora, Button, IconTile, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { CtaBand, Faq } from "@/components/blocks";
import { GetStartedButton } from "@/components/forms/GetStartedButton";
import { JsonLd, breadcrumbNode, faqNode, graphJsonLd } from "@/components/schema";

type Params = Promise<{ slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return FEATURES.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const f = featureBySlug((await params).slug);
  if (!f) return {};
  return pageMeta({ title: f.metaTitle, description: f.metaDescription, path: `/features/${f.slug}` });
}

export default async function FeaturePage({ params }: { params: Params }) {
  const f = featureBySlug((await params).slug);
  if (!f) notFound();
  const parent = bySlug(f.product)!;
  const d = FEATURE_DEPTH[f.slug];
  const faq = [...f.faq, ...(d?.faq ?? [])];

  return (
    <>
      <section className="relative pb-20 pt-12 sm:pt-16">
        <Aurora tones={[parent.tone[0], parent.tone[1]]} />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13.5px] text-muted">
            <Link href="/product" className="hover:text-ink">Product</Link><ChevronRight className="h-3.5 w-3.5" />
            <Link href={`/product/${parent.slug}`} className="hover:text-ink">{parent.name}</Link><ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-ink">{f.name}</span>
          </nav>
          <div className="mt-6"><IconTile icon={parent.icon} tone={parent.tone} size={52} /></div>
          <h1 className="font-display mt-6 text-balance text-[40px] font-semibold leading-[1.04] sm:text-[56px]">{f.h1}</h1>
          <p className="mt-6 max-w-[720px] text-[18px] leading-8 text-ink-soft">{f.sub}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <GetStartedButton placement={`Feature: ${f.name}`} />
            <Button href={links.call} variant="soft">Book a demo</Button>
          </div>
          <p className="mt-4 text-[13.5px] text-muted">Free for up to 5 people · No credit card</p>
          </div>
          {d && <Reveal delay={120}><ProductStage k={d.mock} chip={{ title: f.steps[1].title, sub: parent.name }} /></Reveal>}
        </div>
      </section>

      {d && (
        <section className="border-t border-line py-20 sm:py-24">
          <div className="mx-auto max-w-[860px] px-5">
            <Reveal>
              <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-brand">Why it matters</p>
              <h2 className="font-display mt-4 text-balance text-[32px] font-semibold leading-[1.08] sm:text-[44px]">{d.why.title}</h2>
              {d.why.paras.map((p) => <p key={p.slice(0, 24)} className="mt-6 text-[17.5px] leading-8 text-ink-soft">{p}</p>)}
            </Reveal>
          </div>
        </section>
      )}

      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5">
          <Reveal><SectionHead eyebrow="How it works" title="Three steps." /></Reveal>
          <ol className="hair mt-12 md:grid-cols-3">
            {f.steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 100}>
                <li className="h-full p-7">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-semibold text-white" style={{ background: `linear-gradient(140deg, ${parent.tone[0]}, ${parent.tone[1]})` }}>{i + 1}</span>
                  <p className="font-display mt-5 text-[22px] font-semibold">{s.title}</p>
                  <p className="mt-2 text-[15px] leading-7 text-ink-soft">{s.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-line bg-soft/60 py-20 sm:py-24">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <SectionHead eyebrow="The details" title="What you get." />
            <ul className="mt-8 space-y-4">
              {f.details.map((d) => <li key={d} className="flex gap-3 text-[16px] leading-7"><Check className="mt-1.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={3} />{d}</li>)}
            </ul>
          </Reveal>
          <Reveal delay={120}>
            <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-muted">Part of</p>
            <ul className="mt-4 space-y-3">
              {f.related.map((slug) => {
                const p = bySlug(slug)!;
                return (
                  <li key={slug}>
                    <Link href={`/product/${slug}`} className="group flex items-center gap-4 rounded-2xl border border-line bg-white p-5 hover:border-ink/20">
                      <IconTile icon={p.icon} tone={p.tone} size={40} />
                      <span className="min-w-0 flex-1"><span className="block text-[17px] font-semibold">{p.name}</span><span className="block text-[14px] text-ink-soft">{p.short}</span></span>
                      <ArrowUpRight className="h-4 w-4 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </div>
      </section>

      {d && (
        <section className="border-t border-line py-20 sm:py-24">
          <div className="mx-auto max-w-[1240px] px-5">
            <Reveal><SectionHead eyebrow="Who uses it" title="How different teams use it." /></Reveal>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {d.uses.map((u, i) => {
                const s = solutionBySlug(u.solution);
                return s ? (
                  <Reveal key={u.solution} delay={i * 90}>
                    <Link href={`/solutions/${s.slug}`} className="lt-card group flex h-full flex-col rounded-2xl p-6">
                      <span className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-muted">{s.name}<ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
                      <span className="mt-4 text-[16px] leading-7">{u.line}</span>
                    </Link>
                  </Reveal>
                ) : null;
              })}
            </div>
            <div className="mt-14">
              <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-muted">Compared with</p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {d.compare.map((slug) => comparisonBySlug(slug)).filter(Boolean).map((cm) => (
                  <Link key={cm!.slug} href={`/compare/${cm!.slug}`} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-[14.5px] font-semibold hover:border-ink/20">Rhinon Tech vs {cm!.competitor}<ArrowUpRight className="h-3.5 w-3.5 text-muted" /></Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5">
          <SectionHead eyebrow="FAQ" title={`${f.name}: questions.`} />
          <div className="mt-12"><Faq items={faq} /></div>
        </div>
      </section>

      <CtaBand tone={parent.tone} title={<>Try {f.name.toLowerCase()} <span className="text-aurora-soft">free.</span></>} sub="Set up a workspace in a few minutes and invite up to 5 people free. No credit card, no time limit." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: `See ${parent.name}`, href: `/product/${parent.slug}` }} />
      <JsonLd data={graphJsonLd([breadcrumbNode([{ name: "Home", path: "/" }, { name: parent.name, path: `/product/${parent.slug}` }, { name: f.name, path: `/features/${f.slug}` }]), faqNode(faq)])} />
    </>
  );
}
