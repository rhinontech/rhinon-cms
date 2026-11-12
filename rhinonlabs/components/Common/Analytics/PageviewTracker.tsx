"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageview, trackEmailVisitor, trackKnownVisitor } from "@/lib/analytics";

// Fires exactly one pageview per client-side navigation. Reads useSearchParams so UTM tags
// are captured on entry; that hook requires a Suspense boundary, added in the root layout.
export function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedEmail = useRef<string | null>(null);
  // Stripping ?r= / ?email= from the address bar updates useSearchParams, which
  // would run this effect again for the same page; count each page once.
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === lastTrackedPath.current) return;
    lastTrackedPath.current = pathname;
    trackPageview(pathname);

    // Links sent before visit codes carried ?email=…; still recorded, but only
    // when there is no code, since a code is the trustworthy signal.
    const email = searchParams.get("email");
    const hasRef = !!searchParams.get("r");
    const isUnsubscribePage = pathname.startsWith("/unsubscribe");
    if (!hasRef && email && email.trim() && !isUnsubscribePage && email !== lastTrackedEmail.current) {
      lastTrackedEmail.current = email;
      trackEmailVisitor(email, pathname);
    }
    // Personalised campaign link (?r=…), or a browser that arrived through one before.
    trackKnownVisitor(pathname);
  }, [pathname, searchParams]);

  return null;
}
