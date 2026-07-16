import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getBlog } from "@/lib/api";
import { format } from "date-fns";
import { Minus, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { MarkdownRenderer } from "@/components/Common/Markdown/MarkdownRenderer";
import { BlockRenderer } from "@/components/Common/Blog/BlockRenderer";
import { TableOfContents } from "@/components/Common/Blog/TableOfContents";
import { BlogFaq } from "@/components/Common/Blog/BlogFaq";
import { BlogSideRail } from "@/components/Common/Blog/BlogSideRail";
import { extractToc, extractTocFromMarkdown } from "@/components/Common/Blog/blocks";
import StickyCallButton from "@/components/Common/CTA/StickyCallButton";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rhinonlabs.com";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (!blog) return { title: "Blog Not Found" };

  return {
    // metaTitle is used verbatim (absolute); otherwise the root "%s | Rhinon Labs" template applies.
    title: blog.metaTitle ? { absolute: blog.metaTitle } : blog.title,
    description: blog.metaDescription || blog.excerpt,
    alternates: { canonical: `${SITE_URL}/blogs/${blog.slug}` },
    openGraph: {
      title: blog.metaTitle || blog.title,
      description: blog.metaDescription || blog.excerpt,
      images: blog.coverImage ? [blog.coverImage] : [],
    },
  };
}

