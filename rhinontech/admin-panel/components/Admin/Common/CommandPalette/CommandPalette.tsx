"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { IconType } from "react-icons";
import {
  TbBook, TbBriefcase, TbBuilding, TbCheckbox, TbCornerDownLeft, TbCurrencyRupee, TbLoader2, TbUser, TbUsers,
} from "react-icons/tb";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import { usePermissions } from "@/context/PermissionsContext";
import { SITE_SCOPED_MODULES, useActiveBrand, type SiteScopedModule } from "@/lib/sites";
import {
  APPROVAL_PERMISSIONS, JUMP_PAGES, MODULES, NAV_SECTIONS, PAGE_LABELS, PLATFORM_ITEMS, entryRoute, moduleTone,
} from "@/components/Admin/Common/navConfig";
import { useCommandPalette } from "./store";

type RecordType = "lead" | "deal" | "account" | "project" | "task" | "person" | "page";

interface SearchResult {
  type: RecordType;
  id: string;
  title: string;
  subtitle: string | null;
  projectId?: string | null;
}

interface JumpTarget {
  id: string;
  label: string;
  /** Where it lives, shown faintly beside the label: "Settings", "CRM"… */
  hint: string;
  href: string;
  moduleKey: string;
  keywords: string;
}

/** How each record type reads in the results, in the order the groups appear. */
const RECORD_GROUPS: Array<{ type: RecordType; heading: string; icon: IconType }> = [
  { type: "lead", heading: "Leads", icon: TbUser },
  { type: "deal", heading: "Deals", icon: TbCurrencyRupee },
  { type: "account", heading: "Accounts", icon: TbBuilding },
  { type: "project", heading: "Projects", icon: TbBriefcase },
  { type: "task", heading: "Tasks", icon: TbCheckbox },
  { type: "person", heading: "People", icon: TbUsers },
  { type: "page", heading: "Pages", icon: TbBook },
];

/**
 * ⌘K: search records and jump to any screen by name.
 *
 * Screens are matched here from the same navigation config the sidebar uses,
 * so nothing appears that the person couldn't open from the menu. Records come
 * from GET /search, which applies each module's own visibility rules.
 */
