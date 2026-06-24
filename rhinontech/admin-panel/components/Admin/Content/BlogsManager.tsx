"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TbArticle,
  TbPlus,
  TbTrash,
  TbLayoutSidebarFilled,
  TbLayoutSidebarRightFilled,
  TbExternalLink,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";
import { ContentImageInput } from "./ContentImageInput";

type BlogStatus = "Draft" | "Published";

interface Blog {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string | null;
  coverImage?: string | null;
  tags: string[];
  readTime: string;
  publishedAt: string;
  status: BlogStatus;
  updatedAt?: string;
}

type PanelMode = "view" | "create" | "edit";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rhinonlabs.com";

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  tags: "",
  readTime: "5 min read",
  authorName: "Prabhat Patra",
  authorRole: "Founder @ Rhinon Tech",
  authorAvatar: "",
  status: "Draft" as BlogStatus,
};

export function BlogsManager() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Blog | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>("view");
  const [panelVisible, setPanelVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchBlogs = useCallback(async () => {
    try {
      const data = await apiFetch<Blog[]>("/content/blogs");
      setBlogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const startCreate = () => {
    setForm(emptyForm);
    setSelected(null);
    setPanelMode("create");
    setPanelVisible(true);
  };

  const startEdit = (blog: Blog) => {
    setForm({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: blog.content,
      coverImage: blog.coverImage || "",
      tags: (blog.tags || []).join(", "),
      readTime: blog.readTime || "5 min read",
      authorName: blog.authorName || "Prabhat Patra",
      authorRole: blog.authorRole || "Founder @ Rhinon Tech",
      authorAvatar: blog.authorAvatar || "",
      status: blog.status,
    });
    setSelected(blog);
    setPanelMode("edit");
    setPanelVisible(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    try {
      if (panelMode === "create") {
        await apiFetch("/content/blogs", { method: "POST", body: JSON.stringify(payload) });
      } else {
        await apiFetch(`/content/blogs/${selected?.id}`, { method: "PUT", body: JSON.stringify(payload) });
      }
      setPanelMode("view");
      setPanelVisible(false);
      fetchBlogs();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this blog post?")) return;
    try {
      await apiFetch(`/content/blogs/${id}`, { method: "DELETE" });
      if (selected?.id === id) {
        setSelected(null);
        setPanelVisible(false);
      }
      fetchBlogs();
    } catch {
      alert("Delete failed");
    }
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <main
        className={cn(
          "flex h-full min-h-0 w-full flex-col overflow-hidden bg-stone-50",
          isSubNavExpanded ? "rounded-r-xl" : "rounded-xl"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            <SubNavToggle />
            <div>
              <h1 className="text-base font-semibold tracking-tight text-gray-900">Blogs</h1>
              <p className="text-xs text-gray-500">Posts published to the Rhinon Labs website.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={startCreate}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-stone-100"
            >
              New Blog <TbPlus size={14} />
            </button>
            {!panelVisible && (
              <button onClick={() => setPanelVisible(true)} className="rounded-lg p-2 text-gray-600 hover:bg-stone-100">
                <TbLayoutSidebarFilled size={20} />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 gap-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl border border-stone-100 bg-white animate-pulse" />
              ))
            ) : blogs.length === 0 ? (
              <div className="py-20 text-center text-sm text-gray-400">No blogs yet. Create your first post.</div>
            ) : (
              blogs.map((blog) => (
                <div
                  key={blog.id}
                  onClick={() => startEdit(blog)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white cursor-pointer hover:bg-stone-50 transition-colors group",
                    selected?.id === blog.id && "border-stone-900 ring-1 ring-stone-900 bg-stone-50/50"
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-12 w-16 shrink-0 rounded-lg overflow-hidden border border-stone-100 bg-stone-100 flex items-center justify-center">
                      {blog.coverImage ? (
                        <img src={blog.coverImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <TbArticle size={18} className="text-stone-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-stone-900 text-sm truncate">{blog.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={cn(
                            "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border",
                            blog.status === "Published"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : "bg-amber-50 text-amber-600 border-amber-100"
                          )}
                        >
                          {blog.status}
                        </span>
                        <span className="text-xs text-stone-400 truncate">/{blog.slug}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    {blog.status === "Published" && (
                      <a
                        href={`${SITE_URL}/blogs/${blog.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-stone-300 hover:text-stone-700 rounded"
                        title="View live"
                      >
                        <TbExternalLink size={17} />
                      </a>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(blog.id); }}
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

      {/* Editor panel */}
      <aside
        className={`flex min-h-0 h-full flex-col bg-white rounded-xl overflow-hidden transition-all duration-200 ease-in-out ${
          panelVisible ? "w-[48%] ml-2" : "w-0"
        }`}
      >
        {panelVisible && (
          <div className="flex h-full flex-1 flex-col overflow-hidden">
            <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-5">
              <p className="-mb-px flex self-stretch items-center border-b-2 border-stone-900 text-sm font-bold tracking-tight text-black">
                {panelMode === "create" ? "New Blog" : "Edit Blog"}
              </p>
              <button onClick={() => setPanelVisible(false)} className="text-gray-600 hover:text-gray-900">
                <TbLayoutSidebarRightFilled size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {(panelMode === "create" || panelMode === "edit") && (
                <form onSubmit={handleSave} className="flex-1 flex flex-col p-5 space-y-4 pb-8">
                  <FormInput label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required placeholder="How we scale operations without hiring" />

                  <FormInput label="Slug (optional — auto from title)" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} placeholder="how-we-scale-operations" />

                  <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Excerpt
                    <textarea
                      required
                      value={form.excerpt}
                      onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-stone-900 bg-white resize-none h-20 text-sm"
                      placeholder="One or two sentences shown on the blog card."
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Content (Markdown)
                    <textarea
                      required
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-stone-900 bg-white resize-none h-64 text-sm font-mono"
                      placeholder={"## Heading\n\nParagraph text. Use **bold**, and\n\n- bullet points"}
                    />
                  </label>

                  <ContentImageInput label="Cover Image" value={form.coverImage} onChange={(v) => setForm({ ...form, coverImage: v })} />

                  <div className="grid grid-cols-2 gap-3">
                    <FormInput label="Tags (comma separated)" value={form.tags} onChange={(v) => setForm({ ...form, tags: v })} placeholder="Operations, AI" />
                    <FormInput label="Read Time" value={form.readTime} onChange={(v) => setForm({ ...form, readTime: v })} placeholder="5 min read" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormInput label="Author Name" value={form.authorName} onChange={(v) => setForm({ ...form, authorName: v })} />
                    <FormInput label="Author Role" value={form.authorRole} onChange={(v) => setForm({ ...form, authorRole: v })} />
                  </div>

                  <FormInput label="Author Avatar URL" value={form.authorAvatar} onChange={(v) => setForm({ ...form, authorAvatar: v })} placeholder="https://..." />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as BlogStatus })}
                      className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:outline-none text-sm bg-white"
                    >
                      <option value="Draft">Draft (hidden from site)</option>
                      <option value="Published">Published (live on site)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-3 border-t pt-4 mt-auto">
                    <button type="button" onClick={() => setPanelVisible(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                      Cancel
                    </button>
                    <button type="submit" disabled={saving} className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60 transition-colors">
                      {saving ? "Saving..." : panelMode === "create" ? "Save Blog" : "Update Blog"}
                    </button>
                  </div>
                </form>
              )}
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
