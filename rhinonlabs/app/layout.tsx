import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { HeroHeader } from "@/components/Common/Header/Header";
import { Footer } from "@/components/Common/Footer/Footer";
import FloatingContactButton from "@/components/Common/FloatingContactButton/FloatingContactButton";
import { Navbar } from "@/components/Common/Header/Navbar";
import StructuredData from "@/components/Common/SEO/StructuredData";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// const inter = Inter({
//   variable: "--font-inter",
//   subsets: ["latin"],
// });

// const instrumentSerif = Instrument_Serif({
//   weight: "400",
//   variable: "--font-instrument",
//   subsets: ["latin"],
// });


const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
  style: "italic"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rhinonlabs.com"),
  title: {
    default: "Rhinon Labs | Ship Your Product 3x Faster Without Hiring a Tech Team",
    template: "%s | Rhinon Labs",
  },
  description:
    "We help founders and SMBs design, build and launch websites, apps and AI products and internal tools fast with affordable pricing. AI-powered development for startups.",
  keywords: [
    "MVP Development",
    "AI SaaS Development",
    "Startup Web Development",
    "Mobile App Development",
    "Landing Page Design",
    "Internal Tools",
    "AI Development",
    "Rapid Prototyping",
    "Founder-Friendly Development",
    "SMB Software Development",
  ],
  authors: [{ name: "Rhinon Labs" }],
  creator: "Rhinon Labs",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://rhinonlabs.com",
    title: "Rhinon Labs | Ship Your Product 3x Faster",
    description:
      "We help founders and SMBs design, build and launch websites, apps and AI products fast. AI-powered development with affordable pricing.",
    siteName: "Rhinon Labs",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Rhinon Labs - AI-powered development for startups",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rhinon Labs | Ship Your Product 3x Faster",
    description:
      "We help founders and SMBs design, build and launch websites, apps and AI products fast. AI-powered development with affordable pricing.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${instrumentSerif.variable} relative font-sans antialiased text-foreground bg-background`}
      >
        <StructuredData />
        <Navbar />
        {children}
        <Footer />

        <div
          className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-[1200px] h-[70px] z-10 pointer-events-none backdrop-blur-[7px] mask-[linear-gradient(to_bottom,transparent_0%,black_60%)]"
        />

      </body>
    </html>
  );
}
