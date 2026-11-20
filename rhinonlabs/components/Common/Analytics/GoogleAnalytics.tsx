import Script from "next/script";

const GA_ID = "G-HQ0812RTEQ";

/**
 * Google Analytics (GA4). Production only, so local and preview visits do not
 * show up in the numbers. GA4 follows client-side route changes on its own.
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
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
