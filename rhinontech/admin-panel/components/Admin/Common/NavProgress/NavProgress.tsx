"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader } from "./PageLoading";

/**
 * The centred loader, shown the moment an in-app link is clicked and
 * finishes when the new route renders, so a slow server round-trip never looks
 * like a dead click.
 */
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [active, setActive] = useState(false);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      setActive(true);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // The route changed: the navigation finished.
  useEffect(() => setActive(false), [pathname, search]);

  // Never get stuck if a navigation is cancelled.
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setActive(false), 15000);
    return () => clearTimeout(t);
  }, [active]);

  if (!active) return null;
  // Waits a beat before showing, so fast navigations don't flash a spinner.
  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center opacity-0 animate-[navloader-in_150ms_ease-out_250ms_forwards]">
      <div className="rounded-xl border border-border bg-card px-6 py-5 shadow-lg">
        <Loader />
      </div>
    </div>
  );
}
