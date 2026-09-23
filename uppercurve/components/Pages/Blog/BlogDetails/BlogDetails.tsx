"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { BlogPost, ContentBlock, BlogApiBlock } from "../blogData";
import BlogPoster from "../BlogPoster";

const fallbackGradients = [
  "from-indigo-600 via-indigo-800 to-slate-900",
  "from-blue-600 via-sky-700 to-indigo-950",
  "from-emerald-600 via-teal-700 to-slate-900",
  "from-violet-600 via-purple-700 to-slate-950",
  "from-amber-600 via-orange-700 to-stone-950",
  "from-rose-600 via-pink-700 to-slate-950",
];

export function cleanHeadingText(text: string): string {
  return text
    .replace(/&nbsp;?/gi, " ")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugifyHeading(text: string): string {
  return (
    cleanHeadingText(text)
      .toLowerCase()
      .replace(/<[^>]*>/g, "")
      .replace(/&[a-z#0-9]+;/g, " ")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}

export function stripScripts(html: string): string {
  return (html || "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

export function extractYouTubeId(url: string): string | null {
  const m = (url || "").match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

/**
 * Injects deterministic id attributes into <h2> tags within an HTML block
 * so that table-of-contents jump links and scroll spy work reliably.
 */
export function withHeadingIds(html: string, seen: Map<string, number>): string {
  return html.replace(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi, (_m, attrs: string, inner: string) => {
    const text = cleanHeadingText(inner.replace(/<[^>]*>/g, ""));
    if (!text) return `<h2${attrs}>${inner}</h2>`;
    const base = slugifyHeading(text);
    const count = (seen.get(base) || 0) + 1;
    seen.set(base, count);
    const id = count > 1 ? `${base}-${count}` : base;
    return `<h2${attrs} id="${id}">${inner}</h2>`;
  });
}

function formatInlineText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-bold text-[#111827]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          className="text-[#2563eb] hover:text-[#1d4ed8] underline underline-offset-2 font-medium"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}

function LegacyBlock({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "h2":
      return (
        <h2
          id={slugifyHeading(block.text)}
          className="text-2xl sm:text-[36px] font-[500] text-[#111827] tracking-tight leading-snug pt-6 pb-2 scroll-mt-28 font-poppins"
        >
          {block.text}
        </h2>
      );
    case "p":
      return (
        <p className="blog-content font-serif text-[#374151] text-[17px] sm:text-[18px] leading-[1.8] font-normal">
          {formatInlineText(block.text)}
        </p>
      );
    case "list":
      return (
        <ul className="blog-content space-y-2.5 my-3 pl-5 list-disc text-[#374151] font-serif text-[17px] sm:text-[18px] leading-[1.75]">
          {block.items.map((item, idx) => (
            <li key={idx}>{formatInlineText(item)}</li>
          ))}
        </ul>
      );
    case "quote":
      return (
        <blockquote className="blog-content my-6 border-l-4 border-indigo-600 bg-gray-50/70 rounded-r-xl px-6 py-4 text-[17px] sm:text-[18px] italic font-serif text-[#1f2937] leading-relaxed">
          “{block.text}”
        </blockquote>
      );
    default:
      return null;
  }
}

function ApiBlockRenderer({ blocks }: { blocks: BlogApiBlock[] }) {
  const seenHeadings = new Map<string, number>();

  return (
    <div className="space-y-6">
      {blocks.map((block) => {
        switch (block.type) {
          case "paragraph":
            return (
              <div
                key={block.id}
                className="article-html"
                dangerouslySetInnerHTML={{
                  __html: withHeadingIds(stripScripts(block.html), seenHeadings),
                }}
              />
            );
          case "image":
            if (!block.url) return null;
            return (
              <figure key={block.id} className="my-8">
                <div className="overflow-hidden rounded-2xl border border-gray-200/80 shadow-sm">
                  <img src={block.url} alt={block.alt || ""} className="w-full object-cover" />
                </div>
                {block.credit && (
                  <figcaption className="mt-2 text-center text-xs text-gray-500 font-medium">
                    {block.credit}
                  </figcaption>
                )}
              </figure>
            );
          case "video":
            if (!block.url) return null;
            return (
              <figure key={block.id} className="my-8">
                <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-black shadow-sm">
                  <video src={block.url} controls playsInline className="w-full" />
                </div>
                {block.caption && (
                  <figcaption className="mt-2 text-center text-xs text-gray-500 font-medium">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          case "youtube": {
            const vidId = extractYouTubeId(block.url);
            if (!vidId) return null;
            return (
              <figure key={block.id} className="my-8">
                <div className="aspect-video overflow-hidden rounded-2xl border border-gray-200/80 bg-black shadow-sm">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${vidId}`}
                    title="YouTube video"
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                {block.caption && (
                  <figcaption className="mt-2 text-center text-xs text-gray-500 font-medium">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}

export function BlogDetails({
  post,
  relatedPosts,
}: {
  post: BlogPost;
  relatedPosts?: BlogPost[];
}) {
  const [copied, setCopied] = useState(false);
  const [activeHeading, setActiveHeading] = useState<string>("");

  // Extract headings from either contentBlocks (HTML), legacy content array, or rawContent (markdown)
  const headings = useMemo(() => {
    const list: { id: string; text: string }[] = [];
    const seen = new Map<string, number>();

    const addHeading = (text: string) => {
      const clean = cleanHeadingText(text);
      if (!clean) return;
      const base = slugifyHeading(clean);
      const count = (seen.get(base) || 0) + 1;
      seen.set(base, count);
      const id = count > 1 ? `${base}-${count}` : base;
      list.push({ id, text: clean });
    };

    if (post.contentBlocks && post.contentBlocks.length > 0) {
      for (const block of post.contentBlocks) {
        if (block.type === "paragraph" && block.html) {
          const re = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi;
          let m: RegExpExecArray | null;
          while ((m = re.exec(block.html))) {
            addHeading(m[1].replace(/<[^>]*>/g, ""));
          }
        }
      }
    } else if (post.content && Array.isArray(post.content) && post.content.length > 0) {
      for (const b of post.content) {
        if (b.type === "h2") {
          addHeading(b.text);
        }
      }
    } else if (post.rawContent) {
      const lines = post.rawContent.split("\n");
      for (const line of lines) {
        if (line.trim().startsWith("## ")) {
          addHeading(line.trim().slice(3));
        }
      }
    }

    if (post.faqs && post.faqs.length > 0) {
      list.push({ id: "faqs", text: "Frequently Asked Questions" });
    }

    return list;
  }, [post]);

  // Show strictly real related posts fetched from the API
  const morePosts = useMemo(() => {
    const pool = relatedPosts || [];
    return pool.filter((p) => p.slug !== post.slug).slice(0, 4);
  }, [post.slug, relatedPosts]);

  // Active heading spy on scroll
  useEffect(() => {
    if (headings.length === 0) return;

    const handleScroll = () => {
      const headingElements = headings.map((h) => ({
        id: h.id,
        el: document.getElementById(h.id),
      }));

      const scrollPosition = window.scrollY + 140;

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const item = headingElements[i];
        if (item.el && item.el.offsetTop <= scrollPosition) {
          setActiveHeading(item.id);
          return;
        }
      }
      if (headingElements.length > 0) {
        setActiveHeading(headingElements[0].id);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasApiBlocks = Boolean(post.contentBlocks && post.contentBlocks.length > 0);
  const hasLegacyBlocks = Boolean(post.content && post.content.length > 0);

  return (
    <main className="min-h-screen bg-white flex flex-col items-center blog-details-page">
      <div className="w-full max-w-6xl mx-auto px-5 md:px-6 pt-6 pb-24">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-[13px] mt-10 text-gray-500 font-medium mb-4">
          <Link href="/blog" className="hover:text-gray-900 transition-colors">
            Blog
          </Link>
          <span className="text-gray-400">›</span>
          <span className="text-gray-700 font-medium">{post.category}</span>
        </nav>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-[52px] font-[500] text-[#111827] tracking-tight leading-[1.2] mb-6 font-poppins">
          {post.title}
        </h1>

        {/* Author Meta & AI Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-6 my-8 border-y border-gray-200/80">
          {/* Author info */}
          <div className="flex items-center gap-3">
            {post.authorAvatar ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-gray-200">
                <img
                  src={post.authorAvatar}
                  alt={post.authorName || "Author"}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L3 7l9 5 9-5-9-5zM3 17l9 5 9-5M3 12l9 5 9-5" />
                </svg>
              </div>
            )}
            <div>
              <div className="text-sm font-bold text-gray-900 leading-snug font-poppins">
                {post.authorName || "UpperCurve Academy"}
              </div>
              <div className="text-xs text-gray-500 font-medium font-poppins blog-time">
                {post.authorRole ? `${post.authorRole} · ` : ""}Date: {post.dateLabel}
              </div>
            </div>
          </div>

          {/* AI Summaries & Share */}
          <div className="flex items-center flex-wrap gap-2.5">
            <span className="text-xs text-gray-500 font-medium">Summarise this blog</span>

            {/* ChatGPT */}
            <a
              href={`https://chatgpt.com/?q=${encodeURIComponent(`Summarize this article: ${post.title} - ${post.excerpt}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-200/80 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-xs"
            >
              <span className="w-4 h-4 rounded-full bg-black flex items-center justify-center text-white text-[9px]">
                <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                  <path d="M22.28 10.37a5.55 5.55 0 0 0-.46-4.41 5.67 5.67 0 0 0-4.32-2.82 5.59 5.59 0 0 0-3.92.51A5.6 5.6 0 0 0 9.21 2a5.67 5.67 0 0 0-4.8 2.87 5.57 5.57 0 0 0-1.89 4.07 5.68 5.68 0 0 0 .58 4.4 5.67 5.67 0 0 0-.58 4.4 5.65 5.65 0 0 0 2.83 3.82 5.59 5.59 0 0 0 3.86.5 5.6 5.6 0 0 0 4.37 1.62 5.67 5.67 0 0 0 4.8-2.87 5.57 5.57 0 0 0 1.89-4.07 5.68 5.68 0 0 0-.58-4.4 5.66 5.66 0 0 0 2.59-1.97zm-8.83 10.3a4.1 4.1 0 0 1-2.48-.82l.14-.08 4.1-2.37a.8.8 0 0 0 .4-.69v-5.78l1.74 1a.07.07 0 0 1 .04.05v4.77a4.13 4.13 0 0 1-3.94 3.92zm-8.4-3.57a4.1 4.1 0 0 1-.5-2.57l.14.08 4.1 2.37a.78.78 0 0 0 .79 0l5-2.89v2a.07.07 0 0 1-.03.06l-4.13 2.38a4.13 4.13 0 0 1-5.37-1.43zm-1.12-8.58a4.1 4.1 0 0 1 1.98-1.75v4.9a.78.78 0 0 0 .39.69l5 2.89-1.74 1a.07.07 0 0 1-.07 0l-4.13-2.38a4.13 4.13 0 0 1-1.43-5.35zm12.39-1.34-4.1 2.37a.78.78 0 0 0-.4.69v5.78l-1.74-1a.07.07 0 0 1-.04-.05V9.92a4.13 4.13 0 0 1 6.28-3.1zm2.75 6.15a4.1 4.1 0 0 1-1.98 1.75v-4.9a.78.78 0 0 0-.39-.69l-5-2.89 1.74-1a.07.07 0 0 1 .07 0l4.13 2.38a4.13 4.13 0 0 1 1.43 5.35zm-9.35-1.57 2.24-1.29 2.24 1.29v2.58l-2.24 1.29-2.24-1.29z" />
                </svg>
              </span>
              <span>ChatGPT</span>
            </a>

            {/* Google AI Mode */}
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`Summarize: ${post.title}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-200/80 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-xs"
            >
              <span className="w-3.5 h-3.5 flex items-center justify-center">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.21 0 10.05 0 12s.45 3.79 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
              </span>
              <span>Google AI Mode</span>
            </a>

            {/* Claude */}
            <a
              href={`https://claude.ai/new?q=${encodeURIComponent(`Summarize this article: ${post.title} - ${post.excerpt}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-200/80 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-xs"
            >
              <span className="w-4 h-4 rounded-full bg-[#D97706] text-white flex items-center justify-center text-[10px] font-bold">
                A
              </span>
              <span>Claude</span>
            </a>

            <span className="text-gray-300">|</span>

            {/* Share button with copied toast */}
            <div className="relative">
              <button
                onClick={handleShare}
                aria-label="Share article"
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
              </button>
              {copied && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                  Link copied!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Two-Column Grid: Sticky Contents + Main Content */}
        <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12">
          {/* Sticky Contents Sidebar */}
          {headings.length > 0 && (
            <aside className="w-full lg:w-[280px] shrink-0 lg:sticky lg:top-24">
              <div className="bg-[#f8f9fa] rounded-2xl border border-gray-200/80 p-5 shadow-xs">
                <h3 className="text-base font-bold text-gray-900 mb-3.5 font-poppins">Contents</h3>
                <nav className="flex flex-col space-y-2.5">
                  {headings.map((heading) => {
                    const isActive = activeHeading === heading.id;
                    return (
                      <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        className={`text-[13.5px] leading-snug font-medium transition-colors block ${
                          isActive
                            ? "text-[#1d4ed8] font-bold underline underline-offset-2"
                            : "text-[#2563eb] hover:text-[#1d4ed8] hover:underline"
                        }`}
                      >
                        {heading.text}
                      </a>
                    );
                  })}
                </nav>
              </div>
            </aside>
          )}

          {/* Main Article Content */}
          <article className="flex-1 min-w-0 w-full">
            {/* Poster / Hero Banner placed at top of article content */}
            <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-gray-200/70 h-[280px] sm:h-[360px] md:h-[400px] mb-8">
              <BlogPoster post={post} featured />
            </div>

            {/* Dynamic Content Blocks */}
            {hasApiBlocks && post.contentBlocks ? (
              <ApiBlockRenderer blocks={post.contentBlocks} />
            ) : hasLegacyBlocks ? (
              <div className="space-y-6 blog-content">
                {post.content.map((block, idx) => (
                  <LegacyBlock key={idx} block={block} />
                ))}
              </div>
            ) : post.rawContent ? (
              <div className="article-html">
                <p>{post.rawContent}</p>
              </div>
            ) : (
              <div className="article-html">
                <p>{post.excerpt}</p>
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 pt-6 border-t border-gray-100 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-2">
                  Tags:
                </span>
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium px-3 py-1 bg-gray-100 text-gray-700 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* FAQs Section */}
            {post.faqs && post.faqs.length > 0 && (
              <section id="faqs" className="mt-16 pt-10 border-t border-gray-200/80 scroll-mt-28">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 font-poppins">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                  {post.faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50/70 border border-gray-200/70 rounded-2xl p-5 hover:border-gray-300 transition-colors"
                    >
                      <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2 font-poppins">
                        {faq.question}
                      </h4>
                      <p className="text-sm sm:text-[15px] text-gray-600 leading-relaxed font-sans">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </article>
        </div>

        {/* Related Blogs */}
        <div className="mt-20 pt-10 border-t border-gray-200/80">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-[28px] font-bold text-gray-900 tracking-tight font-poppins">
              Related Blogs
            </h2>
            {morePosts.length > 0 && (
              <Link
                href="/blog"
                className="text-sm font-semibold text-gray-600 hover:text-black transition-colors"
              >
                See all →
              </Link>
            )}
          </div>

          {morePosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {morePosts.map((other, idx) => {
                const gradientClass =
                  other.gradient ||
                  `bg-gradient-to-br ${fallbackGradients[idx % fallbackGradients.length]}`;
                const hasThumbnail = Boolean(other.coverImage || (other as any).thumbnail);
                const thumbnailSrc = other.coverImage || (other as any).thumbnail;

                return (
                  <Link
                    key={other.slug}
                    href={`/blog/${other.slug}`}
                    className="group flex flex-col cursor-pointer"
                  >
                    {/* Card Thumbnail */}
                    <div className="w-full aspect-[16/10] rounded-2xl overflow-hidden border border-gray-200/70 shadow-xs relative bg-gray-100 transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-0.5">
                      {hasThumbnail ? (
                        <img
                          src={thumbnailSrc}
                          alt={other.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div
                          className={`w-full h-full relative p-4 flex flex-col justify-between overflow-hidden transition-transform duration-300 group-hover:scale-105 ${gradientClass}`}
                        >
                          {/* Texture overlay */}
                          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.3)_1px,transparent_1px)] [background-size:12px_12px] opacity-25" />
                          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-white/10 blur-xl" />

                          <div className="relative z-10 flex items-center justify-between">
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-white/80 [font-family:var(--font-montserrat)]">
                              UpperCurve
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
                              {other.category}
                            </span>
                          </div>

                          <div className="relative z-10">
                            <h4 className="text-white font-bold text-xs sm:text-sm line-clamp-2 leading-snug font-poppins">
                              {other.title}
                            </h4>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="mt-3 text-sm sm:text-[15px] font-bold text-[#111827] group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug font-poppins">
                      {other.title}
                    </h3>

                    {/* Date & Read Time */}
                    <p className="mt-1 text-xs text-gray-500 font-normal font-poppins blog-time">
                      Date: {other.dateLabel} • {other.readTime}
                    </p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500 font-medium">
              No other blogs available.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default BlogDetails;
