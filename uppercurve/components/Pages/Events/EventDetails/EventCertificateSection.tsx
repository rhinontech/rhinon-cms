"use client";

import React from "react";

const serifStyle = { fontFamily: 'Georgia, "Times New Roman", Times, serif' };

export function EventCertificateSection() {
  return (
    <section className="w-full bg-white py-14 sm:py-20 px-4 sm:px-6 flex justify-center border-b border-gray-100 select-none overflow-hidden">
      <div className="w-full max-w-5xl flex flex-col items-center">
        {/* Laurel Wreath Heading Header */}
        <div className="flex items-center justify-center gap-4 sm:gap-8 mb-12 sm:mb-16">
          {/* Left Laurel Wreath SVG */}
          <svg
            className="w-12 h-20 sm:w-16 sm:h-28 text-gray-300 shrink-0 transform -scale-x-100 drop-shadow-xs"
            viewBox="0 0 100 160"
            fill="currentColor"
          >
            <path d="M50 150 C 40 120, 20 80, 50 10 C 48 20, 35 40, 42 70 C 45 85, 30 110, 50 150 Z" opacity="0.3" />
            <path d="M48 20 C 42 22, 36 28, 38 36 C 42 34, 48 30, 48 20 Z" />
            <path d="M52 30 C 58 32, 64 38, 62 46 C 58 44, 52 40, 52 30 Z" />
            <path d="M40 45 C 32 48, 26 56, 28 66 C 34 63, 40 58, 40 45 Z" />
            <path d="M55 55 C 63 58, 69 66, 67 76 C 61 73, 55 68, 55 55 Z" />
            <path d="M36 75 C 26 79, 20 89, 23 100 C 30 96, 37 90, 36 75 Z" />
            <path d="M58 85 C 68 89, 74 99, 71 110 C 64 106, 57 100, 58 85 Z" />
            <path d="M34 110 C 24 115, 18 126, 22 137 C 29 132, 36 125, 34 110 Z" />
            <path d="M60 118 C 70 123, 76 133, 72 144 C 65 139, 58 132, 60 118 Z" />
          </svg>

          {/* Central Title */}
          <div className="text-center font-poppins">
            <span className="block text-2xl sm:text-3xl md:text-4xl text-gray-900 font-medium tracking-tight leading-tight">
              Earn your
            </span>
            <span
              className="block text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-medium tracking-tight text-indigo-600 my-1 sm:my-1.5"
              style={serifStyle}
            >
              Certificate
            </span>
            <span className="block text-2xl sm:text-3xl md:text-4xl text-gray-900 font-medium tracking-tight leading-tight">
              of Participation
            </span>
          </div>

          {/* Right Laurel Wreath SVG */}
          <svg
            className="w-12 h-20 sm:w-16 sm:h-28 text-gray-300 shrink-0 drop-shadow-xs"
            viewBox="0 0 100 160"
            fill="currentColor"
          >
            <path d="M50 150 C 40 120, 20 80, 50 10 C 48 20, 35 40, 42 70 C 45 85, 30 110, 50 150 Z" opacity="0.3" />
            <path d="M48 20 C 42 22, 36 28, 38 36 C 42 34, 48 30, 48 20 Z" />
            <path d="M52 30 C 58 32, 64 38, 62 46 C 58 44, 52 40, 52 30 Z" />
            <path d="M40 45 C 32 48, 26 56, 28 66 C 34 63, 40 58, 40 45 Z" />
            <path d="M55 55 C 63 58, 69 66, 67 76 C 61 73, 55 68, 55 55 Z" />
            <path d="M36 75 C 26 79, 20 89, 23 100 C 30 96, 37 90, 36 75 Z" />
            <path d="M58 85 C 68 89, 74 99, 71 110 C 64 106, 57 100, 58 85 Z" />
            <path d="M34 110 C 24 115, 18 126, 22 137 C 29 132, 36 125, 34 110 Z" />
            <path d="M60 118 C 70 123, 76 133, 72 144 C 65 139, 58 132, 60 118 Z" />
          </svg>
        </div>

        {/* Certificate Card Mockup */}
        <div className="relative w-full max-w-3xl rounded-3xl border-4 border-indigo-950/20 bg-slate-950 shadow-[0_20px_60px_rgba(79,70,229,0.18)] overflow-hidden flex flex-col md:flex-row items-stretch">
          {/* Subtle Outer Neon Aura */}
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-blue-500/10 to-indigo-500/20 blur-xl pointer-events-none" />

          {/* Left Half: Certificate Details */}
          <div className="relative z-10 w-full md:w-[55%] p-6 sm:p-9 bg-[#080b0f] text-white flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10">
            {/* Top Logo matching header navbar */}
            <div>
              <div className="flex items-center gap-2.5 mb-8">
                <img
                  src="/uppercurve_logo_nav.png"
                  alt="UpperCurve logo"
                  className="h-6 sm:h-7 w-auto"
                />
                <span className="text-base sm:text-lg tracking-tight font-medium [font-family:var(--font-montserrat)]">
                  <span className="text-white">UPPER</span>
                  <span className="text-indigo-400">CURVE</span>
                </span>
              </div>

              {/* Title with Vertical Line */}
              <div className="pl-4 border-l-2 border-indigo-500 mb-8">
                <h4 className="text-lg sm:text-xl font-medium tracking-wide uppercase text-white font-poppins leading-tight">
                  Certificate
                </h4>
                <p className="text-xs sm:text-sm font-normal text-gray-400 tracking-wider uppercase font-poppins mt-0.5">
                  of Participation
                </p>
              </div>

              {/* Recipient */}
              <div className="mb-6">
                <span className="block text-[11px] text-gray-400 font-normal font-poppins mb-1">
                  This certification is presented to
                </span>
                <span className="block text-xl sm:text-2xl font-medium text-white tracking-tight font-poppins">
                  Himanshu Singh
                </span>
              </div>
            </div>

            {/* Bottom Metadata & Signature */}
            <div className="pt-6 border-t border-white/10 flex items-end justify-between gap-4 font-poppins text-left">
              <div>
                <span className="block text-[11px] font-medium text-white">
                  06 JANUARY 2026
                </span>
                <span className="block text-[9px] uppercase tracking-wider text-gray-400">
                  DATE OF ISSUE
                </span>
                <span className="block text-[10px] text-gray-500 mt-2 font-mono">
                  CSHF198T
                </span>
                <span className="block text-[9px] uppercase tracking-wider text-gray-500">
                  CERTIFICATE ID
                </span>
              </div>

              <div className="text-center">
                <div className="font-serif italic text-sm text-indigo-300 leading-none mb-1">
                  Ceolauf
                </div>
                <div className="w-16 h-[1px] bg-white/20 mx-auto mb-1" />
                <span className="block text-[9px] font-medium uppercase tracking-wider text-gray-400">
                  DIRECTOR
                </span>
                <span className="block text-[8px] uppercase tracking-wider text-gray-500">
                  UPPERCURVE
                </span>
              </div>
            </div>
          </div>

          {/* Right Half: Royal Blue Ribbon & Program Badge */}
          <div className="relative z-10 w-full md:w-[45%] p-6 sm:p-9 bg-gradient-to-br from-[#0c2363] via-[#091a48] to-[#040e28] text-white flex flex-col items-center justify-between text-center overflow-hidden">
            {/* Ambient Radial Spotlight */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent pointer-events-none" />

            {/* Top Star */}
            <div className="relative z-10 mb-4">
              <span className="text-blue-300 text-sm leading-none">★</span>
              <p className="text-xs text-blue-200/80 font-normal font-poppins mt-2">
                Successful participation of
              </p>
            </div>

            {/* Program Name with Laurel Wreath Accent */}
            <div className="relative z-10 my-4 py-2 px-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="block text-sm sm:text-base font-medium text-white font-poppins leading-snug">
                AI Product Management
              </span>
              <span className="block text-xs text-blue-300 font-normal font-poppins mt-0.5">
                Micro-Certification
              </span>
            </div>

            {/* Recognition Text */}
            <div className="relative z-10 my-3">
              <p
                className="text-[11px] sm:text-xs text-blue-100/75 leading-relaxed font-normal max-w-xs mx-auto"
                style={serifStyle}
              >
                In Recognition of their participation for demonstrating exceptional commitment during the &quot;2 Days AI Product Management Micro-Certification&quot;.
              </p>
            </div>

            {/* Official Wax Seal Ribbon Badge with UpperCurve emblem */}
            <div className="relative z-10 mt-4 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 border-2 border-blue-300/40 shadow-lg flex items-center justify-center p-3 shadow-blue-500/30">
                <img
                  src="/uppercurve_logo_nav.png"
                  alt="UpperCurve seal"
                  className="w-full h-full object-contain filter brightness-200"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EventCertificateSection;
