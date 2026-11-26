import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check, ChevronRight, CircleDashed, Minus, X } from "lucide-react";
import { links, pageMeta } from "@/components/site";
import { COMPARISONS, RHINON, ROWS, comparisonBySlug, type Cell, type Comparison } from "@/content/compare";
import { COMPARE_DEPTH, DIFFERENCE, type CompareDepth } from "@/content/compareDepth";
import { FREE_FEATURES, PLAN_LIMITS, STARTER_PLAN } from "@/content/plans";
import { AppWindow, ProductMock } from "@/components/ProductMocks";
import { Aurora, Button, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { Spot } from "@/components/Spot";
import { CtaBand, Faq } from "@/components/blocks";
import { JsonLd, breadcrumbNode, faqNode, graphJsonLd } from "@/components/schema";

type Params = Promise<{ slug: string }>;
type QA = { q: string; a: string };

/** The address bar shown over a product screen (mock keys that differ from the app path). */
const APP_PATH: Partial<Record<string, string>> = { chatbot: "ai-agent", work: "projects", pages: "docs" };

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

/** FAQ groups that every comparison shares, worded for the competitor on the page. */
function sharedFaq(c: Comparison): { pricing: QA[]; switching: QA[] } {
  return {
    pricing: [
      { q: "What is in Rhinon Tech's free plan?", a: `${FREE_FEATURES[0]}, plus ${FREE_FEATURES.slice(1).join(", ").toLowerCase()}. There is no time limit and no credit card.` },
      { q: "What happens when we add a sixth person?", a: `The Free plan stops at 5 people. Starter covers up to ${STARTER_PLAN.seats} people with higher daily limits, and we give you a clear price before anything is set up.` },
      { q: "Is the AI Agent free?", a: `No. The AI Agent is on the Starter plan, with ${STARTER_PLAN.aiAgentRepliesPerDay.toLocaleString("en-IN")} replies a day. Every other product works without it on Free.` },
    ],
    switching: [
      { q: `Can we try Rhinon Tech without leaving ${c.competitor}?`, a: `Yes. Start a free workspace for up to 5 people and run it next to ${c.competitor} on one client or one pipeline before deciding. No card is needed.` },
      { q: "Can we take our data with us if we leave Rhinon Tech?", a: "Yes. You can export your leads as a spreadsheet, export your data or delete your workspace at any time." },
      { q: "Will you help us move?", a: "Yes. Book a demo and we will help you plan the move, set up your pipeline stages and bring your contacts across." },
    ],
  };
}

function related(c: Comparison, d?: CompareDepth): Comparison[] {
  const others = COMPARISONS.filter((o) => o.slug !== c.slug);
  const lead = d?.focus[0];
  const same = others.filter((o) => COMPARE_DEPTH[o.slug]?.focus[0] === lead);
  return [...same, ...others.filter((o) => !same.includes(o))].slice(0, 3);
}

export default async function ComparePage({ params }: { params: Params }) {
  const c = comparisonBySlug((await params).slug);
  if (!c) notFound();
  const d = COMPARE_DEPTH[c.slug];
  const faq = sharedFaq(c);
  const allFaq = [...c.faq, ...faq.pricing, ...faq.switching];
  const yes = (cells: Partial<Record<string, Cell>>) => c.rows.filter((k) => cells[k]?.mark === "yes").length;
  const jump = [
    d && { id: "reasons", label: "Why teams switch" },
    { id: "features", label: "Feature by feature" },
    d && { id: "fit", label: "Which fits your team" },
    { id: "pricing", label: "Pricing" },
    { id: "switching", label: "Switching" },
    { id: "faq", label: "FAQ" },
  ].filter(Boolean) as { id: string; label: string }[];

  return (
    <>
      <section className="relative pb-16 pt-12 sm:pt-16">
        <Aurora />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13.5px] text-muted">
              <Link href="/compare" className="hover:text-ink">Compare</Link><ChevronRight className="h-3.5 w-3.5" />
              <span className="font-medium text-ink">Rhinon Tech vs {c.competitor}</span>
            </nav>
            <h1 className="font-display mt-6 text-balance text-[40px] font-semibold leading-[1.04] sm:text-[56px]">{c.h1}</h1>
            <p className="mt-6 max-w-[640px] text-[18px] leading-8 text-ink-soft">{c.verdict}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href={links.signup}>Get started free</Button>
              <Button href={links.call} variant="soft">Book a demo</Button>
            </div>
            <p className="mt-4 text-[13.5px] text-muted">Free for up to 5 people · Facts about {c.competitor} checked on {fmtDate(c.lastChecked)}</p>
          </div>
          {d && (
            <Reveal delay={120}>
              <AppWindow url={`rhinontech.in/${APP_PATH[d.focus[0]] ?? d.focus[0]}`}>
                <ProductMock k={d.focus[0]} />
              </AppWindow>
            </Reveal>
          )}
        </div>
        <nav aria-label="On this page" className="relative mx-auto mt-14 max-w-[1240px] px-5">
          <ul className="flex flex-wrap gap-2">
            {jump.map((j) => (
              <li key={j.id}><a href={`#${j.id}`} className="inline-flex rounded-full border border-line bg-white px-3.5 py-1.5 text-[13.5px] font-medium text-ink-soft hover:border-ink/20 hover:text-ink">{j.label}</a></li>
            ))}
          </ul>
        </nav>
      </section>

      {d && (
        <section id="reasons" className="scroll-mt-24 border-t border-line py-20 sm:py-24">
          <div className="mx-auto max-w-[1240px] px-5">
            <Reveal><SectionHead eyebrow="Why teams switch" title={`${d.reasons.length} reasons service teams pick Rhinon Tech over ${c.competitor}.`} /></Reveal>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {d.reasons.map((r, i) => (
                <Reveal key={r.title} delay={i * 90}>
                  <div className="lt-card h-full rounded-2xl p-6">
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">0{i + 1}</p>
                    <p className="font-display mt-3 text-[21px] font-semibold leading-tight">{r.title}</p>
                    <p className="mt-3 text-[15px] leading-7 text-ink-soft">{r.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

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

      <section id="features" className="scroll-mt-24 border-t border-line bg-soft/60 py-20 sm:py-24">
        <div className="mx-auto max-w-[1100px] px-5">
          <SectionHead eyebrow="Side by side" title={`Rhinon Tech vs ${c.competitor}, feature by feature.`} sub={`"Not listed" means ${c.competitor}'s own pages didn't show it when we checked; it may still exist.`} />
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#c9d4ff] bg-white px-5 py-4"><p className="text-[13px] text-muted">Rhinon Tech</p><p className="font-display mt-1 text-[28px] font-semibold">{yes(RHINON)} of {c.rows.length} <span className="text-[16px] font-medium text-ink-soft">fully covered</span></p></div>
            <div className="rounded-2xl border border-line bg-white px-5 py-4"><p className="text-[13px] text-muted">{c.competitor}</p><p className="font-display mt-1 text-[28px] font-semibold">{yes(c.them)} of {c.rows.length} <span className="text-[16px] font-medium text-ink-soft">fully covered</span></p></div>
          </div>
          <Spot className="mt-6 overflow-x-auto !rounded-3xl">
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
          <p className="mt-4 text-[13.5px] text-muted">The count is the rows marked Yes; Partly and Not listed are not counted. It shows coverage, not quality: read the notes.</p>
        </div>
      </section>

      {d && (
        <section className="border-t border-line py-20 sm:py-24">
          <div className="mx-auto max-w-[1240px] px-5">
            <Reveal><SectionHead eyebrow="Day to day" title="What the difference looks like." sub="Drawn from the app's real screens, with made-up data." /></Reveal>
            <div className="mt-14 space-y-20">
              {[d.focus[1], d.focus[2]].map((k, i) => (
                <div key={k} className="grid items-center gap-10 lg:grid-cols-2">
                  <Reveal className={i % 2 ? "lg:order-2" : ""}>
                    <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-brand">{DIFFERENCE[k].eyebrow}</p>
                    <h3 className="font-display mt-4 text-balance text-[30px] font-semibold leading-[1.08] sm:text-[38px]">{DIFFERENCE[k].title}</h3>
                    <p className="mt-5 max-w-[520px] text-[17px] leading-8 text-ink-soft">{DIFFERENCE[k].body}</p>
                  </Reveal>
                  <Reveal delay={120}><AppWindow><ProductMock k={k} /></AppWindow></Reveal>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {d && (
        <section id="fit" className="scroll-mt-24 border-t border-line bg-soft/60 py-20 sm:py-24">
          <div className="mx-auto max-w-[1100px] px-5">
            <Reveal><SectionHead eyebrow="Which fits" title="The verdict, by kind of team." sub={`Some teams are better off with ${c.competitor}. This is our honest read.`} /></Reveal>
            <Spot className="mt-12 overflow-x-auto !rounded-3xl">
              <table className="w-full min-w-[640px] text-left text-[15px]">
                <caption className="sr-only">Which tool fits which kind of team</caption>
                <thead className="bg-soft text-[12px] font-semibold uppercase tracking-wider text-muted">
                  <tr><th scope="col" className="w-[36%] px-5 py-3">If you are</th><th scope="col" className="w-[20%] px-5 py-3">Pick</th><th scope="col" className="px-5 py-3">Why</th></tr>
                </thead>
                <tbody>
                  {d.fit.map((f) => (
                    <tr key={f.team} className="border-t border-line align-top">
                      <th scope="row" className="px-5 py-4 font-medium">{f.team}</th>
                      <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[13px] font-semibold ${f.pick === "rhinon" ? "bg-[#eef1ff] text-brand" : "bg-soft text-ink"}`}>{f.pick === "rhinon" ? "Rhinon Tech" : c.competitor}</span></td>
                      <td className="px-5 py-4 text-ink-soft">{f.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Spot>
          </div>
        </section>
      )}

      <section id="pricing" className="scroll-mt-24 border-t border-line py-20 sm:py-24">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <SectionHead eyebrow="Pricing" title="What it costs." />
            <p className="mt-6 text-[17px] leading-8 text-ink-soft">{c.pricing}</p>
            <p className="mt-4 text-[15px] leading-7 text-muted">Prices change often: check {c.competitor}&apos;s own pricing page before you decide.</p>
            <Link href="/pricing" className="mt-5 inline-flex text-[15px] font-semibold underline underline-offset-4">See Rhinon Tech pricing</Link>
          </Reveal>
          <Reveal delay={120}>
            <Spot className="overflow-x-auto !rounded-3xl">
              <table className="w-full min-w-[460px] text-left text-[14.5px]">
                <caption className="sr-only">Rhinon Tech plan limits</caption>
                <thead className="bg-soft text-[12px] font-semibold uppercase tracking-wider text-muted">
                  <tr><th scope="col" className="px-5 py-3">Rhinon Tech</th><th scope="col" className="px-5 py-3">Free</th><th scope="col" className="px-5 py-3 text-brand">Starter</th></tr>
                </thead>
                <tbody>
                  {PLAN_LIMITS.map((r) => (
                    <tr key={r.label} className="border-t border-line align-top">
                      <th scope="row" className="px-5 py-3.5 font-medium">{r.label}</th>
                      <td className="px-5 py-3.5 text-ink-soft">{r.free}</td>
                      <td className="px-5 py-3.5 text-ink-soft">{r.starter}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-line"><th scope="row" className="px-5 py-3.5 font-medium">Price</th><td className="px-5 py-3.5 font-semibold">Free, no time limit</td><td className="px-5 py-3.5 text-ink-soft">Priced with you</td></tr>
                </tbody>
              </table>
            </Spot>
          </Reveal>
        </div>
      </section>

      <section id="switching" className="scroll-mt-24 border-t border-line bg-soft/60 py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5">
          <Reveal><SectionHead eyebrow="Switching" title={`Moving from ${c.competitor}, in three steps.`} /></Reveal>
          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              { t: `Start free alongside ${c.competitor}`, b: `Create a workspace and invite up to 5 people. Nothing in ${c.competitor} needs to change yet.` },
              { t: "Bring your data across", b: c.moving },
              { t: "Move one live client first", b: "Set up your pipeline stages and one project, run them for a week, then move the rest once the team is comfortable." },
            ].map((s, i) => (
              <Reveal key={s.t} delay={i * 90}>
                <li className="h-full rounded-2xl border border-line bg-white p-6">
                  <span className="font-display flex h-9 w-9 items-center justify-center rounded-full bg-ink text-[15px] font-semibold text-white">{i + 1}</span>
                  <p className="font-display mt-5 text-[20px] font-semibold leading-tight">{s.t}</p>
                  <p className="mt-3 text-[15px] leading-7 text-ink-soft">{s.b}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 border-t border-line py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5">
          <SectionHead eyebrow="FAQ" title={`Rhinon Tech vs ${c.competitor}: questions.`} />
          {[
            { h: `About ${c.competitor}`, items: c.faq },
            { h: "Pricing and plans", items: faq.pricing },
            { h: "Switching and your data", items: faq.switching },
          ].map((g) => (
            <div key={g.h} className="mt-12">
              <h3 className="mx-auto mb-5 max-w-[820px] font-mono text-[12px] uppercase tracking-[0.16em] text-muted">{g.h}</h3>
              <Faq items={g.items} />
            </div>
          ))}
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

      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5">
          <SectionHead eyebrow="More comparisons" title="Weighing up other tools?" />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {related(c, d).map((o) => (
              <Link key={o.slug} href={`/compare/${o.slug}`} className="lt-card group flex h-full flex-col rounded-2xl p-6">
                <span className="flex items-start justify-between gap-4">
                  <span className="font-display text-[22px] font-semibold leading-tight">Rhinon Tech vs {o.competitor}</span>
                  <ArrowUpRight className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
                <span className="mt-3 text-[15px] leading-6 text-ink-soft">{o.chooseRhinon[0]}.</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand title={<>Try it free <span className="text-aurora-soft">alongside {c.competitor}.</span></>} sub="Set up a workspace in a few minutes and invite up to 5 people free. No credit card, no time limit." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "Book a demo", href: links.call }} />
      <JsonLd data={graphJsonLd([breadcrumbNode([{ name: "Home", path: "/" }, { name: "Compare", path: "/compare" }, { name: `vs ${c.competitor}`, path: `/compare/${c.slug}` }]), faqNode(allFaq)])} />
    </>
  );
}
