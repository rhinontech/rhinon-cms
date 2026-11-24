"use client";

import { usePathname, useRouter } from "next/navigation";
import { NotificationBell } from "@/components/Admin/Common/Notifications/NotificationBell";
import Link from "next/link";
import Cookies from "js-cookie";
import { clearPermissionsCache } from "@/context/PermissionsContext";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { TbUser, TbCheck, TbChevronDown, TbChevronRight, TbEye, TbMenu2, TbSearch } from "react-icons/tb";
import { useDashboard } from "@/components/Common/DashboardProvider/DashboardProvider";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { apiFetch } from "@/lib/api";
import { SITE_SCOPED_MODULES, siteSlugFromPath, useSites, type SiteScopedModule } from "@/lib/sites";
import { ThemeSegmented } from "@/components/Common/ThemeProvider/ThemeToggle";
import { MODULES, PAGE_LABELS, moduleTone } from "@/components/Admin/Common/navConfig";
import { BrandCrumbSwitcher } from "@/components/Admin/Common/Sites/BrandSwitcher";
import { useCommandPalette } from "@/components/Admin/Common/CommandPalette/store";
import { useShortcutLabel } from "@/components/Admin/Common/CommandPalette/useShortcutLabel";

/** Ids, slugs with digits and tokens are not page names, so they never become a crumb. */
const looksLikeId = (segment: string) => /\d/.test(segment) && segment.length > 6;
const humanize = (segment: string) => {
  const words = decodeURIComponent(segment).replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/**
 * Where you are: the section, the module, the brand (only when there is more
 * than one), then the page — named the way the menus name them.
 * Built from the URL alone, so it is right on the first paint of every screen.
 */
function Breadcrumbs({ pathname }: { pathname: string }) {
  const { sites } = useSites();
  const [, role, moduleKey, ...rest] = pathname.split("/");
  const mod = MODULES[moduleKey];
  if (!mod) return <div className="min-w-0 flex-1" />;

  const brandSlug = siteSlugFromPath(pathname);
  const pageSegments = brandSlug ? rest.slice(1) : rest;
  const segment = pageSegments[0] && !looksLikeId(pageSegments[0]) ? pageSegments[0] : "";
  // The menu's word for the page, not the URL's ("All projects", not "Clients").
  const page = PAGE_LABELS[`${moduleKey}/${segment}`] ?? (segment ? humanize(segment) : null);
  const crumbHref = (key: string) =>
    `/${role}/${key}${brandSlug && SITE_SCOPED_MODULES.includes(key as SiteScopedModule) ? `/${brandSlug}` : ""}`;
  // A module that lives inside another (Sequences in Outreach) shows its home first.
  const lead = mod.parent ? MODULES[mod.parent] : mod;
  const leadKey = mod.parent ?? moduleKey;
  const Icon = lead.icon;
  const tone = moduleTone(moduleKey);
  const chevron = <TbChevronRight size={13} className="shrink-0 text-muted-foreground/60" />;

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1.5 text-ui">
      {/* Section and module names stay whole; only the page name gives way when space runs out. */}
      <Link href={crumbHref(leadKey)} prefetch={false} className="flex shrink-0 items-center gap-2 rounded-md px-1.5 py-1 font-semibold text-foreground transition-colors hover:bg-foreground/[0.05]">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ background: `${tone}1f`, color: tone }}>
          <Icon size={15} strokeWidth={1.9} />
        </span>
        <span className="whitespace-nowrap">{lead.label}</span>
      </Link>
      {mod.parent && (
        <>
          {chevron}
          <Link href={crumbHref(moduleKey)} prefetch={false} className="shrink-0 whitespace-nowrap rounded-md px-1 py-1 font-medium text-foreground/85 transition-colors hover:bg-foreground/[0.05]">
            {mod.label}
          </Link>
        </>
      )}
      {/* One brand means there is nothing to choose — the chip only appears when there is. */}
      {brandSlug && sites.length > 1 && (
        <>
          <span className="hidden sm:block">{chevron}</span>
          <BrandCrumbSwitcher />
        </>
      )}
      {page && page !== mod.label && (
        <>
          <span className="hidden sm:block">{chevron}</span>
          <span className="hidden min-w-0 truncate font-medium text-muted-foreground sm:inline">{page}</span>
        </>
      )}
    </nav>
  );
}

/** The header's search box. The same palette opens from the sidebar and with ⌘K. */
function HeaderSearch() {
  const openPalette = useCommandPalette((s) => s.setOpen);
  const shortcut = useShortcutLabel();
  return (
    <>
      <button
        onClick={() => openPalette(true)}
        className="hidden h-8 w-44 shrink-0 items-center gap-2 rounded-full border border-foreground/[0.08] bg-card/60 px-3 text-xs text-muted-foreground shadow-xs backdrop-blur transition-colors hover:bg-card hover:text-foreground md:inline-flex xl:w-60"
      >
        <TbSearch size={14} />
        <span className="flex-1 text-left">Search or jump to…</span>
        <kbd className="rounded border border-border px-1.5 py-px text-2xs font-medium">{shortcut}</kbd>
      </button>
      <button onClick={() => openPalette(true)} className="rounded-lg p-2 text-foreground/70 hover:bg-foreground/[0.06] md:hidden" aria-label="Search">
        <TbSearch size={18} />
      </button>
    </>
  );
}

