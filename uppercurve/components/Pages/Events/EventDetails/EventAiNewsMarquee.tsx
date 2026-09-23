"use client";

import React from "react";

const serifStyle = { fontFamily: 'Georgia, "Times New Roman", Times, serif' };

interface NewsItem {
  id: string;
  source: string;
  sourceDotColor?: string;
  headline: string;
  excerpt: string;
  badgeText: string;
  badgeBg: string;
  badgeTextColor: string;
}

export function EventAiNewsMarquee() {
  const row1News: NewsItem[] = [
    {
      id: "ora-layoff",
      source: "Tech News",
      sourceDotColor: "bg-red-500",
      headline: "Tech giants may lay off up to 30,000 employees to fund AI transition",
      excerpt: "Firms face massive shifts, potentially 20,000–30,000 roles, to fund $300B AI infrastructure and models.",
      badgeText: "ORA",
      badgeBg: "bg-red-50 border-red-200",
      badgeTextColor: "text-red-600 font-medium",
    },
    {
      id: "it-jobs-amazon",
      source: "India Today",
      sourceDotColor: "bg-red-500",
      headline: "Over 1 lakh IT jobs gone: Big tech layoffs accelerate as AI automation expands",
      excerpt: "The tech industry is witnessing a structural transformation with employees affected across legacy roles.",
      badgeText: "META",
      badgeBg: "bg-blue-50 border-blue-200",
      badgeTextColor: "text-blue-600 font-medium",
    },
    {
      id: "et-amazon",
      source: "The Economic Times",
      sourceDotColor: "bg-amber-500",
      headline: "14,000 corporate job cuts announced, up to 30,000 layoffs expected in AI restructuring",
      excerpt: "Shares shift as confirmed reports reveal corporate and cloud roles transition rapidly to AI tooling.",
      badgeText: "AWS",
      badgeBg: "bg-amber-50 border-amber-200",
      badgeTextColor: "text-amber-700 font-medium",
    },
    {
      id: "msft-ai-shift",
      source: "Bloomberg",
      sourceDotColor: "bg-emerald-500",
      headline: "Enterprise leaders replace routine software tasks with autonomous agent pipelines",
      excerpt: "Companies are prioritizing builders proficient in modern agentic architectures over traditional developers.",
      badgeText: "MSFT",
      badgeBg: "bg-emerald-50 border-emerald-200",
      badgeTextColor: "text-emerald-700 font-medium",
    },
  ];

  const row2News: NewsItem[] = [
    {
      id: "goldman-report",
      source: "India Today",
      sourceDotColor: "bg-red-500",
      headline: "Goldman Sachs warns AI push may spark new corporate layoff wave in 2026",
      excerpt: "A report predicts 2026 will bring another wave of AI-led reallocations as companies prioritise efficiency.",
      badgeText: "GS",
      badgeBg: "bg-slate-100 border-slate-200",
      badgeTextColor: "text-slate-800 font-medium",
    },
    {
      id: "fresh-layoffs",
      source: "Goodreturns",
      sourceDotColor: "bg-emerald-500",
      headline: "Tech Majors Announce Fresh Layoffs in 2026: Thousands of Jobs at Risk as AI Accelerates",
      excerpt: "Organizations are moving ahead with ongoing rounds of restructuring to reinvest in generative models.",
      badgeText: "AMZN",
      badgeBg: "bg-orange-50 border-orange-200",
      badgeTextColor: "text-orange-600 font-medium",
    },
    {
      id: "ap-news-ai",
      source: "AP News",
      sourceDotColor: "bg-rose-500",
      headline: "Corporate roles downsized as spending on artificial intelligence accelerates",
      excerpt: "Online retail and cloud giants reallocate headcounts towards AI engineers and automation specialists.",
      badgeText: "AP",
      badgeBg: "bg-gray-100 border-gray-200",
      badgeTextColor: "text-gray-700 font-medium",
    },
    {
      id: "google-ai-pivot",
      source: "Reuters",
      sourceDotColor: "bg-indigo-500",
      headline: "Software development velocity surges 3x with AI PMs and modern copilots",
      excerpt: "Product teams report unprecedented output gains by integrating autonomous agent workflows.",
      badgeText: "AI",
      badgeBg: "bg-indigo-50 border-indigo-200",
      badgeTextColor: "text-indigo-600 font-medium",
    },
  ];

  const row3News: NewsItem[] = [
    {
      id: "corp-jobs-30k",
      source: "Business Standard",
      sourceDotColor: "bg-blue-500",
      headline: "Firms cut as many as 30,000 corporate jobs in biggest shift since 2022",
      excerpt: "Major corporate reshuffle as management pivots towards autonomous generative tooling.",
      badgeText: "PR",
      badgeBg: "bg-blue-50 border-blue-200",
      badgeTextColor: "text-blue-700 font-medium",
    },
    {
      id: "citigroup-cut",
      source: "People Matters · HR News",
      sourceDotColor: "bg-cyan-500",
      headline: "Citigroup confirms 3,500 tech job layoff in global IT restructuring",
      excerpt: "The bank stated that the layoffs will roll out as part of an overhaul aimed at operational modernization.",
      badgeText: "CITI",
      badgeBg: "bg-cyan-50 border-cyan-200",
      badgeTextColor: "text-cyan-700 font-medium",
    },
    {
      id: "pinterest-ai",
      source: "CNBC",
      sourceDotColor: "bg-rose-500",
      headline: "Pinterest laying off 15% of workforce as part of AI push; reallocates capital",
      excerpt: "The company said it is reallocating resources strictly to teams focused on generative artificial intelligence.",
      badgeText: "PINS",
      badgeBg: "bg-rose-50 border-rose-200",
      badgeTextColor: "text-rose-600 font-medium",
    },
    {
      id: "forbes-upskill",
      source: "Forbes",
      sourceDotColor: "bg-emerald-500",
      headline: "The biggest career moat in 2026: Mastering AI product strategy and automation",
      excerpt: "Surveys confirm professionals who direct and orchestrate AI systems command a 40% salary premium.",
      badgeText: "F",
      badgeBg: "bg-emerald-50 border-emerald-200",
      badgeTextColor: "text-emerald-700 font-medium",
    },
  ];

  const renderCard = (item: NewsItem, idx: number) => (
    <div
      key={`${item.id}-${idx}`}
      className="bg-white border border-gray-200 hover:border-indigo-300 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all flex items-start justify-between gap-3.5 w-[320px] sm:w-[370px] shrink-0 text-left select-none"
    >
      <div className="flex-1 min-w-0">
        {/* Source Header */}
        <div className="flex items-center gap-1.5 mb-1.5 font-poppins">
          <span className={`w-1.5 h-1.5 rounded-full ${item.sourceDotColor || "bg-indigo-600"}`} />
          <span className="text-[11px] font-medium text-gray-500 truncate">
            {item.source}
          </span>
        </div>

        {/* Headline */}
        <h4 className="text-xs sm:text-[13px] font-medium text-gray-900 leading-snug line-clamp-2 mb-1.5 font-poppins">
          {item.headline}
        </h4>

        {/* Snippet (Editorial Serif Font) */}
        <p
          className="text-[11px] sm:text-xs text-gray-500 line-clamp-2 leading-relaxed font-normal"
          style={serifStyle}
        >
          {item.excerpt}
        </p>
      </div>

      {/* Right Thumbnail Badge */}
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center text-[10px] sm:text-xs tracking-wider border shrink-0 font-poppins ${item.badgeBg} ${item.badgeTextColor}`}
      >
        {item.badgeText}
      </div>
    </div>
  );

  return (
    <section className="w-full bg-white py-10 sm:py-14 px-4 sm:px-6 flex justify-center border-b border-gray-100 select-none">
      <div className="relative w-full max-w-6xl rounded-3xl border border-gray-200/90 bg-white p-6 sm:p-10 md:p-12 overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
        {/* Subtle decorative aura */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-50/50 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-emerald-50/50 blur-[100px] pointer-events-none" />

        {/* Header Block */}
        <div className="relative z-10 text-center mb-8 sm:mb-10 font-poppins">
          <span className="block text-xs sm:text-sm font-medium tracking-widest uppercase text-indigo-600 mb-2">
            AI WON&apos;T REPLACE YOU
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-gray-900 tracking-tight leading-tight max-w-2xl mx-auto">
            But professionals who use AI will outperform you.
          </h2>
        </div>

        {/* 3 Infinite Moving Marquee Rows from Right to Left */}
        <div className="relative w-full space-y-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          {/* Row 1 (Right to Left) */}
          <div
            className="flex w-max items-center gap-4 animate-marquee hover:[animation-play-state:paused] py-1"
            style={{ animationDuration: "30s" }}
          >
            {[...Array(4)].flatMap(() => row1News).map((item, idx) => renderCard(item, idx))}
          </div>

          {/* Row 2 (Right to Left, slightly different pace) */}
          <div
            className="flex w-max items-center gap-4 animate-marquee hover:[animation-play-state:paused] py-1"
            style={{ animationDuration: "26s" }}
          >
            {[...Array(4)].flatMap(() => row2News).map((item, idx) => renderCard(item, idx))}
          </div>

          {/* Row 3 (Right to Left, steady pace) */}
          <div
            className="flex w-max items-center gap-4 animate-marquee hover:[animation-play-state:paused] py-1"
            style={{ animationDuration: "34s" }}
          >
            {[...Array(4)].flatMap(() => row3News).map((item, idx) => renderCard(item, idx))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default EventAiNewsMarquee;
