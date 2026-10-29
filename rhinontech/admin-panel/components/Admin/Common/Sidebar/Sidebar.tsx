"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";
import { TbPin, TbPinFilled } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { MODULES } from "@/components/Admin/Common/navConfig";
import { useDashboard } from "../../../Common/DashboardProvider/DashboardProvider";
import { usePermissions } from "@/context/PermissionsContext";
import { apiFetch } from "@/lib/api";
import { SITE_SCOPED_MODULES, useActiveBrand, type SiteScopedModule } from "@/lib/sites";
import { BrandSwitcher } from "@/components/Admin/Common/Sites/BrandSwitcher";
import { selectUnreadTotal, useTeamChat } from "@/components/Admin/Chat/store";

/** The module a sidebar href points at: /admin/outreach -> "outreach". */
function moduleKeyOf(href: string): string {
  return href.split("/")[2] ?? "";
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarExpanded, setSidebarExpanded, isHovering, setIsHovering, mobileNavOpen, setMobileNavOpen } = useDashboard();
  const { has, isPlatformOwner } = usePermissions();
  // Which brand the whole admin is viewed as. Every module is available under
  // every brand; this only decides which brand's data the split ones show.
  const { slug: brandSlug } = useActiveBrand();
  // Built from the URL, not the async PermissionsContext state, so the very
  // first client render (and hydration) matches the server-rendered HTML —
  // effectiveRoleSlug starts empty until /auth/me resolves, which would
  // otherwise render every href as "//dashboard" on first paint.
  const roleSlug = pathname.split("/")[1] || "";

  // The mobile drawer always shows labels; desktop keeps pin/hover behavior.
  const expanded = sidebarExpanded || isHovering || mobileNavOpen;

  // Unread startup-idea submissions, shown as a badge on that nav item. Polled on a slow
  // interval and refreshed on navigation, so opening a submission clears it promptly.
  const canReadIdeas = has("startupIdeas:read");
  const [unreadIdeas, setUnreadIdeas] = useState(0);
  const unreadChat = useTeamChat(selectUnreadTotal);
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

  const item = (key: string, permissions: string[], extra: { badge?: number; platformOnly?: boolean } = {}) => ({
    title: MODULES[key].label,
    icon: MODULES[key].icon,
    href: `/${roleSlug}/${key}`,
    permissions,
    ...extra,
  });

  const navItems = [
    item("dashboard", ["dashboard:read"]),
    item("inbox", ["inbox:read"]),
    item("chat", ["chat:read"], { badge: unreadChat }),
    item("pages", ["pages:read"]),
    item("crm", ["crm:read"]),
    item("outreach", ["outreach:read"]),
    item("chatbot", ["chatbot:read"]),
    item("automation", ["outreach:read", "crm:read", "dashboard:read"]),
    item("work", ["work:read"]),
    item("employees", ["people:read", "attendance:read", "leave:read", "performance:read", "documents:read"]),
    item("payroll", ["payslips:read"]),
    item("content", ["content:read"]),
    item("startup-ideas", ["startupIdeas:read"], { badge: unreadIdeas }),
    item("meetings", ["meetings:read"]),
    item("analytics", ["analytics:read"]),
    // The platform team's own module: every customer workspace. Not a permission —
    // a tenant's owner is a superadmin too — so it keys on being the platform's owner.
    item("platform", [], { platformOnly: true }),
    item("settings", ["settings:read", "docsAccess:read", "provisioning:read"]),
  ]
    .filter((item) => ("platformOnly" in item && item.platformOnly ? isPlatformOwner : has(...item.permissions)))
    // Link straight into the active brand for the modules that are split by
    // one, so switching brand and clicking Inbox does not bounce through the
    // brand picker every time.
    .map((item) => {
      const key = moduleKeyOf(item.href);
      const scoped = SITE_SCOPED_MODULES.includes(key as SiteScopedModule);
      return scoped && brandSlug ? { ...item, href: `${item.href}/${brandSlug}` } : item;
    }) as Array<{
    title: string;
    icon: IconType;
    href: string;
    permissions: string[];
    badge?: number;
  }>;

  return (
    <>
      {/* Mobile backdrop */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setMobileNavOpen(false)} />
      )}
    <aside
      className={cn(
        "flex h-full flex-col transition-all duration-300 ease-in-out",
        // Mobile: fixed overlay drawer slid in from the left; desktop: static column.
        "fixed inset-y-0 left-0 z-50 w-64 max-lg:bg-card! shadow-xl lg:static lg:z-auto lg:shadow-none",
        mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        expanded ? "lg:w-56" : "lg:w-14"
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Brand switcher — takes the logo's place, because which brand you are in
          decides what every brand-split module below is showing. */}
      <div className="flex h-14 w-full shrink-0 items-center justify-center">
        {expanded ? (
          <div className="flex w-full items-center gap-1 px-2">
            <div className="min-w-0 flex-1">
              <BrandSwitcher expanded />
            </div>
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              title={sidebarExpanded ? "Unpin sidebar" : "Pin sidebar open"}
              className={cn(
                "hidden shrink-0 rounded-md p-1.5 transition-colors lg:block",
                sidebarExpanded ? "text-foreground/80 hover:bg-foreground/[0.06]" : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
              )}
            >
              {sidebarExpanded ? <TbPinFilled size={14} /> : <TbPin size={14} />}
            </button>
          </div>
        ) : (
          <BrandSwitcher expanded={false} />
        )}
      </div>

      {/* Nav */}
      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto py-3">
        <div className="space-y-0.5 px-2">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={expanded ? undefined : item.title}
                className={cn(
                  "group relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-[13px] font-medium transition-[background-color,color,box-shadow] duration-150",
                  expanded ? "justify-start" : "justify-center",
                  active
                    ? "bg-card text-foreground shadow-xs ring-1 ring-foreground/[0.06] dark:bg-white/[0.08] dark:shadow-none dark:ring-white/[0.06]"
                    : "text-foreground/65 hover:bg-card/60 hover:text-foreground dark:hover:bg-white/[0.05]"
                )}
              >
                <span className="relative shrink-0">
                  <Icon size={19} strokeWidth={1.8} className={cn("transition-colors", active ? "text-brand" : "text-current")} />
                  {/* Collapsed rail has no room for a count — a dot still signals "something new". */}
                  {!expanded && !!item.badge && (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-brand ring-2 ring-background" />
                  )}
                </span>
                {expanded && <span className="flex-1 truncate">{item.title}</span>}
                {expanded && !!item.badge && (
                  <span className="ml-auto rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums text-brand-foreground">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
    </>
  );
}
