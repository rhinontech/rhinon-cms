"use client";

import { usePathname, useRouter } from "next/navigation";
import { TbCheck, TbSelector } from "react-icons/tb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
 * A stable colour per brand.
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

function Glyph({ name, slug, size = "md" }: { name: string; slug: string; size?: "md" | "sm" }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg font-bold text-white",
        glyphColor(slug),
        size === "md" ? "h-9 w-9 text-xs" : "h-8 w-8 text-[11px]"
      )}
    >
      {initials(name)}
    </span>
  );
}

/**
 * The brand the admin is being viewed as, in the sidebar header.
 *
 * Switching brand does not add or remove menus — every module stays available
 * under every brand. What changes is the DATA those modules show: the six
 * brand-split ones (Inbox, CRM, Outreach, Automation, Content, Analytics)
 * follow the brand in the URL, and the rest are workspace-wide either way.
 */
export function BrandSwitcher({ expanded }: { expanded: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1] || "";
  const { slug, brand, sites, loading, select } = useActiveBrand();

  if (loading || !brand) {
    return (
      <div className={cn("flex items-center", expanded ? "w-full gap-2.5 px-1" : "justify-center")}>
        <span className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-muted" />
        {expanded && <span className="h-4 flex-1 animate-pulse rounded bg-muted" />}
      </div>
    );
  }

  const switchTo = (next: string) => {
    select(next);
    // Stay on the current module — every brand has all of them. Only the
    // brand-split ones carry the slug in their path.
    const currentModule = pathname.split("/")[2] || "dashboard";
    const scoped = SITE_SCOPED_MODULES.includes(currentModule as SiteScopedModule);
    router.push(scoped ? `/${roleSlug}/${currentModule}/${next}` : `/${roleSlug}/${currentModule}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center rounded-xl transition-colors hover:bg-muted/70",
            expanded ? "w-full gap-2.5 p-1.5" : "h-9 w-9 justify-center"
          )}
          aria-label={`Current brand: ${brand.name}. Switch brand`}
        >
          <Glyph name={brand.name} slug={brand.slug} />
          {expanded && (
            <>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-bold leading-tight text-foreground">
                  {brand.name}
                </span>
                <span className="block truncate text-xs leading-tight text-muted-foreground">
                  {host(brand.siteUrl) ?? (brand.isDefault ? "Default brand" : "Brand")}
                </span>
              </span>
              <TbSelector size={16} className="shrink-0 text-muted-foreground" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64 p-1.5">
        <DropdownMenuLabel className="px-2 py-1 text-xs font-medium text-muted-foreground">
          Brands
        </DropdownMenuLabel>
        {sites.map((site) => (
          <DropdownMenuItem
            key={site.slug}
            onSelect={() => switchTo(site.slug)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-2"
          >
            <Glyph name={site.name} slug={site.slug} size="sm" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
              {site.name}
            </span>
            {site.slug === slug ? (
              <TbCheck size={16} className="shrink-0 text-primary" />
            ) : (
              <span className="shrink-0 truncate text-xs text-muted-foreground">
                {host(site.siteUrl) ?? ""}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
