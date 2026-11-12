import Script from "next/script";

const GTM_ID = "GTM-T8G5PP3T";
const live = process.env.NODE_ENV === "production";

/**
 * Google Tag Manager: the loader goes in the head, the noscript fallback right after <body>.
 * Production only, so local visits do not show up in the numbers. The `gtm.start` event is
 * what tells the container the page has loaded; without it none of its tags fire.
 */
export function GoogleTagManagerHead() {
  if (!live) return null;
  return (
    <Script id="gtm" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
    </Script>
  );
}

export function GoogleTagManagerNoscript() {
  if (!live) return null;
  return (
    <noscript>
      <iframe src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`} height="0" width="0" style={{ display: "none", visibility: "hidden" }} title="Google Tag Manager" />
    </noscript>
  );
}
