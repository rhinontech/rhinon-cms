import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import type { CaseStudy } from "@/lib/api";
import { MarkdownRenderer } from "@/components/Common/Markdown/MarkdownRenderer";
import { BlockRenderer } from "@/components/Common/Blog/BlockRenderer";
import { TableOfContents } from "@/components/Common/Blog/TableOfContents";
import { BlogSideRail } from "@/components/Common/Blog/BlogSideRail";
import { extractToc } from "@/components/Common/Blog/blocks";
import StickyCallButton from "@/components/Common/CTA/StickyCallButton";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rhinonlabs.com";

export default function CaseStudyDetail({ caseStudy }: { caseStudy: CaseStudy }) {
  const category = caseStudy.category || caseStudy.industry || "Case Study";
  const blocks = caseStudy.contentBlocks?.length ? caseStudy.contentBlocks : null;
  const toc = blocks ? extractToc(blocks) : [];
  const cover = caseStudy.image || caseStudy.images?.[0];
  const gallery = (caseStudy.images || []).filter((img) => img !== cover);
  const pageUrl = `${SITE_URL}/case-studies/${caseStudy.slug}`;
  const stats = caseStudy.stats || [];

  const caseStudySchema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: caseStudy.title,
    description: caseStudy.description,
    ...(cover ? { image: [cover] } : {}),
    ...(caseStudy.date ? { datePublished: caseStudy.date } : {}),
    creator: {
      "@type": "Organization",
      name: "Rhinon Labs",
      url: SITE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
  };

  return (
    <div className="relative min-h-screen bg-background selection:bg-white/20 overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(caseStudySchema) }} />

      <div className="max-w-[1400px] mx-auto px-16 pt-28 pb-24 relative">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-12 flex items-center gap-2 text-sm">
          <Link href="/case-studies" className="font-bold text-foreground transition-opacity hover:opacity-70">
            Case Studies
          </Link>
          <span className="text-muted-foreground/60">»</span>
          <span className="font-medium text-muted-foreground">{category}</span>
          <span className="text-muted-foreground/60">»</span>
          <span className="truncate font-medium text-muted-foreground">{caseStudy.title}</span>
        </nav>

        {/* 3-column layout: sticky TOC | scrollable article | sticky side rail */}
        <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)_320px] lg:gap-10 xl:grid-cols-[240px_minmax(0,1fr)_256px] xl:gap-12 relative">
          {/* Left — Table of contents (sticky) */}
          <aside className="hidden lg:block self-start sticky top-28 max-h-[calc(100vh-9rem)] overflow-y-auto pr-1">
            <TableOfContents items={toc} />
          </aside>

          {/* Middle — scrollable article */}
          <article className="min-w-0">
            <span className="mb-5 inline-block text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              {category}
            </span>

            {/* Title + description */}
            <h1 className="text-2xl md:text-[2.4rem] font-black text-foreground leading-[1.08] tracking-tight mb-7">
              {caseStudy.title}
            </h1>
            <p className="text-md md:text-lg text-muted-foreground leading-relaxed mb-10">
              {caseStudy.description}
            </p>

            {/* Project facts row */}
            <div className="mb-10 flex flex-wrap items-center gap-x-10 gap-y-4 border-b border-white/10 pb-10">
              {caseStudy.client && (
                <Fact label="Client" value={caseStudy.client} />
              )}
              {caseStudy.industry && (
                <Fact label="Industry" value={caseStudy.industry} />
              )}
              {caseStudy.timeline && (
                <Fact label="Timeline" value={caseStudy.timeline} />
              )}
              {caseStudy.date && (
                <Fact label="Date" value={caseStudy.date} />
              )}
              {caseStudy.liveLink && (
                <a
                  href={caseStudy.liveLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm font-bold text-foreground transition-colors hover:opacity-70"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Visit live site <ArrowRight size={14} />
                </a>
              )}
            </div>

            {/* Headline stats */}
            {stats.length > 0 && (
              <div className="mb-12 flex flex-wrap gap-x-12 gap-y-6">
                {stats.map((stat, i) => (
                  <div key={i}>
                    <p className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
                      {stat.value}
                      <span className="text-lg text-muted-foreground">{stat.suffix}</span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Cover image */}
            {cover && (
              <div className="mb-14 aspect-video w-full overflow-hidden rounded-3xl border border-white/10">
                <img src={cover} alt={caseStudy.title} className="h-full w-full object-cover" />
              </div>
            )}

            {/* Mobile TOC */}
            <TableOfContents items={toc} variant="mobile" />

            {/* Body */}
            {blocks ? (
              <BlockRenderer blocks={blocks} />
            ) : caseStudy.content ? (
              <div className="prose prose-invert max-w-none">
                <MarkdownRenderer content={caseStudy.content} />
              </div>
            ) : null}

            {/* Gallery */}
            {gallery.length > 0 && (
              <div className="mt-14 space-y-8">
                {gallery.map((img, i) => (
                  <div key={i} className="overflow-hidden rounded-3xl border border-white/10">
                    <img
                      src={img}
                      alt={`${caseStudy.title} screenshot ${i + 1}`}
                      className="w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Quote / outcome */}
            {(caseStudy.quote || caseStudy.result) && (
              <div className="mt-16 space-y-6 border-l-2 border-white/20 pl-6">
                {caseStudy.result && (
                  <p className="text-lg font-semibold text-foreground">{caseStudy.result}</p>
                )}
                {caseStudy.quote && (
                  <p className="text-lg italic leading-relaxed text-muted-foreground">{caseStudy.quote}</p>
                )}
              </div>
            )}

            {/* Side rail content stacks below the article on mobile */}
            <div className="mt-14 lg:hidden">
              <BlogSideRail
                url={pageUrl}
                heading="Want results like this for your product?"
                subheading="Tell us what you're building — we'll tell you what it'll take to ship it."
                ctaLabel="Start a Project"
              />
            </div>

            <ContactCta />
          </article>

          {/* Right — CTA card (sticky) */}
          <aside className="hidden lg:block self-start sticky top-28 max-h-[calc(100vh-9rem)] overflow-y-auto pr-1">
            <BlogSideRail
              url={pageUrl}
              heading="Want results like this for your product?"
              subheading="Tell us what you're building — we'll tell you what it'll take to ship it."
              ctaLabel="Start a Project"
            />
          </aside>
        </div>
      </div>
      <StickyCallButton />
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ContactCta() {
  return (
    <div className="relative mt-20 flex flex-col items-center justify-between gap-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:flex-row md:p-10">
      <div className="pointer-events-none absolute top-0 left-0 p-8 opacity-[0.04]">
        <Sparkles size={200} className="text-white" />
      </div>

      <div className="space-y-4 text-center md:text-left">
        <div className="flex items-center justify-center gap-3 text-foreground md:justify-start">
          <ShieldCheck size={20} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Real project, real results</span>
        </div>
        <p className="text-xl font-black text-foreground">Ready to build something like this?</p>
      </div>

      <div className="flex gap-4">
        <Link
          href="/contact-us"
          className="flex h-14 items-center rounded-2xl bg-white px-10 text-xs font-black uppercase tracking-widest text-slate-950 transition-all hover:bg-white/90 hover:translate-y-[-2px]"
        >
          Start a Project
        </Link>
      </div>
    </div>
  );
}
