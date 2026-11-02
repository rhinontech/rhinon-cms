import type { Metadata } from "next";
import Link from "next/link";
import { Home } from "lucide-react";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for doesn't exist.",
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
};


export default function NotFound() {
  return (
    <div className="relative min-h-[75vh] flex flex-col justify-center items-center px-5 py-24 selection:bg-[#1c2bff]/50 overflow-x-clip">
      {/* Background radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
      >
        <div className="w-[600px] h-[350px] bg-primary/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-3xl mx-auto w-full flex flex-col items-center text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-xs font-medium tracking-widest text-[#A3B8CC] uppercase font-sans">
            Error 404
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-sans font-normal leading-[1.1] tracking-[-0.02em] text-transparent bg-clip-text bg-linear-to-b from-white to-white/80 mb-4">
          Page <span className="font-serif italic text-transparent bg-clip-text">not found</span>
        </h1>

        <p className="text-white/70 text-base sm:text-lg max-w-lg mb-10">
          The link you followed may be broken, or the page may have been moved or removed.
        </p>

        {/* Primary Action */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-colors mb-14 text-sm"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}

