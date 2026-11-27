import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Bot, Briefcase, Check, ChevronRight, CircleDashed, FileText, Gift, Inbox, LayoutList, Minus, MessagesSquare, Send, Share2, Target, UsersRound, X, type LucideIcon } from "lucide-react";
import { links, pageMeta } from "@/components/site";
import { COMPARISONS, RHINON, ROWS, comparisonBySlug, type Cell, type Comparison } from "@/content/compare";
import { COMPARE_DEPTH, DIFFERENCE, type CompareDepth } from "@/content/compareDepth";
import { FREE_FEATURES, PLAN_LIMITS, STARTER_PLAN } from "@/content/plans";
import type { MockKey } from "@/content/products";
import { Aurora, Button, SectionHead } from "@/components/ui";
import { Checker, PainRow, ProductStage } from "@/components/kit";
import { GetStartedButton } from "@/components/forms/GetStartedButton";
import { Reveal } from "@/components/Reveal";
import { Spot } from "@/components/Spot";
import { CtaBand, Faq } from "@/components/blocks";
import { JsonLd, breadcrumbNode, faqNode, graphJsonLd } from "@/components/schema";

type Params = Promise<{ slug: string }>;
type QA = { q: string; a: string };

/** Short labels and icons for the "what you would add" row, in priority order. */
const GAP_ORDER: { key: keyof typeof ROWS; short: string; icon: LucideIcon }[] = [
  { key: "handoff", short: "Won deal becomes a project", icon: Briefcase },
  { key: "portal", short: "A client portal", icon: Share2 },
  { key: "agent", short: "An AI agent on your website", icon: Bot },
  { key: "outreach", short: "AI cold email sequences", icon: Send },
  { key: "crm", short: "A CRM and pipeline", icon: Target },
  { key: "chat", short: "Team chat and calls", icon: MessagesSquare },
  { key: "projects", short: "Projects and tasks", icon: LayoutList },
  { key: "hr", short: "HR and e-signed offer letters", icon: UsersRound },
  { key: "docs", short: "Docs and a wiki", icon: FileText },
  { key: "inbox", short: "A team inbox", icon: Inbox },
  { key: "free", short: "A free plan", icon: Gift },
];

/** The three biggest things Rhinon includes that the competitor's own pages didn't show as a full yes. */
function gaps(c: Comparison) {
  const label = (m?: string) => (m === "no" ? "No" : m === "partial" ? "Partly" : "Not listed on their pages");
  return GAP_ORDER.filter((g) => c.rows.includes(g.key) && RHINON[g.key]?.mark === "yes" && c.them[g.key]?.mark !== "yes")
    .slice(0, 3)
    .map((g) => ({ icon: g.icon, title: g.short, body: `${c.competitor}: ${label(c.them[g.key]?.mark)}${c.them[g.key]?.note ? `, ${c.them[g.key]!.note!.charAt(0).toLowerCase()}${c.them[g.key]!.note!.slice(1)}` : ""}. Rhinon: included.` }));
}

