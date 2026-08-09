"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import { TbArrowLeft, TbLoader, TbPlus, TbTrash, TbUpload } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch, apiUpload } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { ContentImageInput } from "../ContentImageInput";
import { ParagraphBlock } from "../BlogEditor/ParagraphBlock";
import { legacyMarkdownToHtml } from "../BlogEditor/legacyMarkdown";
import { newBlockId, slugifyTitle, type BlogBlock } from "../BlogEditor/types";

type Status = "Draft" | "Published";

interface Stat {
  value: string;
  suffix?: string;
  label: string;
}

interface CaseStudy {
  id: string;
  title: string;
  description: string;
  content?: string | null;
  contentBlocks?: BlogBlock[];
  slug: string;
  client?: string | null;
  industry?: string | null;
  category?: string | null;
  timeline?: string | null;
  liveLink?: string | null;
  date?: string | null;
  result?: string | null;
  quote?: string | null;
  image?: string | null;
  images?: string[];
  stats: Stat[];
  displayOrder: number;
  status: Status;
  updatedAt?: string;
}

function isEmptyHtml(html: string): boolean {
  return !html || !html.replace(/<[^>]*>/g, " ").trim();
}

export function CaseStudyEditorPage({ id }: { id?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const roleSlug = pathname.split("/")[1];
  const domain = params.domain as string;
  const listPath = `/${roleSlug}/content/${domain}/case-studies`;

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState<Status | null>(null);
  const [error, setError] = useState("");
  const [original, setOriginal] = useState<CaseStudy | null>(null);
  const [legacyConverted, setLegacyConverted] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  // One continuous document, same model as the blog editor — images/video embed inline.
  const [content, setContent] = useState("");
  const [client, setClient] = useState("");
  const [industry, setIndustry] = useState("");
  const [category, setCategory] = useState("");
  const [timeline, setTimeline] = useState("");
  const [liveLink, setLiveLink] = useState("");
  const [date, setDate] = useState("");
  const [result, setResult] = useState("");
  const [quote, setQuote] = useState("");
  const [image, setImage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [stats, setStats] = useState<Stat[]>([{ value: "", suffix: "", label: "" }]);
  const [displayOrder, setDisplayOrder] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const cs = await apiFetch<CaseStudy>(`/content/case-studies/${id}`);
        if (cancelled) return;
        setOriginal(cs);
        setTitle(cs.title);
        setSlug(cs.slug);
        setSlugTouched(true);
        setDescription(cs.description);
        setClient(cs.client || "");
        setIndustry(cs.industry || "");
        setCategory(cs.category || "");
        setTimeline(cs.timeline || "");
        setLiveLink(cs.liveLink || "");
        setDate(cs.date || "");
        setResult(cs.result || "");
        setQuote(cs.quote || "");
        setImage(cs.image || "");
        setImages(cs.images?.length ? cs.images : []);
        setStats(cs.stats?.length ? cs.stats : [{ value: "", suffix: "", label: "" }]);
        setDisplayOrder(cs.displayOrder ?? 0);

        const isSingleParagraph = cs.contentBlocks?.length === 1 && cs.contentBlocks[0].type === "paragraph";
        if (isSingleParagraph) {
          setContent((cs.contentBlocks![0] as any).html);
        } else if (cs.content) {
          setContent(legacyMarkdownToHtml(cs.content));
          setLegacyConverted(true);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load case study");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!id && !slugTouched) setSlug(slugifyTitle(title));
  }, [title, id, slugTouched]);

  const updateStat = (i: number, key: keyof Stat, value: string) =>
    setStats((s) => s.map((st, idx) => (idx === i ? { ...st, [key]: value } : st)));
  const addStat = () => setStats((s) => [...s, { value: "", suffix: "", label: "" }]);
  const removeStat = (i: number) => setStats((s) => s.filter((_, idx) => idx !== i));

  const updateImage = (i: number, value: string) =>
    setImages((imgs) => imgs.map((u, idx) => (idx === i ? value : u)));
  const addImageUrl = () => setImages((imgs) => [...imgs, ""]);
  const removeImage = (i: number) => setImages((imgs) => imgs.filter((_, idx) => idx !== i));

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGalleryUploading(true);
    try {
      const { url } = await apiUpload<{ url: string }>("/content/upload-image", file);
      setImages((imgs) => [...imgs, url]);
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setGalleryUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const handleSave = useCallback(
    async (status: Status) => {
      setError("");
      if (!title.trim()) { setError("Title is required."); return; }
      if (!description.trim()) { setError("Summary is required."); return; }

      const cleanBlocks: BlogBlock[] = isEmptyHtml(content)
        ? []
        : [{ id: newBlockId(), type: "paragraph", html: content }];

      const payload = {
        title: title.trim(),
        slug: slug.trim() || slugifyTitle(title),
        description: description.trim(),
        contentBlocks: cleanBlocks,
        client: client.trim() || null,
        industry: industry.trim() || null,
        category: category.trim() || null,
        timeline: timeline.trim() || null,
        liveLink: liveLink.trim() || null,
        date: date.trim() || null,
        result: result.trim() || null,
        quote: quote.trim() || null,
        image: image || null,
        images: images.map((u) => u.trim()).filter(Boolean),
        stats: stats.filter((s) => s.value.trim() || s.label.trim()),
        displayOrder: Number(displayOrder) || 0,
        status,
      };

      setSaving(status);
      try {
        if (id) {
          const updated = await apiFetch<CaseStudy>(`/content/case-studies/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          setOriginal(updated);
          setSlug(updated.slug);
          setLegacyConverted(false);
        } else {
          const created = await apiFetch<CaseStudy>("/content/case-studies", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          router.replace(`${listPath}/${created.id}`);
        }
      } catch (err: any) {
        setError(err.message || "Save failed");
      } finally {
        setSaving(null);
      }
    },
    [
      id, title, slug, description, content, client, industry, category, timeline, liveLink,
      date, result, quote, image, images, stats, displayOrder, router, listPath,
    ]
  );

  const status: Status = original?.status || "Draft";
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
      <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b px-4">
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={() => router.push(listPath)}
            className="rounded-lg p-2 text-gray-600 hover:bg-stone-100"
            title="Back to case studies"
          >
            <TbArrowLeft size={18} />
          </button>
          <SubNavToggle />
          <h1 className="truncate text-base font-semibold tracking-tight text-gray-900">
            {id ? "Edit Case Study" : "New Case Study"}
          </h1>
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
          This case study was converted from legacy markdown — review the formatting before saving.
        </div>
      )}

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
                  placeholder="ApexisPro — Architecture Operations"
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-lg font-bold tracking-tight outline-none focus:ring-2 focus:ring-stone-900"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Case Study URL
                <div className="flex items-center overflow-hidden rounded-lg border border-stone-200 bg-white focus-within:ring-2 focus-within:ring-stone-900">
                  <span className="shrink-0 border-r border-stone-100 bg-stone-50 px-3 py-2 text-sm text-stone-400">/case-studies/</span>
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
                    Changing the URL of a published case study breaks existing links to it.
                  </p>
                )}
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Summary
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short summary shown on cards & the case-study header."
                  className="h-20 w-full resize-none rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-stone-900"
                />
              </label>
            </div>

            <ParagraphBlock html={content} onChange={setContent} />

            <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Result (optional)
                <input
                  type="text"
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  placeholder="Delivered a centralized operational platform (₹4,00,000 project)."
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-900"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Quote (optional)
                <textarea
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="A short, factual outcome statement (not a fabricated testimonial)."
                  className="h-20 w-full resize-none rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-900"
                />
              </label>
            </div>

            {/* Gallery editor */}
            <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">Gallery Images</h2>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={galleryUploading}
                    className="flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-stone-900 disabled:opacity-50"
                  >
                    {galleryUploading ? <TbLoader className="animate-spin" size={13} /> : <TbUpload size={13} />}
                    {galleryUploading ? "Uploading…" : "Upload"}
                  </button>
                  <button type="button" onClick={addImageUrl} className="flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-stone-900">
                    <TbPlus size={13} /> Add URL
                  </button>
                </div>
              </div>
              <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" />
              {images.length === 0 && (
                <p className="text-xs text-stone-400">No gallery images yet — these show on the case-study detail page.</p>
              )}
              {images.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={url}
                    onChange={(e) => updateImage(i, e.target.value)}
                    placeholder="https://image-url..."
                    className="flex-1 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-stone-900"
                  />
                  <button type="button" onClick={() => removeImage(i)} className="shrink-0 rounded p-1.5 text-stone-300 hover:text-red-600">
                    <TbTrash size={15} />
                  </button>
                </div>
              ))}
            </div>

            {/* Stats editor */}
            <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">Headline Stats</h2>
                <button type="button" onClick={addStat} className="flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-stone-900">
                  <TbPlus size={13} /> Add
                </button>
              </div>
              {stats.map((stat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={stat.value}
                    onChange={(e) => updateStat(i, "value", e.target.value)}
                    placeholder="₹4L"
                    className="w-20 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-stone-900"
                  />
                  <input
                    value={stat.suffix || ""}
                    onChange={(e) => updateStat(i, "suffix", e.target.value)}
                    placeholder="+"
                    className="w-14 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-stone-900"
                  />
                  <input
                    value={stat.label}
                    onChange={(e) => updateStat(i, "label", e.target.value)}
                    placeholder="project value delivered"
                    className="flex-1 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-stone-900"
                  />
                  <button type="button" onClick={() => removeStat(i)} className="shrink-0 rounded p-1.5 text-stone-300 hover:text-red-600">
                    <TbTrash size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right — settings rail */}
          <div className="space-y-4">
            <SettingsCard title="Client">
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Client
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="ApexisPro"
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-900"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Industry
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Architecture"
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-900"
                />
              </label>
            </SettingsCard>

            <SettingsCard title="Project Details">
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Category
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Operations Platform"
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-900"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Timeline
                <input
                  type="text"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  placeholder="12 weeks"
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-900"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Date
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="2024"
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-900"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Live Link
                <input
                  type="text"
                  value={liveLink}
                  onChange={(e) => setLiveLink(e.target.value)}
                  placeholder="https://client-site.com"
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-900"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Display Order
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-900"
                />
              </label>
            </SettingsCard>

            <SettingsCard title="Cover Image">
              <ContentImageInput value={image} onChange={setImage} />
            </SettingsCard>
          </div>
        </div>
      </div>
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
