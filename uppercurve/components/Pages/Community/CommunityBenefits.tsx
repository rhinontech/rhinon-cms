"use client";

import React from "react";

export function CommunityBenefits() {
  const items = [
    {
      title: "AI Updates",
      description: "Stay current with what actually matters in AI",
      icon: (
        <svg className="w-5 h-5 text-[#0066FF]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
    },
    {
      title: "Curated Resources",
      description: "Handpicked tools, guides, and tutorials",
      icon: (
        <svg className="w-5 h-5 text-[#0066FF]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      ),
    },
    {
      title: "Session Invites",
      description: "Weekend AI masterminds and workshops",
      icon: (
        <svg className="w-5 h-5 text-[#0066FF]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      title: "Free Tools",
      description: "Access to exclusive AI tools and templates",
      icon: (
        <svg className="w-5 h-5 text-[#0066FF]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.07a4.5 4.5 0 004.486-4.486c-.118-.58-.094-1.193.07-1.743m-1.743 1.743L15 4.5m4.5 4.5L15 4.5" />
        </svg>
      ),
    },
  ];

  return (
    <section className="w-full bg-[#F8FAFC] text-gray-900 pt-16 pb-24 px-4 sm:px-6 font-sans border-t border-gray-200/70">
      <div className="w-full max-w-3xl mx-auto">
        {/* Section Heading */}
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-950 text-center tracking-tight mb-10">
          What You&apos;ll Get
        </h2>

        {/* 2x2 Clean Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-16">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-7 flex flex-col justify-start transition-all hover:border-[#0066FF]/30 hover:shadow-md shadow-xs"
            >
              {/* Icon Circle */}
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-5">
                {item.icon}
              </div>

              {/* Title */}
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 tracking-tight">
                {item.title}
              </h3>

              {/* Description */}
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Footer Privacy & Copyright */}
        <div className="text-center space-y-1.5">
          <p className="text-xs sm:text-sm text-gray-600 font-medium">
            We respect your privacy. No spam, ever.
          </p>
          <p className="text-[11px] text-gray-400">
            Staying Ahead © 2026
          </p>
        </div>
      </div>
    </section>
  );
}

export default CommunityBenefits;
