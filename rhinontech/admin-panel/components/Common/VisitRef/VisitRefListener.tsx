"use client";

import { useEffect } from "react";
import { API_URL } from "@/lib/api";

/**
 * Campaign emails link to the dashboard with a personalised visit code (?r=…)
 * so a click on "Try the free dashboard" shows up on that lead in the CRM.
 * Records the arrival once and takes the code out of the address bar. Does
 * nothing on every other page load.
 */
export function VisitRefListener() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("r");
    if (!ref || !/^[A-Za-z0-9_-]{32}$/.test(ref)) return;
    url.searchParams.delete("r");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    fetch(`${API_URL}/public/visitors`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ ref, path: url.pathname, referrer: document.referrer || undefined }),
      keepalive: true,
    }).catch(() => { /* a lost visit must never break sign-in */ });
  }, []);
  return null;
}
