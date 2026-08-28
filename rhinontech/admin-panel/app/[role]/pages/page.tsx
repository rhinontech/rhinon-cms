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
          className="rounded-lg border border-border bg-card/80 p-2 text-foreground/70 hover:bg-muted"
          aria-label="Open sidebar"
        >
          <TbFileText size={18} />
        </button>
      </div>
      <TbFileText size={40} className="text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">{hasPages ? "Select a page from the sidebar" : "No pages yet"}</p>
      <div className="flex items-center gap-2">
        {hasPages && (
          <button
            onClick={toggleSideNav}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-1.5 text-xs font-medium text-foreground/85 hover:bg-muted lg:hidden"
          >
            Open sidebar
          </button>
        )}
        <button
          onClick={createPage}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <TbPlus size={14} /> New page
        </button>
      </div>
    </div>
  );
}
