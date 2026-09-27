"use client";

import React from "react";
import { AnimateWrapper, TextAnimation } from "@/components/Animations";

export function RealCraftSection() {
  const bottomCards = [
    {
      icon: "👓",
      iconBg: "bg-cyan-100 text-cyan-600",
      title: "Find Your Direction",
      desc: "Explore programs across AI, engineering, product, and emerging careers.",
    },
    {
      icon: "🥞",
      iconBg: "bg-fuchsia-100 text-fuchsia-600",
      title: "Build Real Things",
      desc: "Hands-on projects and industry briefs that go beyond academics.",
    },
    {
      icon: "📦",
      iconBg: "bg-amber-100 text-amber-600",
      title: "Grow Your Career",
      desc: "Mentorship, career preparation, and a network that opens doors.",
    },
  ];

  return (
    <section className=" py-24 text-gray-900 font-sans antialiased">

      {/* Section Header */}
      <div className="max-w-[1400px] mx-auto flex flex-col items-center text-center mb-16">
        <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-md mb-6 hover:scale-105 transition-transform cursor-pointer">
          <span className="text-lg">👆</span>
        </div>
        <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight max-w-2xl">
          <TextAnimation>Learn for</TextAnimation> <br /> <TextAnimation>the real world.</TextAnimation>
        </h2>
      </div>

      {/* Grid Layout of Upper Feature Cards */}
      <AnimateWrapper className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch mb-12">

        {/* COLUMN 1 */}
        <div className="flex flex-col gap-3">
          {/* Card 1: Learn the basics everyone skips */}
          <div className="group bg-[#f3f4f6] rounded-3xl p-5 md:p-6 flex flex-col justify-between overflow-hidden relative shadow-sm border border-gray-200/50 min-h-[260px]">
            <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-5 text-left">
              Skills the industry <br /> actually expects
            </h3>

            {/* Overlapping Cards Container */}
            <div className="relative w-full pt-1 pb-1">
              {/* TOP OVERLAPPING COLOR PALETTE CARD */}
              <div className="relative z-20 bg-white rounded-2xl p-3 shadow-[0_10px_24px_-4px_rgba(0,0,0,0.08)] border border-gray-100/90 w-[86%] transition-transform duration-300 ease-out group-hover:-translate-y-2 group-hover:-rotate-3 hover:-translate-y-2 hover:-rotate-3 cursor-pointer">
                <div className="flex items-center justify-between gap-2">
                  <span className="w-7 h-7 rounded-xl bg-[#38bdf8] shadow-sm transition-transform hover:scale-110" />
                  <span className="w-7 h-7 rounded-xl bg-[#6366f1] shadow-[0_8px_16px_rgba(99,102,241,0.5)] ring-2 ring-indigo-200 transition-transform hover:scale-110" />
                  <span className="w-7 h-7 rounded-xl bg-[#a3e635] shadow-sm transition-transform hover:scale-110" />
                  <span className="w-7 h-7 rounded-xl bg-[#fbbf24] shadow-sm transition-transform hover:scale-110" />
                  <span className="w-7 h-7 rounded-xl bg-[#f472b6] shadow-sm transition-transform hover:scale-110" />
                </div>
              </div>

              {/* BOTTOM OVERLAPPING ALIGNMENT & TYPOGRAPHY CARD */}
              <div className="relative z-10 -mt-5 ml-auto w-[86%] bg-white rounded-2xl p-3 shadow-md border border-gray-100 transition-transform duration-300">
                {/* Alignment Icons Row */}
                <div className="flex items-center justify-between px-1 pb-2 border-b border-gray-100">
                  {/* Active Align Left Button */}
                  <div className="w-8 h-8 rounded-full bg-[#262626] text-white flex items-center justify-center shadow-md">
                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 5h18v2H3V5zm0 5h12v2H3v-2zm0 5h18v2H3v-2zm0 5h12v2H3v-2z" />
                    </svg>
                  </div>

                  {/* Align Center Button */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                    <svg className="w-3.5 h-3.5 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 5h18v2H3V5zm3 5h12v2H6v-2zm-3 5h18v2H3v-2zm3 5h12v2H6v-2z" />
                    </svg>
                  </div>

                  {/* Align Right Button */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                    <svg className="w-3.5 h-3.5 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 5h18v2H3V5zm6 5h12v2H9v-2zm-6 5h18v2H3v-2zm6 5h12v2H9v-2z" />
                    </svg>
                  </div>

                  {/* Justify Button */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                    <svg className="w-3.5 h-3.5 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 5h18v2H3V5zm0 5h18v2H3v-2zm0 5h18v2H3v-2zm0 5h12v2H3v-2z" />
                    </svg>
                  </div>
                </div>

                {/* Size Selector Row (S M L XL) */}
                <div className="flex items-center justify-between px-1 pt-2 text-sm font-black text-gray-900">
                  <span className="w-8 text-center font-black hover:text-black cursor-pointer">S</span>
                  <span className="w-8 text-center font-black hover:text-black cursor-pointer">M</span>
                  <span className="w-8 h-8 rounded-full bg-[#262626] text-white flex items-center justify-center font-black shadow-md text-xs">L</span>
                  <span className="w-8 text-center font-black hover:text-black cursor-pointer">XL</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Build a portfolio of 6 real projects */}
          <div className="group bg-[#f3f4f6] rounded-3xl pt-5 px-5 md:pt-6 md:px-6 pb-0 flex flex-col justify-between overflow-hidden relative shadow-sm border border-gray-200/50 min-h-[260px] cursor-pointer">
            <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-5 text-left">
              Build real projects, <br /> not toy exercises
            </h3>

            {/* Stacked Message Card Container Touching Bottom */}
            <div className="relative w-full mt-auto pt-2 flex flex-col items-center">
              {/* BACK STACKED BACKGROUND CARD */}
              <div className="absolute top-1.5 w-[92%] h-[92%] bg-[#e5e7eb]/90 rounded-[24px] shadow-sm transition-transform duration-500 ease-out group-hover:scale-105 group-hover:-translate-y-2 z-0" />

              {/* FRONT MAIN MESSAGE CARD */}
              <div className="relative z-10 w-[96%] bg-white rounded-t-[22px] p-3.5 shadow-[0_-6px_20px_rgba(0,0,0,0.05)] border border-gray-100/80 transition-transform duration-500 ease-out group-hover:scale-[1.02] group-hover:-translate-y-1 space-y-2.5 translate-y-1">
                {/* Message Header */}
                <div className="flex items-center justify-between pb-0.5">
                  <span className="text-xs font-black text-gray-900">Message</span>
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] font-bold hover:bg-gray-200 transition-colors">
                    •••
                  </div>
                </div>

                {/* Message Row 1: Jarret Waelchi */}
                <div className="flex items-center gap-2.5 p-0.5">
                  <div className="relative w-8 h-8 rounded-full bg-emerald-200 overflow-hidden shrink-0">
                    <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Jarret" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-gray-900 truncate">Jarret Waelchi</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[9px] font-bold text-gray-400">03:30PM</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 truncate">When do you release the coded...</p>
                  </div>
                </div>

                {/* Message Row 2: Orval Casper */}
                <div className="flex items-center gap-2.5 bg-[#f3f4f6] rounded-xl p-2">
                  <div className="relative w-8 h-8 rounded-full bg-purple-200 overflow-hidden shrink-0">
                    <span className="absolute top-0 left-0 w-2 h-2 rounded-full bg-lime-400 ring-2 ring-white z-10" />
                    <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="Orval" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-gray-900 truncate">Orval Casper</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[9px] font-bold text-gray-400">11:59AM</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">When do you release the coded...</p>
                  </div>
                </div>

                {/* Message Row 3: Michel Emard */}
                <div className="flex items-center gap-3 p-1">
                  <div className="relative w-10 h-10 rounded-full bg-amber-200 overflow-hidden shrink-0">
                    <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80" alt="Michel" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-gray-900 truncate">Michel Emard</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] font-bold text-gray-400">09:30AM</span>
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">When do you release the coded...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2 (Center Mobile App Mockup) */}
        <div className="bg-[#f3f4f6] rounded-3xl h-[650px] max-sm:h-[450px] relative shadow-sm border border-gray-200/50 overflow-hidden">
          <img
            src="/realCraft/image2.avif"
            alt="Live Map UI"
            className="absolute -bottom-30 left-1/2 -translate-x-1/2 w-full max-w-[320px] sm:max-w-sm h-auto object-contain drop-shadow-lg translate-y-2 pointer-events-none"
          />
        </div>

        {/* COLUMN 3 */}
        <div className="flex flex-col gap-3">
          {/* Card 3: Get weekly 1:1 critique from working pros */}
          <div className="group bg-[#f3f4f6] rounded-3xl pt-6 px-6 md:pt-8 md:px-8 pb-0 flex flex-col justify-between overflow-hidden relative shadow-sm border border-gray-200/50 min-h-[320px] cursor-pointer">
            <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-6 text-left">
              Learn directly from <br /> working professionals
            </h3>

            {/* Tilted Images Container touching bottom */}
            <div className="flex gap-3 justify-center items-end mt-auto translate-y-3 pt-2">
              {/* Left Image Card (Tilts Counter-Clockwise) */}
              <div className="w-1/2 h-44 rounded-2xl overflow-hidden shadow-xl border-2 border-white/80 transform -rotate-6 transition-all duration-500 ease-out group-hover:-rotate-12 group-hover:-translate-y-2 group-hover:scale-105">
                <img
                  className="w-full h-full object-cover"
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"
                  alt="mentor1"
                />
              </div>

              {/* Right Image Card (Tilts Clockwise in Opposite Direction) */}
              <div className="w-1/2 h-44 rounded-2xl overflow-hidden shadow-xl border-2 border-white/80 transform rotate-3 transition-all duration-500 ease-out group-hover:rotate-9 group-hover:-translate-y-2 group-hover:scale-105">
                <img
                  className="w-full h-full object-cover"
                  src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80"
                  alt="mentor2"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Job-ready in 12 weeks, no fluff */}
          <div className="group overflow-hidden bg-[#f3f4f6] rounded-3xl p-6 md:p-8 flex flex-col justify-between overflow-hidden relative shadow-sm border border-gray-200/50 min-h-[320px] cursor-pointer">
            <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-6 text-left relative z-10">
              Momentum toward your <br /> next opportunity
            </h3>

            {/* 3D PURPLE FLUFF SHAPE IMAGE (TOUCHES BOTTOM & RIGHT, SCALES ON HOVER) */}
            <div className="absolute -bottom-26 right-0 w-78 md:w-68  pointer-events-none">
              <img
                src="/realCraft/image1.avif"
                alt="Job ready shape"
                className="w-full h-auto object-contain translate-y-1 translate-x-1 transition-transform duration-500 ease-out group-hover:scale-110 origin-bottom-right"
              />
            </div>
          </div>
        </div>

      </AnimateWrapper>

      {/* THREE BOTTOM CARDS */}
      <AnimateWrapper className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {bottomCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-3xl p-8 border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300 text-left flex flex-col justify-between space-y-6"
          >
            <div className={`w-10 h-10 rounded-2xl ${card.iconBg} flex items-center justify-center text-lg font-bold shadow-inner`}>
              {card.icon}
            </div>
            <div>
              <h4 className="text-xl font-extrabold text-gray-900 mb-2">
                {card.title}
              </h4>
              <p className="text-sm font-normal text-gray-500 leading-relaxed">
                {card.desc}
              </p>
            </div>
          </div>
        ))}
      </AnimateWrapper>

    </section >
  );
}

export default RealCraftSection;