export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const router = useRouter();
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1] || "";
  const { has, isOwner, isPlatformOwner } = usePermissions();
  const { slug: brandSlug } = useActiveBrand();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const latest = useRef("");

  // ⌘K / Ctrl+K from anywhere in the admin.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!useCommandPalette.getState().open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  // A fresh palette every time it opens.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSearching(false);
    }
  }, [open]);

  // Records, debounced. Only the newest answer is kept, so a slow reply for
  // "ac" can't overwrite the results for "acme".
  useEffect(() => {
    const q = query.trim();
    latest.current = q;
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      apiFetch<{ query: string; results: SearchResult[] }>(`/search?q=${encodeURIComponent(q)}`)
        .then((data) => {
          if (latest.current === q) setResults(data.results ?? []);
        })
        .catch(() => {
          if (latest.current === q) setResults([]);
        })
        .finally(() => {
          if (latest.current === q) setSearching(false);
        });
    }, 220);
    return () => clearTimeout(timer);
  }, [query]);

  const hrefFor = (moduleKey: string) => {
    const scoped = SITE_SCOPED_MODULES.includes(moduleKey as SiteScopedModule);
    return scoped && brandSlug ? `/${roleSlug}/${moduleKey}/${brandSlug}` : `/${roleSlug}/${moduleKey}`;
  };

  // Every screen this person can open, by name.
  const targets = useMemo<JumpTarget[]>(() => {
    const list: JumpTarget[] = [];
    const add = (moduleKey: string, label: string, hint: string, href: string, keywords = "") =>
      list.push({ id: `${href}|${label}`, label, hint, href, moduleKey, keywords: `${label} ${hint} ${keywords}`.toLowerCase() });

    if (has("dashboard:read")) add("dashboard", "Home", "What needs you today", hrefFor("dashboard"), "dashboard start");
    if (has(...APPROVAL_PERMISSIONS)) add("approvals", "Approvals", "Leave, attendance and reimbursements", hrefFor("approvals"), "approve requests pending");
    for (const section of NAV_SECTIONS) {
      for (const entry of section.items) {
        if (!has(...entry.permissions)) continue;
        const route = entryRoute(entry, has);
        if (route) add(entry.key, MODULES[entry.key].label, section.label, hrefFor(route), entry.description);
      }
    }
    for (const entry of PLATFORM_ITEMS) {
      const allowed = entry.key === "platform" ? isPlatformOwner : entry.permissions.length > 0 && has(...entry.permissions);
      if (allowed) add(entry.key, MODULES[entry.key].label, "Rhinon platform", hrefFor(entry.key), entry.description);
    }
    for (const page of JUMP_PAGES) {
      if (page.ownerOnly ? !isOwner : page.permissions.length > 0 && !has(...page.permissions)) continue;
      const label = PAGE_LABELS[`${page.module}/${page.segment}`] ?? MODULES[page.module]?.label ?? page.segment;
      const parent = MODULES[page.module]?.parent;
      const hint = parent ? MODULES[parent].label : MODULES[page.module]?.label ?? "";
      add(page.module, label, hint, `${hrefFor(page.module)}${page.segment ? `/${page.segment}` : ""}`, page.keywords);
    }
    if (has("settings:read", "docsAccess:read", "provisioning:read")) add("settings", "Settings", "Workspace", hrefFor("settings"));
    add("profile", "Your profile", "Account", `/${roleSlug}/profile/info`, "me account name photo");
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [has, isOwner, isPlatformOwner, roleSlug, brandSlug]);

  const q = query.trim().toLowerCase();
  const words = q.split(/\s+/).filter(Boolean);
  // Every word has to appear somewhere in the name, its section or its keywords.
  const matchedTargets = words.length ? targets.filter((t) => words.every((w) => t.keywords.includes(w))).slice(0, 8) : targets.slice(0, 9);

  const recordHref = (r: SearchResult): string => {
    switch (r.type) {
      case "lead": return `${hrefFor("crm")}?leadId=${r.id}`;
      case "deal": return `${hrefFor("crm")}/pipeline?dealId=${r.id}`;
      case "account": return `${hrefFor("crm")}/accounts?accountId=${r.id}`;
      case "project": return `/${roleSlug}/work/projects/${r.id}`;
      case "task": return r.projectId ? `/${roleSlug}/work/projects/${r.projectId}?task=${r.id}` : `/${roleSlug}/work/tasks`;
      case "person": return `/${roleSlug}/employees?person=${r.id}`;
      case "page": return `/${roleSlug}/pages/${r.id}`;
    }
  };

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const showRecords = q.length >= 2;
  const nothing = showRecords && !searching && results.length === 0 && matchedTargets.length === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* The dialog's own corner "×" would sit on top of the search box; Esc and a click outside close it. */}
      <DialogContent className="top-[18%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl [&>button:last-child]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>Find a lead, deal, project, task, person or page, or jump to any screen.</DialogDescription>
        </DialogHeader>
        <Command
          shouldFilter={false}
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2"
        >
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search people, leads, deals, projects, pages… or a screen"
            autoFocus
          />
          <CommandList className="max-h-[min(60vh,440px)]">
            {nothing && (
              <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
                {`Nothing matches "${query.trim()}". Try a name, a company or a screen like "leave".`}
              </CommandEmpty>
            )}

            {matchedTargets.length > 0 && (
              <CommandGroup heading={words.length ? "Go to" : "Jump to"}>
                {matchedTargets.map((t) => {
                  const Icon = MODULES[t.moduleKey]?.icon;
                  const tone = moduleTone(t.moduleKey);
                  return (
                    <CommandItem key={t.id} value={t.id} onSelect={() => go(t.href)} className="gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ background: `${tone}1f`, color: tone }}>
                        {Icon && <Icon size={16} />}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm">{t.label}</span>
                      <span className="shrink-0 truncate text-xs text-muted-foreground">{t.hint}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {showRecords && searching && results.length === 0 && (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                <TbLoader2 size={15} className="animate-spin" /> Searching your workspace…
              </div>
            )}

            {showRecords &&
              RECORD_GROUPS.map((group) => {
                const rows = results.filter((r) => r.type === group.type);
                if (rows.length === 0) return null;
                const Icon = group.icon;
                return (
                  <CommandGroup key={group.type} heading={group.heading}>
                    {rows.map((r) => (
                      <CommandItem key={`${r.type}:${r.id}`} value={`${r.type}:${r.id}`} onSelect={() => go(recordHref(r))} className="gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <Icon size={16} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm">{r.title}</span>
                          {r.subtitle && <span className="block truncate text-xs text-muted-foreground">{r.subtitle}</span>}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
          </CommandList>
          <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
            <span>Searches the records you can open — nothing more.</span>
            <span className="flex items-center gap-1">
              <TbCornerDownLeft size={12} /> to open · Esc to close
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
