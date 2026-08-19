"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TbFileText, TbPlus } from "react-icons/tb";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useSideNav } from "@/context/SideNavContext";
import type { PageNode } from "@/components/Admin/Pages/types";

export default function PagesIndexPage() {
  const router = useRouter();
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const { isExpanded, toggleSideNav } = useSideNav();
  const [loading, setLoading] = useState(true);
  const [hasPages, setHasPages] = useState(false);

  useEffect(() => {
    apiFetch<PageNode[]>("/pages/tree")
      .then((pages) => setHasPages(pages.length > 0))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const createPage = async () => {
    try {
      const page = await apiFetch<{ id: string }>("/pages", { method: "POST", body: JSON.stringify({ title: "Untitled" }) });
      router.push(`/${roleSlug}/pages/${page.id}`);
    } catch (err: any) {
      alert(err.message || "Failed to create page");
    }
  };

  if (loading) return null;

  return (
    <div className={cn("relative flex h-full w-full flex-col items-center justify-center gap-3 text-center glass-panel", isExpanded ? "lg:rounded-r-xl rounded-xl" : "rounded-xl")}>
      <div className="absolute left-4 top-4 lg:hidden">
        <button
          onClick={toggleSideNav}
          className="rounded-lg border border-stone-200 bg-white/80 p-2 text-gray-600 hover:bg-stone-100"
          aria-label="Open sidebar"
        >
          <TbFileText size={18} />
        </button>
      </div>
      <TbFileText size={40} className="text-stone-200" />
      <p className="text-sm text-stone-400">{hasPages ? "Select a page from the sidebar" : "No pages yet"}</p>
      <div className="flex items-center gap-2">
        {hasPages && (
          <button
            onClick={toggleSideNav}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-stone-100 lg:hidden"
          >
            Open sidebar
          </button>
        )}
        <button
          onClick={createPage}
          className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-stone-800"
        >
          <TbPlus size={14} /> New page
        </button>
      </div>
    </div>
  );
}