function decodeJWT(token: string): { fullName?: string; companyEmail?: string; roleSlug?: string } {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

const AVATAR_COLORS = [
  "from-blue-500 to-indigo-600", "from-rose-500 to-pink-600",
  "from-emerald-500 to-teal-600", "from-amber-500 to-orange-600", "from-violet-500 to-purple-600",
];
const avatarGradient = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

interface RoleOption { slug: string; name: string }

export function SiteHeader() {
  const pathname = usePathname();
  const router   = useRouter();
  const { setMobileNavOpen } = useDashboard();
  const roleSlug = pathname.split("/")[1] || "";
  const [currentUser, setCurrentUser] = useState<{ fullName?: string; companyEmail?: string; roleSlug?: string }>({
    fullName: "User",
    companyEmail: "",
  });
  const [roleViews, setRoleViews] = useState<RoleOption[]>([]);

  useEffect(() => {
    const token = Cookies.get("authToken");
    if (token) setCurrentUser(decodeJWT(token));
  }, []);

  const canPreviewRoles = currentUser.roleSlug === "superadmin";

  useEffect(() => {
    if (!canPreviewRoles) return;
    apiFetch<{ slug: string; name: string }[]>("/roles")
      .then((roles) => setRoleViews(roles.map((r) => ({ slug: r.slug, name: r.name }))))
      .catch(() => setRoleViews([]));
  }, [canPreviewRoles]);

  const name      = currentUser.fullName    ?? "User";
  const firstName = name.split(" ")[0];
  const email     = currentUser.companyEmail ?? "";
  const initial   = name.charAt(0).toUpperCase();
  const currentRoleView = roleViews.find((role) => role.slug === roleSlug)?.name ?? roleSlug;

  const switchRoleView = (nextRole: string) => {
    const parts = pathname.split("/");
    parts[1] = nextRole;
    router.push(parts.join("/") || `/${nextRole}/dashboard`);
  };

  const logOut = () => {
    Cookies.remove("authToken");
    Cookies.remove("permissions");
    clearPermissionsCache();
    router.push("/auth/login");
  };

  return (
    <div className="flex h-11 shrink-0 items-center gap-1.5 px-1 sm:gap-2">
      {/* Hamburger — opens the sidebar drawer on mobile */}
      <button
        onClick={() => setMobileNavOpen(true)}
        className="rounded-lg p-2 text-foreground/70 hover:bg-foreground/[0.06] lg:hidden"
        aria-label="Open navigation"
      >
        <TbMenu2 size={20} />
      </button>
      <Breadcrumbs pathname={pathname} />
      <HeaderSearch />
      {/* Role preview lives in the profile menu; while previewing, a chip says so and exits in one click. */}
      {canPreviewRoles && roleSlug !== "superadmin" && (
        <button
          onClick={() => switchRoleView("superadmin")}
          className="inline-flex h-7 items-center gap-1.5 rounded-md bg-amber-500/10 px-2 text-xs font-medium text-amber-700 hover:bg-amber-500/15 dark:text-amber-300"
          title="Back to your own view"
        >
          <TbEye size={14} />
          <span className="hidden sm:inline">{`Previewing ${currentRoleView} · Exit`}</span>
        </button>
      )}

      {/* Notifications */}
      <NotificationBell />

      <div className="mx-0.5 h-5 w-px bg-foreground/10" />

      {/* User menu */}
      <Popover>
        <PopoverTrigger asChild>
          <button className="group flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-foreground/[0.06]">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(name)} text-2xs font-semibold text-white shadow-xs ring-2 ring-background/70`}>
              {initial}
            </div>
            <span className="hidden max-w-[160px] truncate text-ui font-medium text-foreground/85 sm:inline">{firstName}</span>
            <TbChevronDown size={13} className="text-muted-foreground transition-colors group-hover:text-foreground/70" />
          </button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-64 p-2">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(name)} flex items-center justify-center text-white font-semibold text-sm shrink-0`}>
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{name}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
          </div>
          <div className="border-t pt-1 space-y-0.5">
            <div className="px-2 py-2">
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Theme</p>
              <ThemeSegmented />
            </div>
            {canPreviewRoles && roleViews.length > 0 && (
              <div className="border-t px-2 py-2">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Preview as role</p>
                {roleViews.map((role) => (
                  <button
                    key={role.slug}
                    onClick={() => switchRoleView(role.slug)}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted ${role.slug === roleSlug ? "font-medium text-foreground" : "text-foreground/85"}`}
                  >
                    {role.name}
                    {role.slug === roleSlug && <TbCheck size={14} className="text-primary" />}
                  </button>
                ))}
                <p className="px-2 pt-1 text-2xs text-muted-foreground">Permissions stay Super Admin.</p>
              </div>
            )}
            <Link
              href={`/${roleSlug}/profile/info`}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground/85 hover:bg-muted rounded-md"
            >
              <TbUser size={15} /> View Profile
            </Link>
            <button
              onClick={logOut}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-muted rounded-md"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
