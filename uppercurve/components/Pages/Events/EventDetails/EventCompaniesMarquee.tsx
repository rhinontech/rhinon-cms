"use client";

import React from "react";

export function EventCompaniesMarquee() {
  const companies = [
    {
      id: "samsung",
      render: () => (
        <span className="font-sans font-medium tracking-[0.22em] text-lg sm:text-xl text-gray-800 hover:text-black transition-colors whitespace-nowrap">
          SAMSUNG
        </span>
      ),
    },
    {
      id: "cognizant",
      render: () => (
        <div className="flex items-center gap-1.5 hover:opacity-85 transition-opacity whitespace-nowrap">
          <svg className="w-5 h-5 text-indigo-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span className="font-sans font-medium text-lg sm:text-xl text-gray-800 lowercase tracking-tight">
            cognizant
          </span>
        </div>
      ),
    },
    {
      id: "zeta",
      render: () => (
        <span className="font-sans font-medium text-xl sm:text-2xl text-gray-800 lowercase tracking-tight hover:opacity-85 transition-opacity whitespace-nowrap">
          zeta
        </span>
      ),
    },
    {
      id: "volvo",
      render: () => (
        <div className="flex items-center gap-2 hover:opacity-85 transition-opacity whitespace-nowrap">
          <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="8" />
            <path d="M17 7l4-4m0 0h-4m4 0v4" />
          </svg>
          <span className="font-sans font-medium tracking-[0.35em] text-sm sm:text-base text-gray-800 uppercase">
            VOLVO
          </span>
        </div>
      ),
    },
    {
      id: "walmart",
      render: () => (
        <div className="flex items-center gap-1.5 hover:opacity-85 transition-opacity whitespace-nowrap">
          <span className="font-sans font-medium text-xl sm:text-2xl text-gray-800 tracking-tight">
            Walmart
          </span>
          <span className="text-amber-500 text-lg leading-none font-medium">✻</span>
        </div>
      ),
    },
    {
      id: "celigo",
      render: () => (
        <span className="font-sans font-medium text-xl text-gray-800 lowercase tracking-tight hover:opacity-85 transition-opacity whitespace-nowrap">
          celigo
        </span>
      ),
    },
    {
      id: "cardekho",
      render: () => (
        <div className="flex items-center gap-1.5 hover:opacity-85 transition-opacity whitespace-nowrap">
          <div className="w-5 h-5 rounded-full border-2 border-gray-800 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-indigo-600" />
          </div>
          <span className="font-sans font-medium text-lg sm:text-xl text-gray-800 tracking-tight">
            CarDekho
          </span>
        </div>
      ),
    },
    {
      id: "tally",
      render: () => (
        <span className="font-serif italic font-medium text-2xl text-gray-800 tracking-tight hover:opacity-85 transition-opacity whitespace-nowrap">
          Tally
        </span>
      ),
    },
    {
      id: "tatacomm",
      render: () => (
        <div className="flex flex-col items-center leading-tight hover:opacity-85 transition-opacity whitespace-nowrap">
          <span className="text-xs sm:text-sm tracking-[0.25em] font-medium text-gray-900">
            TATA
          </span>
          <span className="text-[9px] sm:text-[10px] tracking-wider text-gray-500 font-normal">
            COMMUNICATIONS
          </span>
        </div>
      ),
    },
    {
      id: "microsoft",
      render: () => (
        <div className="flex items-center gap-2 hover:opacity-85 transition-opacity whitespace-nowrap">
          <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
            <span className="bg-[#f25022] w-1.5 h-1.5" />
            <span className="bg-[#7fba00] w-1.5 h-1.5" />
            <span className="bg-[#00a4ef] w-1.5 h-1.5" />
            <span className="bg-[#ffb900] w-1.5 h-1.5" />
          </div>
          <span className="font-sans font-medium text-lg sm:text-xl text-gray-800 tracking-tight">
            Microsoft
          </span>
        </div>
      ),
    },
    {
      id: "google",
      render: () => (
        <span className="font-sans font-medium text-xl text-gray-800 tracking-tight hover:opacity-85 transition-opacity whitespace-nowrap">
          Google
        </span>
      ),
    },
    {
      id: "amazon",
      render: () => (
        <div className="flex flex-col items-center leading-none hover:opacity-85 transition-opacity whitespace-nowrap">
          <span className="font-sans font-medium text-xl text-gray-800 tracking-tight">
            amazon
          </span>
          <span className="text-amber-500 text-xs font-medium -mt-0.5">⌣</span>
        </div>
      ),
    },
  ];

  return (
    <section className="w-full bg-white py-8 sm:py-10 border-b border-gray-100 overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center">
        {/* Heading */}
        <h3 className="text-center text-sm sm:text-base md:text-lg font-medium text-gray-700 tracking-tight font-poppins mb-6 sm:mb-8">
          Learners from{" "}
          <span className="text-indigo-600 font-medium">350+</span> Companies have upskilled in{" "}
          <span className="text-gray-900 font-medium">AI</span> from us
        </h3>

        {/* Infinite Moving Marquee from right to left */}
        <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div
            className="flex w-max items-center gap-10 sm:gap-14 md:gap-16 animate-marquee hover:[animation-play-state:paused] py-2"
            style={{ animationDuration: "28s" }}
          >
            {/* Duplicate 4 times for seamless continuous right-to-left loop */}
            {[...Array(4)].flatMap(() => companies).map((comp, idx) => (
              <div
                key={idx}
                className="shrink-0 flex items-center justify-center opacity-75 hover:opacity-100 transition-opacity cursor-pointer px-2"
              >
                {comp.render()}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default EventCompaniesMarquee;
