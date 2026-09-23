"use client";

import React from "react";

const serifStyle = { fontFamily: 'Georgia, "Times New Roman", Times, serif' };

interface Participant {
  name: string;
  initials: string;
  bgGradient: string;
  avatarUrl?: string;
  hasAudio?: boolean;
}

export function EventWhoShouldJoin() {
  const participants: Participant[] = [
    {
      name: "Sai Rakshith",
      initials: "SR",
      bgGradient: "from-slate-700 to-slate-900",
    },
    {
      name: "SAJJA SAI KARTHIK",
      initials: "SK",
      bgGradient: "from-zinc-800 to-stone-900",
    },
    {
      name: "Neha Nayan",
      initials: "NN",
      bgGradient: "from-neutral-700 to-neutral-900",
    },
    {
      name: "Ayush Thakur",
      initials: "AT",
      bgGradient: "from-slate-800 to-gray-900",
    },
    {
      name: "OMKAR GHARAT",
      initials: "OG",
      bgGradient: "from-stone-800 to-slate-900",
    },
    {
      name: "Ayush Jain",
      initials: "AJ",
      bgGradient: "from-gray-800 to-zinc-900",
    },
    {
      name: "Anirban_IITG_C21",
      initials: "AB",
      bgGradient: "from-zinc-700 to-slate-900",
    },
    {
      name: "Hithesh Cariappa",
      initials: "HC",
      bgGradient: "from-slate-700 to-zinc-900",
    },
    {
      name: "Taranpreet Singh Kalra",
      initials: "TK",
      bgGradient: "from-stone-700 to-neutral-900",
    },
    {
      name: "Aditi Sati",
      initials: "AS",
      bgGradient: "from-neutral-800 to-slate-900",
    },
  ];

  const experienceTiers = [
    {
      years: "1-3 Years",
      sub: "of experience",
      description:
        "Build your advantage early by using AI to work smarter, faster & ahead of your peers.",
    },
    {
      years: "3-9 Years",
      sub: "of experience",
      description:
        "Lead AI-powered initiatives & drive measurable business impact.",
    },
    {
      years: "10+ Years",
      sub: "of experience",
      description:
        "Drive the AI transformation. Lead Strategy, Teams & Enterprise-scale change.",
    },
  ];

  return (
    <section className="w-full bg-white py-12 sm:py-16 px-4 sm:px-6 flex justify-center border-b border-gray-100 select-none">
      <div className="w-full max-w-6xl flex flex-col items-center">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-10 font-poppins">
          <span className="block text-xs sm:text-sm font-medium tracking-widest uppercase text-indigo-600 mb-2">
            AI UPSKILLING FOR EVERYONE
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-gray-900 tracking-tight leading-tight">
            Who should join this AI PM Micro-Certification ?
          </h2>
        </div>

        {/* Main Card Container */}
        <div className="relative w-full rounded-3xl border border-gray-200/90 bg-white overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          {/* Subtle Ambient Auras */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-50/50 blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-emerald-50/40 blur-[100px] pointer-events-none" />

          {/* Top Video Conference Gallery */}
          <div className="relative w-full bg-slate-950 p-3 sm:p-5 pt-4 pb-12 sm:pb-16 overflow-hidden">
            {/* Subtle Zoom UI Bar in Top-Right */}
            <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-2">
              <span className="bg-black/60 backdrop-blur-xs text-white/80 text-[11px] font-poppins font-medium px-3 py-1 rounded-md border border-white/10 flex items-center gap-1.5 shadow-xs">
                <span>Ask to unmute</span>
                <span className="opacity-60">···</span>
              </span>
            </div>

            {/* Video Attendees Grid (2 rows x 5 cols on lg, responsive) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-2.5">
              {participants.map((person, idx) => (
                <div
                  key={idx}
                  className={`relative aspect-[4/3] rounded-xl bg-gradient-to-b ${person.bgGradient} overflow-hidden border border-white/10 flex items-center justify-center group shadow-xs`}
                >
                  {/* Faint Camera Room Background Texture */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/60 pointer-events-none" />

                  {/* Silhouette Portrait Avatar */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/80 font-poppins text-xs sm:text-sm font-medium shadow-inner group-hover:scale-105 transition-transform">
                    {person.initials}
                  </div>

                  {/* Participant Name Tag Pill */}
                  <div className="absolute bottom-2 left-2 max-w-[85%] bg-black/70 backdrop-blur-xs rounded-md px-2 py-0.5 border border-white/10 flex items-center gap-1 text-[10px] text-white/90 font-poppins font-medium truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="truncate">{person.name}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Gradient Fade to Bottom Container */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent pointer-events-none" />
          </div>

          {/* Lower 3 Experience Tiers Card */}
          <div className="relative z-10 -mt-8 sm:-mt-10 mx-3 sm:mx-6 md:mx-8 mb-4 sm:mb-6 rounded-2xl bg-white/95 backdrop-blur-md border border-gray-200/90 shadow-[0_10px_35px_rgba(0,0,0,0.06)] p-6 sm:p-8 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100 gap-6 md:gap-0">
              {experienceTiers.map((tier, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col text-center px-4 sm:px-6 ${
                    idx !== 0 ? "pt-6 md:pt-0" : ""
                  }`}
                >
                  {/* Years of Experience */}
                  <div className="mb-3">
                    <span
                      className="block text-3xl sm:text-4xl text-gray-900 font-medium tracking-tight"
                      style={serifStyle}
                    >
                      {tier.years}
                    </span>
                    <span className="block text-xs text-gray-500 font-normal font-poppins mt-0.5">
                      {tier.sub}
                    </span>
                  </div>

                  {/* Description Paragraph */}
                  <p
                    className="text-xs sm:text-sm text-gray-600 leading-relaxed font-normal max-w-xs mx-auto"
                    style={serifStyle}
                  >
                    {tier.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EventWhoShouldJoin;
