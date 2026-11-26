import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { links, pageMeta } from "@/components/site";
import { bySlug } from "@/content/products";
import { Aurora, IconTile, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { CtaBand } from "@/components/blocks";
import { JsonLd, breadcrumbNode, graphJsonLd } from "@/components/schema";

/*
 * Figures are aggregate counts read from the production database on 26 November 2026
 * (read-only), for Rhinon's own workspace. Re-pull them before changing any number, and keep
 * "what we don't use yet" honest: there were 0 deals and no deal → project conversions.
 */

export const metadata = pageMeta({
  title: "How Rhinon Labs Runs Its Agency on Rhinon Tech",
  description: "Rhinon Labs runs its outreach, client projects and website chat on Rhinon Tech: 5,503 leads, 10,268 outreach emails and 643 project tasks since May 2026.",
  path: "/customers/rhinon-labs",
});

const AS_OF = "26 November 2026";

const FIGURES = [
  { big: "5,503", label: "leads in the CRM", note: "Mostly imported prospect lists" },
  { big: "10,268", label: "outreach emails sent", note: "To 5,496 leads, 19 May to 16 November" },
  { big: "9,261", label: "AI drafts written", note: "From research on each lead" },
  { big: "643", label: "tasks across 9 projects", note: "Client and internal work since May" },
  { big: "127", label: "requests logged against projects", note: "Turned into tasks where needed" },
  { big: "11", label: "people in the workspace", note: "One login for all of it" },
];

const USED = [
  { slug: "outreach", line: "Campaign emails are drafted by AI from research on each lead, across 10 campaigns." },
  { slug: "crm", line: "Imported prospect lists, website enquiries and the scheduler all land in one CRM." },
  { slug: "projects", line: "Client and internal projects, with tasks, boards and requests in one place." },
  { slug: "inbox", line: "20,188 emails in the workspace's inboxes." },
  { slug: "ai-agent", line: "The chat on rhinonlabs.com, live since 22 October, with 16 conversations so far." },
];

export default function RhinonLabsCaseStudy() {
  return (
    <>
      <section className="relative pb-20 pt-12 sm:pt-16">
        <Aurora />
        <div className="relative mx-auto max-w-[1240px] px-5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13.5px] text-muted">
            <span>Customers</span><ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-ink">Rhinon Labs</span>
          </nav>
          <h1 className="font-display mt-6 max-w-[960px] text-balance text-[40px] font-semibold leading-[1.04] sm:text-[64px]">How Rhinon Labs runs its agency on Rhinon Tech</h1>
          <p className="mt-6 max-w-[760px] text-[18px] leading-8 text-ink-soft">Rhinon Labs builds custom CRMs, AI automation and dashboards for growing companies. It is also the team that builds Rhinon Tech, and it runs its own outreach, client projects and website chat on it. These are the real numbers from its workspace.</p>
          <p className="mt-4 text-[13.5px] text-muted">Figures as of {AS_OF}, read from the workspace.</p>
        </div>
      </section>

      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-x-6 gap-y-12 px-5 lg:grid-cols-3">
          {FIGURES.map((f, i) => (
            <Reveal key={f.label} delay={(i % 3) * 90}>
              <p className="font-display text-[52px] font-semibold leading-none sm:text-[72px]">{f.big}</p>
              <p className="mt-3 text-[16px] font-semibold">{f.label}</p>
              <p className="mt-1 text-[14px] text-muted">{f.note}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-soft/60 py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5">
          <Reveal><SectionHead eyebrow="What we use" title="Five products, one workspace." /></Reveal>
          <ul className="mt-12 grid gap-3 md:grid-cols-2">
            {USED.map(({ slug, line }) => {
              const p = bySlug(slug)!;
              return (
                <li key={slug}>
                  <Link href={`/product/${slug}`} className="group flex h-full items-start gap-4 rounded-2xl border border-line bg-white p-6 hover:border-ink/20">
                    <IconTile icon={p.icon} tone={p.tone} size={42} />
                    <span className="min-w-0 flex-1"><span className="font-display block text-[20px] font-semibold">{p.name}</span><span className="mt-1 block text-[15px] leading-6 text-ink-soft">{line}</span></span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-5 lg:grid-cols-2">
          <Reveal>
            <SectionHead eyebrow="Being straight" title="What we don't use yet." />
            <p className="mt-6 text-[17px] leading-8 text-ink-soft">Our own deals aren't tracked in the pipeline yet, so the deal-to-project hand-off isn't part of these numbers. We will update this page when that changes.</p>
          </Reveal>
          <Reveal delay={120}>
            <SectionHead eyebrow="Why it matters" title="We feel every rough edge first." />
            <p className="mt-6 text-[17px] leading-8 text-ink-soft">Because our own team works in Rhinon every day, slow screens, confusing names and missing steps reach us before they reach you.</p>
            <a href={links.labs} className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-semibold underline underline-offset-4">Visit rhinonlabs.com</a>
          </Reveal>
        </div>
      </section>

      <CtaBand title={<>Run your agency <span className="text-aurora-soft">the same way.</span></>} sub="Set up a workspace in a few minutes and invite up to 5 people free. No credit card, no time limit." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "Book a demo", href: links.call }} />
      <JsonLd data={graphJsonLd([breadcrumbNode([{ name: "Home", path: "/" }, { name: "Rhinon Labs case study", path: "/customers/rhinon-labs" }])])} />
    </>
  );
}
