import type { Metadata } from "next";
import { Geist, Inter_Tight } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"], weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://rhinontech.in"),
  title: "Rhinon Tech: CRM, outreach, inbox and team in one free workspace",
  description:
    "One workspace for your CRM, AI email outreach, shared inbox, projects and HR. Free for your whole team. Built by Rhinon Labs.",
  openGraph: {
    title: "Rhinon Tech: your whole business in one workspace",
    description: "CRM, AI outreach, shared inbox, projects and HR in one free workspace.",
    url: "https://rhinontech.in",
    siteName: "Rhinon Tech",
    type: "website",
  },
  icons: { icon: "/logo-dark.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${interTight.variable} font-sans`}>{children}</body>
    </html>
  );
}
