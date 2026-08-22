"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageview, trackEmailVisitor } from "@/lib/analytics";

// Fires exactly one pageview per client-side navigation. Reads useSearchParams so UTM tags
// are captured on entry; that hook requires a Suspense boundary, added in the root layout.
export function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedEmail = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    trackPageview(pathname);

    // If URL contains ?email=..., capture the visitor with IP & location
    const email = searchParams.get("email");
    if (email && email.trim() && email !== lastTrackedEmail.current) {
      lastTrackedEmail.current = email;
      trackEmailVisitor(email, pathname);
    }
  }, [pathname, searchParams]);

  return null;
}
