"use client";

import React, { useEffect, useRef, useState } from "react";
import { TextAnimation } from "@/components/Animations";

interface TimelineEntry {
  period: string;
  title: string;
  desc: string;
  stats: { label: string; value: string }[];
  photos: { src: string; alt: string }[];
}

export function PastEventsTimeline() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [beamHeight, setBeamHeight] = useState(0);

  const entries: TimelineEntry[] = [
    {
      period: "Jun 2026",
      title: "Summer Build Sprint",
      desc: "Five days of team builds around one real brief from a working startup, wrapped up with a demo day in front of the whole community.",
      stats: [
        { label: "Format", value: "Sprint" },
        { label: "Where", value: "In person" },
      ],
      photos: [
        {
          src: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
          alt: "Summer Build Sprint audience",
        },
        {
          src: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
          alt: "Team collaborating during the sprint",
        },
      ],
    },
    {
      period: "Apr 2026",
      title: "Career Night Vol. 7",
      desc: "Students presented their projects to working professionals, then practiced interviews in rapid-fire feedback rounds.",
      stats: [
        { label: "Format", value: "Showcase" },
        { label: "Where", value: "In person" },
      ],
      photos: [
        {
          src: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80",
          alt: "Presenter on stage at Career Night",
        },
        {
          src: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80",
          alt: "Audience giving feedback",
        },
      ],
    },
    {
      period: "Feb 2026",
      title: "Tech Careers Day",
      desc: "A full-day online event on modern tech careers — AI, engineering, and product — with speakers from across the industry.",
      stats: [
        { label: "Format", value: "Conference" },
        { label: "Where", value: "Online" },
      ],
      photos: [
        {
          src: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?auto=format&fit=crop&w=800&q=80",
          alt: "Speaker presenting at Tech Careers Day",
        },
        {
          src: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=800&q=80",
          alt: "Conference workspace setup",
        },
      ],
    },
  ];

  // Aceternity "Timeline", adapted: the gradient beam height follows scroll
  // progress via a scroll listener instead of framer-motion useScroll.
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;

    const handleScroll = () => {
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const progress = Math.min(
        1,
        Math.max(0, (viewportHeight * 0.6 - rect.top) / rect.height)
      );
      setBeamHeight(progress * rect.height);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <section className="py-16 bg-white text-gray-900 font-sans">
      {/* Section Header */}
      <div className="flex flex-col items-center text-center mb-14 px-6">
        <span className="bg-amber-100 border border-amber-200 text-amber-700 text-[11px] font-semibold px-3 py-1 rounded-full mb-4 shadow-2xs">
          Past events
        </span>
        <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
          <TextAnimation>The receipts.</TextAnimation>
        </h2>
        <p className="text-sm text-gray-500 max-w-sm mt-4 leading-relaxed">
          A look back at what the community built, shipped and celebrated over the last
          few months.
        </p>
      </div>

      {/* Timeline */}
      <div ref={timelineRef} className="relative max-w-5xl mx-auto pb-10">
        {/* Track line */}
        <div className="absolute left-[19px] md:left-[19px] top-0 bottom-0 w-[2px] bg-gray-200/80 overflow-hidden">
          {/* Scroll beam */}
          <div
            className="w-full bg-gradient-to-b from-indigo-500 via-purple-500 to-transparent rounded-full"
            style={{ height: beamHeight }}
          />
        </div>

        {entries.map((entry) => (
          <div key={entry.period} className="flex justify-start pt-10 md:pt-20 md:gap-10">
            {/* Sticky period label + dot */}
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-32 self-start max-w-xs lg:max-w-sm md:w-full">
              <div className="h-10 w-10 absolute left-0 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                <div className="h-3.5 w-3.5 rounded-full bg-indigo-500/80 border border-indigo-300" />
              </div>
              <h3 className="hidden md:block md:pl-16 text-3xl lg:text-4xl font-black tracking-tight text-gray-300">
                {entry.period}
              </h3>
            </div>

            {/* Entry content */}
            <div className="relative pl-16 pr-0 md:pl-4 w-full">
              <h3 className="md:hidden block text-2xl mb-4 text-left font-black tracking-tight text-gray-300">
                {entry.period}
              </h3>

              <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 md:p-7">
                <h4 className="text-xl font-black text-gray-900 tracking-tight mb-2">
                  {entry.title}
                </h4>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">{entry.desc}</p>

                {/* Stats */}
                <div className="flex flex-wrap gap-3 mb-6">
                  {entry.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-gray-50 border border-gray-200/60 rounded-xl px-4 py-2 text-center"
                    >
                      <div className="text-lg font-black text-gray-900 leading-tight">
                        {stat.value}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Photos */}
                <div className="grid grid-cols-2 gap-3">
                  {entry.photos.map((photo) => (
                    <img
                      key={photo.src}
                      src={photo.src}
                      alt={photo.alt}
                      className="rounded-2xl object-cover h-32 md:h-44 w-full shadow-sm"
                      loading="lazy"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default PastEventsTimeline;
