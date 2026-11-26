import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, ChevronRight } from "lucide-react";
import { links, pageMeta } from "@/components/site";
import { SOLUTIONS, solutionBySlug } from "@/content/solutions";
import { comparisonBySlug } from "@/content/compare";
import { bySlug } from "@/content/products";
import { SOLUTION_DEPTH } from "@/content/solutionDepth";
import { featureBySlug } from "@/content/features";
import { PROOF_AS_OF, PROOF_FIGURES } from "@/content/proof";
import { FREE_PLAN, STARTER_PLAN } from "@/content/plans";
import { AppWindow, ProductMock } from "@/components/ProductMocks";
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
  const d = SOLUTION_DEPTH[s.slug];
  const faq = [...s.faq, ...(d?.faq ?? [])];

  return (
    <>
      <section className="relative pb-20 pt-12 sm:pt-16">
        <Aurora />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13.5px] text-muted">
            <Link href="/solutions" className="hover:text-ink">Solutions</Link><ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-ink">{s.name}</span>
          </nav>
          <h1 className="font-display mt-6 text-balance text-[42px] font-semibold leading-[1.02] sm:text-[60px]">{s.h1}</h1>
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
          {d && <Reveal delay={120}><AppWindow><ProductMock k={d.hero} /></AppWindow></Reveal>}
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

      {d && (
        <section className="border-t border-line py-20 sm:py-24">
          <div className="mx-auto max-w-[1240px] px-5 space-y-20">
            {d.scenes.map((sc, i) => (
              <div key={sc.title} className="grid items-center gap-10 lg:grid-cols-2">
                <Reveal className={i % 2 ? "lg:order-2" : ""}>
                  <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-brand">{sc.eyebrow}</p>
                  <h2 className="font-display mt-4 text-balance text-[30px] font-semibold leading-[1.08] sm:text-[40px]">{sc.title}</h2>
                  <p className="mt-5 max-w-[520px] text-[17px] leading-8 text-ink-soft">{sc.body}</p>
                </Reveal>
                <Reveal delay={120}><AppWindow><ProductMock k={sc.k} /></AppWindow></Reveal>
              </div>
            ))}
          </div>
        </section>
      )}

      {d && (
        <section className="border-t border-line bg-soft/60 py-20 sm:py-24">
          <div className="mx-auto max-w-[1100px] px-5">
            <Reveal><SectionHead eyebrow="A week in Rhinon" title={`What a normal week looks like for ${s.name.toLowerCase()}.`} sub="An example week, using only what the product does today." /></Reveal>
            <ol className="relative mt-12 space-y-3 before:absolute before:bottom-6 before:left-[22px] before:top-6 before:w-px before:bg-line">
              {d.week.map((w, i) => (
                <Reveal key={w.day} delay={i * 70}>
                  <li className="relative flex gap-5 rounded-2xl border border-line bg-white p-5">
                    <span className="font-display relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-white">{w.day.slice(0, 3)}</span>
                    <span><span className="block text-[15px] font-semibold">{w.day}</span><span className="mt-1 block text-[15.5px] leading-7 text-ink-soft">{w.line}</span></span>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5">
          <Reveal><SectionHead eyebrow="We use it ourselves" title="Rhinon Labs runs its own agency on Rhinon Tech." sub={`Real figures from our own workspace, as of ${PROOF_AS_OF}. We will add customer stories here once customers give us permission.`} /></Reveal>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PROOF_FIGURES.slice(0, 4).map((f, i) => (
              <Reveal key={f.label} delay={i * 80}>
                <div className="lt-card h-full rounded-2xl p-6">
                  <p className="font-display text-[40px] font-semibold leading-none">{f.big}</p>
                  <p className="mt-3 text-[15px] font-semibold">{f.label}</p>
                  <p className="mt-1 text-[13.5px] text-muted">{f.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Link href="/customers/rhinon-labs" className="mt-8 inline-flex items-center gap-1.5 text-[15px] font-semibold underline underline-offset-4">Read how Rhinon Labs uses it <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-5 lg:grid-cols-2">
          <Reveal>
            <SectionHead eyebrow="Set up in an afternoon" title="A starting point that fits." />
            <ul className="mt-8 space-y-4">
              {s.setup.map((t) => {
                const [label, stages] = t.includes("→") ? [t.split(":")[0], t.slice(t.indexOf(":") + 1).split("→").map((x) => x.trim())] : [t, null];
                return stages ? (
                  <li key={t}>
                    <p className="flex gap-3 text-[16px] leading-7"><ArrowRight className="mt-1.5 h-4 w-4 shrink-0 text-brand" />{label}</p>
                    <div className="ml-7 mt-3 flex flex-wrap items-center gap-1.5">
                      {stages.map((st, i) => (
                        <span key={st} className="flex items-center gap-1.5">
                          <span className={`rounded-lg border px-2.5 py-1 text-[13px] font-semibold ${i === stages.length - 1 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-line bg-white"}`}>{st}</span>
                          {i < stages.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted" />}
                        </span>
                      ))}
                    </div>
                  </li>
                ) : <li key={t} className="flex gap-3 text-[16px] leading-7"><ArrowRight className="mt-1.5 h-4 w-4 shrink-0 text-brand" />{t}</li>;
              })}
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

      <section className="border-t border-line bg-soft/60 py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5">
          <Reveal><SectionHead eyebrow="What it costs" title="Priced by the size of your team." /></Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              { size: `Up to ${FREE_PLAN.seats} people`, plan: "Free", price: "Free, no time limit", body: `Every product except the AI Agent, with ${FREE_PLAN.emailsPerDay} emails and ${FREE_PLAN.aiDraftsPerDay} AI drafts a day.` },
              { size: `${FREE_PLAN.seats + 1} to ${STARTER_PLAN.seats} people`, plan: "Starter", price: "Priced with you", body: `The AI Agent on your website, ${STARTER_PLAN.emailsPerDay} emails and ${STARTER_PLAN.aiDraftsPerDay} AI drafts a day, and your own email domain.` },
              { size: `More than ${STARTER_PLAN.seats} people`, plan: "Enterprise", price: "Talk to us", body: "No seat, email or AI caps, and up to 3 AI Agents." },
            ].map((p, i) => (
              <Reveal key={p.plan} delay={i * 90}>
                <div className={`h-full rounded-2xl border bg-white p-6 ${i === 0 ? "border-[#c9d4ff]" : "border-line"}`}>
                  <p className="text-[13.5px] text-muted">{p.size}</p>
                  <p className="font-display mt-2 text-[26px] font-semibold">{p.plan}</p>
                  <p className="mt-1 text-[15px] font-semibold text-brand">{p.price}</p>
                  <p className="mt-4 text-[15px] leading-7 text-ink-soft">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Link href="/pricing" className="mt-8 inline-flex text-[15px] font-semibold underline underline-offset-4">See every plan limit</Link>
        </div>
      </section>

      {d && (
        <section className="border-t border-line py-20 sm:py-24">
          <div className="mx-auto max-w-[1240px] px-5">
            <Reveal><SectionHead eyebrow="Go deeper" title="The parts teams ask about most." /></Reveal>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {d.features.map((slug) => featureBySlug(slug)).filter(Boolean).map((f) => (
                <Link key={f!.slug} href={`/features/${f!.slug}`} className="lt-card group flex h-full flex-col rounded-2xl p-6">
                  <span className="flex items-start justify-between gap-4">
                    <span className="font-display text-[21px] font-semibold leading-tight">{f!.name}</span>
                    <ArrowUpRight className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                  <span className="mt-3 text-[15px] leading-6 text-ink-soft">{f!.sub}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5">
          <SectionHead eyebrow="FAQ" title={`Questions from ${s.name.toLowerCase()}.`} />
          <div className="mt-12"><Faq items={faq} /></div>
        </div>
      </section>

      <CtaBand title={<>Built for <span className="text-aurora-soft">{s.name.toLowerCase()}.</span></>} sub="Set up a workspace in a few minutes and invite up to 5 people free. No credit card, no time limit." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "Book a demo", href: links.call }} />
      <JsonLd data={graphJsonLd([breadcrumbNode([{ name: "Home", path: "/" }, { name: "Solutions", path: "/solutions" }, { name: s.name, path: `/solutions/${s.slug}` }]), faqNode(faq)])} />
    </>
  );
}
