"use client";

import React from "react";
import Link from "next/link";
import { UpcomingEvent, upcomingEvents } from "../eventsData";
import SaveSeatForm from "./SaveSeatForm";
import TopicFAQSection from "../../Homepage/TopicFAQSection/TopicFAQSection";

function FactRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2.5 text-gray-500 text-xs font-semibold">
        <span className="text-blue-600 shrink-0">{icon}</span>
        <span>{label}</span>
      </div>
      <span className="text-xs sm:text-sm font-bold text-gray-900 text-right">
        {value}
      </span>
    </div>
  );
}

export function EventDetails({ event }: { event: UpcomingEvent }) {
  const moreEvents = upcomingEvents.filter((e) => e.slug !== event.slug).slice(0, 3);

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center font-sans">
      {/* Top Breadcrumb Bar */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-600 hover:text-[#0066FF] transition-colors bg-white px-3.5 py-1.5 rounded-full border border-gray-200/80 shadow-2xs group"
        >
          <svg
            className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span>Back to All Events</span>
        </Link>
      </div>

      {/* Hero Masterclass Banner */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 mb-8">
        <div className="w-full rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-gray-200/80 bg-gradient-to-r from-[#021338] via-[#052b82] to-[#0b4bc9] text-white relative min-h-[320px] sm:min-h-[360px] p-6 sm:p-10 flex flex-col justify-between">
          {/* Faint Grid Texture */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />

          {/* UpperCurve Watermark */}
          <div className="absolute top-6 right-6 z-10 flex items-center gap-1.5 opacity-85">
            <span className="text-xs font-extrabold tracking-tight [font-family:var(--font-montserrat)] text-white/90">
              UPPER<span className="text-cyan-400">CURVE</span>
            </span>
          </div>

          {/* Top Tag & Main Heading */}
          <div className="relative z-10 max-w-2xl">
            <div className="inline-block bg-[#FACC15] text-[#0f172a] text-[10px] sm:text-[11px] font-black px-3.5 py-1 rounded-sm uppercase tracking-wider shadow-sm mb-4">
              For Working Professionals
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight mb-3">
              {event.title}
            </h1>

            <p className="text-sm sm:text-base text-blue-100/90 font-medium leading-relaxed max-w-xl">
              {event.tagline}
            </p>
          </div>

          {/* Instructor Graphic Cutout */}
          <div className="hidden md:flex absolute bottom-0 right-10 lg:right-16 w-52 lg:w-64 h-64 lg:h-76 z-10 pointer-events-none overflow-hidden items-end justify-center">
            <img
              src="/instructor/image1.avif"
              alt="Ankit Kumar"
              className="w-full h-full object-cover object-top filter contrast-[1.05]"
            />
          </div>

          {/* Bottom Live Badges & Speaker Details */}
          <div className="relative z-20 flex flex-wrap items-center gap-4 pt-8 mt-4 border-t border-white/15">
            <div className="bg-[#0055FF] border border-blue-400/40 rounded-xl px-3.5 py-2 flex items-center gap-2.5 shadow-sm">
              <div className="w-5 h-5 rounded-full bg-white text-[#0055FF] flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
                </svg>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-black uppercase tracking-wider text-white leading-none">
                  FREE LIVE
                </span>
                <span className="text-[11px] font-bold text-blue-100 leading-tight">
                  Masterclass
                </span>
              </div>
            </div>

            <div className="h-6 w-[1px] bg-white/20 hidden sm:block" />

            <div className="flex flex-col text-left">
              <span className="text-[10px] text-blue-200/85 font-medium leading-none">
                Taught By
              </span>
              <span className="text-sm font-bold text-white mt-0.5">
                Ankit Kumar <span className="text-xs text-blue-200 font-normal">· AI Engineer & Mentor</span>
              </span>
            </div>

            <div className="h-6 w-[1px] bg-white/20 hidden lg:block" />

            <div className="flex items-center gap-4 text-xs text-blue-100 font-medium">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-cyan-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {event.dateLabel}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-cyan-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {event.time}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Details & Agenda (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Key Takeaways Card */}
            <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center font-bold">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                    What You&apos;ll Build & Take Home
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">
                    Hands-on practical outcomes from this interactive session
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {event.takeaways.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#F8FAFC] border border-gray-100 hover:border-blue-200 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#0066FF] text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span className="text-sm font-semibold text-gray-800 leading-snug">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Agenda Timeline Card */}
            <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                    Session Agenda & Schedule
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">
                    Step-by-step interactive breakdown
                  </p>
                </div>
              </div>

              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-blue-100">
                {event.agenda.map((slot, idx) => (
                  <div key={idx} className="relative group">
                    {/* Timeline Node */}
                    <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-[#0066FF] flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                      <div className="w-2 h-2 rounded-full bg-[#0066FF]" />
                    </div>

                    <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4 sm:p-5 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all">
                      <div className="inline-block bg-blue-50 text-[#0066FF] text-xs font-bold px-2.5 py-1 rounded-md mb-2">
                        {slot.time}
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
                        {slot.item}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* About the Masterclass Card */}
            <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-sm">
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mb-4">
                About this Session
              </h3>
              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                {event.about.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>

            {/* Meet Your Mentor Card */}
            <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                  Instructor Spotlight
                </span>
                <span className="text-xs font-bold text-gray-400">Live Mentorship</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-blue-100 shadow-md shrink-0 bg-blue-50">
                  <img
                    src="/instructor/image1.avif"
                    alt="Ankit Kumar"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h4 className="text-xl font-black text-gray-900">Ankit Kumar</h4>
                  <p className="text-xs sm:text-sm font-semibold text-blue-600 mb-2">
                    Lead AI Architect & UpperCurve Mentor
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
                    Experienced software engineer with extensive background building production-grade autonomous agent workflows, RAG pipelines, and high-throughput systems. Mentored over 2,000+ engineers making their transition into modern AI tooling.
                  </p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                    <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                      Ex-Tech Lead
                    </span>
                    <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                      2,000+ Mentees
                    </span>
                    <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                      4.9/5 Rating
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Prerequisites */}
            <div className="bg-blue-50/60 rounded-3xl border border-blue-100 p-6 sm:p-8">
              <h4 className="text-base sm:text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                Who is this session for?
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-700 font-medium">
                <li className="flex items-center gap-2">
                  <span className="text-blue-600 font-bold">•</span> Working professionals looking to level up with modern AI tooling
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600 font-bold">•</span> Developers who want to build and ship real agentic workflows
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600 font-bold">•</span> No heavy math or machine learning degree required — bring your curiosity & laptop
                </li>
              </ul>
            </div>

          </div>

          {/* Right Column: Sticky Registration Card (5 cols on lg) */}
          <div className="lg:col-span-5 lg:sticky lg:top-8 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-200/90 shadow-[0_10px_35px_rgba(0,0,0,0.06)] p-6 sm:p-8">
              
              {/* Urgency Badge */}
              <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-gray-100">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Limited Seats Available
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  100% Free
                </span>
              </div>

              {/* Title & Sub */}
              <div className="mb-5">
                <h3 className="text-xl font-black text-gray-900 tracking-tight leading-snug">
                  Reserve Your Spot Now
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Instant Zoom link & calendar reminder sent to your email.
                </p>
              </div>

              {/* Event Facts */}
              <div className="bg-gray-50/80 rounded-2xl p-4 mb-5 border border-gray-100">
                <FactRow
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  }
                  label="Date"
                  value={event.dateLabel}
                />
                <FactRow
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  }
                  label="Time"
                  value={event.time}
                />
                <FactRow
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  }
                  label="Mode"
                  value={event.location}
                />
                <FactRow
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                    </svg>
                  }
                  label="Certificate"
                  value="Included (Free)"
                />
              </div>

              {/* Form Component */}
              <SaveSeatForm eventTitle={event.title} />
            </div>

            {/* Social Proof Mini Card */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
              <div className="flex -space-x-2 overflow-hidden shrink-0">
                <span className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                  AK
                </span>
                <span className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                  PS
                </span>
                <span className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center">
                  RJ
                </span>
              </div>
              <div className="text-xs text-gray-600 font-medium leading-tight">
                <span className="font-bold text-gray-900">5,000+ builders</span> have attended UpperCurve masterclasses.
              </div>
            </div>
          </div>

        </div>

        {/* More Events Section (if available) */}
        {moreEvents.length > 0 && (
          <div className="mt-20 pt-10 border-t border-gray-200/80">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  Explore More Masterclasses
                </h2>
                <div className="w-16 h-1 bg-[#0066FF] mt-2 rounded-full" />
              </div>
              <Link
                href="/events"
                className="text-xs sm:text-sm font-bold text-[#0066FF] hover:underline inline-flex items-center gap-1"
              >
                <span>View all</span>
                <span>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {moreEvents.map((other) => (
                <Link
                  key={other.slug}
                  href={`/events/${other.slug}`}
                  className="group bg-white rounded-2xl border border-gray-200/80 hover:border-[#0066FF]/40 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`${other.chip} border text-[10px] font-bold px-2.5 py-0.5 rounded-full`}>
                        {other.type}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-400">
                        {other.dateLabel}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-gray-900 leading-snug group-hover:text-[#0066FF] transition-colors mb-2">
                      {other.title}
                    </h4>

                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {other.tagline}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#0066FF]">
                    <span>View details</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FAQ Section at bottom */}
      <div className="w-full border-t border-gray-200/80 bg-white">
        <TopicFAQSection />
      </div>
    </main>
  );
}

export default EventDetails;
