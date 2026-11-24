"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { TbCheck, TbSelector } from "react-icons/tb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import adminImages from "@/constants/admin/images";
import { cn } from "@/lib/utils";
import { SITE_SCOPED_MODULES, useActiveBrand, type SiteScopedModule } from "@/lib/sites";

/** Two initials, so a collapsed sidebar still says which brand you are in. */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Each brand's own mark.
 *
 * Bundled per slug rather than fetched, so the switcher paints with the sidebar
 * instead of popping in a frame later. A brand with no logo here falls back to
 * coloured initials, which is what keeps this from breaking the moment someone
 * adds a third brand.
 */
const BRAND_LOGOS: Record<string, { light: StaticImageData; dark: StaticImageData; bleed?: boolean }> = {
  rhinonlabs: { light: adminImages.blueLogo, dark: adminImages.whiteLogo },
  // The app icon is a complete tile on its own (navy square, rounded corners), so it
  // fills the whole slot: no padding, no grey box behind it, same on both themes.
  rhinontech: { light: adminImages.Icon_Rhinon_Tech, dark: adminImages.Icon_Rhinon_Tech, bleed: true },
  // One mark on both themes: the Uppercurve arrow carries its own gradient and
  // the navy U stays legible on a dark sidebar.
  uppercurve: { light: adminImages.Logo_Uppercurve, dark: adminImages.Logo_Uppercurve },
};

/**
 * A stable colour per brand, for the initials fallback.
 *
 * Hashed from the slug rather than stored, so a brand added later gets a colour
 * without anyone having to choose one, and it never changes between sessions.
 */
const GLYPH_COLORS = [
  "bg-blue-600", "bg-emerald-600", "bg-violet-600",
  "bg-amber-600", "bg-rose-600", "bg-cyan-600",
];
function glyphColor(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return GLYPH_COLORS[hash % GLYPH_COLORS.length];
}

/** Host only — "uppercurve.in" reads better here than the full origin. */
function host(siteUrl: string | null): string | null {
  if (!siteUrl) return null;
  return siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "").replace(/^www\./, "");
}

function Glyph({ name, slug, size = "md" }: { name: string; slug: string; size?: "md" | "sm" | "xs" }) {
  const box = size === "md" ? "h-9 w-9" : size === "sm" ? "h-8 w-8" : "h-5 w-5 rounded-full! p-0.5!";
  const logo = BRAND_LOGOS[slug];

  if (logo?.bleed) {
    return (
      <span className={cn("block shrink-0 overflow-hidden rounded-lg", box)}>
        <Image src={logo.light} alt="" aria-hidden loading="eager" className="h-full w-full object-cover" />
      </span>
    );
  }

  if (logo) {
    return (
      <span className={cn("flex shrink-0 items-center justify-center rounded-lg bg-muted/50 p-1", box)}>
        {/* Both marks render and CSS picks one — swapping via useTheme() would
            flash the wrong logo before hydration resolves. Eager, because a lazy
            image that starts out display:none was never fetched once the theme
            revealed it: the dark mark stayed an empty tile. */}
        <Image src={logo.light} alt="" aria-hidden loading="eager" className="h-full w-full object-contain dark:hidden" />
        <Image src={logo.dark} alt="" aria-hidden loading="eager" className="hidden h-full w-full object-contain dark:block" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg font-semibold text-white",
        glyphColor(slug),
        box,
        size === "md" ? "text-xs" : size === "sm" ? "text-2xs" : "text-2xs"
      )}
    >
      {initials(name)}
    </span>
  );
}

/**
 * Which workspace you are in, at the top of the sidebar.
 *
 * This slot used to hold the brand switcher, which meant nothing to a customer
 * with one brand (every customer today) and took the logo's place. The brand
 * now lives where it matters: a switcher in the breadcrumb of the brand-split
 * modules, shown only when the workspace has more than one brand.
 */
export function WorkspaceIdentity({ name, isPlatform, expanded, href }: { name: string | null; isPlatform: boolean; expanded: boolean; href: string }) {
  if (!name) {
    return (
      <div className={cn("flex items-center", expanded ? "w-full gap-2.5 px-1" : "justify-center")}>
        <span className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-muted" />
        {expanded && <span className="h-4 flex-1 animate-pulse rounded bg-muted" />}
      </div>
    );
  }
  return (
    <Link
      href={href}
      prefetch={false}
      className={cn("flex items-center rounded-xl transition-colors hover:bg-muted/70", expanded ? "w-full gap-2.5 p-1.5" : "h-9 w-9 justify-center")}
      title={name}
    >
      {/* The platform workspace wears Rhinon Tech's own mark; a customer's wears its initials. */}
      <Glyph name={name} slug={isPlatform ? "rhinontech" : `workspace-${name}`} />
      {expanded && (
        <span className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm font-semibold leading-tight text-foreground">{name}</span>
          <span className="block truncate text-xs leading-tight text-muted-foreground">Workspace</span>
        </span>
      )}
    </Link>
  );
}

/**
 * The brand a brand-split module is showing, as a switcher in its breadcrumb.
 *
 * Rendered only when the workspace has more than one brand. Switching keeps you
 * on the same module and page — every brand has all of them — and only swaps
 * the brand segment of the URL, which is what decides the data shown.
 */
export function BrandCrumbSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { slug, brand, sites, loading, select } = useActiveBrand();
  if (loading || !brand || sites.length < 2) return null;

  const switchTo = (next: string) => {
    select(next);
    const parts = pathname.split("/");
    const currentModule = parts[2] || "dashboard";
    if (SITE_SCOPED_MODULES.includes(currentModule as SiteScopedModule)) {
      // /role/module/<brand>/rest… — keep the page, swap the brand. Record ids in
      // the rest belong to the old brand, so stop at the tab.
      router.push(`/${parts[1]}/${currentModule}/${next}${parts[4] ? `/${parts[4]}` : ""}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="hidden min-w-0 max-w-[160px] items-center gap-1.5 rounded-full bg-foreground/[0.05] py-0.5 pl-0.5 pr-2 text-xs font-medium text-foreground/80 ring-1 ring-inset ring-foreground/[0.06] transition-colors hover:bg-foreground/[0.09] sm:inline-flex"
          aria-label={`Showing ${brand.name}. Switch brand`}
          title="Which brand's data this screen shows"
        >
          <Glyph name={brand.name} slug={brand.slug} size="xs" />
          <span className="truncate">{brand.name}</span>
          <TbSelector size={13} className="shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-1.5">
        <DropdownMenuLabel className="px-2 py-1 text-xs font-medium text-muted-foreground">Show data for</DropdownMenuLabel>
        {sites.map((site) => (
          <DropdownMenuItem key={site.slug} onSelect={() => switchTo(site.slug)} className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <Glyph name={site.name} slug={site.slug} size="sm" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{site.name}</span>
            {site.slug === slug ? (
              <TbCheck size={16} className="shrink-0 text-primary" />
            ) : (
              <span className="shrink-0 truncate text-xs text-muted-foreground">{host(site.siteUrl) ?? ""}</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
