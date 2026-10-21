"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mulish } from "next/font/google";
import { format } from "date-fns";
import { apiFetch } from "@/lib/api";
import type { Blog } from "../BlogEditor/types";
import { useDomainConfig } from "../domains";
import { BlockRenderer } from "./BlockRenderer";
import { TableOfContents } from "./TableOfContents";
import { BlogFaq } from "./BlogFaq";
import { BlogSideRail } from "./BlogSideRail";
import { extractToc } from "./blocks";
import "./site-preview.css";

const mulish = Mulish({ subsets: ["latin"], variable: "--font-mulish", display: "swap" });

/**
 * Full-page preview of a blog exactly as rhinonlabs.com renders it — same
 * markup (mirrors rhinonlabs/app/blogs/[slug]/page.tsx) and the site's theme,
 * scoped to .rl-site. Reads the last SAVED version, drafts included.
 *
 * Covers the admin chrome with a fixed overlay rather than escaping the
 * [role] layouts, so it stays behind the same auth and permission checks.
 */
export function BlogSitePreview({ id, domain }: { id: string; domain: string }) {
  const pathname = usePathname();
  const { config } = useDomainConfig(domain);
  const [blog, setBlog] = useState<Blog | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Blog>(`/content/blogs/${id}`).then(setBlog).catch((e) => setError(e.message || "Failed to load"));
  }, [id]);

  useEffect(() => {
    if (blog) document.title = `Preview · ${blog.title}`;
  }, [blog]);

  const editHref = pathname.replace(/\/preview\/?$/, "");
  const siteUrl = config?.siteUrl || "https://www.rhinonlabs.com";

  if (error || !blog) {
    return (
      <div className={`rl-site ${mulish.variable} fixed inset-0 z-[200] flex items-center justify-center`}>
        <p className="text-muted-foreground">{error || "Loading preview…"}</p>
      </div>
    );
  }

  // Article links are site-relative ("/services/…"), which is right on the live
  // site but would resolve to the admin here. Point them at the real site, in a
  // new tab. Only the preview is rewritten; the saved post keeps relative links.
  const absolutize = (html: string) =>
    html.replace(/<a\b([^>]*?)href="\/(?!\/)([^"]*)"([^>]*)>/gi, (_m, pre, path, post) => {
      const rest = `${pre}${post}`.replace(/\s(target|rel)="[^"]*"/gi, "");
      return `<a${rest} href="${siteUrl.replace(/\/$/, "")}/${path}" target="_blank" rel="noreferrer">`;
    });
  const blocks = blog.contentBlocks?.length
    ? blog.contentBlocks.map((b) => (b.type === "paragraph" ? { ...b, html: absolutize(b.html) } : b))
    : null;
  const faqs = (blog.faqs || []).filter((f) => f.question?.trim() && f.answer?.trim());
  const toc = blocks ? extractToc(blocks) : [];
  const pageUrl = `${siteUrl}/blogs/${blog.slug}`;

  return (
    <div className={`rl-site ${mulish.variable} fixed inset-0 z-[200] overflow-y-auto overflow-x-clip selection:bg-white/20`}>
      {/* Preview bar — the only thing that isn't the live page */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-black/70 px-6 py-2 text-xs backdrop-blur">
        <span className="text-muted-foreground">
          <span className={blog.status === "Published" ? "text-emerald-400" : "text-amber-400"}>{blog.status}</span>
          {" · "}Preview of the last saved version · {pageUrl.replace(/^https?:\/\//, "")}
        </span>
        <div className="flex items-center gap-4">
          {blog.status === "Published" && (
            <a href={pageUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">View live ↗</a>
          )}
          <Link href={editHref} className="font-semibold text-foreground hover:opacity-80">Back to editor</Link>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-16 pt-28 pb-24 relative">
        <nav aria-label="Breadcrumb" className="mb-12 flex items-center gap-2 text-sm">
          <span className="font-bold text-foreground">Blog</span>
          {blog.category && (
            <>
              <span className="text-muted-foreground/60">»</span>
              <span className="font-medium text-muted-foreground">{blog.category}</span>
            </>
          )}
          <span className="text-muted-foreground/60">»</span>
          <span className="truncate font-medium text-muted-foreground">{blog.title}</span>
        </nav>

        <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)_320px] lg:gap-10 xl:grid-cols-[240px_minmax(0,1fr)_256px] xl:gap-12 relative">
          <aside className="hidden lg:block self-start sticky top-28 max-h-[calc(100vh-9rem)] overflow-y-auto pr-1">
            <TableOfContents items={toc} />
          </aside>

          <article className="min-w-0">
            <h1 className="text-2xl md:text-[2.4rem] font-[600] text-foreground leading-[1.08] tracking-tight mb-7">
              {blog.title}
            </h1>
            <p className="text-md md:text-lg text-muted-foreground leading-relaxed mb-10">{blog.excerpt}</p>

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
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Updated on {format(new Date(blog.publishedAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>

            {blog.coverImage && (
              <div className="mb-14 aspect-video w-full overflow-hidden rounded-3xl border border-white/10">
                <img src={blog.coverImage} alt={blog.title} className="h-full w-full object-cover" />
              </div>
            )}

            <TableOfContents items={toc} variant="mobile" />

            {blocks ? (
              <BlockRenderer blocks={blocks} />
            ) : (
              <div className="article-html whitespace-pre-wrap">{blog.content}</div>
            )}

            {blog.tags?.length > 0 && (
              <div className="mt-16 flex flex-wrap gap-3">
                {blog.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-bold text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {faqs.length > 0 && <BlogFaq faqs={faqs} />}

            <div className="mt-14 lg:hidden">
              <BlogSideRail url={pageUrl} />
            </div>
          </article>

          <aside className="hidden lg:block self-start sticky top-28 max-h-[calc(100vh-9rem)] overflow-y-auto pr-1">
            <BlogSideRail url={pageUrl} />
          </aside>
        </div>
      </div>
    </div>
  );
}
