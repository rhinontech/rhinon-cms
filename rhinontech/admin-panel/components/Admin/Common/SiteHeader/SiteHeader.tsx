"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import { clearPermissionsCache } from "@/context/PermissionsContext";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { TbUser, TbChevronDown, TbChevronRight, TbBell, TbEye, TbMenu2 } from "react-icons/tb";
import { useDashboard } from "@/components/Common/DashboardProvider/DashboardProvider";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { apiFetch } from "@/lib/api";
import { siteSlugFromPath, useSites } from "@/lib/sites";
import { ThemeToggle } from "@/components/Common/ThemeProvider/ThemeToggle";
import { MODULES } from "@/components/Admin/Common/navConfig";

/** Ids, slugs with digits and tokens are not page names, so they never become a crumb. */
const looksLikeId = (segment: string) => /\d/.test(segment) && segment.length > 6;
const humanize = (segment: string) => {
  const words = decodeURIComponent(segment).replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/**
 * Where you are: the module, the brand for brand-split modules, then the page.
 * Built from the URL alone, so it is right on the first paint of every screen.
 */
function Breadcrumbs({ pathname }: { pathname: string }) {
  const { sites } = useSites();
  const [, role, moduleKey, ...rest] = pathname.split("/");
  const mod = MODULES[moduleKey];
  if (!mod) return <div className="min-w-0 flex-1" />;

  const brandSlug = siteSlugFromPath(pathname);
  const brand = brandSlug ? sites.find((s) => s.slug === brandSlug) : null;
  const pageSegments = brandSlug ? rest.slice(1) : rest;
  const page = pageSegments[0] && !looksLikeId(pageSegments[0]) ? humanize(pageSegments[0]) : null;
  const moduleHref = `/${role}/${moduleKey}${brandSlug ? `/${brandSlug}` : ""}`;
  const Icon = mod.icon;

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1.5 text-[13px]">
      <Link href={moduleHref} className="flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 font-semibold text-foreground transition-colors hover:bg-foreground/[0.05]">
        <Icon size={16} strokeWidth={1.9} className="shrink-0 text-muted-foreground" />
        <span className="truncate">{mod.label}</span>
      </Link>
      {brandSlug && (
        <>
          <TbChevronRight size={13} className="shrink-0 text-muted-foreground/60" />
          <span className="hidden min-w-0 truncate rounded-full bg-foreground/[0.05] px-2 py-0.5 text-xs font-medium text-foreground/75 ring-1 ring-inset ring-foreground/[0.06] sm:inline">
            {brand?.name ?? humanize(brandSlug)}
          </span>
        </>
      )}
      {page && (
        <>
          <TbChevronRight size={13} className="hidden shrink-0 text-muted-foreground/60 sm:block" />
          <span className="hidden min-w-0 truncate font-medium text-muted-foreground sm:inline">{page}</span>
        </>
      )}
    </nav>
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
      {canPreviewRoles && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="inline-flex h-8 items-center gap-1.5 rounded-full border border-foreground/[0.08] bg-card/60 px-2.5 text-xs font-medium text-foreground/80 shadow-xs backdrop-blur transition-colors hover:bg-card sm:px-3">
              <TbEye size={15} className="text-muted-foreground" />
              <span className="hidden sm:inline">{`Viewing as ${currentRoleView}`}</span>
              <TbChevronDown size={13} className="text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-2">
            <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Preview interface
            </div>
            {roleViews.map((role) => (
              <button
                key={role.slug}
                onClick={() => switchRoleView(role.slug)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted ${
                  role.slug === roleSlug ? "font-semibold text-foreground" : "text-foreground/85"
                }`}
              >
                {role.name}
                {role.slug === roleSlug && <span className="text-xs text-blue-600 dark:text-blue-300">Active</span>}
              </button>
            ))}
            <p className="mt-1 border-t px-2 pt-2 text-xs leading-5 text-muted-foreground">
              Permissions stay Super Admin.
            </p>
          </PopoverContent>
        </Popover>
      )}

      <ThemeToggle />

      {/* Notifications */}
      <button className="relative rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground" aria-label="Notifications">
        <TbBell size={18} />
      </button>

      <div className="mx-0.5 h-5 w-px bg-foreground/10" />

      {/* User menu */}
      <Popover>
        <PopoverTrigger asChild>
          <button className="group flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-foreground/[0.06]">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(name)} text-[11px] font-bold text-white shadow-xs ring-2 ring-background/70`}>
              {initial}
            </div>
            <span className="hidden max-w-[160px] truncate text-[13px] font-medium text-foreground/85 sm:inline">{firstName}</span>
            <TbChevronDown size={13} className="text-muted-foreground transition-colors group-hover:text-foreground/70" />
          </button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-56 p-2">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(name)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{name}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
          </div>
          <div className="border-t pt-1 space-y-0.5">
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
