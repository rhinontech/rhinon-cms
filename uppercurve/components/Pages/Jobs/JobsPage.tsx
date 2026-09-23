"use client";

import React from "react";
import { TextAnimation } from "@/components/Animations";

export function JobsPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center">
      {/* Hero Section */}
      <div className="relative w-full overflow-hidden border-b border-gray-100">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_55%_45%_at_50%_35%,#000_25%,transparent_95%)] opacity-35" />

        <section className="relative max-w-7xl mx-auto pt-16 max-sm:pt-12 pb-16 px-6 flex flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-1 py-1 pr-3 mb-8 shadow-sm">
            <span className="bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
              Careers
            </span>
            <span className="text-sm font-[450] text-indigo-950">
              Curated Tech & AI Opportunities
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight leading-[1.05] max-w-4xl mb-6 font-poppins">
            <TextAnimation>Find your next role with</TextAnimation>{" "}
            <br className="hidden sm:inline" />
            <TextAnimation>UpperCurve Careers</TextAnimation>
          </h1>

          <p className="text-gray-500 text-base md:text-lg font-normal max-w-2xl leading-relaxed mb-8">
            High-signal job opportunities, internships, and fellowships with top
            engineering teams, high-growth startups, and AI pioneers.
          </p>
        </section>
      </div>

      {/* Placeholder Container for Components */}
      <div className="w-full max-w-7xl mx-auto px-6 py-16 flex flex-col items-center">
        <div className="w-full max-w-3xl rounded-3xl border border-dashed border-gray-300 bg-gray-50/60 p-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center mb-4">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 font-poppins">
            Jobs Page Initialized
          </h3>
          <p className="text-sm text-gray-500 max-w-md">
            Ready to build! Share the images and component specifications, and we will
            generate each section to match the design.
          </p>
        </div>
      </div>
    </main>
  );
}

export default JobsPage;
