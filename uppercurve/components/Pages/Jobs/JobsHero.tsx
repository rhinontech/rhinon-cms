"use client";

import React, { useMemo } from "react";

interface JobsHeroProps {
  title?: string;
  subtitle?: string;
  jobCount?: number | string;
  updatedDate?: string;
}

export function JobsHero({
  title = "Curated Jobs",
  subtitle = "Discover exclusive opportunities curated by UpperCurve",
  jobCount = "8676",
  updatedDate,
}: JobsHeroProps) {
  // Format current date if not provided (e.g. "September 23, 2026")
  const formattedDate = useMemo(() => {
    if (updatedDate) return updatedDate;
    try {
      const now = new Date();
      return now.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "September 23, 2026";
    }
  }, [updatedDate]);

  return (
    <section className="relative w-full min-h-[460px] sm:min-h-[520px] md:min-h-[560px] bg-white flex items-center justify-center overflow-hidden select-none border-b border-gray-100">
      {/* Background Dot Texture */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#e2e8f0_2px,transparent_2px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_30%,transparent_100%)] opacity-60" />

      {/* ================= LEFT WAVY GLOW ACCENT (LIGHT THEME) ================= */}
      <div className="absolute left-0 top-0 bottom-0 w-[140px] sm:w-[220px] md:w-[300px] pointer-events-none z-10">
        {/* Soft glowing ambient light behind the scalloped notches */}
        <div className="absolute -left-14 top-[10%] w-52 h-52 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute -left-16 top-[38%] w-60 h-60 rounded-full bg-indigo-300/40 blur-[80px]" />
        <div className="absolute -left-14 top-[66%] w-52 h-52 rounded-full bg-purple-200/40 blur-3xl" />

        {/* Left Scalloped Wave SVG */}
        <svg
          viewBox="0 0 180 600"
          preserveAspectRatio="none"
          className="w-full h-full drop-shadow-[0_10px_25px_rgba(99,102,241,0.12)]"
        >
          <defs>
            <linearGradient id="leftLightStrokeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="45%" stopColor="#6366f1" />
              <stop offset="80%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>

            <filter id="leftSoftGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Glowing gradient rim */}
          <path
            d="M 0,0 
               C 70,25 145,60 145,115
               C 145,170 70,185 25,215
               C 80,245 155,275 155,330
               C 155,385 75,405 25,430
               C 70,455 140,490 140,545
               C 140,580 80,595 0,600"
            fill="none"
            stroke="url(#leftLightStrokeGlow)"
            strokeWidth="5"
            opacity="0.75"
            filter="url(#leftSoftGlow)"
          />

          {/* Crisp highlight line */}
          <path
            d="M 0,0 
               C 70,25 145,60 145,115
               C 145,170 70,185 25,215
               C 80,245 155,275 155,330
               C 155,385 75,405 25,430
               C 70,455 140,490 140,545
               C 140,580 80,595 0,600"
            fill="none"
            stroke="url(#leftLightStrokeGlow)"
            strokeWidth="2"
          />

          {/* Pure White interior fill */}
          <path
            d="M 0,0 
               C 70,25 145,60 145,115
               C 145,170 70,185 25,215
               C 80,245 155,275 155,330
               C 155,385 75,405 25,430
               C 70,455 140,490 140,545
               C 140,580 80,595 0,600
               L 0,600 Z"
            fill="#ffffff"
          />
        </svg>
      </div>

      {/* ================= RIGHT WAVY GLOW ACCENT (LIGHT THEME) ================= */}
      <div className="absolute right-0 top-0 bottom-0 w-[140px] sm:w-[220px] md:w-[300px] pointer-events-none z-10">
        {/* Soft glowing ambient light behind the scalloped notches */}
        <div className="absolute -right-14 top-[10%] w-52 h-52 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute -right-16 top-[38%] w-60 h-60 rounded-full bg-indigo-300/40 blur-[80px]" />
        <div className="absolute -right-14 top-[66%] w-52 h-52 rounded-full bg-purple-200/40 blur-3xl" />

        {/* Right Scalloped Wave SVG (Mirrored) */}
        <svg
          viewBox="0 0 180 600"
          preserveAspectRatio="none"
          className="w-full h-full scale-x-[-1] drop-shadow-[0_10px_25px_rgba(99,102,241,0.12)]"
        >
          <defs>
            <linearGradient id="rightLightStrokeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="45%" stopColor="#6366f1" />
              <stop offset="80%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>

            <filter id="rightSoftGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Glowing gradient rim */}
          <path
            d="M 0,0 
               C 70,25 145,60 145,115
               C 145,170 70,185 25,215
               C 80,245 155,275 155,330
               C 155,385 75,405 25,430
               C 70,455 140,490 140,545
               C 140,580 80,595 0,600"
            fill="none"
            stroke="url(#rightLightStrokeGlow)"
            strokeWidth="5"
            opacity="0.75"
            filter="url(#rightSoftGlow)"
          />

          {/* Crisp highlight line */}
          <path
            d="M 0,0 
               C 70,25 145,60 145,115
               C 145,170 70,185 25,215
               C 80,245 155,275 155,330
               C 155,385 75,405 25,430
               C 70,455 140,490 140,545
               C 140,580 80,595 0,600"
            fill="none"
            stroke="url(#rightLightStrokeGlow)"
            strokeWidth="2"
          />

          {/* Pure White interior fill */}
          <path
            d="M 0,0 
               C 70,25 145,60 145,115
               C 145,170 70,185 25,215
               C 80,245 155,275 155,330
               C 155,385 75,405 25,430
               C 70,455 140,490 140,545
               C 140,580 80,595 0,600
               L 0,600 Z"
            fill="#ffffff"
          />
        </svg>
      </div>

      {/* ================= CENTRAL CONTENT ================= */}
      <div className="relative z-20 max-w-4xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        {/* Main Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-bold text-gray-900 tracking-[-0.03em] leading-tight font-poppins">
          {title}
        </h1>

        {/* Subtitle */}
        <p className="mt-3.5 sm:mt-4 text-sm sm:text-base md:text-lg text-gray-500 font-normal max-w-2xl leading-relaxed">
          {subtitle}
        </p>

        {/* Updated Badge */}
        <div className="mt-6 sm:mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-gray-200/90 shadow-sm hover:shadow-md transition-all">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs sm:text-sm text-gray-600 font-medium">
            Updated on {formattedDate}
          </span>
          <span className="text-gray-300 font-medium text-xs sm:text-sm">•</span>
          <span className="text-xs sm:text-sm text-indigo-600 font-bold tracking-tight">
            {typeof jobCount === "number" ? jobCount.toLocaleString() : jobCount} jobs available
          </span>
        </div>
      </div>
    </section>
  );
}

export default JobsHero;
