"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import { TbArrowLeft, TbEye, TbLoader, TbSparkles } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { ContentImageInput } from "../ContentImageInput";
import { ParagraphBlock } from "./ParagraphBlock";
import { FaqEditor } from "./FaqEditor";
import { BlogPreview } from "./BlogPreview";
import { legacyMarkdownToHtml } from "./legacyMarkdown";
import { getDomainConfig } from "../domains";
import {
  type Blog,
  type BlogFaq,
  type BlogStatus,
  flattenBlocksToHtml,
  newBlockId,
  slugifyTitle,
} from "./types";

const RESOURCE_LABEL: Record<"blogs" | "events", string> = { blogs: "Blog", events: "Event" };
// Rhinon Labs' blogs default to the founder byline; other sites/resources start blank
// so the admin isn't left with the wrong person's name on a post they didn't write.
const DEFAULT_AUTHOR: Record<string, { name: string; role: string }> = {
  "rhinonlabs:blogs": { name: "Prabhat Patra", role: "Founder @ Rhinon Tech" },
};

const META_TITLE_LIMIT = 60;
const META_DESC_LIMIT = 160;
const WORDS_PER_MINUTE = 200;

function isEmptyHtml(html: string): boolean {
  return !html || !html.replace(/<[^>]*>/g, " ").trim();
}

