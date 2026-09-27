"use client";

import React from "react";

interface CommunityHeroProps {
  founderName?: string;
  founderTitle?: string;
}

export function CommunityHero({
  founderName = "Vaibhav Sisinty",
  founderTitle = "Founder, GrowthSchool",
}: CommunityHeroProps) {
  const scrollToForm = () => {
    const el = document.getElementById("join-form");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="w-full bg-white text-gray-900 min-h-[75vh] sm:min-h-[80vh] flex flex-col items-center justify-center text-center px-4 sm:px-6 py-16 sm:py-20 font-sans relative overflow-hidden">
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
        {/* Top Pill Badge */}
        <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold mb-8 tracking-normal shadow-2xs">
          Free · WhatsApp Community
        </div>

        {/* Main Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-gray-950 tracking-tight mb-4 [font-family:var(--font-montserrat),sans-serif]">
          Staying Ahead
        </h1>

        {/* Subheading */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 tracking-tight mb-6">
          Your unfair advantage in AI.
        </h2>

        {/* Descriptive Text */}
        <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed max-w-md mx-auto mb-4">
          Skip the noise. Get the signal. AI updates,
          <br className="hidden sm:inline" />
          {" "}tools, and live sessions straight to
        </p>

        {/* WhatsApp Brand Highlight */}
        <div className="flex items-center justify-center gap-2 text-gray-900 font-bold text-base sm:text-lg mb-8">
          <svg className="w-5 h-5 fill-[#25D366]" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
          <span>WhatsApp.</span>
        </div>

        {/* Founder / Mentor Profile Pill */}
        <div className="inline-flex items-center gap-3 p-1.5 pr-4 rounded-xl bg-white border border-gray-200/90 text-left mb-12 shadow-sm">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200/60">
            <img
              src="/instructor/image1.avif"
              alt="Ankit Kumar"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
              {founderName}
            </span>
            <span className="text-[11px] text-gray-500 font-medium leading-tight mt-0.5">
              {founderTitle}
            </span>
          </div>
        </div>

        {/* Scroll Chevron */}
        <button
          type="button"
          onClick={scrollToForm}
          aria-label="Scroll to registration form"
          className="text-gray-400 hover:text-gray-900 transition-colors cursor-pointer p-2 animate-bounce"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </button>
      </div>
    </section>
  );
}

export default CommunityHero;