export default async function BlogDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (!blog) {
    notFound();
  }

  const blocks = blog.contentBlocks?.length ? blog.contentBlocks : null;
  const toc = blocks ? extractToc(blocks) : extractTocFromMarkdown(blog.content);
  const faqs = (blog.faqs || []).filter((f) => f.question?.trim() && f.answer?.trim());
  const pageUrl = `${SITE_URL}/blogs/${blog.slug}`;

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.metaDescription || blog.excerpt,
    ...(blog.coverImage ? { image: [blog.coverImage] } : {}),
    datePublished: blog.publishedAt,
    author: {
      "@type": "Person",
      name: blog.authorName,
      jobTitle: blog.authorRole,
    },
    publisher: {
      "@type": "Organization",
      name: "Rhinon Labs",
      url: SITE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
  };

  const faqSchema =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        }
      : null;

  return (
    <div className="blog-theme relative min-h-screen bg-background selection:bg-white/20 overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}

      <div className="max-w-[1400px] mx-auto px-16 pt-28 pb-24 relative">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-12 flex items-center gap-2 text-sm">
          <Link href="/blogs" className="font-bold text-foreground transition-opacity hover:opacity-70">
            Blog
          </Link>
          {blog.category && (
            <>
              <span className="text-muted-foreground/60">»</span>
              <span className="font-medium text-muted-foreground">{blog.category}</span>
            </>
          )}
          <span className="text-muted-foreground/60">»</span>
          <span className="truncate font-medium text-muted-foreground">{blog.title}</span>
        </nav>

        {/* 3-column layout: sticky TOC | scrollable article | sticky side rail */}
        <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)_320px] lg:gap-10 xl:grid-cols-[240px_minmax(0,1fr)_256px] xl:gap-12 relative">
          {/* Left — Table of contents (sticky) */}
          <aside className="hidden lg:block self-start sticky top-28 max-h-[calc(100vh-9rem)] overflow-y-auto pr-1">
            <TableOfContents items={toc} />
          </aside>

          {/* Middle — scrollable article */}
          <article className="min-w-0">
            {/* Title + excerpt */}
            <h1 className="text-2xl md:text-[2.4rem] font-[600] text-foreground leading-[1.08] tracking-tight mb-7">
              {blog.title}
            </h1>
            <p className="text-md md:text-lg text-muted-foreground leading-relaxed mb-10">
              {blog.excerpt}
            </p>

            {/* Byline */}
            <div className="mb-10 flex flex-wrap justify-between items-center gap-x-12 gap-y-5">
              
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 overflow-hidden rounded-full border border-white/15">
                  <img
                    src={blog.authorAvatar || "https://github.com/prabhatpk.png"}
                    alt={blog.authorName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    By <span className="font-[500] text-foreground">{blog.authorName}</span>
                    {/* <span className="text-muted-foreground"> · {blog.authorRole}</span> */}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Updated on {format(new Date(blog.publishedAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              {/* <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 overflow-hidden rounded-full border border-white/15">
                  <img
                    src={blog.authorAvatar || "https://github.com/prabhatpk.png"}
                    alt={blog.authorName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm text-foreground">
                    Reviewed By <span className="font-bold"> Prabhat Patra</span>
                    {/* <span className="text-muted-foreground"> · {blog.authorRole}</span> */}
                  {/* </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                   Founder
                  </p>
                </div>
              </div>  */}
            </div>

            {/* Why trust our content */}
            <details className="group mb-12 border-b border-white/10 pb-8" open>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="text-xl font-[500] tracking-tight text-foreground">Why trust our content</span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 text-foreground transition-transform group-open:rotate-0">
                  <Minus size={15} className="hidden group-open:block" />
                  <span className="block text-sm font-bold group-open:hidden">+</span>
                </span>
              </summary>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
                <p>
                  <strong className=" text-foreground">Written by builders, not bloggers:</strong>{" "}
                  every guide comes from products we have actually designed, built and shipped for founders at
                  Rhinon Labs — not from theory.
                </p>
                <p>
                  <strong className=" text-foreground">Reviewed before publishing:</strong>{" "}
                  each article is checked by the team working on client projects every day, so the advice stays
                  practical and current.
                </p>
              </div>
            </details>

            {/* Feature Image */}
            {blog.coverImage && (
              <div className="mb-14 aspect-video w-full overflow-hidden rounded-3xl border border-white/10">
                <img src={blog.coverImage} alt={blog.title} className="h-full w-full object-cover" />
              </div>
            )}

            {/* Mobile TOC */}
            <TableOfContents items={toc} variant="mobile" />

            {/* Body */}
            {blocks ? (
              <BlockRenderer blocks={blocks} />
            ) : (
              <div className="prose prose-invert max-w-none">
                <MarkdownRenderer content={blog.content} />
              </div>
            )}

            {/* Tags */}
            {blog.tags?.length > 0 && (
              <div className="mt-16 flex flex-wrap gap-3">
                {blog.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-white/25 cursor-default"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {faqs.length > 0 && <BlogFaq faqs={faqs} />}

            {/* Side rail content stacks below the article on mobile */}
            <div className="mt-14 lg:hidden">
              <BlogSideRail url={pageUrl} />
            </div>

            {/* <NewsletterCta /> */}
          </article>

          {/* Right — assessment card + Summarize with AI (sticky) */}
          <aside className="hidden lg:block self-start sticky top-28 max-h-[calc(100vh-9rem)] overflow-y-auto pr-1">
            <BlogSideRail url={pageUrl} />
          </aside>
        </div>
      </div>
      <StickyCallButton />
    </div>
  );
}

function NewsletterCta() {
  return (
    <div className="relative mt-20 flex flex-col items-center justify-between gap-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:flex-row md:p-10">
      <div className="pointer-events-none absolute top-0 left-0 p-8 opacity-[0.04]">
        <Sparkles size={200} className="text-white" />
      </div>

      <div className="space-y-4 text-center md:text-left">
        <div className="flex items-center justify-center gap-3 text-foreground md:justify-start">
          <ShieldCheck size={20} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Authentic content</span>
        </div>
        <p className="text-xl font-black text-foreground">Stay ahead of the tech curve.</p>
      </div>

      <div className="flex gap-4">
        <button className="h-14 rounded-2xl bg-white px-10 text-xs font-black uppercase tracking-widest text-slate-950 transition-all hover:bg-white/90 hover:translate-y-[-2px]">
          Join 5,000+ Founders
        </button>
      </div>
    </div>
  );
}
