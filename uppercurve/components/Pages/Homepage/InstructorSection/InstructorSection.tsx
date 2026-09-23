"use client";
import { AnimateWrapper, TextAnimation } from "@/components/Animations";

import React from "react";

export function InstructorSection() {
  return (
    <section className="py-24 max-sm:py-14  text-gray-900 font-sans antialiased ">
      <div className=" flex flex-col items-center text-center">

        {/* Pill Badge */}
        <span className="bg-gray-200/80 border border-gray-300/60 text-gray-700 text-[11px] font-bold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wider">
          Mentorship
        </span>

        {/* Headline */}
        <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-14">
          <TextAnimation>Mentors, not just teachers</TextAnimation>
        </h2>

        {/* Grid Layout of Instructor Cards */}
        <AnimateWrapper className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch mb-16">

          {/* Left Large Photo Card */}
          <div className="md:col-span-6 bg-gray-900 rounded-3xl overflow-hidden relative shadow-xl min-h-[620px] max-sm:min-h-[500px] flex flex-col justify-end">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80"
              alt="UpperCurve mentor session"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Dark overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

            {/* Bottom White Overlay Card */}
            <div className="relative z-10 m-4 bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-gray-100 flex items-center justify-between text-left">
              <div>
                <div className="text-3xl font-black text-gray-900">1:1</div>
                <div className="text-xs font-semibold text-gray-500">Live mentor sessions</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-base">
                ✍️
              </div>
            </div>
          </div>

          {/* Right Column Cards */}
          <div className="md:col-span-6 flex flex-col gap-6">

            {/* Top Right Card: Bio + Donut Image */}
            <div className="bg-[#f4f5f7] rounded-3xl p-8 flex flex-col justify-between overflow-hidden relative shadow-sm border border-gray-200/60 min-h-[460px] text-left">
              <div className="max-w-md z-10 flex flex-col justify-between h-full">
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug mb-8">
                  <TextAnimation>Our mentors are working professionals — engineers, product leaders, founders, and builders who ship real products and hire real teams.</TextAnimation>
                </h3>

                <div>
                  <div className="text-5xl font-bold text-gray-900">Real</div>
                  <div className="text-xs font-semibold text-gray-500">experience, shared honestly</div>
                </div>
              </div>

              {/* Pink Donut Graphic image snippet on right */}
              <div className="absolute -bottom-10 -right-10 w-48 h-48 pointer-events-none">
                <img
                  src="/instructor/image1.avif"
                  alt="Instructor graphic"
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </div>
            </div>

            {/* Bottom Right Card: Lime Background */}
            <div className="bg-[#b4f461] text-gray-900 rounded-3xl p-8 flex flex-col justify-between text-left shadow-sm border border-lime-400/80 min-h-[160px]">
              <p className="text-md sm:text-md font-semibold leading-relaxed text-gray-950 mb-4">
                Mentors here give the advice they wish they’d gotten earlier: honest, practical, and specific to your goals.
              </p>

              <div>
                <div className="text-5xl font-bold text-gray-950">Zero</div>
                <div className="text-xs font-bold text-gray-800">fluff. Just what works.</div>
              </div>
            </div>

          </div>

        </AnimateWrapper>

      </div >
    </section >
  );
}

export default InstructorSection;
