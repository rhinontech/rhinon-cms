import React from "react";
import Link from "next/link";
import { TextAnimation, AnimateWrapper } from "@/components/Animations";
import { upcomingEvents, UpcomingEvent } from "../eventsData";
import EventPoster from "../EventPoster";

function MetaRow({ event }: { event: UpcomingEvent }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-gray-600">
      <span className="inline-flex items-center gap-1.5">📍 {event.location}</span>
      <span className="inline-flex items-center gap-1.5">🕒 {event.time}</span>
      <span className="inline-flex items-center gap-1.5 bg-gray-100 border border-gray-200/70 text-gray-700 px-2.5 py-0.5 rounded-full">
        {event.mode}
      </span>
    </div>
  );
}

export function UpcomingEventsSection() {
  const [featured, ...rest] = upcomingEvents;

  return (
    <section className="py-16 text-gray-900 font-sans">
      {/* Section Header */}
      <div className="flex flex-col items-center text-center mb-12 px-6">
        <span className="bg-indigo-100 border border-indigo-200 text-indigo-700 text-[11px] font-semibold px-3 py-1 rounded-full mb-5 shadow-2xs">
          Upcoming events
        </span>
        <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
          <TextAnimation>Pull up a chair.</TextAnimation>
        </h2>
        <p className="text-sm text-gray-500 max-w-md mt-5 leading-relaxed">
          Workshops, showcases, and meetups — free for enrolled students. In-person
          capacity is set by the venue, so save your seat early.
        </p>
      </div>

      {/* Featured event */}
      <AnimateWrapper className="max-w-6xl mx-auto mb-6">
        <Link
          href={`/events/${featured.slug}`}
          className="group grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl border border-gray-200/80 hover:border-gray-300 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
        >
          <div className="min-h-[260px] md:min-h-[380px] overflow-hidden">
            <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]">
              <EventPoster event={featured} featured />
            </div>
          </div>

          <div className="flex flex-col justify-between p-7 md:p-10">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                Next up
              </div>
              <h3 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-4">
                {featured.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">{featured.tagline}</p>
              <MetaRow event={featured} />
            </div>

            <div className="flex items-center gap-3 pt-8">
              <span className="relative inline-flex items-center justify-center font-bold text-white tracking-tight rounded-full px-7 py-3.5 text-sm bg-gradient-to-b from-[#2d2d32] via-[#1c1c20] to-[#0f0f12] border border-black/40 border-t-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_10px_25px_-5px_rgba(0,0,0,0.5)] group-hover:brightness-115 transition-all duration-200">
                Save your seat
              </span>
              <span className="text-sm font-bold text-gray-900 inline-flex items-center gap-1.5">
                View details
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </span>
            </div>
          </div>
        </Link>
      </AnimateWrapper>

      {/* Remaining events grid */}
      <AnimateWrapper className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" delayMs={100}>
        {rest.map((event) => (
          <Link
            key={event.slug}
            href={`/events/${event.slug}`}
            className="group flex flex-col bg-white rounded-3xl border border-gray-200/80 hover:border-gray-300 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
          >
            <div className="aspect-[16/10] overflow-hidden">
              <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]">
                <EventPoster event={event} />
              </div>
            </div>

            <div className="flex flex-col flex-1 p-6">
              <h3 className="text-xl font-black text-gray-900 tracking-tight leading-snug mb-2.5">
                {event.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">{event.tagline}</p>

              <div className="mt-auto space-y-4">
                <MetaRow event={event} />
                <div className="pt-4 border-t border-gray-100 text-sm font-bold text-gray-900 inline-flex items-center gap-1.5">
                  Save your seat
                  <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </AnimateWrapper>
    </section>
  );
}

export default UpcomingEventsSection;
