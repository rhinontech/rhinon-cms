import React from "react";
import { UpcomingEvent } from "./eventsData";

export function EventPoster({
  event,
  featured = false,
}: {
  event: UpcomingEvent;
  featured?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden h-full w-full ${event.gradient}`}>
      {/* Dot grid texture */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:14px_14px] opacity-25" />
      {/* Soft light + shadow glows */}
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/15 blur-3xl" />
      <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-black/40 blur-3xl" />

      {/* Poster content */}
      <div className={`relative z-10 h-full flex flex-col justify-between ${featured ? "p-8" : "p-6"}`}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 [font-family:var(--font-montserrat)]">
            UpperCurve
          </span>
          <span className="bg-white/15 border border-white/25 text-white text-[11px] font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
            {event.type}
          </span>
        </div>

        <div>
          <div
            className={`text-white font-black tracking-tight leading-[1.05] ${
              featured ? "text-3xl sm:text-4xl md:text-5xl" : "text-2xl sm:text-3xl"
            }`}
          >
            {event.title}
          </div>
          <div className="mt-3 text-xs font-semibold text-white/75 tracking-wide">
            {event.dateLabel} · {event.time}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventPoster;
