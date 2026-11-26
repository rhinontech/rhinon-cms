import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import RhinonChatLoader from "@/components/RhinonChat";
import { GoogleTagManagerHead, GoogleTagManagerNoscript } from "@/components/GoogleTagManager";
import { ANALYTICS_KEY, API_URL, SITE_URL } from "@/components/site";
import { JsonLd, siteWideGraph } from "@/components/schema";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const DESCRIPTION =
  "The AI CRM for agencies and service businesses: an AI agent on your website, AI-written follow-ups, and won deals turned into projects clients can track. Free for up to 5 people.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Rhinon Tech | AI CRM for agencies and service businesses",
    template: "%s | Rhinon Tech",
  },
  description: DESCRIPTION,
  openGraph: {
    title: "Rhinon Tech | AI CRM for agencies and service businesses",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Rhinon Tech",
    type: "website",
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="font-sans">
        <GoogleTagManagerNoscript />
        <GoogleTagManagerHead />
        <Navbar />
        <main className="overflow-x-clip">{children}</main>
        <Footer />
        <RhinonChatLoader />
        {process.env.NODE_ENV === "production" && <script async defer src={API_URL + "/t.js"} data-key={ANALYTICS_KEY} />}
        <JsonLd data={siteWideGraph()} />
      </body>
    </html>
  );
}
