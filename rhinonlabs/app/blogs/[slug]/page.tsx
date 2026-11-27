import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getBlog, getBlogs, getCaseStudies, type Blog, type CaseStudy } from "@/lib/api";
import { getCategorySlugForBlog } from "@/lib/blog-categories";
import { format } from "date-fns";
import { Minus, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";

import Link from "next/link";
import Image from "next/image";
import { MarkdownRenderer } from "@/components/Common/Markdown/MarkdownRenderer";
import { BlockRenderer } from "@/components/Common/Blog/BlockRenderer";
import { TableOfContents } from "@/components/Common/Blog/TableOfContents";
import { BlogFaq } from "@/components/Common/Blog/BlogFaq";
import { BlogSideRail } from "@/components/Common/Blog/BlogSideRail";
import { extractToc, extractTocFromMarkdown } from "@/components/Common/Blog/blocks";
import StickyCallButton from "@/components/Common/CTA/StickyCallButton";
import { getServiceByBlogSlug } from "@/lib/services";

import { SCHEMA_IDS } from "@/lib/site";
export const revalidate = 300;
export async function generateStaticParams() {
  const blogs = await getBlogs().catch(() => []);
  return blogs.map((b) => ({ slug: b.slug }));
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.rhinonlabs.com";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (!blog) return { title: "Blog Not Found" };

  const effectiveTitle = blog.title.replace(/\s+\?$/, "?");
  const ogTitle = blog.metaTitle || effectiveTitle;
  const ogDescription = blog.metaDescription || blog.excerpt;
  const ogImage = blog.coverImage || `${SITE_URL}/og-image.jpg`;

  return {
    title: blog.metaTitle ? { absolute: blog.metaTitle } : effectiveTitle,
    description: ogDescription,
    alternates: { canonical: `${SITE_URL}/blogs/${blog.slug}` },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: `${SITE_URL}/blogs/${blog.slug}`,
      type: "article",
      publishedTime: blog.publishedAt,
      authors: [blog.authorName],
      images: [
        {
          url: ogImage,
          alt: effectiveTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
  };
}

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "of", "with",
  "by", "from", "up", "about", "into", "over", "after", "is", "are", "was",
  "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
  "but", "if", "then", "else", "when", "where", "why", "how", "all", "any",
  "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor",
  "not", "only", "own", "same", "so", "than", "too", "very", "can", "will",
  "just", "should", "now", "our", "your", "their", "its", "this", "that", "these", "those"
]);

function extractKeywords(text: string): Set<string> {
  const words = (text || "")
    .toLowerCase()
    .replace(/<[^>]*>/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return new Set(words);
}

function calculateScore(sourceKeywords: Set<string>, targetText: string): number {
  if (!sourceKeywords.size || !targetText) return 0;
  const targetWords = extractKeywords(targetText);
  let score = 0;
  for (const word of targetWords) {
    if (sourceKeywords.has(word)) {
      score += 1;
    }
  }
  return score;
}

/**
 * Robust NLP-based related articles algorithm (matches the recommendation engine in Uppercurve).
 * Ranks all available posts by NLP keyword overlap, tags, category, and service affinity.
 * Returns only the top 3 most relevant articles.
 */
function getRelatedArticles(currentBlog: Blog, allBlogs: Blog[], limit = 3): Blog[] {
  if (!allBlogs || !allBlogs.length) return [];

  const currentService = getServiceByBlogSlug(currentBlog.slug);
  const currentCategory = (currentBlog.category || "").toLowerCase().trim();
  const currentTags = (currentBlog.tags || []).map((t) => t.toLowerCase().trim());
  const currentText = [
    currentBlog.title,
    currentBlog.excerpt || "",
    currentCategory,
    ...currentTags,
  ].join(" ");

  const sourceKeywords = extractKeywords(currentText);

  const scored = allBlogs
    .filter((b) => b.slug !== currentBlog.slug)
    .map((candidate) => {
      const candidateService = getServiceByBlogSlug(candidate.slug);
      const candidateCategory = (candidate.category || "").toLowerCase().trim();
      const candidateTags = (candidate.tags || []).map((t) => t.toLowerCase().trim());
      const candidateText = [
        candidate.title,
        candidate.excerpt || "",
        candidateCategory,
        ...candidateTags,
      ].join(" ");

      let score = calculateScore(sourceKeywords, candidateText);

      // Boost 1: Same service pillar (highest thematic cluster alignment)
      if (currentService && candidateService && currentService.slug === candidateService.slug) {
        score += 8;
      }

      // Boost 2: Exact tag matches
      for (const curTag of currentTags) {
        if (!curTag || curTag.length < 3) continue;
        for (const canTag of candidateTags) {
          if (curTag === canTag) {
            score += 4;
          }
        }
      }

      // Boost 3: Same category
      if (currentCategory && candidateCategory && currentCategory === candidateCategory) {
        score += 3;
      }

      return { blog: candidate, score };
    });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.blog.publishedAt).getTime() - new Date(a.blog.publishedAt).getTime();
  });

  return scored.slice(0, limit).map((item) => item.blog);
}

