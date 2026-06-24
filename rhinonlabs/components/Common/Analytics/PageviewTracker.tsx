"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageview } from "@/lib/analytics";

// Fires exactly one pageview per client-side navigation. Reads useSearchParams so UTM tags
// are captured on entry; that hook requires a Suspense boundary, added in the root layout.
export function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    trackPageview(pathname);
    // We intentionally re-run on querystring changes too, so campaign landings (?utm_*) are recorded.
  }, [pathname, searchParams]);

  return null;
}