/** "N min read" at ~200 wpm, counted across the whole doc (tags stripped). */
function computeReadTimeFromHtml(html: string): string {
  const words = html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / WORDS_PER_MINUTE))} min read`;
}

export function BlogEditorPage({ id, resource = "blogs" }: { id?: string; resource?: "blogs" | "events" }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const roleSlug = pathname.split("/")[1];
  const domain = params.domain as string;
  const domainConfig = getDomainConfig(domain);
  const domainBase = `/${roleSlug}/content/${domain}`;
  // Blogs live at the domain root; other resources (events, case studies) get their own segment.
  const listPath = resource === "blogs" ? domainBase : `${domainBase}/${resource}`;
  const resourceLabel = RESOURCE_LABEL[resource];
  const apiBase = `/content/${resource}`;
  const defaultAuthor = DEFAULT_AUTHOR[`${domain}:${resource}`] || { name: "", role: "" };

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState<BlogStatus | null>(null);
  const [error, setError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const [original, setOriginal] = useState<Blog | null>(null);
  const [legacyConverted, setLegacyConverted] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  // One continuous document — images/video embed inline via the toolbar, so
  // there's no block list to manage anymore.
  const [content, setContent] = useState("");
  const [faqs, setFaqs] = useState<BlogFaq[]>([]);
  const [coverImage, setCoverImage] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [readTime, setReadTime] = useState("1 min read");
  const [readTimeTouched, setReadTimeTouched] = useState(false);
  const [publishedAt, setPublishedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [authorName, setAuthorName] = useState(defaultAuthor.name);
  const [authorRole, setAuthorRole] = useState(defaultAuthor.role);
  const [authorAvatar, setAuthorAvatar] = useState("");

  // Load the post (edit mode) + the list once for the category suggestions.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await apiFetch<Blog[]>(resource === "blogs" ? `${apiBase}?domain=${domain}` : apiBase);
        if (cancelled) return;
        const distinct = Array.from(
          new Map(
            list
              .map((b) => (b.category || "").trim())
              .filter(Boolean)
              .map((c) => [c.toLowerCase(), c])
          ).values()
        ).sort();
        setCategories(distinct);
      } catch {
        /* suggestions only */
      }
    })();

    if (!id) return () => { cancelled = true; };

    (async () => {
      try {
        const blog = await apiFetch<Blog>(`${apiBase}/${id}`);
        if (cancelled) return;
        setOriginal(blog);
        setTitle(blog.title);
        setSlug(blog.slug);
        setSlugTouched(true);
        setExcerpt(blog.excerpt);
        setCoverImage(blog.coverImage || "");
        setCategory(blog.category || "");
        setTags((blog.tags || []).join(", "));
        setReadTime(blog.readTime || "1 min read");
        setReadTimeTouched(true);
        setPublishedAt(new Date(blog.publishedAt).toISOString().slice(0, 10));
        setMetaTitle(blog.metaTitle || "");
        setMetaDescription(blog.metaDescription || "");
        setAuthorName(blog.authorName || defaultAuthor.name);
        setAuthorRole(blog.authorRole || defaultAuthor.role);
        setAuthorAvatar(blog.authorAvatar || "");
        setFaqs(blog.faqs || []);
        if (blog.contentBlocks?.length) {
          // A single paragraph block loads straight in; anything else (legacy
          // multi-block posts with separate image/video/youtube blocks) gets
          // flattened into one continuous document, inline images/video and all.
          const isSingleParagraph = blog.contentBlocks.length === 1 && blog.contentBlocks[0].type === "paragraph";
          setContent(isSingleParagraph ? (blog.contentBlocks[0] as any).html : flattenBlocksToHtml(blog.contentBlocks));
          if (!isSingleParagraph) setLegacyConverted(true);
        } else if (blog.content) {
          setContent(legacyMarkdownToHtml(blog.content));
          setLegacyConverted(true);
        }
      } catch (err: any) {
        setError(err.message || `Failed to load ${resourceLabel.toLowerCase()}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Auto slug (create mode, until touched) + auto read time (until touched).
  useEffect(() => {
    if (!id && !slugTouched) setSlug(slugifyTitle(title));
  }, [title, id, slugTouched]);

  useEffect(() => {
    if (!readTimeTouched) setReadTime(computeReadTimeFromHtml(content));
  }, [content, readTimeTouched]);

  const cleanFaqs = useMemo(
    () => faqs.filter((f) => f.question.trim() && f.answer.trim()),
    [faqs]
  );

  const handleSave = useCallback(
    async (status: BlogStatus) => {
      setError("");
      const cleanBlocks = isEmptyHtml(content)
        ? []
        : [{ id: newBlockId(), type: "paragraph" as const, html: content }];
      if (!title.trim()) { setError("Title is required."); return; }
      if (!excerpt.trim()) { setError("Excerpt is required."); return; }
      if (cleanBlocks.length === 0 && !original?.content) {
        setError("Write something before saving.");
        return;
      }

      const payload: Record<string, unknown> = {
        title: title.trim(),
        slug: slug.trim() || slugifyTitle(title),
        excerpt: excerpt.trim(),
        contentBlocks: cleanBlocks,
        faqs: cleanFaqs,
        coverImage: coverImage || null,
        category: category.trim() || null,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        readTime,
        publishedAt: new Date(`${publishedAt}T00:00:00`).toISOString(),
        metaTitle: metaTitle.trim() || null,
        metaDescription: metaDescription.trim() || null,
        authorName: authorName.trim() || defaultAuthor.name,
        authorRole: authorRole.trim() || defaultAuthor.role,
        authorAvatar: authorAvatar || null,
        status,
      };
      // domain is only meaningful for the shared `blogs` resource — case
      // studies/events are single-domain resources with no such column.
      if (resource === "blogs") payload.domain = domain;

      setSaving(status);
      try {
        if (id) {
          const updated = await apiFetch<Blog>(`${apiBase}/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          setOriginal(updated);
          setSlug(updated.slug);
          setLegacyConverted(false);
        } else {
          const created = await apiFetch<Blog>(apiBase, {
            method: "POST",
            body: JSON.stringify(payload),
          });
          router.replace(`${domainBase}/${resource}/${created.id}`);
        }
      } catch (err: any) {
        setError(err.message || "Save failed");
      } finally {
        setSaving(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      id, title, slug, excerpt, content, cleanFaqs, coverImage, category, tags, readTime,
      publishedAt, metaTitle, metaDescription, authorName, authorRole, authorAvatar,
      original, router, listPath, resource, domain, apiBase, domainBase, defaultAuthor,
    ]
  );

  const status: BlogStatus = original?.status || "Draft";
  const slugChangedOnPublished =
    !!original && original.status === "Published" && slug.trim() !== original.slug;

  if (loading) {
    return (
      <main className="flex h-full min-h-0 w-full items-center justify-center rounded-xl glass-panel">
        <TbLoader size={22} className="animate-spin text-stone-400" />
      </main>
    );
  }

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl glass-panel">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b px-4">
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={() => router.push(listPath)}
            className="rounded-lg p-2 text-gray-600 hover:bg-stone-100"
            title={`Back to ${resourceLabel.toLowerCase()}s`}
          >
            <TbArrowLeft size={18} />
          </button>
          <SubNavToggle />
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight text-gray-900">
              {id ? `Edit ${resourceLabel}` : `New ${resourceLabel}`}
            </h1>
          </div>
          <span
            className={cn(
              "ml-2 shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest",
              status === "Published"
                ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                : "border-amber-100 bg-amber-50 text-amber-600"
            )}
          >
            {status}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-stone-100"
          >
            <TbEye size={14} /> Preview
          </button>
          <button
            onClick={() => handleSave("Draft")}
            disabled={!!saving}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-stone-100 disabled:opacity-60"
          >
            {saving === "Draft" ? "Saving…" : "Save as Draft"}
          </button>
          <button
            onClick={() => handleSave("Published")}
            disabled={!!saving}
            className="rounded-lg bg-stone-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-stone-800 disabled:opacity-60"
          >
            {saving === "Published" ? "Publishing…" : status === "Published" ? "Update" : "Publish"}
          </button>
        </div>
      </div>

      {error && (
        <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs font-medium text-red-600">{error}</div>
      )}
      {legacyConverted && (
        <div className="border-b border-cyan-100 bg-cyan-50 px-4 py-2 text-xs font-medium text-cyan-700">
          This post was converted from legacy markdown into a paragraph block — review the formatting before saving.
        </div>
      )}

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* Left — content */}
          <div className="min-w-0 space-y-5">
            <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Title
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="7 UI design principles every product manager should know"
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-lg font-bold tracking-tight outline-none focus:ring-2 focus:ring-stone-900"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                {resourceLabel} URL
                <div className="flex items-center overflow-hidden rounded-lg border border-stone-200 bg-white focus-within:ring-2 focus-within:ring-stone-900">
                  <span className="shrink-0 border-r border-stone-100 bg-stone-50 px-3 py-2 text-sm text-stone-400">/{resource}/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => { setSlug(slugifyTitle(e.target.value) || e.target.value.toLowerCase()); setSlugTouched(true); }}
                    placeholder="auto-generated-from-title"
                    className="w-full bg-transparent px-3 py-2 text-sm outline-none"
                  />
                </div>
                {slugChangedOnPublished && (
                  <p className="text-xs font-normal text-amber-600">
                    Changing the URL of a published post breaks existing links to it.
                  </p>
                )}
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Excerpt
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="One or two sentences shown on the blog card."
                  className="h-20 w-full resize-none rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-stone-900"
                />
              </label>
            </div>

            <ParagraphBlock html={content} onChange={setContent} />

            <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
              <FaqEditor faqs={faqs} onChange={setFaqs} />
            </div>
          </div>

          {/* Right — settings rail */}
          <div className="space-y-4">
            <SettingsCard title="Publishing">
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Published Date
                <input
                  type="date"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-900"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                <span className="flex items-center justify-between">
                  Read Time
                  {readTimeTouched && (
                    <button
                      type="button"
                      onClick={() => { setReadTimeTouched(false); setReadTime(computeReadTimeFromHtml(content)); }}
                      className="inline-flex items-center gap-1 rounded-full border border-stone-200 px-2 py-0.5 text-[10px] font-semibold text-stone-500 hover:bg-stone-100"
                      title="Recalculate from content"
                    >
                      <TbSparkles size={11} /> auto
                    </button>
                  )}
                </span>
                <input
                  type="text"
                  value={readTime}
                  onChange={(e) => { setReadTime(e.target.value); setReadTimeTouched(true); }}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-900"
                />
                {!readTimeTouched && (
                  <span className="text-[10px] font-normal text-stone-400">Auto-calculated from your content.</span>
                )}
              </label>
            </SettingsCard>

            <SettingsCard title="Organize">
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Category
                <input
                  type="text"
                  list="blog-categories"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Product Fundamentals"
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-900"
                />
                <datalist id="blog-categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Tags (comma separated)
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Operations, AI"
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-900"
                />
              </label>
            </SettingsCard>

            <SettingsCard title="SEO">
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                <span className="flex items-center justify-between">
                  Meta Title
                  <CharCounter value={metaTitle} limit={META_TITLE_LIMIT} />
                </span>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={title || "Falls back to the blog title"}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-900"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                <span className="flex items-center justify-between">
                  Meta Description
                  <CharCounter value={metaDescription} limit={META_DESC_LIMIT} />
                </span>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder={excerpt || "Falls back to the excerpt"}
                  className="h-24 w-full resize-none rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-900"
                />
              </label>
            </SettingsCard>

            <SettingsCard title="Thumbnail">
              <ContentImageInput value={coverImage} onChange={setCoverImage} />
            </SettingsCard>

            <SettingsCard title="Author">
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Name
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-900"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Designation
                <input
                  type="text"
                  value={authorRole}
                  onChange={(e) => setAuthorRole(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-900"
                />
              </label>
              <ContentImageInput label="Avatar" value={authorAvatar} onChange={setAuthorAvatar} />
            </SettingsCard>
          </div>
        </div>
      </div>

      <BlogPreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={title}
        excerpt={excerpt}
        coverImage={coverImage}
        authorName={authorName}
        authorRole={authorRole}
        readTime={readTime}
        category={category}
        blocks={isEmptyHtml(content) ? [] : [{ id: "preview", type: "paragraph", html: content }]}
        faqs={faqs}
        slug={original?.slug || ""}
        siteUrl={domainConfig?.siteUrl}
        path={resource}
        isPublished={status === "Published"}
      />
    </main>
  );
}

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
      <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">{title}</h2>
      {children}
    </div>
  );
}

function CharCounter({ value, limit }: { value: string; limit: number }) {
  return (
    <span
      className={cn(
        "text-[10px] font-semibold tabular-nums",
        value.length > limit ? "text-amber-600" : "text-stone-400"
      )}
    >
      {value.length}/{limit}
    </span>
  );
}
