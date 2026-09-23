"use client";

import React, { useState } from "react";
import Link from "next/link";
import { upcomingEvents, UpcomingEvent } from "../eventsData";

const EVENT_VISUALS: Record<
  string,
  {
    ribbon: string;
    posterTitle: string;
    posterSubtitle: string;
    instructorName: string;
    instructorRole: string;
    badgeText: string;
    badgeType: string;
    bgGradient: string;
    accentColor: string;
    showAvatar?: boolean;
    avatarSrc?: string;
  }
> = {
  "building-with-ai-tools": {
    ribbon: "FOR WORKING PROFESSIONALS",
    posterTitle: "Building AI Agents",
    posterSubtitle: "Your Gateway To AI Career Switch",
    instructorName: "Ankit Kumar",
    instructorRole: "AI Engineer & Mentor",
    badgeText: "FREE LIVE",
    badgeType: "Masterclass",
    bgGradient: "from-[#021338] via-[#052b82] to-[#0b4bc9]",
    accentColor: "#FACC15",
    showAvatar: true,
    avatarSrc: "/instructor/image1.avif",
  },
  // "show-your-work-vol-8": {
  //   ribbon: "COMMUNITY SHOWCASE",
  //   posterTitle: "Show Your Work",
  //   posterSubtitle: "Live Feedback From Industry Mentors",
  //   instructorName: "UpperCurve Mentors",
  //   instructorRole: "Design & Engineering",
  //   badgeText: "IN-PERSON",
  //   badgeType: "Showcase",
  //   bgGradient: "from-[#291202] via-[#753406] to-[#b8520b]",
  //   accentColor: "#FDE047",
  //   showAvatar: true,
  //   avatarSrc: "/instructor/image1.avif",
  // },
  // "48-hour-build-jam": {
  //   ribbon: "HACKATHON SPRINT",
  //   posterTitle: "48h Build Jam",
  //   posterSubtitle: "Ship A Real Product in 48 Hours",
  //   instructorName: "Builder Guild",
  //   instructorRole: "Teams & Mentors",
  //   badgeText: "ONLINE",
  //   badgeType: "Build Jam",
  //   bgGradient: "from-[#23033d] via-[#5b0e8c] to-[#991ec7]",
  //   accentColor: "#F472B6",
  //   showAvatar: false,
  // },
  // "breaking-into-tech-careers": {
  //   ribbon: "CAREER AMA",
  //   posterTitle: "Crack Tech Roles",
  //   posterSubtitle: "Unscripted Insights from Hiring Leads",
  //   instructorName: "Founders & Leads",
  //   instructorRole: "Panel Discussion",
  //   badgeText: "LIVE STREAM",
  //   badgeType: "AMA Session",
  //   bgGradient: "from-[#022036] via-[#054975] to-[#0a7dbf]",
  //   accentColor: "#38BDF8",
  //   showAvatar: false,
  // },
  // "ship-your-first-side-project": {
  //   ribbon: "ONE-DAY SPRINT",
  //   posterTitle: "Ship In 24 Hours",
  //   posterSubtitle: "From Idea to Production Before Sunset",
  //   instructorName: "Saurabh Sharma",
  //   instructorRole: "Fullstack Architect",
  //   badgeText: "IN-PERSON",
  //   badgeType: "Workshop",
  //   bgGradient: "from-[#02281a] via-[#065b3c] to-[#0b9c65]",
  //   accentColor: "#34D399",
  //   showAvatar: true,
  //   avatarSrc: "/instructor/image1.avif",
  // },
  // "uppercurve-community-meetup": {
  //   ribbon: "NETWORKING & DEMOS",
  //   posterTitle: "Builders Meetup",
  //   posterSubtitle: "Connect With Fellow Engineers & Designers",
  //   instructorName: "UpperCurve Community",
  //   instructorRole: "All Welcome",
  //   badgeText: "IN-PERSON",
  //   badgeType: "Meetup",
  //   bgGradient: "from-[#2e0214] via-[#730533] to-[#be0c52]",
  //   accentColor: "#FB7185",
  //   showAvatar: false,
  // },
};

const CATEGORIES = ["All Events", "Workshop", "Showcase", "Build Jam", "AMA", "Meetup"];

