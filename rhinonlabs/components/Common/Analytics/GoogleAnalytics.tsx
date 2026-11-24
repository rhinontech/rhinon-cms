"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const GA_ID = "G-HQ0812RTEQ";

/**
 * Google Analytics (GA4). Production only.
 * Defers loading until after initial page load so GTM's 196 KB payload and JS compilation
 * do not compete with LCP or cause Total Blocking Time (TBT).
 */
export function GoogleAnalytics() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    // Load after 3 seconds or on first user interaction
    const timer = setTimeout(() => setShouldLoad(true), 3000);
    const trigger = () => {
      setShouldLoad(true);
      window.removeEventListener("scroll", trigger);
      window.removeEventListener("pointerdown", trigger);
    };

    window.addEventListener("scroll", trigger, { passive: true, once: true });
    window.addEventListener("pointerdown", trigger, { passive: true, once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", trigger);
      window.removeEventListener("pointerdown", trigger);
    };
  }, []);

  if (!shouldLoad) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
