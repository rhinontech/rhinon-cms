"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";
import { TbFileText, TbHelpCircle, TbMail, TbPin, TbPinFilled, TbRocket, TbSearch } from "react-icons/tb";
import { cn } from "@/lib/utils";
import {
  APPROVAL_PERMISSIONS, MODULES, NAV_SECTIONS, PLATFORM_ITEMS,
  entryIsActive, entryRoute, isWithin, type NavEntry,
} from "@/components/Admin/Common/navConfig";
import { useDashboard } from "../../../Common/DashboardProvider/DashboardProvider";
import { usePermissions } from "@/context/PermissionsContext";
import { apiFetch } from "@/lib/api";
import { SITE_SCOPED_MODULES, useActiveBrand, type SiteScopedModule } from "@/lib/sites";
import { WorkspaceIdentity } from "@/components/Admin/Common/Sites/BrandSwitcher";
import { selectUnreadTotal, useTeamChat } from "@/components/Admin/Chat/store";
import { useCommandPalette } from "@/components/Admin/Common/CommandPalette/store";
import { useShortcutLabel } from "@/components/Admin/Common/CommandPalette/useShortcutLabel";
import { useApprovalCount } from "@/lib/approvals";
import { useLegal } from "@/lib/legal";
import { useModuleNav } from "@/components/Admin/Common/CollapsibleSubNav/moduleNavStore";
import { itemIsActive } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface NavLink {
  key: string;
  label: string;
  icon: IconType;
  href: string;
  active: boolean;
  badge?: number;
}