export function FeaturedMasterclass() {
  const [selectedCategory, setSelectedCategory] = useState("All Events");

  const filteredEvents =
    selectedCategory === "All Events"
      ? upcomingEvents
      : upcomingEvents.filter((event) => event.type.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <section className="w-full pb-20 pt-4 font-sans">
      {/* Header & Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Upcoming Events & Masterclasses
          </h2>
          <div className="w-20 h-1 bg-[#0066FF] mt-2.5 rounded-full" />
        </div>

        {/* Category Pills */}
        {/* <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${selectedCategory === cat
                  ? "bg-[#0066FF] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
            >
              {cat}
            </button>
          ))}
        </div> */}
      </div>

      {/* Events List */}
      <div className="space-y-6">
        {filteredEvents.map((event: UpcomingEvent) => {
          const visual = EVENT_VISUALS[event.slug] || {
            ribbon: "LIMITED SEATS",
            posterTitle: event.title,
            posterSubtitle: event.tagline,
            instructorName: "UpperCurve Mentors",
            instructorRole: "Industry Expert",
            badgeText: event.mode.toUpperCase(),
            badgeType: event.type,
            bgGradient: "from-[#021338] via-[#052b82] to-[#0b4bc9]",
            accentColor: "#FACC15",
            showAvatar: false,
          };

          return (
            <div
              key={event.slug}
              className="w-full bg-white rounded-2xl border border-gray-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col md:flex-row items-stretch transition-all duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] group"
            >
              {/* Left Side: Rich Graphical Banner */}
              <div
                className={`w-full md:w-[440px] lg:w-[480px] shrink-0 min-h-[220px] sm:min-h-[250px] relative overflow-hidden bg-gradient-to-r ${visual.bgGradient} text-white p-6 sm:p-7 flex flex-col justify-between`}
              >
                {/* Faint Grid Texture */}
                <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />

                {/* Top Logo Watermark */}
                <div className="absolute top-5 right-5 z-10 flex items-center gap-1.5 opacity-85">
                  <span className="text-[11px] font-extrabold tracking-tight [font-family:var(--font-montserrat)] text-white/90">
                    UPPER<span className="text-cyan-400">CURVE</span>
                  </span>
                </div>

                {/* Top Ribbon Tag & Poster Titles */}
                <div className="relative z-10 max-w-[280px]">
                  <div
                    style={{ backgroundColor: visual.accentColor }}
                    className="inline-block text-[#0f172a] text-[10px] sm:text-[11px] font-black px-3 py-1 rounded-sm uppercase tracking-wider shadow-sm mb-3"
                  >
                    {visual.ribbon}
                  </div>

                  <h3
                    style={{ color: visual.accentColor }}
                    className="text-2xl sm:text-3xl font-black leading-tight tracking-tight drop-shadow-sm"
                  >
                    {visual.posterTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-1 leading-snug line-clamp-2">
                    {visual.posterSubtitle}
                  </p>
                </div>

                {/* Avatar / Graphic Cutout (if available) */}
                {visual.showAvatar && visual.avatarSrc ? (
                  <div className="absolute bottom-0 right-3 sm:right-5 w-36 sm:w-44 h-48 sm:h-52 z-10 pointer-events-none overflow-hidden flex items-end justify-center">
                    <img
                      src={visual.avatarSrc}
                      alt={visual.instructorName}
                      className="w-full h-full object-cover object-top filter contrast-[1.05]"
                    />
                  </div>
                ) : (
                  <div className="absolute -bottom-8 -right-8 w-44 h-44 rounded-full bg-white/5 blur-xl pointer-events-none" />
                )}

                {/* Bottom Badge + Instructor/Host Info */}
                <div className="relative z-20 flex items-center gap-3 pt-5">
                  {/* Badge */}
                  <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-lg px-2.5 sm:px-3 py-1.5 flex items-center gap-2 shadow-sm">
                    <div className="w-5 h-5 rounded-full bg-white text-blue-900 flex items-center justify-center shrink-0">
                      {event.mode === "Online" ? (
                        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[9px] font-black uppercase tracking-wider text-white leading-none">
                        {visual.badgeText}
                      </span>
                      <span className="text-[10px] font-bold text-blue-100 leading-tight">
                        {visual.badgeType}
                      </span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-6 w-[1px] bg-white/25" />

                  {/* Instructor / Host */}
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] text-blue-200/85 font-medium leading-none">
                      {visual.instructorRole}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white mt-0.5 truncate max-w-[140px]">
                      {visual.instructorName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side: Event Details & CTA */}
              <div className="p-6 sm:p-7 flex flex-col justify-between flex-1 bg-white">
                <div>
                  {/* Top Row: Type & Availability */}
                  <div className="flex items-center justify-between gap-4 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${event.chip}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {event.type}
                      </span>
                      <span className="text-xs text-gray-500 font-medium hidden sm:inline">
                        • {event.mode}
                      </span>
                    </div>
                    <span className="text-amber-600 text-xs font-semibold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60">
                      Limited Seats Available
                    </span>
                  </div>

                  {/* Event Main Title */}
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug mb-2 group-hover:text-[#0066FF] transition-colors">
                    <Link href={`/events/${event.slug}`}>
                      {event.title}
                    </Link>
                  </h3>

                  {/* Tagline / Snippet */}
                  <p className="text-xs sm:text-sm text-gray-600 mb-5 line-clamp-2 leading-relaxed">
                    {event.tagline}
                  </p>

                  {/* Metadata Info (Date, Time, Location) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100 text-xs sm:text-sm text-gray-700 font-medium">
                    {/* Date */}
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-blue-600 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>{event.dateLabel}</span>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-blue-600 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{event.time}</span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-blue-600 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                        />
                      </svg>
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="flex items-center justify-between pt-6 mt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Registrations closing soon</span>
                  </div>

                  <Link
                    href={`/events/${event.slug}`}
                    className="bg-[#0070F3] hover:bg-[#005FE0] text-white font-bold text-xs sm:text-sm px-7 py-2.5 sm:py-3 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95 inline-flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <span>Register Now</span>
                    <svg
                      className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default FeaturedMasterclass;
