"use client";

import React from "react";

export function ActionCtaSection() {
  const checklistItems = [
    "Structured curriculum",
    "Live classes with structured assignments",
    "1:1 Mentorship from industry experts",
    "End-to-End placement support",
  ];

  return (
    <section className="w-full py-16 sm:py-24 bg-white border-t border-gray-300 text-gray-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        {/* Top Header: 2200+ Students Placed At */}
        <div className="w-full flex items-center justify-center gap-4 sm:gap-6 mb-10 sm:mb-14">
          <div className="h-[1px] bg-gray-300 flex-1 max-w-xs sm:max-w-sm hidden sm:block" />
          <div className="border border-gray-300 rounded-full px-5 py-1.5 text-xs font-semibold text-gray-700 tracking-wider uppercase bg-white shadow-sm whitespace-nowrap">
            2200+ STUDENTS PLACED AT
          </div>
          <div className="h-[1px] bg-gray-300 flex-1 max-w-xs sm:max-w-sm hidden sm:block" />
        </div>

        {/* Brand Logos Infinite Moving Marquee Bar with Edge Fade Masks */}
        <div className="relative w-full max-w-6xl mb-14 sm:mb-20 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
          <div
            className="flex w-max items-center gap-12 sm:gap-16 animate-marquee hover:[animation-play-state:paused] py-3 select-none"
            style={{ animationDuration: "25s" }}
          >
            {[...Array(4)].flatMap(() => [
              {
                id: "goldman",
                content: (
                  <div className="flex flex-col text-left font-serif leading-none tracking-tight text-[#1F2937] hover:opacity-80 transition-opacity">
                    <span className="text-xl sm:text-2xl font-bold">Goldman</span>
                    <span className="text-xl sm:text-2xl font-bold">Sachs</span>
                  </div>
                ),
              },
              {
                id: "bytedance",
                content: (
                  <div className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="flex items-end gap-1 h-6">
                      <span className="w-1.5 h-6 bg-[#00D2D2] rounded-sm" />
                      <span className="w-1.5 h-4 bg-[#3B82F6] rounded-sm" />
                      <span className="w-1.5 h-7 bg-[#00D2D2] rounded-sm" />
                      <span className="w-1.5 h-5 bg-[#3B82F6] rounded-sm" />
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-[#1F2937] tracking-tight">
                      ByteDance
                    </span>
                  </div>
                ),
              },
              {
                id: "paypal",
                content: (
                  <div className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                    <span className="text-2xl sm:text-3xl font-black italic tracking-tighter text-[#003087]">
                      P<span className="text-[#0079C1] -ml-2">P</span>
                    </span>
                    <span className="text-xl sm:text-2xl font-bold italic tracking-tight text-[#003087]">
                      Pay<span className="text-[#0079C1]">Pal</span>
                    </span>
                  </div>
                ),
              },
              {
                id: "samsung",
                content: (
                  <div className="hover:opacity-80 transition-opacity">
                    <span className="text-xl sm:text-2xl font-black tracking-widest text-[#034EA2] uppercase">
                      SAMSUNG
                    </span>
                  </div>
                ),
              },
              {
                id: "jpmorgan",
                content: (
                  <div className="hover:opacity-80 transition-opacity font-serif">
                    <span className="text-xl sm:text-2xl font-bold text-[#1F2937] tracking-tight">
                      J.P.Morgan
                    </span>
                  </div>
                ),
              },
              {
                id: "oracle",
                content: (
                  <div className="hover:opacity-80 transition-opacity">
                    <span className="text-xl sm:text-2xl font-black tracking-wider text-[#C74634] uppercase font-mono">
                      ORACLE
                    </span>
                  </div>
                ),
              },
              {
                id: "intuit",
                content: (
                  <div className="hover:opacity-80 transition-opacity">
                    <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#0077C5]">
                      intuit<span className="text-[#0077C5]">.</span>
                    </span>
                  </div>
                ),
              },
            ]).map((brand, idx) => (
              <div key={idx} className="shrink-0 flex items-center">
                {brand.content}
              </div>
            ))}
          </div>
        </div>

        {/* Main Dark Blue Callout Card */}
        <div className="w-full max-w-6xl rounded-3xl sm:rounded-[36px] bg-gradient-to-br from-[#02184d] via-[#042d82] to-[#0747b5] p-8 sm:p-12 lg:p-16 text-white shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.18] mb-6">
                The time to think is <br />
                over: <span className="font-serif italic font-normal text-blue-100">It&apos;s time to act.</span>
              </h2>

              <div className="space-y-3 text-blue-100/80 text-sm sm:text-base font-normal leading-relaxed mb-8 max-w-lg">
                <p>
                  One decision can change your career. <br />
                  If you&apos;ve decided to grow, this is your right time to switch and reach your dream role.
                </p>
                <p className="font-medium text-blue-50/90">
                  No more excuses. Upskill and make it happen.
                </p>
              </div>

              <div className="flex flex-col items-start gap-2.5">
                <a
                  href="/#callback"
                  className="bg-white hover:bg-gray-100 text-[#072d7d] font-bold text-sm sm:text-base px-7 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 inline-flex items-center gap-2.5 group"
                >
                  <span>Request A Callback</span>
                  <svg
                    className="w-4 h-4 text-[#072d7d] group-hover:rotate-12 transition-transform"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.05 15.05 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1A11.36 11.36 0 018.5 3.99c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.61c0-.55-.45-1-1-1z" />
                  </svg>
                </a>
                <span className="text-amber-400 font-semibold text-xs tracking-wide select-none">
                  Join the next batch before seats fill up!
                </span>
              </div>
            </div>

            {/* Right Checklist Column */}
            <div className="lg:col-span-5 flex flex-col space-y-5 sm:space-y-6 lg:pl-6">
              {checklistItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3.5 sm:gap-4">
                  <div className="w-6 h-6 rounded-full bg-blue-500/40 border border-blue-300/50 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <svg className="w-3.5 h-3.5 stroke-white stroke-[3] fill-none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <span className="text-base sm:text-lg font-semibold text-white tracking-tight">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ActionCtaSection;
