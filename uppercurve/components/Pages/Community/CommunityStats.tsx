"use client";

import React from "react";

export function CommunityStats() {
  const stats = [
    {
      value: "15,000+",
      label: "Active Builders",
      sublabel: "Engineers, founders & students",
    },
    {
      value: "40+",
      label: "Live Masterclasses",
      sublabel: "Interactive hands-on workshops",
    },
    {
      value: "98.4%",
      label: "Satisfaction Rate",
      sublabel: "Rated 5 stars by community",
    },
    {
      value: "₹0 / Free",
      label: "Lifetime Access",
      sublabel: "No hidden subscription paywalls",
    },
  ];

  return (
    <section className="w-full bg-[#07112B] text-white py-14 sm:py-16 font-sans relative overflow-hidden border-y border-slate-800">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-blue-600/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
          {stats.map((stat, idx) => (
            <div key={idx} className="p-4 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 tracking-tight mb-2">
                {stat.value}
              </div>
              <div className="text-sm sm:text-base font-bold text-white mb-1">
                {stat.label}
              </div>
              <div className="text-xs text-slate-400 font-medium">
                {stat.sublabel}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CommunityStats;
