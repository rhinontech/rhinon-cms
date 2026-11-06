import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter_Tight } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SITE_URL } from "@/components/site";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"], weight: ["500", "600", "700"] });

const DESCRIPTION =
  "One workspace for your CRM, AI email outreach, shared inbox, projects and HR. Free for your whole team. Built by Rhinon Labs.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Rhinon Tech | Run your whole company from one workspace",
    template: "%s | Rhinon Tech",
  },
  description: DESCRIPTION,
  openGraph: {
    title: "Rhinon Tech | Run your whole company from one workspace",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Rhinon Tech",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

const ORGANIZATION = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Rhinon Tech",
  url: SITE_URL,
  logo: `${SITE_URL}/brand/logo-navy.png`,
  parentOrganization: { "@type": "Organization", name: "Rhinon Labs", url: "https://www.rhinonlabs.com" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} ${interTight.variable} font-sans`}>
        <Navbar />
        <main className="overflow-x-clip">{children}</main>
        <Footer />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION) }} />
      </body>
    </html>
  );
}
