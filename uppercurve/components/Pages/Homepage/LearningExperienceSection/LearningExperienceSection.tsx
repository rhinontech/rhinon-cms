"use client";

import React from "react";

interface LearningExperienceSectionProps {
  brandName?: string;
  brandCaps?: string;
}

export function LearningExperienceSection({
  brandName = "UpperCurve Academy",
  brandCaps = "WITH UPPERCURVE ACADEMY",
}: LearningExperienceSectionProps) {
  const features = [
    {
      title: "Structured and Effective Learning Path",
      description:
        "A step-by-step roadmap, designed by MAANG engineers, that cuts the noise and keeps you focused.",
      icon: (
        <svg
          className="w-5 h-5 text-gray-300"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
          />
        </svg>
      ),
    },
    {
      title: "Live Classes (Assignments + Projects)",
      description:
        "Learn from industry experts, practice with guided assignments, and build projects that showcase real skills.",
      icon: (
        <svg
          className="w-5 h-5 text-gray-300"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 21h8m-4-4v4m-2-10a2 2 0 104 0 2 2 0 00-4 0zm-4 7c0-2.21 1.79-4 4-4s4 1.79 4 4"
          />
        </svg>
      ),
    },
    {
      title: "1:1 Mentorship",
      description:
        "Get personalized guidance from engineers who've already cracked the path you're aiming for.",
      icon: (
        <svg
          className="w-5 h-5 text-gray-300"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
          />
        </svg>
      ),
    },
    {
      title: "Placement Support",
      description:
        "From resume building to mock interviews, we stay with you until you land your dream role.",
      icon: (
        <svg
          className="w-5 h-5 text-gray-300"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v1.069m6.75 0c-1.125-.06-2.26-.09-3.4-.09s-2.275.03-3.4.09"
          />
        </svg>
      ),
    },
  ];

  return (
    <section className="w-full text-white  border-y border-white/5 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/3 translate-y-1/3 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="mx-auto bg-[#030712] grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10">
        {/* Left Column: Blueprint 99% Upskill Rate Card */}
        <div className="lg:col-span-6 flex justify-center w-full">
          <div className="relative w-full  aspect-square sm:aspect-[1.08/1]  overflow-hidden bg-gradient-to-tr from-[#021338] via-[#052b82] to-[#0d59eb] shadow-[0_20px_60px_rgba(5,43,130,0.4)] border border-blue-400/20 p-8 sm:p-12 flex flex-col justify-center items-center select-none">
            {/* Soft inner radial glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.35),transparent_70%)] pointer-events-none" />

            {/* Blueprint Grid Crosshair Lines */}
            {/* Top horizontal line */}
            <div className="absolute top-10 sm:top-14 left-0 right-0 h-[1px] bg-white/20" />
            {/* Bottom horizontal line */}
            <div className="absolute bottom-10 sm:bottom-14 left-0 right-0 h-[1px] bg-white/20" />
            {/* Left vertical line */}
            <div className="absolute top-0 bottom-0 left-10 sm:left-14 w-[1px] bg-white/20" />
            {/* Right vertical line */}
            <div className="absolute top-0 bottom-0 right-10 sm:right-14 w-[1px] bg-white/20" />

            {/* 4 Corner Glowing Target Dots at intersections */}
            {/* Top-Left */}
            <div className="absolute top-10 sm:top-14 left-10 sm:left-14 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] border-2 border-blue-400/40" />
            {/* Top-Right */}
            <div className="absolute top-10 sm:top-14 right-10 sm:right-14 translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] border-2 border-blue-400/40" />
            {/* Bottom-Left */}
            <div className="absolute bottom-10 sm:bottom-14 left-10 sm:left-14 -translate-x-1/2 translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] border-2 border-blue-400/40" />
            {/* Bottom-Right */}
            <div className="absolute bottom-10 sm:bottom-14 right-10 sm:right-14 translate-x-1/2 translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] border-2 border-blue-400/40" />

            {/* Content inside the grid box */}
            <div className="relative z-10 text-center space-y-6">
              <div className="relative z-10 text-center ">
                <span className="text-xs sm:text-[13px] font-semibold tracking-[0.28em] text-blue-200/80 uppercase">
                  UPSKILL RATE
                </span>
              </div>

              <div className="relative z-10 text-center ">
                <span className="text-7xl sm:text-8xl md:text-9xl font-[500] text-white tracking-tight drop-shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                  99%
                </span>
              </div>

              <div className="relative z-10 text-center ">
                <span className="text-xs sm:text-[13px] font-semibold tracking-[0.24em] text-blue-200/80 uppercase">
                  {brandCaps}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Features List */}
        <div className="lg:col-span-6  flex flex-col max-md:p-5  justify-center">
          {/* Header Tag */}
          <div className="inline-flex items-center gap-2.5 text-xs font-bold tracking-[0.25em] text-gray-400 uppercase mb-4">
            <span className="w-5 h-[1px] bg-gray-500/70" />
            <span>FEATURES</span>
            <span className="w-5 h-[1px] bg-gray-500/70" />
          </div>

          {/* Section Headline */}
          <h2 className="text-3xl sm:text-4xl md:text-4xl font-[500] text-white tracking-tight leading-tight mb-10">
            {brandName} <br />
            <span className="text-gray-100">learning experience</span>
          </h2>

          {/* 4 Feature Items */}
          <div className="space-y-7 sm:space-y-8">
            {features.map((item, index) => (
              <div key={index} className="flex items-start gap-4 sm:gap-5 group">
                {/* Circular Glass Icon */}
                <div className="w-12 h-12 rounded-full bg-white/[0.07] border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/[0.12] group-hover:border-white/20 transition-all duration-200 mt-0.5 shadow-sm">
                  {item.icon}
                </div>

                {/* Text Content */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mb-1 group-hover:text-blue-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed max-w-lg font-normal">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Brochure Callout Banner */}
      <div className="w-full max-w-6xl mx-auto mt-14 sm:mt-20 mb-10 sm:mb-14 px-4 sm:px-6 relative z-20">
        <div className="w-full bg-gradient-to-r from-[#dcebff] via-white to-[#dcebff] border border-blue-200/90 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 shadow-[0_12px_35px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-3.5 sm:gap-4 text-center sm:text-left">
            {/* Sunburst Cyan/Blue Gradient Icon */}
            <svg className="w-8 h-8 shrink-0" viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="sparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>
              <g transform="translate(16, 16)">
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                  <rect
                    key={deg}
                    x="-1.75"
                    y="-14"
                    width="3.5"
                    height="7.5"
                    rx="1.75"
                    fill="url(#sparkleGrad)"
                    transform={`rotate(${deg})`}
                  />
                ))}
                <circle r="4.5" fill="url(#sparkleGrad)" />
              </g>
            </svg>

            <p className="text-gray-900 font-bold text-sm sm:text-base leading-snug">
              Ready to join UpperCurve and take your first step towards success?
            </p>
          </div>

          <a
            href="/#brochure"
            className="whitespace-nowrap bg-[#0052FF] hover:bg-[#0043CC] text-white font-bold text-xs sm:text-[13px] tracking-wider uppercase px-6 sm:px-8 py-3 rounded-[3px] transition-all duration-200 active:scale-95 shadow-sm inline-flex items-center justify-center shrink-0"
          >
            DOWNLOAD BROCHURE
          </a>
        </div>
      </div>
    </section>
  );
}

export default LearningExperienceSection;
