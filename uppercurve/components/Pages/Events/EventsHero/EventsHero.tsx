"use client";

import React from "react";

export function EventsHero() {
  return (
    <section className="relative w-full overflow-hidden bg-white text-[#0f172a] font-sans py-20 sm:py-28 lg:py-36 px-4 sm:px-6">
      {/* Soft Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] bg-blue-50/60 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container with Floating Tech Cards surrounding Headline */}
      <div className="relative max-w-5xl mx-auto flex items-center justify-center min-h-[260px] sm:min-h-[300px]">
        {/* ================= LEFT FLOATING CARDS ================= */}

        {/* 1. Database Icon (Top-Left) */}
        <div className="absolute left-8 sm:left-24 lg:left-36 top-0 sm:top-2 -translate-y-1/2 z-20 animate-float-slow">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white shadow-[0_10px_25px_rgba(0,0,0,0.06)] border border-gray-100 flex items-center justify-center hover:scale-105 transition-transform duration-200">
            {/* Database SVG */}
            <svg
              className="w-6 h-6 text-[#E25A24]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <ellipse cx="12" cy="5" rx="8" ry="2.8" />
              <path d="M20 12c0 1.55-3.58 2.8-8 2.8s-8-1.25-8-2.8" />
              <path d="M4 5v14c0 1.55 3.58 2.8 8 2.8s8-1.25 8-2.8V5" />
            </svg>
          </div>
        </div>

        {/* 2. React Atom Icon (Far-Left Center) */}
        <div className="absolute left-0 sm:left-6 lg:left-14 top-1/2 -translate-y-1/2 z-20 animate-float-delayed">
          <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-white shadow-[0_12px_30px_rgba(0,0,0,0.07)] border border-gray-100 flex items-center justify-center hover:scale-105 transition-transform duration-200">
            {/* React SVG */}
            <svg
              className="w-8 h-8 text-[#00D8FF]"
              viewBox="-11.5 -10.23174 23 20.46348"
              fill="none"
            >
              <circle cx="0" cy="0" r="2.05" fill="#00D8FF" />
              <g stroke="#00D8FF" strokeWidth="1" fill="none">
                <ellipse rx="11" ry="4.2" />
                <ellipse rx="11" ry="4.2" transform="rotate(60)" />
                <ellipse rx="11" ry="4.2" transform="rotate(120)" />
              </g>
            </svg>
          </div>
        </div>

        {/* 3. MongoDB Leaf Icon (Bottom-Left) */}
        <div className="absolute left-8 sm:left-24 lg:left-36 bottom-0 sm:bottom-2 translate-y-1/2 z-20 animate-float-reverse">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white shadow-[0_10px_25px_rgba(0,0,0,0.06)] border border-gray-100 flex items-center justify-center hover:scale-105 transition-transform duration-200">
            {/* Leaf SVG */}
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C12 2 6 9.5 6 15.5C6 18.8 8.7 21.5 12 21.5C15.3 21.5 18 18.8 18 15.5C18 9.5 12 2 12 2Z"
                fill="#13AA52"
              />
              <path
                d="M12 2V21.5C12 21.5 12 19 12 15.5C12 9.5 12 2 12 2Z"
                fill="#116149"
              />
            </svg>
          </div>
        </div>

        {/* ================= CENTER HEADLINE ================= */}
        <div className="relative z-10 text-center max-w-xl sm:max-w-4xl px-6 sm:px-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-normal text-[#1E293B] tracking-tight leading-[1.38]">
            Take a step forward to ace in your <br />
            <span className="font-extrabold text-[#0B1B3D]">Tech Career</span>{" "}
            by learning from <br />
            industry experts in{" "}
            <span className="inline-block bg-[#edf4ff] text-[#0B1B3D] font-extrabold px-2.5 py-0.5 rounded-md shadow-xs">
              our Free Events
            </span>
          </h1>
        </div>

        {/* ================= RIGHT FLOATING CARDS ================= */}

        {/* 4. HTML5 Shield Icon (Top-Right) */}
        <div className="absolute right-8 sm:right-24 lg:right-36 top-0 sm:top-2 -translate-y-1/2 z-20 animate-float-delayed">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white shadow-[0_10px_25px_rgba(0,0,0,0.06)] border border-gray-100 flex items-center justify-center hover:scale-105 transition-transform duration-200">
            {/* HTML5 SVG */}
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M4 2L5.5 19.5L12 22L18.5 19.5L20 2H4Z" fill="#E44D26" />
              <path d="M12 3.5V20.3L17.2 18.2L18.4 3.5H12Z" fill="#F16529" />
              <path
                d="M8 7H16L15.7 10.5H10.5L10.7 13H15.5L15.1 17L12 17.9L8.9 17L8.7 14.5H10.4L10.5 15.6L12 16L13.5 15.6L13.7 13.5H8.4L8 7Z"
                fill="white"
              />
            </svg>
          </div>
        </div>

        {/* 5. C++ Icon (Far-Right Center) */}
        <div className="absolute right-0 sm:right-6 lg:right-14 top-1/2 -translate-y-1/2 z-20 animate-float-slow">
          <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-white shadow-[0_12px_30px_rgba(0,0,0,0.07)] border border-gray-100 flex items-center justify-center hover:scale-105 transition-transform duration-200">
            {/* C++ Hexagon SVG */}
            <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
              <path
                d="M16 2L28 9V23L16 30L4 23V9L16 2Z"
                fill="#00599C"
              />
              <path
                d="M16 11C13.24 11 11 13.24 11 16C11 18.76 13.24 21 16 21C17.65 21 19.1 20.19 20 18.94L18.4 17.34C17.85 18.15 16.98 18.7 16 18.7C14.51 18.7 13.3 17.49 13.3 16C13.3 14.51 14.51 13.3 16 13.3C16.98 13.3 17.85 13.85 18.4 14.66L20 13.06C19.1 11.81 17.65 11 16 11Z"
                fill="white"
              />
              <path
                d="M21.5 14H23V15.5H24.5V16.5H23V18H21.5V16.5H20V15.5H21.5V14ZM25.5 14H27V15.5H28.5V16.5H27V18H25.5V16.5H24V15.5H25.5V14Z"
                fill="white"
              />
            </svg>
          </div>
        </div>

        {/* 6. JavaScript JS Icon (Bottom-Right) */}
        <div className="absolute right-8 sm:right-24 lg:right-36 bottom-0 sm:bottom-2 translate-y-1/2 z-20 animate-float-reverse">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white shadow-[0_10px_25px_rgba(0,0,0,0.06)] border border-gray-100 flex items-center justify-center hover:scale-105 transition-transform duration-200">
            {/* JS Badge */}
            <div className="w-7 h-7 bg-[#F7DF1E] rounded-md flex items-end justify-end p-0.5 shadow-2xs">
              <span className="text-[#000000] font-black text-xs leading-none tracking-tighter">
                JS
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EventsHero;
