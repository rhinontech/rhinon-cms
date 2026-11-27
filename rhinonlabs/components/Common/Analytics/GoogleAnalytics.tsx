"use client";

import Script from "next/script";

const GA_ID = "G-HQ0812RTEQ";

/**
 * Google Analytics (GA4).
 * Audit H-08 fix: Loads with strategy="afterInteractive" so short visits and instant
 * conversions are captured without waiting for idle/delay.
 */
export function GoogleAnalytics() {
  if (process.env.NODE_ENV !== "production") return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', {
  page_path: window.location.pathname,
  transport_type: 'beacon'
});`}
      </Script>
    </>
  );
}
