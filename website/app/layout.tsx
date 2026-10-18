import { Sora, Geist, IBM_Plex_Mono } from "next/font/google";
import SmoothScroll from "@/components/ui/SmoothScroll";
import { site } from "@/lib/content";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-sora" });
const geist = Geist({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-geist" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });

export const metadata = {
  title: site.title,
  description: site.description,
  openGraph: {
    type: "website",
    title: site.title,
    description: site.description,
  },
  twitter: { card: "summary_large_image", title: site.title, description: site.description },
};

export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${geist.variable} ${plexMono.variable}`}>
      <body>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
