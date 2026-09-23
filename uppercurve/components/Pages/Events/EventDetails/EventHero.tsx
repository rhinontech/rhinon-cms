"use client";

import React from "react";

export interface EventHeroProps {
  badge?: string;
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  duration?: string;
  whatsappUrl?: string;
  onRegisterClick?: () => void;
}

export function EventHero({
  badge = "1 Weekend • 2 Live Masterclass by Industry Expert",
  title,
  description,
  startDate,
  startTime,
  duration = "5+ Hours of Live AI PM Training",
  whatsappUrl = "https://chat.whatsapp.com",
  onRegisterClick,
}: EventHeroProps) {
  const handleRegister = () => {
    if (onRegisterClick) {
      onRegisterClick();
      return;
    }
    const el = document.getElementById("register-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="w-full bg-white py-6 sm:py-10 px-4 sm:px-6 flex justify-center">
      <div className="relative w-full max-w-6xl rounded-3xl border border-gray-200/90 bg-white p-6 sm:p-10 md:p-14 overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.04)]">
        {/* Soft subtle emerald / green gradient aura in top-right corner adapted for white theme */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-100/40 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/4 -right-16 w-80 h-80 rounded-full bg-teal-50/60 blur-[110px] pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10">
          {/* Top Tag Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium mb-6 shadow-2xs font-poppins">
            <span>{badge.split("•")[0]?.trim() || "1 Weekend"}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{badge.split("•")[1]?.trim() || "2 Live Masterclass by Industry Expert"}</span>
          </div>

          {/* Main Title (font-poppins, 500 font-weight) */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[46px] font-medium text-gray-900 tracking-tight leading-tight font-poppins mb-4 max-w-4xl">
            {title}
          </h1>

          {/* Tagline / Subtitle (blog content font: Georgia serif) */}
          <p
            className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-3xl mb-8 font-normal"
            style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
          >
            {description}
          </p>

          {/* Metadata Row: Start Date, Start Time, Total Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-10 max-w-3xl pt-2">
            {/* Start Date */}
            <div className="flex items-start gap-3">
              <div className="p-1 text-emerald-600 shrink-0 mt-0.5">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <span className="block text-xs text-gray-500 font-normal">
                  Start Date
                </span>
                <span className="block text-sm sm:text-base font-medium text-gray-900 mt-0.5 font-poppins">
                  {startDate}
                </span>
              </div>
            </div>

            {/* Start Time */}
            <div className="flex items-start gap-3">
              <div className="p-1 text-emerald-600 shrink-0 mt-0.5">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <div>
                <span className="block text-xs text-gray-500 font-normal">
                  Start Time
                </span>
                <span className="block text-sm sm:text-base font-medium text-gray-900 mt-0.5 font-poppins">
                  {startTime}
                </span>
              </div>
            </div>

            {/* Total Duration */}
            <div className="flex items-start gap-3">
              <div className="p-1 text-emerald-600 shrink-0 mt-0.5">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <span className="block text-xs text-gray-500 font-normal">
                  Total Duration
                </span>
                <span className="block text-sm sm:text-base font-medium text-gray-900 mt-0.5 font-poppins">
                  {duration}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Register Now Button (UpperCurve primary color & font-medium) */}
            <button
              type="button"
              onClick={handleRegister}
              className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-medium text-sm sm:text-base shadow-sm hover:shadow-md transition-all cursor-pointer font-poppins"
            >
              Register Now
            </button>

            {/* Join WhatsApp Community Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-xl bg-[#2e7d32] hover:bg-[#256828] active:scale-[0.98] text-white font-medium text-sm sm:text-base shadow-sm hover:shadow-md inline-flex items-center gap-2.5 transition-all cursor-pointer font-poppins"
            >
              <svg
                className="w-5 h-5 fill-current shrink-0"
                viewBox="0 0 24 24"
              >
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm5.78 14.07c-.24.68-1.4 1.25-1.95 1.33-.51.08-1.18.11-3.41-.81-2.85-1.18-4.67-4.08-4.81-4.27-.14-.19-1.16-1.54-1.16-2.94 0-1.4.73-2.09.99-2.37.26-.28.58-.35.77-.35.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.82 2 .89 2.15.07.15.12.33.02.53-.1.2-.15.32-.3.49-.15.17-.32.38-.46.51-.15.15-.31.31-.13.62.18.31.8 1.32 1.72 2.14 1.18 1.05 2.17 1.37 2.48 1.52.31.15.49.13.67-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.7-.16.28.1.78.84 2.1 1.49.32.16.53.24.61.37.08.13.08.76-.16 1.44z" />
              </svg>
              <span>Join WhatsApp Community</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EventHero;
