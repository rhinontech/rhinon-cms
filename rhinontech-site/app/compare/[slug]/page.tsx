import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronRight, CircleDashed, Minus, X } from "lucide-react";
import { links, pageMeta } from "@/components/site";
import { COMPARISONS, RHINON, ROWS, comparisonBySlug, type Cell } from "@/content/compare";
import { Aurora, Button, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { Spot } from "@/components/Spot";
import { CtaBand, Faq } from "@/components/blocks";
import { JsonLd, breadcrumbNode, faqNode, graphJsonLd } from "@/components/schema";

type Params = Promise<{ slug: string }>;

// Only the comparisons in content/compare.ts exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const c = comparisonBySlug((await params).slug);
  if (!c) return {};
  return pageMeta({ title: c.metaTitle, description: c.metaDescription, path: `/compare/${c.slug}` });
}

const fmtDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function Mark({ cell }: { cell?: Cell }) {
  const m = cell?.mark ?? "unlisted";
  const icon =
    m === "yes" ? <Check className="h-4 w-4 text-emerald-600" strokeWidth={3} /> :
    m === "partial" ? <Minus className="h-4 w-4 text-amber-600" strokeWidth={3} /> :
    m === "no" ? <X className="h-4 w-4 text-rose-500" strokeWidth={3} /> :
    <CircleDashed className="h-4 w-4 text-muted" />;
  const label = m === "yes" ? "Yes" : m === "partial" ? "Partly" : m === "no" ? "No" : "Not listed on their page";
  return (
    <span className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0" aria-hidden>{icon}</span>
      <span>
        <span className="font-medium text-ink">{label}</span>
        {cell?.note && <span className="block text-[13px] leading-5 text-muted">{cell.note}</span>}
      </span>
    </span>
  );
}

export default async function ComparePage({ params }: { params: Params }) {
  const c = comparisonBySlug((await params).slug);
  if (!c) notFound();

  return (
    <>
      <section className="relative pb-20 pt-12 sm:pt-16">
        <Aurora />
        <div className="relative mx-auto max-w-[1240px] px-5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13.5px] text-muted">
            <Link href="/compare" className="hover:text-ink">Compare</Link><ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-ink">Rhinon Tech vs {c.competitor}</span>
          </nav>
          <h1 className="font-display mt-6 max-w-[920px] text-balance text-[40px] font-semibold leading-[1.04] sm:text-[60px]">{c.h1}</h1>
          <p className="mt-6 max-w-[760px] text-[18px] leading-8 text-ink-soft">{c.verdict}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href={links.signup}>Get started free</Button>
            <Button href={links.call} variant="soft">Book a demo</Button>
          </div>
          <p className="mt-4 text-[13.5px] text-muted">Free for up to 5 people · Facts about {c.competitor} checked on {fmtDate(c.lastChecked)}</p>
        </div>
      </section>

      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto grid max-w-[1240px] gap-5 px-5 md:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-[28px] border border-line bg-white p-8">
              <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-muted">Choose {c.competitor} if</p>
              <ul className="mt-6 space-y-4">
                {c.chooseThem.map((t) => <li key={t} className="flex gap-3 text-[16px] leading-7 text-ink-soft"><Check className="mt-1.5 h-4 w-4 shrink-0 text-muted" strokeWidth={3} />{t}</li>)}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="h-full rounded-[28px] border border-[#c9d4ff] bg-white p-8 shadow-[0_40px_80px_-40px_rgb(0_44_112_/_0.35)]">
              <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-brand">Choose Rhinon Tech if</p>
              <ul className="mt-6 space-y-4">
                {c.chooseRhinon.map((t) => <li key={t} className="flex gap-3 text-[16px] font-medium leading-7"><Check className="mt-1.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={3} />{t}</li>)}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-line bg-soft/60 py-20 sm:py-24">
        <div className="mx-auto max-w-[1100px] px-5">
          <SectionHead eyebrow="Side by side" title={`Rhinon Tech vs ${c.competitor}, feature by feature.`} sub={`"Not listed" means ${c.competitor}'s own pages didn't show it when we checked; it may still exist.`} />
          <Spot className="mt-12 overflow-x-auto !rounded-3xl">
            <table className="w-full min-w-[680px] text-left text-[15px]">
              <caption className="sr-only">Feature comparison between Rhinon Tech and {c.competitor}</caption>
              <thead className="bg-soft text-[12px] font-semibold uppercase tracking-wider text-muted">
                <tr>
                  <th scope="col" className="w-[34%] px-5 py-3 font-semibold">Feature</th>
                  <th scope="col" className="w-[33%] px-5 py-3 font-semibold text-brand">Rhinon Tech</th>
                  <th scope="col" className="w-[33%] px-5 py-3 font-semibold">{c.competitor}</th>
                </tr>
              </thead>
              <tbody>
                {c.rows.map((key) => (
                  <tr key={key} className="border-t border-line align-top">
                    <th scope="row" className="px-5 py-4 font-medium">{ROWS[key]}</th>
                    <td className="px-5 py-4"><Mark cell={RHINON[key]} /></td>
                    <td className="px-5 py-4"><Mark cell={c.them[key]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Spot>
        </div>
      </section>

      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-5 lg:grid-cols-2">
          <Reveal>
            <SectionHead eyebrow="Pricing" title="What it costs." />
            <p className="mt-6 text-[17px] leading-8 text-ink-soft">{c.pricing}</p>
            <Link href="/pricing" className="mt-5 inline-flex text-[15px] font-semibold underline underline-offset-4">See Rhinon Tech pricing</Link>
          </Reveal>
          <Reveal delay={120}>
            <SectionHead eyebrow="Switching" title={`Moving from ${c.competitor}.`} />
            <p className="mt-6 text-[17px] leading-8 text-ink-soft">{c.moving}</p>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5">
          <SectionHead eyebrow="FAQ" title={`Rhinon Tech vs ${c.competitor}: questions.`} />
          <div className="mt-12"><Faq items={c.faq} /></div>
          <div className="mx-auto mt-12 max-w-[820px] text-[13.5px] leading-6 text-muted">
            <p>Sources, checked on {fmtDate(c.lastChecked)}:{" "}
              {c.sources.map((s, i) => (
                <span key={s.url}>{i > 0 && ", "}<a href={s.url} rel="nofollow noopener" target="_blank" className="underline underline-offset-2 hover:text-ink">{s.label}</a></span>
              ))}.
              {" "}{c.competitor} is a trademark of its owner. Spotted something out of date? <Link href="/contact" className="underline underline-offset-2 hover:text-ink">Tell us</Link> and we will fix it.
            </p>
          </div>
        </div>
      </section>

      <CtaBand title={<>Try it free <span className="text-aurora-soft">alongside {c.competitor}.</span></>} sub="Set up a workspace in a few minutes and invite up to 5 people free. No credit card, no time limit." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "Book a demo", href: links.call }} />
      <JsonLd data={graphJsonLd([breadcrumbNode([{ name: "Home", path: "/" }, { name: "Compare", path: "/compare" }, { name: `vs ${c.competitor}`, path: `/compare/${c.slug}` }]), faqNode(c.faq)])} />
    </>
  );
}
