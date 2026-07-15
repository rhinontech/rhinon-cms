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
  const { isExpanded } = useSideNav();
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
    <div className={cn("flex h-full w-full flex-col items-center justify-center gap-3 text-center glass-panel", isExpanded ? "rounded-r-xl" : "rounded-xl")}>
      <TbFileText size={40} className="text-stone-200" />
      <p className="text-sm text-stone-400">{hasPages ? "Select a page from the sidebar" : "No pages yet"}</p>
      <button
        onClick={createPage}
        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3.5 py-1.5 text-xs font-medium hover:bg-stone-100"
      >
        <TbPlus size={14} /> New page
      </button>
    </div>
  );
}
