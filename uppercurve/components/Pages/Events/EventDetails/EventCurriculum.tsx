"use client";

import React from "react";

const serifStyle = { fontFamily: 'Georgia, "Times New Roman", Times, serif' };

interface CurriculumDay {
  dayNumber: string;
  timeSlot: string;
  title: string;
  headerGradient: string;
  bulletColor: string;
  points: string[];
}

export function EventCurriculum() {
  const curriculum: CurriculumDay[] = [
    {
      dayNumber: "DAY 1",
      timeSlot: "11:00 AM – 12:30 PM IST",
      title: "Product Management in the Agentic AI Era",
      headerGradient: "bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600",
      bulletColor: "bg-indigo-600",
      points: [
        "What defines the AI-native Product Manager (PM 2.0).",
        "How to integrate AI into every step of the product lifecycle.",
        "AI for Opportunity Discovery: Customer Problem Discovery & Pain-Point Clustering.",
        "Hands on Product Development Lifecycle exercises.",
      ],
    },
    {
      dayNumber: "DAY 2",
      timeSlot: "11:00 AM – 12:30 PM IST",
      title: "Build AI Enabled Products from Concept to Launch",
      headerGradient: "bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-500",
      bulletColor: "bg-teal-600",
      points: [
        "AI Foundations for PMs: Understanding LLMs, embeddings, vector stores.",
        "Designing AI Features: Using JTBD and CRAFT frameworks to map problems to AI solutions.",
        "PRDs for AI Products: Writing requirements with behavior, risks, and edge cases using templates.",
        "Prototyping with AI Tools: Creating functional prototypes using Bolt.new, Framer AI, Lovable, and Opal.",
        "Metrics and Evaluation: Analyzing product usage and trends using Mixpanel AI and Amplitude AI.",
      ],
    },
  ];

  return (
    <section className="w-full bg-white py-12 sm:py-16 px-4 sm:px-6 flex justify-center border-b border-gray-100 select-none">
      <div className="w-full max-w-6xl flex flex-col items-center">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12 font-poppins">
          <span className="block text-xs sm:text-sm font-medium tracking-widest uppercase text-indigo-600 mb-2">
            CURRICULUM
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-gray-900 tracking-tight leading-tight">
            What you&apos;ll learn in 5 hours?
          </h2>
        </div>

        {/* 2 Side-by-Side Curriculum Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 w-full items-stretch">
          {curriculum.map((day, idx) => (
            <div
              key={idx}
              className="group flex flex-col rounded-3xl border border-gray-200/90 bg-white overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.03)] hover:shadow-xl hover:border-indigo-300 transition-all duration-300"
            >
              {/* Card Header with Top Gradient Banner */}
              <div className={`${day.headerGradient} p-6 sm:p-8 text-white relative overflow-hidden`}>
                {/* Subtle sheen highlight streak */}
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />

                {/* Day Badge & Time Row */}
                <div className="flex flex-wrap items-center gap-3 mb-3 font-poppins">
                  <span className="px-3 py-1 rounded-lg bg-black/25 backdrop-blur-xs text-xs sm:text-[13px] font-medium tracking-wider text-white border border-white/15">
                    {day.dayNumber}
                  </span>

                  <div className="flex items-center gap-1.5 text-xs sm:text-[13px] text-white/90 font-medium bg-black/20 backdrop-blur-xs px-3 py-1 rounded-lg border border-white/10">
                    <svg
                      className="w-3.5 h-3.5 opacity-90"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>{day.timeSlot}</span>
                  </div>
                </div>

                {/* Day Title */}
                <h3 className="text-xl sm:text-2xl font-medium text-white tracking-tight leading-snug font-poppins">
                  {day.title}
                </h3>
              </div>

              {/* Card Body with Bullet Points */}
              <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between bg-white">
                <ul className="space-y-4">
                  {day.points.map((pt, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-3 text-left">
                      <span
                        className={`w-2 h-2 rounded-full ${day.bulletColor} shrink-0 mt-2 shadow-2xs`}
                      />
                      <span
                        className="text-sm sm:text-[15px] text-gray-700 leading-relaxed font-normal"
                        style={serifStyle}
                      >
                        {pt}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Bottom subtle indicator */}
                <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-poppins font-normal">
                  <span>Interactive Live Masterclass</span>
                  <span className="font-medium text-indigo-600">Q&A Included</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default EventCurriculum;
