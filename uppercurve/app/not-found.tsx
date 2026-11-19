import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Page not found",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main className="min-h-[75vh] flex items-center justify-center bg-white px-4 py-16 sm:px-6 font-[family-name:var(--font-plus-jakarta)] text-[#0B1B3D]">
      <div className="w-full max-w-lg mx-auto text-center">
        <p className="text-sm font-bold font-mono tracking-widest uppercase text-[#0052FF] mb-3">
          404 Error
        </p>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0B1B3D] tracking-tight">
          Page not found
        </h1>
        <p className="mt-3 text-sm sm:text-base text-[#64748B] leading-relaxed">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. Here are the main sections you can explore:
        </p>

        {/* Clean, Simple Links to Course, Events, and Blog */}
        <div className="mt-8 space-y-3 text-left">
          <Link
            href="/courses/agentic-ai-launchpad"
            className="group flex items-center justify-between p-4 rounded-xl border border-[#E6EAF2] bg-[#F8FAFC] hover:bg-white hover:border-[#0052FF]/30 hover:shadow-sm transition-all"
          >
            <div>
              <p className="text-sm font-bold text-[#0B1B3D] group-hover:text-[#0052FF] transition-colors">
                Agentic AI Launchpad
              </p>
              <p className="text-xs text-[#64748B]">
                6-Week live mentor-led cohort on building AI agents
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0052FF] group-hover:translate-x-1 transition-all shrink-0 ml-3" />
          </Link>

          <Link
            href="/events"
            className="group flex items-center justify-between p-4 rounded-xl border border-[#E6EAF2] bg-[#F8FAFC] hover:bg-white hover:border-[#0052FF]/30 hover:shadow-sm transition-all"
          >
            <div>
              <p className="text-sm font-bold text-[#0B1B3D] group-hover:text-[#0052FF] transition-colors">
                Live Events & Workshops
              </p>
              <p className="text-xs text-[#64748B]">
                Free weekend certificate workshops and masterclasses
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0052FF] group-hover:translate-x-1 transition-all shrink-0 ml-3" />
          </Link>

          <Link
            href="/blog"
            className="group flex items-center justify-between p-4 rounded-xl border border-[#E6EAF2] bg-[#F8FAFC] hover:bg-white hover:border-[#0052FF]/30 hover:shadow-sm transition-all"
          >
            <div>
              <p className="text-sm font-bold text-[#0B1B3D] group-hover:text-[#0052FF] transition-colors">
                Practical AI Blog
              </p>
              <p className="text-xs text-[#64748B]">
                Guides, tutorials and engineering workflows
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0052FF] group-hover:translate-x-1 transition-all shrink-0 ml-3" />
          </Link>
        </div>

        {/* Back to Home Button */}
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#0052FF] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#0040D0] transition-colors shadow-sm"
          >
            Back to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
