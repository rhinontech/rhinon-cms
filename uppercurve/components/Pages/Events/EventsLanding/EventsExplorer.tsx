"use client";

import { useMemo, useState } from "react";
import { CalendarX2 } from "lucide-react";
import type { EventCategory, EventDetailModel } from "../shared/model";
import { CATEGORY_CONFIG } from "../shared/categoryConfig";
import EventCard from "./EventCard";

type ModeFilter = "All" | "Online" | "In person";

const CATEGORY_ORDER: EventCategory[] = [
  "Normal",
  "MicroCertificate",
  "GenAiMicroCertificate",
  "Claude",
  "ClaudeOneDay",
  "Community",
];

/**
 * Filtering happens on the client: the whole season is a handful of events,
 * already on the page, so a round trip per click would only add latency.
 * The chosen format is mirrored into ?format= so a filtered view can be shared.
 */
export default function EventsExplorer({
  events,
  initialFormat,
}: {
  events: EventDetailModel[];
  initialFormat?: string;
}) {
  const valid = (value?: string): value is EventCategory =>
    Boolean(value && CATEGORY_ORDER.includes(value as EventCategory));

  const [format, setFormat] = useState<EventCategory | "All">(valid(initialFormat) ? initialFormat : "All");
  const [mode, setMode] = useState<ModeFilter>("All");

  const counts = useMemo(() => {
    const map = new Map<EventCategory, number>();
    for (const e of events) map.set(e.category, (map.get(e.category) ?? 0) + 1);
    return map;
  }, [events]);

  const visible = events.filter(
    (e) =>
      (format === "All" || e.category === format) &&
      (mode === "All" || (mode === "Online" ? e.mode === "Online" : e.mode !== "Online"))
  );

  const chooseFormat = (next: EventCategory | "All") => {
    setFormat(next);
    const url = new URL(window.location.href);
    if (next === "All") url.searchParams.delete("format");
    else url.searchParams.set("format", next);
    window.history.replaceState(null, "", url);
  };

  const tabs: (EventCategory | "All")[] = ["All", ...CATEGORY_ORDER.filter((c) => counts.has(c))];

  return (
    <div>
      <div className="flex flex-col gap-5">
        {/* Scrolls sideways on phones; wraps on anything wider, so no format is
            ever hidden off the edge of the row. */}
        <div
          role="tablist"
          aria-label="Filter by format"
          className="-mx-4 px-4 sm:mx-0 sm:px-0 flex sm:flex-wrap gap-2 overflow-x-auto sm:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map((tab) => {
            const active = format === tab;
            const count = tab === "All" ? events.length : counts.get(tab) ?? 0;
            return (
              <button
                key={tab}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => chooseFormat(tab)}
                className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold border transition-all ${
                  active
                    ? "bg-[#0B1B3D] border-[#0B1B3D] text-white shadow-[0_8px_18px_-10px_rgba(11,27,61,0.8)]"
                    : "bg-white border-[#E2E8F0] text-[#334155] hover:border-[#CBD5E1] hover:text-[#0B1B3D]"
                }`}
              >
                {tab === "All" ? null : (
                  <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_CONFIG[tab].accent.dot}`} aria-hidden />
                )}
                {tab === "All" ? "All events" : CATEGORY_CONFIG[tab].label}
                <span
                  className={`text-[11px] font-bold rounded-full px-1.5 min-w-5 ${
                    active ? "bg-white/15 text-white" : "bg-[#F1F5F9] text-[#64748B]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-[#F1F5F9] p-1" role="group" aria-label="Filter by location">
          {(["All", "Online", "In person"] as ModeFilter[]).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={mode === option}
              onClick={() => setMode(option)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition-all ${
                mode === option ? "bg-white text-[#0B1B3D] shadow-sm" : "text-[#64748B] hover:text-[#0B1B3D]"
              }`}
            >
              {option === "All" ? "Anywhere" : option}
            </button>
          ))}
        </div>
        <p className="text-[13px] text-[#64748B]" aria-live="polite">
          Showing <span className="font-bold text-[#0B1B3D]">{visible.length}</span>{" "}
          {visible.length === 1 ? "event" : "events"}
        </p>
        </div>
      </div>

      {visible.length ? (
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((event, index) => (
            <EventCard key={event.slug} event={event} priority={index < 3} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-[22px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-6 py-16 text-center">
          <CalendarX2 className="mx-auto w-8 h-8 text-[#94A3B8]" aria-hidden />
          <p className="mt-4 text-[16px] font-bold text-[#0B1B3D]">Nothing scheduled for this filter yet</p>
          <p className="mt-1 text-[14px] text-[#64748B]">Try another format, or see everything that is coming up.</p>
          <button
            type="button"
            onClick={() => {
              chooseFormat("All");
              setMode("All");
            }}
            className="mt-6 text-[12px] font-bold tracking-wider uppercase text-[#0052FF] hover:text-[#0043CC]"
          >
            Show all events
          </button>
        </div>
      )}
    </div>
  );
}
