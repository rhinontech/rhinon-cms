"use client";

import React from "react";
import { AnimateWrapper, CounterNumber, TextAnimation } from "@/components/Animations";

export function StatsSection() {
  const stats = [
    {
      icon: "📖",
      iconBg: "bg-gray-100 text-gray-700",
      number: "30+",
      label: "Hands-On Exercises",
    },
    {
      icon: "📺",
      iconBg: "bg-cyan-100 text-cyan-600",
      number: "150+",
      label: "Video lessons",
    },
    {
      icon: "⏱️",
      iconBg: "bg-fuchsia-100 text-fuchsia-600",
      number: "600+",
      label: "Hours of content",
    },
    {
      icon: "🔄",
      iconBg: "bg-gray-100 text-gray-700",
      number: "∞",
      label: "Lifetime access",
    },
  ];

  return (
    <section className="py-24 max-sm:py-14 text-gray-900 font-sans antialiased ">
      <div className="flex flex-col items-center text-center">

        {/* Top TV/Monitor Icon Badge */}
        <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-md mb-6 hover:scale-105 transition-transform cursor-pointer">
          <span className="text-lg">📺</span>
        </div>

        {/* Headline */}
        <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-16">
          <TextAnimation>Your design skills,</TextAnimation> <br /><TextAnimation> sharper than before</TextAnimation >
        </h2 >

        {/* 4 Stat Cards Row */}
        <AnimateWrapper className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-1 max-sm:gap-2 items-stretch">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-[#f4f5f7] rounded-xl p-8 flex flex-col items-center justify-between text-center border border-gray-200/60 transition-all duration-300 min-h-[220px]"
            >
              {/* Icon Box */}
              <div className={`w-12 h-12 rounded-lg ${stat.iconBg} flex items-center justify-center text-xl md:text-lg shadow-inner mb-6`}>
                {stat.icon}
              </div>

              {/* Number Stat */}
              <div>
                <div className="text-5xl md:text-5xl font-black max-sm:font-bold text-gray-900 tracking-tight mb-2">
                  <CounterNumber>{stat.number}</CounterNumber>
                </div>

                {/* Subtitle Label */}
                <div className="text-xs font-semibold text-gray-500">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </AnimateWrapper>

      </div >
    </section >
  );
}

export default StatsSection;
