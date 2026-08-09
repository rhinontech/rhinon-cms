"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import { TbArticle, TbPlus, TbTrash, TbExternalLink, TbClock } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";
import { getDomainConfig, type ContentResource } from "./domains";
import type { Blog } from "./BlogEditor/types";

const RESOURCE_COPY: Record<ContentResource, { title: string; newLabel: string; empty: string }> = {
  blogs: { title: "Blogs", newLabel: "New Blog", empty: "No blogs yet. Create your first post." },
  "case-studies": { title: "Case Studies", newLabel: "New Case Study", empty: "No case studies yet." },
  events: { title: "Events", newLabel: "New Event", empty: "No events yet. Create your first event." },
};

export function BlogsManager({ resource = "blogs" }: { resource?: "blogs" | "events" }) {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const roleSlug = pathname.split("/")[1];
  const domain = params.domain as string;
  const domainConfig = getDomainConfig(domain);
  const copy = RESOURCE_COPY[resource];
  const basePath = `/${roleSlug}/content/${domain}`;

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlogs = useCallback(async () => {
    try {
      const path = resource === "blogs" ? `/content/blogs?domain=${domain}` : "/content/events";
      const data = await apiFetch<Blog[]>(path);
      setBlogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [resource, domain]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete this ${resource === "events" ? "event" : "post"}?`)) return;
    try {
      await apiFetch(`/content/${resource}/${id}`, { method: "DELETE" });
      fetchBlogs();
    } catch {
      alert("Delete failed");
    }
  };

  return (
    <main
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden glass-panel",
        isSubNavExpanded ? "rounded-r-xl" : "rounded-xl"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <SubNavToggle />
          <div>
            <h1 className="text-base font-semibold tracking-tight text-gray-900">{copy.title}</h1>
            <p className="text-xs text-gray-500">Posts published to the {domainConfig?.label || "site"} website.</p>
          </div>
        </div>
        <button
          onClick={() => router.push(`${basePath}/${resource}/new`)}
          className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-stone-800 transition-colors"
        >
          {copy.newLabel} <TbPlus size={14} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 gap-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl border border-stone-100 bg-white animate-pulse" />
            ))
          ) : blogs.length === 0 ? (
            <div className="py-20 text-center text-sm text-gray-400">{copy.empty}</div>
          ) : (
            blogs.map((blog) => (
              <div
                key={blog.id}
                onClick={() => router.push(`${basePath}/${resource}/${blog.id}`)}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white cursor-pointer hover:bg-stone-50 transition-colors group"
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
                      {blog.category && (
                        <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border bg-stone-50 text-stone-500 border-stone-200 truncate">
                          {blog.category}
                        </span>
                      )}
                      <span className="hidden sm:inline-flex items-center gap-1 text-xs text-stone-400">
                        <TbClock size={12} /> {blog.readTime}
                      </span>
                      <span className="text-xs text-stone-400 truncate">/{blog.slug}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                  {blog.status === "Published" && domainConfig && (
                    <a
                      href={`${domainConfig.siteUrl}/${resource}/${blog.slug}`}
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
  );
}