/**
 * Dynamic Content Recommendations:
 * Derives top companion guide, contextual service, and relevant interactive tools.
 */
function getRelatedContextualContent(
  currentBlog: Blog,
  relatedArticles: Blog[],
  service: ReturnType<typeof getServiceByBlogSlug>
) {
  // Companion article: #1 most relevant related article from the algorithm
  const companionArticle = relatedArticles.length > 0 ? relatedArticles[0] : null;

  // Dynamic interactive tools match using keyword overlap
  const currentKeywords = extractKeywords(
    [currentBlog.title, currentBlog.excerpt || "", ...(currentBlog.tags || [])].join(" ")
  );

  const AVAILABLE_TOOLS = [
    {
      title: "Interactive tool:",
      prompt: "Streamline your new hire setup with our free",
      linkText: "Employee Onboarding Checklist Generator →",
      href: "/tools/employee-onboarding-checklist",
      keywords: new Set(["onboarding", "hire", "employee", "hiring", "team", "hr", "staff", "onboard"]),
    },
    {
      title: "Interactive tool:",
      prompt: "Calculate how much revenue manual sales admin is costing your team with our free",
      linkText: "CRM ROI Calculator →",
      href: "/tools/crm-roi-calculator",
      keywords: new Set(["crm", "sales", "revenue", "roi", "leads", "pipeline", "deals", "admin"]),
    },
  ];

  let bestTool: (typeof AVAILABLE_TOOLS)[0] | null = null;
  let maxToolScore = 0;

  for (const tool of AVAILABLE_TOOLS) {
    let matchCount = 0;
    for (const kw of tool.keywords) {
      if (currentKeywords.has(kw)) matchCount++;
    }
    if (matchCount > maxToolScore && matchCount >= 1) {
      maxToolScore = matchCount;
      bestTool = tool;
    }
  }

  return {
    companionArticle,
    service,
    relevantTool: bestTool,
  };
}

