"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  TbPlus, TbChevronRight, TbFileText, TbDots, TbTrash, TbSearch, TbX,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useSideNav } from "@/context/SideNavContext";
import { usePagesStore } from "./pagesStore";
import { buildTree, isImageIcon, type PageNode, type PageTreeNode } from "./types";

function PageIcon({ icon, size = 14 }: { icon: string | null; size?: number }) {
  if (isImageIcon(icon)) {
    return (
      <span className="inline-block shrink-0 overflow-hidden rounded-sm align-middle" style={{ width: size, height: size }}>
        <img src={icon!} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }
  if (icon) return <span className="shrink-0 text-sm leading-none">{icon}</span>;
  return <TbFileText size={size} className="shrink-0 text-muted-foreground" />;
}
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PagesSidebar({ activeId, onChanged }: { activeId?: string; onChanged?: () => void }) {
  const { isExpanded, toggleSideNav } = useSideNav();
  const router = useRouter();
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];

  const [pages, setPages] = useState<PageNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<PageNode[] | null>(null);

  const fetchTree = async () => {
    try {
      const data = await apiFetch<PageNode[]>("/pages/tree");
      setPages(data);
    } catch (err) {
      console.error("Failed to load pages", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  // PageEditor saves title/icon edits directly to the backend without going
  // through this component's fetched copy — apply its patches live instead of
  // waiting for the next fetchTree() (create/archive/refresh).
  const lastPatch = usePagesStore((s) => s.lastPatch);
  useEffect(() => {
    if (!lastPatch) return;
    setPages((prev) => prev.map((p) => (p.id === lastPatch.id ? { ...p, ...lastPatch.patch } : p)));
  }, [lastPatch]);

  // A page created elsewhere (e.g. the "/page" slash command) becomes active
  // before this tree knows about it — refetch once so it appears.
  const refetchedForRef = useRef<string | null>(null);
  useEffect(() => {
    if (!activeId || loading) return;
    if (!pages.some((p) => p.id === activeId) && refetchedForRef.current !== activeId) {
      refetchedForRef.current = activeId;
      fetchTree();
    }
  }, [activeId, pages, loading]);

  // Auto-expand ancestors of the active page.
  useEffect(() => {
    if (!activeId || pages.length === 0) return;
    const byId = new Map(pages.map((p) => [p.id, p]));
    const toExpand = new Set<string>();
    let cur = byId.get(activeId);
    while (cur?.parentId) {
      toExpand.add(cur.parentId);
      cur = byId.get(cur.parentId);
    }
    if (toExpand.size) setExpandedIds((prev) => new Set([...prev, ...toExpand]));
  }, [activeId, pages]);

  useEffect(() => {
    const q = search.trim();
    if (!q) { setSearchResults(null); return; }
    const t = setTimeout(() => {
      apiFetch<PageNode[]>(`/pages/search?q=${encodeURIComponent(q)}`).then(setSearchResults).catch(() => setSearchResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const tree = useMemo(() => buildTree(pages), [pages]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const createPage = async (parentId?: string) => {
    try {
      const page = await apiFetch<{ id: string }>("/pages", {
        method: "POST",
        body: JSON.stringify({ title: "Untitled", parentId: parentId || null }),
      });
      if (parentId) setExpandedIds((prev) => new Set(prev).add(parentId));
      await fetchTree();
      onChanged?.();
      router.push(`/${roleSlug}/pages/${page.id}`);
    } catch (err: any) {
      alert(err.message || "Failed to create page");
    }
  };

  const archivePage = async (id: string) => {
    if (!confirm("Archive this page and its sub-pages?")) return;
    try {
      await apiFetch(`/pages/${id}`, { method: "DELETE" });
      await fetchTree();
      onChanged?.();
      if (id === activeId) router.push(`/${roleSlug}/pages`);
    } catch (err: any) {
      alert(err.message || "Failed to archive page");
    }
  };

  // Auto-close overlay on route changes on mobile
  const prevPath = useRef(pathname);
  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      if (isExpanded && typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
        toggleSideNav();
      }
    }
  }, [pathname, isExpanded, toggleSideNav]);

  const renderNode = (node: PageTreeNode, depth: number) => {
    const isOpen = expandedIds.has(node.id);
    const isActive = node.id === activeId;
    return (
      <div key={node.id}>
        <div
          className={cn(
            "group flex items-center gap-1 rounded-md py-1.5 pr-1.5 text-sm cursor-pointer",
            isActive ? "bg-card/80 text-foreground font-medium shadow-xs" : "text-foreground/70 hover:bg-card/40"
          )}
          style={{ paddingLeft: `${depth * 14 + 6}px` }}
          onClick={() => {
            router.push(`/${roleSlug}/pages/${node.id}`);
            if (isExpanded && typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
              toggleSideNav();
            }
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
            className={cn("shrink-0 rounded p-0.5 hover:bg-foreground/5", node.children.length === 0 && "invisible")}
          >
            <TbChevronRight size={13} className={cn("transition-transform", isOpen && "rotate-90")} />
          </button>
          <PageIcon icon={node.icon} />
          <span className="flex-1 min-w-0 truncate">{node.title || "Untitled"}</span>
          <button
            onClick={(e) => { e.stopPropagation(); createPage(node.id); }}
            className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground/85 hover:bg-foreground/5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
            title="Add sub-page"
          >
            <TbPlus size={14} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground/85 hover:bg-foreground/5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
              >
                <TbDots size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={() => archivePage(node.id)} className="gap-2 text-red-600 dark:text-red-300">
                <TbTrash size={14} /> Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {isOpen && node.children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <>
      {/* Phone backdrop */}
      {isExpanded && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={toggleSideNav} />
      )}
      <aside
        className={cn(
          "flex-col glass-sidenav transition-all duration-200 ease-in-out overflow-hidden",
          isExpanded
            ? "fixed inset-y-0 left-0 z-50 flex w-72 max-lg:bg-card! shadow-xl lg:static lg:z-auto lg:h-full lg:w-[18%] lg:min-w-[220px] lg:rounded-l-xl lg:glass-sidenav lg:shadow-none lg:border-r lg:border-border"
            : "hidden lg:flex lg:h-full lg:w-0"
        )}
      >
        {isExpanded && (
          <div className="flex h-full w-full flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
              <span className="text-lg font-semibold tracking-tight">Pages</span>
              <div className="flex items-center gap-1">
                <button onClick={() => createPage()} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" title="New page">
                  <TbPlus size={17} />
                </button>
                <button onClick={toggleSideNav} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:hidden" aria-label="Close menu">
                  <TbX size={18} />
                </button>
              </div>
            </div>

            <div className="px-3 pt-3">
              <div className="relative">
                <TbSearch size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search pages…"
                  className="w-full rounded-lg border border-border bg-card/60 py-1.5 pl-7 pr-7 text-xs outline-none focus:ring-1 focus:ring-border"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground/85">
                    <TbX size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2">
              {loading ? (
                <div className="space-y-1.5 px-2">
                  {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-6 animate-pulse rounded bg-card/40" />)}
                </div>
              ) : searchResults ? (
                searchResults.length === 0 ? (
                  <p className="px-3 py-4 text-center text-xs text-muted-foreground">No matches</p>
                ) : (
                  searchResults.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSearch("");
                        router.push(`/${roleSlug}/pages/${p.id}`);
                        if (isExpanded && typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
                          toggleSideNav();
                        }
                      }}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground/85 hover:bg-card/40"
                    >
                      <PageIcon icon={p.icon} />
                      <span className="truncate">{p.title || "Untitled"}</span>
                    </div>
                  ))
                )
              ) : tree.length === 0 ? (
                <div className="px-3 py-6 text-center">
                  <p className="mb-2 text-xs text-muted-foreground">No pages yet</p>
                  <button onClick={() => createPage()} className="text-xs font-semibold text-foreground/85 hover:underline">
                    + New page
                  </button>
                </div>
              ) : (
                tree.map((node) => renderNode(node, 0))
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
