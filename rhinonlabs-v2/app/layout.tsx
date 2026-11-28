import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RhinonLabs — AI-Native Product Engineering Company",
  description:
    "AI software development company that designs, builds and runs AI agents, mobile apps and web platforms for startups and enterprises across 22+ countries.",
  openGraph: {
    title: "RhinonLabs — AI-Native Product Engineering Company",
    description:
      "AI software development company that designs, builds and runs AI agents, mobile apps and web platforms for startups and enterprises across 22+ countries.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&family=Spline+Sans+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white text-[#121314] font-body antialiased selection:bg-[#FF6B35] selection:text-white">
        {children}
      </body>
    </html>
  );
}