/** This module's own pages, nested under its row (published by the module's sub-nav). */
function ModulePages() {
  const items = useModuleNav((s) => s.items);
  const pathname = usePathname();
  // Only when pinned open (or the phone drawer): hover-peeking shouldn't reflow the menu.
  const { sidebarExpanded, mobileNavOpen } = useDashboard();
  if (!items?.length || !(sidebarExpanded || mobileNavOpen)) return null;
  const rows = items.flatMap((i) => (i.isCollapsible && i.children?.length ? [i, ...i.children.map((c) => ({ ...c, nested: true }))] : [i]));
  return (
    <ul className="mb-1 ml-[1.15rem] mt-0.5 space-y-px border-l border-foreground/[0.08] pl-2">
      {rows.map((row) => {
        const active = itemIsActive(row, pathname);
        return (
          <li key={`${row.label}-${row.href}`}>
            <Link
              href={row.href}
              prefetch={false}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-7 items-center truncate rounded-md px-2 text-ui transition-colors",
                "nested" in row && "pl-5",
                active ? "bg-foreground/[0.06] font-medium text-foreground" : "text-foreground/60 hover:bg-foreground/[0.04] hover:text-foreground"
              )}
            >
              {row.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** One row: a monochrome icon and label; the active row gets a neutral surface and an accent bar. */
function NavRow({ item, expanded }: { item: NavLink; expanded: boolean }) {
  const Icon = item.icon;
  return (
    <>
    <Link
      href={item.href}
      prefetch={false}
      title={expanded ? undefined : item.label}
      aria-current={item.active ? "page" : undefined}
      className={cn(
        "group relative flex h-8 select-none items-center gap-2.5 rounded-md px-2 text-ui font-medium transition-colors duration-150 cursor-pointer",
        item.active
          ? "bg-foreground/[0.06] text-foreground"
          : "text-foreground/65 hover:bg-foreground/[0.04] hover:text-foreground"
      )}
    >
      {item.active && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" aria-hidden />}
      <span className="relative shrink-0 pointer-events-none">
        <Icon size={17} strokeWidth={1.9} className={item.active ? "text-foreground" : "text-foreground/55 group-hover:text-foreground/80"} />
        {/* The collapsed rail has no room for a count — a dot still says "something new". */}
        {!expanded && !!item.badge && (
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-brand ring-2 ring-background" />
        )}
      </span>
      {expanded && <span className="flex-1 truncate pointer-events-none">{item.label}</span>}
      {expanded && !!item.badge && (
        <span className="ml-auto rounded-full bg-brand px-1.5 py-0.5 text-2xs font-semibold leading-none tabular-nums text-brand-foreground pointer-events-none">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
    </Link>
    {item.active && expanded && <ModulePages />}
    </>
  );
}

/** A group heading when the sidebar is open; a thin rule on the icon rail, so the grouping survives collapsing. */
function SectionLabel({ label, expanded }: { label: string; expanded: boolean }) {
  return expanded ? (
    <p className="px-2 pb-1 pt-3.5 text-2xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/75">{label}</p>
  ) : (
    <div className="mx-2.5 my-2 h-px bg-foreground/[0.08]" aria-hidden />
  );
}

/** Help, at the foot of the sidebar: search, setup, and how to reach a person. */
function HelpMenu({ expanded, roleSlug, showSetup }: { expanded: boolean; roleSlug: string; showSetup: boolean }) {
  const openPalette = useCommandPalette((s) => s.setOpen);
  const shortcut = useShortcutLabel();
  const legal = useLegal();
  const [open, setOpen] = useState(false);
  const row = "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-foreground/85 hover:bg-muted";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          title={expanded ? undefined : "Help"}
          className="group flex h-9 w-full select-none items-center gap-3 rounded-lg px-1.5 text-ui font-medium text-foreground/65 transition-colors hover:bg-card/60 hover:text-foreground dark:hover:bg-white/[0.05]"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.05] text-foreground/60">
            <TbHelpCircle size={17} strokeWidth={1.9} />
          </span>
          {expanded && <span className="flex-1 truncate text-left">Help</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="end" className="w-64 p-1.5">
        <button className={row} onClick={() => { setOpen(false); openPalette(true); }}>
          <TbSearch size={16} className="shrink-0 text-muted-foreground" />
          <span className="flex-1">Search and jump to anything</span>
          <kbd className="rounded border border-border px-1.5 text-2xs text-muted-foreground">{shortcut}</kbd>
        </button>
        {showSetup && (
          <Link href={`/${roleSlug}/dashboard#setup`} prefetch={false} className={row} onClick={() => setOpen(false)}>
            <TbRocket size={16} className="shrink-0 text-muted-foreground" />
            <span className="flex-1">Getting started checklist</span>
          </Link>
        )}
        {legal?.supportEmail && (
          <a href={`mailto:${legal.supportEmail}`} className={row}>
            <TbMail size={16} className="shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{`Email support (${legal.supportEmail})`}</span>
          </a>
        )}
        {(legal?.termsUrl || legal?.privacyUrl) && (
          <div className="mt-1 border-t border-border pt-1">
            {legal?.termsUrl && (
              <a href={legal.termsUrl} target="_blank" rel="noreferrer" className={row}>
                <TbFileText size={16} className="shrink-0 text-muted-foreground" />
                <span className="flex-1">Terms of service</span>
              </a>
            )}
            {legal?.privacyUrl && (
              <a href={legal.privacyUrl} target="_blank" rel="noreferrer" className={row}>
                <TbFileText size={16} className="shrink-0 text-muted-foreground" />
                <span className="flex-1">Privacy policy</span>
              </a>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarExpanded, setSidebarExpanded, isHovering, setIsHovering, mobileNavOpen, setMobileNavOpen } = useDashboard();
  const { has, isOwner, isPlatformOwner, account } = usePermissions();
  const openPalette = useCommandPalette((s) => s.setOpen);
  const shortcut = useShortcutLabel();
  // Which brand the brand-split modules open on. Every module is available under
  // every brand; this only decides which brand's data the split ones show.
  const { slug: brandSlug } = useActiveBrand();
  // Built from the URL, not the async PermissionsContext state, so the very
  // first client render (and hydration) matches the server-rendered HTML —
  // effectiveRoleSlug starts empty until /auth/me resolves, which would
  // otherwise render every href as "//dashboard" on first paint.
  const roleSlug = pathname.split("/")[1] || "";
  const isPlatform = !!account.organization?.isPlatform;
  const disabled = account.organization?.disabledModules ?? [];

  // The mobile drawer always shows labels; desktop keeps pin/hover behavior.
  const expanded = sidebarExpanded || isHovering || mobileNavOpen;

  // Unread startup-idea submissions, shown as a badge on that nav item. Polled on a slow
  // interval and refreshed on navigation, so opening a submission clears it promptly.
  const canReadIdeas = has("startupIdeas:read");
  const [unreadIdeas, setUnreadIdeas] = useState(0);
  const unreadChat = useTeamChat(selectUnreadTotal);
  const canApprove = has(...APPROVAL_PERMISSIONS);
  const pendingApprovals = useApprovalCount(canApprove);
  useEffect(() => {
    if (!canReadIdeas) return;
    let active = true;
    const load = () =>
      apiFetch<{ count: number }>("/startup-ideas/unread-count")
        .then((d) => active && setUnreadIdeas(d.count))
        .catch(() => {/* a failed badge poll must never break the sidebar */});
    load();
    const timer = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [canReadIdeas, pathname]);

  const badges: Record<string, number> = { chat: unreadChat, "startup-ideas": unreadIdeas, approvals: pendingApprovals };

  /** A module's link — straight into the active brand for brand-split modules, so it never bounces through a picker. */
  const hrefFor = (moduleKey: string) => {
    const scoped = SITE_SCOPED_MODULES.includes(moduleKey as SiteScopedModule);
    return scoped && brandSlug ? `/${roleSlug}/${moduleKey}/${brandSlug}` : `/${roleSlug}/${moduleKey}`;
  };

  const toLink = (entry: NavEntry): NavLink | null => {
    const route = entryRoute(entry, has);
    if (!route) return null;
    return {
      key: entry.key,
      label: MODULES[entry.key].label,
      icon: MODULES[entry.key].icon,
      href: hrefFor(route),
      active: entryIsActive(entry, pathname),
      badge: badges[entry.key],
    };
  };

  const single = (key: string, permissions: string[]): NavLink | null =>
    has(...permissions)
      ? { key, label: MODULES[key].label, icon: MODULES[key].icon, href: hrefFor(key), active: isWithin(pathname, `/${roleSlug}/${key}`), badge: badges[key] }
      : null;

  const top = [single("dashboard", ["dashboard:read"]), canApprove ? single("approvals", APPROVAL_PERMISSIONS) : null].filter(Boolean) as NavLink[];

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    links: section.items.filter((entry) => has(...entry.permissions) && !disabled.includes(entry.key)).map(toLink).filter(Boolean) as NavLink[],
  })).filter((section) => section.links.length > 0);

  // The platform's own modules: the workspace list keys on being the platform's
  // owner (a tenant's owner is a superadmin too); the rest on their permissions.
  const platformLinks = PLATFORM_ITEMS.filter((entry) => (entry.key === "platform" ? isPlatformOwner : entry.permissions.length > 0 && has(...entry.permissions)))
    .map(toLink)
    .filter(Boolean) as NavLink[];

  const settings = single("settings", ["settings:read", "docsAccess:read", "provisioning:read"]);
  if (settings) {
    // Docs Access and Provisioning live under Settings' sub-nav.
    settings.active = ["settings", "docs-access", "provisioning"].includes(pathname.split("/")[2] ?? "");
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setMobileNavOpen(false)} />
      )}
    <aside
      className={cn(
        "flex h-full flex-col transition-[width] duration-200 ease-in-out",
        // Mobile: fixed overlay drawer slid in from the left; desktop: static column.
        "fixed inset-y-0 left-0 z-50 w-64 max-lg:bg-card! shadow-xl lg:static lg:z-auto lg:shadow-none",
        mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        expanded ? "lg:w-56" : "lg:w-14"
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Which workspace this is. The brand switcher used to sit here; it now
          appears in the breadcrumb of brand-split modules, and only when there
          is more than one brand to switch between. */}
      <div className="flex h-14 w-full shrink-0 items-center justify-center">
        {expanded ? (
          <div className="flex w-full items-center gap-1 px-2">
            <div className="min-w-0 flex-1">
              <WorkspaceIdentity expanded name={account.organization?.name ?? null} isPlatform={isPlatform} href={`/${roleSlug}/dashboard`} />
            </div>
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              title={sidebarExpanded ? "Collapse to icons" : "Keep the menu open"}
              className={cn(
                "hidden shrink-0 rounded-md p-1.5 transition-colors lg:block",
                sidebarExpanded ? "text-foreground/80 hover:bg-foreground/[0.06]" : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
              )}
            >
              {sidebarExpanded ? <TbPinFilled size={14} /> : <TbPin size={14} />}
            </button>
          </div>
        ) : (
          <WorkspaceIdentity expanded={false} name={account.organization?.name ?? null} isPlatform={isPlatform} href={`/${roleSlug}/dashboard`} />
        )}
      </div>

      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-2 pt-1" aria-label="Main">
        <div className="space-y-0.5 px-2">
          {/* Search sits first: when you don't know where something lives, type it. */}
          <button
            onClick={() => openPalette(true)}
            title={expanded ? undefined : `Search (${shortcut})`}
            className="group flex h-9 w-full select-none items-center gap-3 rounded-lg px-1.5 text-ui font-medium text-foreground/65 transition-colors hover:bg-card/60 hover:text-foreground dark:hover:bg-white/[0.05]"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.05] text-foreground/60">
              <TbSearch size={16} strokeWidth={1.9} />
            </span>
            {expanded && (
              <>
                <span className="flex-1 truncate text-left">Search</span>
                <kbd className="rounded border border-border bg-card/60 px-1.5 py-px text-2xs font-medium text-muted-foreground">{shortcut}</kbd>
              </>
            )}
          </button>

          {top.map((item) => <NavRow key={item.key} item={item} expanded={expanded} />)}

          {sections.map((section) => (
            <div key={section.key} className="space-y-0.5">
              <SectionLabel label={section.label} expanded={expanded} />
              {section.links.map((item) => <NavRow key={item.key} item={item} expanded={expanded} />)}
            </div>
          ))}

          {platformLinks.length > 0 && (
            <div className="space-y-0.5">
              <SectionLabel label="Rhinon platform" expanded={expanded} />
              {platformLinks.map((item) => <NavRow key={item.key} item={item} expanded={expanded} />)}
            </div>
          )}
        </div>
      </nav>

      <div className="shrink-0 space-y-0.5 border-t border-foreground/[0.06] px-2 py-2">
        {settings && <NavRow item={settings} expanded={expanded} />}
        <HelpMenu expanded={expanded} roleSlug={roleSlug} showSetup={isOwner && !isPlatform} />
      </div>
    </aside>
    </>
  );
}
