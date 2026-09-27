"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TbLoader } from "react-icons/tb";
import { useCurrentSite, useSites } from "@/lib/sites";
import { SitePickerModal } from "./SitePickerModal";

function Spinner() {
  return (
    <main className="flex h-full w-full items-center justify-center">
      <TbLoader size={22} className="animate-spin text-muted-foreground" />
    </main>
  );
}

/**
 * The landing page of a brand-split module: asks which brand, then routes to
 * /[role]/<module>/<slug>.
 *
 * A workspace with one brand has nothing to choose between, so it redirects
 * straight through — a customer on a single site never learns this screen
 * exists. `landing` is where to go inside the brand (Automation opens on
 * Workflows, not on its own root).
 */
export function SitePickerGate({
  title,
  description,
  landing = "",
}: {
  title: string;
  description: string;
  landing?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, roleSlug, moduleSlug] = pathname.split("/");
  const [open, setOpen] = useState(true);
  const { sites, loading } = useSites();

  const go = (slug: string) =>
    router.push(`/${roleSlug}/${moduleSlug}/${slug}${landing ? `/${landing}` : ""}`);

  useEffect(() => {
    if (!loading && sites.length === 1) {
      router.replace(
        `/${roleSlug}/${moduleSlug}/${sites[0].slug}${landing ? `/${landing}` : ""}`
      );
    }
  }, [loading, sites, roleSlug, moduleSlug, landing, router]);

  if (loading || sites.length === 1) return <Spinner />;

  return (
    <div className="flex h-full w-full items-center justify-center">
      <SitePickerModal
        open={open}
        onOpenChange={setOpen}
        onSelect={go}
        title={title}
        description={description}
      />
      {!open && (
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <p>Choose which brand you want to work in.</p>
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Choose a brand
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Wraps everything under a module's `[domain]` segment.
 *
 * Holds children back until the slug in the URL is known to be a real brand, so
 * no screen ever fires a request under a brand the workspace does not have —
 * and so a stale bookmark to the old un-branded URL (/crm/deals, read as
 * domain="deals") lands on the picker instead of an empty board.
 */
export function SiteScopeGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [, roleSlug, moduleSlug] = pathname.split("/");
  const { site, loading } = useCurrentSite();

  useEffect(() => {
    if (!loading && !site) router.replace(`/${roleSlug}/${moduleSlug}`);
  }, [loading, site, roleSlug, moduleSlug, router]);

  if (loading || !site) return <Spinner />;
  return <>{children}</>;
}
