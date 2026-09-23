"use client";

import React from "react";

export interface EventStickyBarProps {
  eventTitle?: string;
  originalPrice?: string;
  discountedPrice?: string;
  slotsLeft?: string;
  onRegisterClick?: () => void;
}

export function EventStickyBar({
  eventTitle = "2 Days AI PM Masterclass",
  originalPrice = "₹4,999",
  discountedPrice = "Free",
  slotsLeft = "30 Slots",
  onRegisterClick,
}: EventStickyBarProps) {
  const handleRegister = () => {
    if (onRegisterClick) {
      onRegisterClick();
      return;
    }
    const el = document.getElementById("register-section") || document.getElementById("hero-register");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <aside
      aria-label="Event Registration Sticky Bar"
      className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3 sm:py-3.5 flex items-center justify-between gap-4">
        {/* Left & Middle Info */}
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-x-4 sm:gap-x-6 gap-y-1 min-w-0">
          {/* Title & Final Call status */}
          <div className="flex flex-col min-w-0">
            <h3 className="text-gray-900 text-sm sm:text-base md:text-[17px] font-medium tracking-tight font-poppins truncate">
              {eventTitle}
            </h3>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-500 font-poppins mt-0.5">
              <svg
                className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>
                Final Call : Only{" "}
                <span className="text-emerald-600 font-medium">{slotsLeft}</span>{" "}
                Left!
              </span>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="hidden sm:block h-8 w-[1px] bg-gray-200 shrink-0" />

          {/* Pricing */}
          <div className="flex items-center gap-2 font-poppins shrink-0">
            <span className="text-xs sm:text-sm md:text-base text-gray-400 line-through decoration-red-500 decoration-[1.5px] font-medium">
              {originalPrice}
            </span>
            <span className="text-xs sm:text-sm md:text-base text-emerald-600 font-medium">
              {discountedPrice}
            </span>
          </div>
        </div>

        {/* Right CTA Button (UpperCurve Indigo Theme) */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={handleRegister}
            className="px-6 sm:px-8 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-medium text-xs sm:text-sm shadow-sm hover:shadow-md transition-all cursor-pointer font-poppins flex items-center justify-center whitespace-nowrap"
          >
            Register Now
          </button>
        </div>
      </div>
    </aside>
  );
}

export default EventStickyBar;
