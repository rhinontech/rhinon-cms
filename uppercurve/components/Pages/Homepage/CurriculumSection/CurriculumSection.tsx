"use client";

import React, { useState } from "react";
import { TextAnimation, CounterNumber, AnimateWrapper } from "@/components/Animations";
import { PrimaryButton } from "@/components/Common";

interface AccordionModule {
  id: number;
  title: string;
  weeks: string;
  lessons: string;
  duration: string;
  topics?: { title: string; duration: string }[];
}

export function CurriculumSection() {
  const [openModuleId, setOpenModuleId] = useState<number | null>(6); // Default open 6th module as in screenshot

  const modules: AccordionModule[] = [
    {
      id: 1,
      title: "AI & Technology",
      weeks: "Cohort-based",
      lessons: "Live + hands-on",
      duration: "Evolving tracks",
      topics: [
        { title: "Applied AI Foundations", duration: "Hands-on" },
        { title: "Building with AI Tools", duration: "Project" },
        { title: "Data & Automation", duration: "Live" },
      ],
    },
    {
      id: 2,
      title: "Software & Engineering",
      weeks: "Cohort-based",
      lessons: "Project-driven",
      duration: "All levels",
      topics: [
        { title: "Modern Web Development", duration: "Project" },
        { title: "System Design Fundamentals", duration: "Live" },
        { title: "Shipping Production Code", duration: "Hands-on" },
      ],
    },
    {
      id: 3,
      title: "Product & Business",
      weeks: "Cohort-based",
      lessons: "Case-led",
      duration: "All levels",
      topics: [
        { title: "Product Thinking", duration: "Live" },
        { title: "Go-to-Market Basics", duration: "Workshop" },
        { title: "Analytics & Decision Making", duration: "Hands-on" },
      ],
    },
    {
      id: 4,
      title: "Career Accelerator",
      weeks: "Short format",
      lessons: "Live",
      duration: "Career-focused",
      topics: [
        { title: "Positioning & Portfolio", duration: "Workshop" },
        { title: "Interview Preparation", duration: "Live" },
        { title: "Personal Branding", duration: "Hands-on" },
      ],
    },
    {
      id: 5,
      title: "Fellowships",
      weeks: "Selective",
      lessons: "Mentor-led",
      duration: "Project-based",
      topics: [
        { title: "Industry Mentorship", duration: "1:1" },
        { title: "Peer Learning Circles", duration: "Community" },
        { title: "Capstone Project", duration: "Project" },
      ],
    },
    {
      id: 6,
      title: "Industry Projects",
      weeks: "Team-based",
      lessons: "Real briefs",
      duration: "Portfolio-ready",
      topics: [
        { title: "Real-world Briefs", duration: "Project" },
        { title: "Team-based Builds", duration: "Community" },
        { title: "Demo Day", duration: "Live" },
      ],
    },
  ];

  return (
    <section className=" py-20  text-white font-sans antialiased">
      <div className=" mx-auto bg-[#0a0a0c] rounded-3xl p-6 sm:p-18 border border-gray-800/80 shadow-2xl relative">

        {/* Header Title */}
        <div className="flex flex-col items-center text-center mb-14">
          <span className="bg-gray-800/90 text-gray-300 border border-gray-700/80 text-[11px] font-semibold px-3 py-1 rounded-full mb-4">
            Programs
          </span>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none">
            <TextAnimation>Explore</TextAnimation> <br /> <TextAnimation>what’s next.</TextAnimation>
          </h2>
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">

          {/* Left Column: Accordions list */}
          <AnimateWrapper className="order-2 lg:order-1 lg:col-span-7 space-y-4">
            {modules.map((mod) => {
              const isOpen = openModuleId === mod.id;
              return (
                <div
                  key={mod.id}
                  className="bg-[#1a1a1e] border border-gray-800/80 rounded-2xl overflow-hidden transition-all duration-300 shadow-md"
                >
                  <button
                    onClick={() => setOpenModuleId(isOpen ? null : mod.id)}
                    className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-gray-800/30 transition-colors"
                  >
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                        {mod.title}
                      </h3>
                      <p className="text-xs text-gray-400 font-medium">
                        {mod.weeks} • {mod.lessons} • {mod.duration}
                      </p>
                    </div>

                    <div className="w-8 h-8 rounded-lg bg-gray-800/80 text-gray-300 flex items-center justify-center font-bold text-sm">
                      {isOpen ? "−" : "+"}
                    </div>
                  </button>

                  {/* Accordion Content */}
                  {isOpen && mod.topics && (
                    <div className="px-6 pb-6 pt-2 border-t border-gray-800/60 space-y-3 animate-accordion-down overflow-hidden">
                      {mod.topics.map((topic, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-2 border-b border-gray-800/40 last:border-0 text-sm text-gray-300"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                              ✓
                            </span>
                            <span className="font-semibold text-gray-200">{topic.title}</span>
                          </div>
                          <span className="text-xs text-gray-500 font-mono">🕒 {topic.duration}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </AnimateWrapper>

          {/* Right Column: Sticky "About the course" card (sticky on desktop only) */}
          <AnimateWrapper className="order-1 lg:order-2 lg:col-span-5 lg:sticky lg:top-10 self-start">
            <div className="bg-[#e5e7eb] text-gray-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-300/80 space-y-6">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                About our programs
              </span>

              <h3 className="text-2xl sm:text-3xl font-black leading-tight text-gray-900">
                <TextAnimation>Programs that evolve with technology and the careers of tomorrow.</TextAnimation>
              </h3>

              <p className="text-sm text-gray-600 leading-relaxed font-normal">
                Cohort-based learning built around real projects, mentorship, industry
                exposure, and a community of ambitious peers. Tracks change as the
                industry does — the outcomes don’t.
              </p>

              {/* Program Pillars Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/80 col-span-2">
                  <div className="text-2xl font-extrabold text-gray-900">Learn</div>
                  <div className="text-xs text-gray-500 font-medium">practical, industry-relevant skills</div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/80">
                  <div className="text-2xl font-extrabold text-gray-900">Build</div>
                  <div className="text-xs text-gray-500 font-medium">real projects</div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/80">
                  <div className="text-2xl font-extrabold text-gray-900">Grow</div>
                  <div className="text-xs text-gray-500 font-medium">with mentors & peers</div>
                </div>
              </div>

              {/* Community CTA button */}
              <a href="#community" className="block">
                <PrimaryButton className="w-full">Join the community</PrimaryButton>
              </a>

            </div>
          </AnimateWrapper>

        </div>

      </div >
    </section >
  );
}

export default CurriculumSection;