/** Three product screens for the checkerboard: the two "difference" screens, then one more not yet shown. */
function screens(d: CompareDepth): MockKey[] {
  const extra = (["work", "crm", "chatbot", "outreach", "chat", "pages"] as MockKey[]).find((k) => !d.focus.includes(k))!;
  return [d.focus[1], d.focus[2], extra];
}

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
  const gapItems = gaps(c);
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
      {/* Hero: the verdict on the left, the product on a vivid stage on the right. */}
      <section className="relative pb-14 pt-12 sm:pt-16">
        <Aurora />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 lg:grid-cols-[1fr_1fr]">
          <div>
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13.5px] text-muted">
              <Link href="/compare" className="hover:text-ink">Compare</Link><ChevronRight className="h-3.5 w-3.5" />
              <span className="font-medium text-ink">Rhinon Tech vs {c.competitor}</span>
            </nav>
            <p className="mt-7 font-mono text-[12px] font-medium uppercase tracking-[0.14em] text-[#5b3df5]">{c.competitor} alternative · for service businesses</p>
            <h1 className="font-display mt-4 text-balance text-[40px] leading-[1.03] sm:text-[58px]">{c.h1}</h1>
            <p className="mt-6 max-w-[600px] text-[17.5px] leading-8 text-ink-soft">{c.verdict}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <GetStartedButton placement={`Compare: ${c.competitor}`} />
              <span className="text-[13.5px] leading-5 text-muted">Free for up to 5 people.<br />No credit card.</span>
            </div>
            <p className="mt-5 text-[13px] text-muted">Facts about {c.competitor} checked on {fmtDate(c.lastChecked)}, from its own pages.</p>
          </div>
          {d && <Reveal delay={120}><ProductStage k={d.focus[0]} chip={{ title: DIFFERENCE[d.focus[0]].eyebrow, sub: "Included in Rhinon Tech" }} /></Reveal>}
        </div>
        <nav aria-label="On this page" className="relative mx-auto mt-14 max-w-[1240px] px-5">
          <ul className="flex flex-wrap gap-2">
            {jump.map((j) => (
              <li key={j.id}><a href={`#${j.id}`} className="inline-flex rounded-full border border-line bg-white px-3.5 py-1.5 text-[13.5px] font-medium text-ink-soft hover:border-ink/20 hover:text-ink">{j.label}</a></li>
            ))}
          </ul>
        </nav>
      </section>

      {/* What you would add: generated from the dated feature data below. */}
      {gapItems.length > 0 && (
        <section className="border-t border-line py-12">
          <div className="mx-auto max-w-[1240px] px-5">
            <p className="mb-6 font-mono text-[11.5px] font-medium uppercase tracking-[0.14em] text-muted">What Rhinon adds to a {c.competitor} setup</p>
            <PainRow items={gapItems} />
          </div>
        </section>
      )}

      {d && (
        <section id="reasons" className="scroll-mt-24 border-t border-line py-20 sm:py-28">
          <div className="mx-auto max-w-[1240px] px-5">
            <Reveal><SectionHead center eyebrow="Why teams switch" title={`${d.reasons.length} reasons service teams pick Rhinon Tech over ${c.competitor}.`} /></Reveal>
            <div className="hair mt-14 sm:grid-cols-2 lg:grid-cols-4">
              {d.reasons.map((r, i) => (
                <Reveal key={r.title} delay={i * 90}>
                  <div className="h-full p-7">
                    <p className="font-mono text-[11.5px] font-medium uppercase tracking-[0.14em] text-[#5b3df5]">0{i + 1}</p>
                    <p className="font-display mt-3 text-[21px] font-bold leading-tight tracking-[-0.035em]">{r.title}</p>
                    <p className="mt-3 text-[15px] leading-7 text-ink-soft">{r.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <div className="mt-14">
              <Checker rows={screens(d).map((k) => ({ eyebrow: DIFFERENCE[k].eyebrow, title: DIFFERENCE[k].title, body: DIFFERENCE[k].body, k, href: `/product/${k === "chatbot" ? "ai-agent" : k === "work" ? "projects" : k === "pages" ? "docs" : k}` }))} />
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5">
          <div className="hair md:grid-cols-2">
            <div className="p-8 sm:p-10">
              <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted">Choose {c.competitor} if</p>
              <ul className="mt-6 space-y-4">
                {c.chooseThem.map((t) => <li key={t} className="flex gap-3 text-[16px] leading-7 text-ink-soft"><Check className="mt-1.5 h-4 w-4 shrink-0 text-muted" strokeWidth={3} />{t}</li>)}
              </ul>
            </div>
            <div className="bg-[#fbfbff] p-8 sm:p-10">
              <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-[#5b3df5]">Choose Rhinon Tech if</p>
              <ul className="mt-6 space-y-4">
                {c.chooseRhinon.map((t) => <li key={t} className="flex gap-3 text-[16px] font-medium leading-7"><Check className="mt-1.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={3} />{t}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* The comparison table: Rhinon's column is highlighted, as the column you are evaluating. */}
      <section id="features" className="scroll-mt-24 border-t border-line py-20 sm:py-28">
        <div className="mx-auto max-w-[1100px] px-5">
          <SectionHead center eyebrow="Compare" title={`Rhinon Tech vs ${c.competitor}, feature by feature.`} sub={`"Not listed" means ${c.competitor}'s own pages didn't show it when we checked; it may still exist.`} />
          <div className="mt-12 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-[15px]">
              <caption className="sr-only">Feature comparison between Rhinon Tech and {c.competitor}</caption>
              <thead>
                <tr>
                  <th scope="col" className="w-[34%] px-5 pb-6 align-bottom font-mono text-[12px] font-medium uppercase tracking-[0.14em] text-muted">Feature</th>
                  <th scope="col" className="w-[33%] rounded-t-3xl bg-[#f5f3ff] px-5 pb-6 pt-7 text-center align-bottom">
                    <span className="block font-display text-[24px] font-bold tracking-[-0.03em]">Rhinon Tech</span>
                    <span className="mt-1 block text-[13px] font-medium text-muted">{yes(RHINON)} of {c.rows.length} fully covered</span>
                    <Button href={links.signup} className="mt-4 !h-9 !rounded-lg !px-4 !text-[14px]">Get started</Button>
                  </th>
                  <th scope="col" className="w-[33%] px-5 pb-6 pt-7 text-center align-bottom">
                    <span className="block font-display text-[24px] font-bold tracking-[-0.03em]">{c.competitor}</span>
                    <span className="mt-1 block text-[13px] font-medium text-muted">{yes(c.them)} of {c.rows.length} fully covered</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {c.rows.map((key) => (
                  <tr key={key} className="align-top">
                    <th scope="row" className="border-t border-line px-5 py-4 font-medium text-ink-soft">{ROWS[key]}</th>
                    <td className="border-t border-[#e4defc] bg-[#f5f3ff] px-5 py-4"><Mark cell={RHINON[key]} /></td>
                    <td className="border-t border-line px-5 py-4"><Mark cell={c.them[key]} /></td>
                  </tr>
                ))}
                <tr><td /><td className="h-6 rounded-b-3xl bg-[#f5f3ff]" /><td /></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[13.5px] text-muted">The count is the rows marked Yes; Partly and Not listed are not counted. It shows coverage, not quality: read the notes.</p>
        </div>
      </section>

      {d && (
        <section id="fit" className="scroll-mt-24 border-t border-line bg-soft/60 py-20 sm:py-24">
          <div className="mx-auto max-w-[1100px] px-5">
            <Reveal><SectionHead eyebrow="Which fits" title="The verdict, by kind of team." sub={`Some teams are better off with ${c.competitor}. This is our honest read.`} /></Reveal>
            <div className="hair mt-12">
              {d.fit.map((f) => (
                <div key={f.team} className="grid gap-2 p-5 sm:grid-cols-[1.1fr_0.6fr_1.6fr] sm:items-center sm:gap-6 sm:px-7">
                  <p className="font-semibold">{f.team}</p>
                  <p><span className={`inline-flex rounded-full px-2.5 py-1 text-[13px] font-semibold ${f.pick === "rhinon" ? "bg-[#eef1ff] text-brand" : "bg-soft text-ink"}`}>{f.pick === "rhinon" ? "Rhinon Tech" : c.competitor}</span></p>
                  <p className="text-[15px] leading-6 text-ink-soft">{f.why}</p>
                </div>
              ))}
            </div>
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
            <div className="hair">
              <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr] bg-soft font-mono text-[11.5px] font-medium uppercase tracking-[0.14em] text-muted">
                <span className="px-5 py-3">Rhinon Tech</span><span className="px-5 py-3">Free</span><span className="px-5 py-3 text-[#5b3df5]">Starter</span>
              </div>
              {PLAN_LIMITS.map((r) => (
                <div key={r.label} className="grid grid-cols-[1.4fr_0.8fr_0.8fr] text-[14.5px]">
                  <span className="px-5 py-3.5 font-medium">{r.label}</span><span className="px-5 py-3.5 text-ink-soft">{r.free}</span><span className="px-5 py-3.5 text-ink-soft">{r.starter}</span>
                </div>
              ))}
              <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr] text-[14.5px]">
                <span className="px-5 py-3.5 font-medium">Price</span><span className="px-5 py-3.5 font-semibold">Free, no time limit</span><span className="px-5 py-3.5 text-ink-soft">Priced with you</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="switching" className="scroll-mt-24 border-t border-line bg-soft/60 py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5">
          <Reveal><SectionHead eyebrow="Switching" title={`Moving from ${c.competitor}, in three steps.`} /></Reveal>
          <ol className="hair mt-12 md:grid-cols-3">
            {[
              { t: `Start free alongside ${c.competitor}`, b: `Create a workspace and invite up to 5 people. Nothing in ${c.competitor} needs to change yet.` },
              { t: "Bring your data across", b: c.moving },
              { t: "Move one live client first", b: "Set up your pipeline stages and one project, run them for a week, then move the rest once the team is comfortable." },
            ].map((s, i) => (
              <li key={s.t} className="p-7">
                <span className="font-display flex h-9 w-9 items-center justify-center rounded-full bg-ink text-[15px] font-semibold text-white">{i + 1}</span>
                <p className="font-display mt-5 text-[20px] font-bold leading-tight tracking-[-0.03em]">{s.t}</p>
                <p className="mt-3 text-[15px] leading-7 text-ink-soft">{s.b}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 border-t border-line py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5">
          <SectionHead center eyebrow="FAQ" title={`Rhinon Tech vs ${c.competitor}: questions.`} />
          {[
            { h: `About ${c.competitor}`, items: c.faq },
            { h: "Pricing and plans", items: faq.pricing },
            { h: "Switching and your data", items: faq.switching },
          ].map((g) => (
            <div key={g.h} className="mt-12">
              <h3 className="mx-auto mb-2 max-w-[860px] font-mono text-[12px] uppercase tracking-[0.14em] text-[#5b3df5]">{g.h}</h3>
              <Faq items={g.items} />
            </div>
          ))}
          <div className="mx-auto mt-12 max-w-[860px] text-[13.5px] leading-6 text-muted">
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
          <div className="hair mt-10 md:grid-cols-3">
            {related(c, d).map((o) => (
              <Link key={o.slug} href={`/compare/${o.slug}`} className="group flex h-full flex-col p-6 transition-colors hover:bg-[#f7f6ff]">
                <span className="flex items-start justify-between gap-4">
                  <span className="font-display text-[22px] font-bold leading-tight tracking-[-0.03em]">Rhinon Tech vs {o.competitor}</span>
                  <ArrowUpRight className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
                <span className="mt-3 text-[15px] leading-6 text-ink-soft">{o.chooseRhinon[0]}.</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand title={<>Try it free alongside {c.competitor}.</>} sub="Set up a workspace in a few minutes and invite up to 5 people free. No credit card, no time limit." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "Book a demo", href: links.call }} peek={d?.focus[0]} placement={`Compare CTA: ${c.competitor}`} />
      <JsonLd data={graphJsonLd([breadcrumbNode([{ name: "Home", path: "/" }, { name: "Compare", path: "/compare" }, { name: `vs ${c.competitor}`, path: `/compare/${c.slug}` }]), faqNode(allFaq)])} />
    </>
  );
}