export default async function BlogDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (!blog) {
    notFound();
  }

  // Clean stray whitespace before punctuation (e.g. "Admin Panel ?" -> "Admin Panel?")
  const displayTitle = blog.title.replace(/\s+\?$/, "?");

  // Fetch all blogs to calculate related posts using topic + tag + category affinity
  const allBlogs = await getBlogs().catch(() => []);
  const relatedArticles = getRelatedArticles(blog, allBlogs);

  // Contextual matching service derived from lib/services.ts (Single Source of Truth)
  const matchingService = getServiceByBlogSlug(blog.slug);

  // Dynamic contextual content (companion article, service link, relevant free tools)
  const contextualContent = getRelatedContextualContent(blog, relatedArticles, matchingService);

  // Relevant case study for this topic cluster (Audit H-05: "Every post links to 1 case study")
  const allCaseStudies = await getCaseStudies().catch(() => []);
  const matchingCaseStudy = matchingService?.relatedCaseStudies?.length
    ? allCaseStudies.find((cs) => matchingService.relatedCaseStudies.includes(cs.slug)) || allCaseStudies[0]
    : allCaseStudies[0];

  const blocks = blog.contentBlocks?.length ? blog.contentBlocks : null;
  const faqs = (blog.faqs || []).filter((f) => f.question?.trim() && f.answer?.trim());
  const toc = blocks ? extractToc(blocks) : extractTocFromMarkdown(blog.content);
  if (faqs.length > 0) {
    toc.push({ id: "faq", text: "FAQ" });
  }
  const pageUrl = `${SITE_URL}/blogs/${blog.slug}`;

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: displayTitle,
    description: blog.metaDescription || blog.excerpt,
    ...(blog.coverImage ? { image: [blog.coverImage] } : {}),
    datePublished: blog.publishedAt,
    dateModified: blog.updatedAt || blog.publishedAt,
    author: {
      "@type": "Person",
      name: blog.authorName,
      jobTitle: blog.authorRole,
      url: `${SITE_URL}/about`,
      sameAs: [
        "https://www.linkedin.com/company/rhinonlabs",
        "https://x.com/RhinonLabs",
      ],
    },
    publisher: {
      "@type": "Organization",
      "@id": SCHEMA_IDS.organization,
      name: "Rhinon Labs",
      url: SITE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
  };

  const breadcrumbElements = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE_URL,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Blog",
      item: `${SITE_URL}/blogs`,
    },
  ];

  const categorySlug = getCategorySlugForBlog(blog);
  const categoryName = blog.category?.trim() || "Articles";

  breadcrumbElements.push({
    "@type": "ListItem",
    position: 3,
    name: categoryName,
    item: `${SITE_URL}/blogs/category/${categorySlug}`,
  });
  breadcrumbElements.push({
    "@type": "ListItem",
    position: 4,
    name: displayTitle,
    item: pageUrl,
  });

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbElements,
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}

      <div className="max-w-[1400px] mx-auto px-6 sm:px-12 lg:px-16 pt-28 pb-24 relative">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-12 flex items-center gap-2 text-sm">
          <Link href="/blogs" className="font-bold text-foreground transition-opacity hover:opacity-70">
            Blog
          </Link>
          <span className="text-muted-foreground/60">»</span>
          <Link
            href={`/blogs/category/${categorySlug}`}
            className="font-medium text-muted-foreground hover:text-white transition-colors"
          >
            {categoryName}
          </Link>
          <span className="text-muted-foreground/60">»</span>
          <span className="truncate font-medium text-muted-foreground">{displayTitle}</span>
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
              {displayTitle}
            </h1>
            <p className="text-md md:text-lg text-muted-foreground leading-relaxed mb-10">
              {blog.excerpt}
            </p>

            {/* Byline */}
            <div className="mb-10 flex flex-wrap justify-between items-center gap-x-12 gap-y-5">
              
              <div className="flex items-center gap-3.5">
                <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/15">
                  <Image
                    src={blog.authorAvatar || "https://github.com/prabhatpk.png"}
                    alt={blog.authorName}
                    fill
                    sizes="96px"
                    quality={95}
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    By <span className="font-[500] text-foreground">{blog.authorName}</span>
                    {/* <span className="text-muted-foreground"> · {blog.authorRole}</span> */}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Published {format(new Date(blog.publishedAt), "MMM d, yyyy")}
                    {blog.updatedAt &&
                      format(new Date(blog.updatedAt), "yyyy-MM-dd") !==
                        format(new Date(blog.publishedAt), "yyyy-MM-dd") && (
                        <span> · Updated {format(new Date(blog.updatedAt), "MMM d, yyyy")}</span>
                      )}
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
            {/* <details className="group mb-12 border-b border-white/10 pb-8" open>
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
            </details> */}

            {/* Feature Image */}
            {blog.coverImage && (
              <div className="relative mb-14 aspect-video w-full overflow-hidden rounded-3xl border border-white/10">
                <Image
                  src={blog.coverImage}
                  alt={displayTitle}
                  fill
                  priority
                  fetchPriority="high"
                  loading="eager"
                  quality={90}
                  sizes="(min-width: 1280px) 760px, (min-width: 1024px) 60vw, 100vw"
                  className="object-cover"
                />
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

            {/* Dynamic Contextual Companion Playbook (Audit H-02 & H-05) */}
            {contextualContent.companionArticle && (
              <div className="my-8 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/80">
                <span className="font-semibold text-white">Recommended Companion Guide:</span>{" "}
                <Link
                  href={`/blogs/${contextualContent.companionArticle.slug}`}
                  className="font-medium text-white underline hover:text-white/80 transition-colors"
                >
                  {contextualContent.companionArticle.title} →
                </Link>
              </div>
            )}

            {/* Dynamic Relevant Interactive Tool */}
            {contextualContent.relevantTool && (
              <div className="my-8 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/80">
                <span className="font-semibold text-white">{contextualContent.relevantTool.title}</span>{" "}
                {contextualContent.relevantTool.prompt}{" "}
                <Link
                  href={contextualContent.relevantTool.href}
                  className="font-medium text-white underline hover:text-white/80 transition-colors"
                >
                  {contextualContent.relevantTool.linkText}
                </Link>
              </div>
            )}

            {/* Dynamic Service Anchor Link */}
            {contextualContent.service && (
              <div className="my-8 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/80">
                <span className="font-semibold text-white">Looking for production delivery?</span> Explore our tailored{" "}
                <Link
                  href={`/services/${contextualContent.service.slug}`}
                  className="font-medium text-white underline hover:text-white/80 transition-colors"
                >
                  {contextualContent.service.name.toLowerCase()} services →
                </Link>
              </div>
            )}

            {/* Contextual Case Study Proof (Audit H-05: Every post has a relevant case study link) */}
            {matchingCaseStudy && (
              <div className="my-10 rounded-2xl border border-white/10 bg-linear-to-r from-white/[0.03] to-white/[0.01] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#A3B8CC]">
                    Real-World Implementation
                  </span>
                  <h4 className="text-base font-semibold text-white">
                    See how we built and scaled: {matchingCaseStudy.title}
                  </h4>
                  <p className="text-xs text-white/60 line-clamp-2 max-w-xl">
                    {matchingCaseStudy.description}
                  </p>
                </div>
                <Link
                  href={`/case-studies/${matchingCaseStudy.slug}`}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition-all group"
                >
                  <span>Read case study</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
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

            {/* Contextual matching service banner */}
            {matchingService && (
              <div className="mt-14 w-full rounded-2xl border border-white/10 bg-linear-to-br from-white/[0.04] to-white/[0.01] p-6 sm:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] flex flex-col gap-5">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#A3B8CC] block">
                    Matching Solution
                  </span>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white tracking-tight leading-snug">
                    {matchingService.headline} {matchingService.headlineAccent}
                  </h3>
                  <p className="text-sm sm:text-base text-white/60 leading-relaxed">
                    {matchingService.intro}
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href={`/services/${matchingService.slug}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-950 transition-all hover:bg-white/90 hover:translate-y-[-1px] group"
                  >
                    <span>Explore {matchingService.name}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            )}

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

        {/* Related Articles Block */}
        {relatedArticles.length > 0 && (
          <section className="mt-20 pt-16 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-xs font-semibold tracking-widest text-[#A3B8CC] uppercase">
                  Keep Reading
                </span>
                <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white mt-1">
                  Related Articles
                </h2>
              </div>
              <Link
                href="/blogs"
                className="text-xs sm:text-sm font-medium text-white/70 hover:text-white inline-flex items-center gap-1.5 transition-colors group"
              >
                <span>View all articles</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArticles.map((item) => (
                <Link
                  key={item.slug}
                  href={`/blogs/${item.slug}`}
                  className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                >
                  {item.coverImage && (
                    <div className="relative aspect-16/10 w-full overflow-hidden bg-white/5">
                      <Image
                        src={item.coverImage}
                        alt={item.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent opacity-60" />
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    {item.category && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#A3B8CC] mb-2">
                        {item.category}
                      </span>
                    )}
                    <h3 className="text-base font-semibold text-white group-hover:text-white/80 transition-colors line-clamp-2 leading-snug mb-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-white/50 line-clamp-2 mb-4 leading-relaxed">
                      {item.excerpt}
                    </p>
                    <span className="mt-auto text-[10px] text-white/40 pt-3 border-t border-white/5">
                      {format(new Date(item.publishedAt), "MMM d, yyyy")} · {item.readTime}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
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
