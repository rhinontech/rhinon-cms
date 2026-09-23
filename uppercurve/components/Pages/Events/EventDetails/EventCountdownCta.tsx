"use client";

import React, { useState, useEffect } from "react";

const serifStyle = { fontFamily: 'Georgia, "Times New Roman", Times, serif' };

interface EventCountdownCtaProps {
  eventTitle?: string;
  onRegisterClick?: () => void;
}

export function EventCountdownCta({
  eventTitle = "Join AI Product Management Micro-Certification",
  onRegisterClick,
}: EventCountdownCtaProps) {
  // Live dynamic ticking countdown state
  const [timeLeft, setTimeLeft] = useState({
    days: 3,
    hours: 15,
    minutes: 39,
    seconds: 42,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  const formatUnit = (num: number) => String(num).padStart(2, "0");

  return (
    <section id="register-section" className="w-full bg-white py-14 sm:py-20 px-4 sm:px-6 flex justify-center border-b border-gray-100 select-none overflow-hidden">
      <div className="relative w-full max-w-5xl rounded-3xl border border-gray-200/90 bg-white p-8 sm:p-14 md:p-16 text-center shadow-[0_4px_35px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center overflow-hidden">
        {/* Faint Concentric Arcs / Grid Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(99,102,241,0.08)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60" />

        {/* Ambient Arched Bottom Glow Aura (matching screenshot light cone) */}
        <div className="absolute -bottom-24 inset-x-1/4 h-56 rounded-t-full bg-gradient-to-t from-indigo-200/40 via-sky-100/30 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 inset-x-1/3 h-32 rounded-t-full bg-indigo-500/10 blur-xl pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
          {/* Main Title (Editorial Serif Font) */}
          <h2
            className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-medium text-gray-900 tracking-tight leading-tight mb-4"
            style={serifStyle}
          >
            {eventTitle}
          </h2>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-gray-500 font-normal font-poppins mb-8 sm:mb-10">
            Live session starts in:
          </p>

          {/* 4 Unit Countdown Clock */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 md:gap-8 mb-10 font-poppins">
            {/* Days */}
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium text-indigo-600 tracking-tight">
                {formatUnit(timeLeft.days)}
              </span>
              <span className="text-[10px] sm:text-xs text-gray-400 font-medium tracking-widest uppercase mt-1">
                DAYS
              </span>
            </div>

            <span className="text-2xl sm:text-3xl text-gray-300 font-normal pb-4">:</span>

            {/* Hours */}
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium text-indigo-600 tracking-tight">
                {formatUnit(timeLeft.hours)}
              </span>
              <span className="text-[10px] sm:text-xs text-gray-400 font-medium tracking-widest uppercase mt-1">
                HOURS
              </span>
            </div>

            <span className="text-2xl sm:text-3xl text-gray-300 font-normal pb-4">:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium text-indigo-600 tracking-tight">
                {formatUnit(timeLeft.minutes)}
              </span>
              <span className="text-[10px] sm:text-xs text-gray-400 font-medium tracking-widest uppercase mt-1">
                MINUTES
              </span>
            </div>

            <span className="text-2xl sm:text-3xl text-gray-300 font-normal pb-4">:</span>

            {/* Seconds */}
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium text-indigo-600 tracking-tight">
                {formatUnit(timeLeft.seconds)}
              </span>
              <span className="text-[10px] sm:text-xs text-gray-400 font-medium tracking-widest uppercase mt-1">
                SECONDS
              </span>
            </div>
          </div>

          {/* Register Now CTA Button */}
          <button
            type="button"
            onClick={handleRegister}
            className="px-9 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-medium text-sm sm:text-base shadow-sm hover:shadow-md transition-all cursor-pointer font-poppins z-20"
          >
            Register Now
          </button>
        </div>
      </div>
    </section>
  );
}

export default EventCountdownCta;
