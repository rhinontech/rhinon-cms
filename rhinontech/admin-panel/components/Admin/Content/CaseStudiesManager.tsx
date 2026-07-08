"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  TbTrophy,
  TbPlus,
  TbTrash,
  TbLayoutSidebarFilled,
  TbLayoutSidebarRightFilled,
  TbUpload,
  TbLoader,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch, apiUpload } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";
import { ContentImageInput } from "./ContentImageInput";

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

type PanelMode = "create" | "edit";

const emptyForm = {
  title: "",
  slug: "",
  description: "",
  content: "",
  client: "",
  industry: "",
  category: "",
  timeline: "",
  liveLink: "",
  date: "",
  result: "",
  quote: "",
  image: "",
  images: [] as string[],
  stats: [{ value: "", suffix: "", label: "" }] as Stat[],
  displayOrder: 0,
  status: "Draft" as Status,
};

export function CaseStudiesManager() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [items, setItems] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CaseStudy | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>("create");
  const [panelVisible, setPanelVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchItems = useCallback(async () => {
    try {
      const data = await apiFetch<CaseStudy[]>("/content/case-studies");
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const startCreate = () => {
    setForm(emptyForm);
    setSelected(null);
    setPanelMode("create");
    setPanelVisible(true);
  };

  const startEdit = (cs: CaseStudy) => {
    setForm({
      title: cs.title,
      slug: cs.slug,
      description: cs.description,
      content: cs.content || "",
      client: cs.client || "",
      industry: cs.industry || "",
      category: cs.category || "",
      timeline: cs.timeline || "",
      liveLink: cs.liveLink || "",
      date: cs.date || "",
      result: cs.result || "",
      quote: cs.quote || "",
      image: cs.image || "",
      images: cs.images?.length ? cs.images : [],
      stats: cs.stats?.length ? cs.stats : [{ value: "", suffix: "", label: "" }],
      displayOrder: cs.displayOrder ?? 0,
      status: cs.status,
    });
    setSelected(cs);
    setPanelMode("edit");
    setPanelVisible(true);
  };

  const updateStat = (i: number, key: keyof Stat, value: string) => {
    setForm((f) => {
      const stats = [...f.stats];
      stats[i] = { ...stats[i], [key]: value };
      return { ...f, stats };
    });
  };

  const addStat = () => setForm((f) => ({ ...f, stats: [...f.stats, { value: "", suffix: "", label: "" }] }));
  const removeStat = (i: number) =>
    setForm((f) => ({ ...f, stats: f.stats.filter((_, idx) => idx !== i) }));

  const updateImage = (i: number, value: string) =>
    setForm((f) => {
      const images = [...f.images];
      images[i] = value;
      return { ...f, images };
    });
  const addImage = () => setForm((f) => ({ ...f, images: [...f.images, ""] }));
  const removeImage = (i: number) =>
    setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGalleryUploading(true);
    try {
      const { url } = await apiUpload<{ url: string }>("/content/upload-image", file);
      setForm((f) => ({ ...f, images: [...f.images, url] }));
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setGalleryUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      displayOrder: Number(form.displayOrder) || 0,
      images: form.images.map((u) => u.trim()).filter(Boolean),
      stats: form.stats.filter((s) => s.value.trim() || s.label.trim()),
    };
    try {
      if (panelMode === "create") {
        await apiFetch("/content/case-studies", { method: "POST", body: JSON.stringify(payload) });
      } else {
        await apiFetch(`/content/case-studies/${selected?.id}`, { method: "PUT", body: JSON.stringify(payload) });
      }
      setPanelVisible(false);
      fetchItems();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this case study?")) return;
    try {
      await apiFetch(`/content/case-studies/${id}`, { method: "DELETE" });
      if (selected?.id === id) {
        setSelected(null);
        setPanelVisible(false);
      }
      fetchItems();
    } catch {
      alert("Delete failed");
    }
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <main
        className={cn(
          "flex h-full min-h-0 w-full flex-col overflow-hidden glass-panel",
          isSubNavExpanded ? "rounded-r-xl" : "rounded-xl"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            <SubNavToggle />
            <div>
              <h1 className="text-base font-semibold tracking-tight text-gray-900">Case Studies</h1>
              <p className="text-xs text-gray-500">Proof points shown on the Rhinon Labs website.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={startCreate}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-stone-100"
            >
              New Case Study <TbPlus size={14} />
            </button>
            {!panelVisible && (
              <button onClick={() => setPanelVisible(true)} className="rounded-lg p-2 text-gray-600 hover:bg-stone-100">
                <TbLayoutSidebarFilled size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 gap-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl border border-stone-100 bg-white animate-pulse" />
              ))
            ) : items.length === 0 ? (
              <div className="py-20 text-center text-sm text-gray-400">No case studies yet.</div>
            ) : (
              items.map((cs) => (
                <div
                  key={cs.id}
                  onClick={() => startEdit(cs)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white cursor-pointer hover:bg-stone-50 transition-colors group",
                    selected?.id === cs.id && "border-stone-900 ring-1 ring-stone-900 bg-stone-50/50"
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-12 w-16 shrink-0 rounded-lg overflow-hidden border border-stone-100 bg-stone-100 flex items-center justify-center">
                      {cs.image ? (
                        <img src={cs.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <TbTrophy size={18} className="text-stone-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-stone-900 text-sm truncate">{cs.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={cn(
                            "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border",
                            cs.status === "Published"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : "bg-amber-50 text-amber-600 border-amber-100"
                          )}
                        >
                          {cs.status}
                        </span>
                        {cs.industry && <span className="text-xs text-stone-400 truncate">{cs.industry}</span>}
                        <span className="text-[10px] text-stone-300">#{cs.displayOrder}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(cs.id); }}
                      className="p-1.5 text-stone-300 hover:text-red-600 rounded"
                      title="Delete"
                    >
                      <TbTrash size={17} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <aside
        className={`flex min-h-0 h-full flex-col bg-white rounded-xl overflow-hidden transition-all duration-200 ease-in-out ${
          panelVisible ? "w-[48%] ml-2" : "w-0"
        }`}
      >
        {panelVisible && (
          <div className="flex h-full flex-1 flex-col overflow-hidden">
            <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-5">
              <p className="-mb-px flex self-stretch items-center border-b-2 border-stone-900 text-sm font-bold tracking-tight text-black">
                {panelMode === "create" ? "New Case Study" : "Edit Case Study"}
              </p>
              <button onClick={() => setPanelVisible(false)} className="text-gray-600 hover:text-gray-900">
                <TbLayoutSidebarRightFilled size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              <form onSubmit={handleSave} className="flex-1 flex flex-col p-5 space-y-4 pb-8">
                <FormInput label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required placeholder="ApexisPro — Architecture Operations" />

                <div className="grid grid-cols-2 gap-3">
                  <FormInput label="Client" value={form.client} onChange={(v) => setForm({ ...form, client: v })} placeholder="ApexisPro" />
                  <FormInput label="Industry" value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} placeholder="Architecture" />
                </div>

                <FormInput label="Slug (optional — auto from title)" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} placeholder="apexispro-architecture-operations" />

                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  Summary
                  <textarea
                    required
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-stone-900 bg-white resize-none h-24 text-sm"
                    placeholder="Short summary shown on cards & the case-study header."
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  Full Story (Markdown, optional)
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-stone-900 bg-white resize-none h-56 text-sm font-mono"
                    placeholder={"## The Challenge\n\nWhat they were struggling with...\n\n## What We Built\n\n- point one\n- point two\n\n## The Result\n\n**Outcome** in their words."}
                  />
                </label>

                <FormInput label="Result (optional)" value={form.result} onChange={(v) => setForm({ ...form, result: v })} placeholder="Delivered a centralized operational platform (₹4,00,000 project)." />

                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  Quote (optional)
                  <textarea
                    value={form.quote}
                    onChange={(e) => setForm({ ...form, quote: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-stone-900 bg-white resize-none h-20 text-sm"
                    placeholder="A short, factual outcome statement (not a fabricated testimonial)."
                  />
                </label>

                <ContentImageInput label="Cover Image" value={form.image} onChange={(v) => setForm({ ...form, image: v })} />

                {/* Portfolio details (shown on the public case-study page) */}
                <div className="grid grid-cols-2 gap-3">
                  <FormInput label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} placeholder="Operations Platform" />
                  <FormInput label="Timeline" value={form.timeline} onChange={(v) => setForm({ ...form, timeline: v })} placeholder="12 weeks" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormInput label="Date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} placeholder="2024" />
                  <FormInput label="Live Link" value={form.liveLink} onChange={(v) => setForm({ ...form, liveLink: v })} placeholder="https://client-site.com" />
                </div>

                {/* Gallery editor */}
                <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Gallery Images</p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        disabled={galleryUploading}
                        className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1 disabled:opacity-50"
                      >
                        {galleryUploading ? <TbLoader className="animate-spin" size={13} /> : <TbUpload size={13} />}
                        {galleryUploading ? "Uploading..." : "Upload"}
                      </button>
                      <button type="button" onClick={addImage} className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1">
                        <TbPlus size={13} /> Add URL
                      </button>
                    </div>
                  </div>
                  <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" />
                  {form.images.length === 0 && (
                    <p className="text-xs text-stone-400">No gallery images yet — these show on the case-study detail page.</p>
                  )}
                  {form.images.map((url, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={url}
                        onChange={(e) => updateImage(i, e.target.value)}
                        placeholder="https://image-url..."
                        className="flex-1 px-2 py-1.5 rounded-lg border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
                      />
                      <button type="button" onClick={() => removeImage(i)} className="p-1.5 text-stone-300 hover:text-red-600 rounded shrink-0">
                        <TbTrash size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Stats editor */}
                <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Headline Stats</p>
                    <button type="button" onClick={addStat} className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1">
                      <TbPlus size={13} /> Add
                    </button>
                  </div>
                  {form.stats.map((stat, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={stat.value}
                        onChange={(e) => updateStat(i, "value", e.target.value)}
                        placeholder="₹4L"
                        className="w-20 px-2 py-1.5 rounded-lg border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
                      />
                      <input
                        value={stat.suffix || ""}
                        onChange={(e) => updateStat(i, "suffix", e.target.value)}
                        placeholder="+"
                        className="w-14 px-2 py-1.5 rounded-lg border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
                      />
                      <input
                        value={stat.label}
                        onChange={(e) => updateStat(i, "label", e.target.value)}
                        placeholder="project value delivered"
                        className="flex-1 px-2 py-1.5 rounded-lg border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
                      />
                      <button type="button" onClick={() => removeStat(i)} className="p-1.5 text-stone-300 hover:text-red-600 rounded shrink-0">
                        <TbTrash size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormInput label="Display Order" type="number" value={String(form.displayOrder)} onChange={(v) => setForm({ ...form, displayOrder: Number(v) || 0 })} placeholder="1" />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                      className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:outline-none text-sm bg-white"
                    >
                      <option value="Draft">Draft (hidden)</option>
                      <option value="Published">Published (live)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t pt-4 mt-auto">
                  <button type="button" onClick={() => setPanelVisible(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60 transition-colors">
                    {saving ? "Saving..." : panelMode === "create" ? "Save Case Study" : "Update Case Study"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
      {label}
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-stone-900 bg-white text-sm"
      />
    </label>
  );
}
