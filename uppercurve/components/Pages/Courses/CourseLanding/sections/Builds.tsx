"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Course } from "../../courseData";
import { CourseHeading, DarkGrid, GradientText } from "../ui";

const ACCENTS = ["text-[#7DD3FC]", "text-[#60A5FA]", "text-[#A5B4FC]", "text-[#5EEAD4]", "text-[#93C5FD]"];

/** The headline projects, as a row you can drag, swipe or step through. */
export default function Builds({ course }: { course: Course }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number } | null>(null);

  // Snapping fights a mouse drag, so it is off while one is in progress and
  // back on at release, which settles the row on the nearest card.
  const endDrag = () => {
    if (!drag.current || !trackRef.current) return;
    drag.current = null;
    trackRef.current.style.scrollSnapType = "";
  };

  const step = (direction: 1 | -1) => {
    const track = trackRef.current;
    const card = track?.firstElementChild as HTMLElement | null;
    if (!track || !card) return;
    track.scrollBy({ left: direction * (card.offsetWidth + 16), behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden bg-[#06102B] text-white">
      <DarkGrid />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <CourseHeading
            dark
            eyebrow="What you will build"
            title={
              <>
                Six weeks. <GradientText>Fifteen things</GradientText> that work.
              </>
            }
            description="Not exercises. Not notebooks. Agents that keep running after the session ends."
          />
          <div className="hidden sm:flex gap-2">
            {([-1, 1] as const).map((direction) => (
              <button
                key={direction}
                type="button"
                onClick={() => step(direction)}
                aria-label={direction === 1 ? "Next build" : "Previous build"}
                className="grid place-items-center w-12 h-12 rounded-full border border-white/15 text-white/80 hover:bg-white hover:text-[#0B1B3D] transition-colors"
              >
                {direction === 1 ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={trackRef}
          onPointerDown={(event) => {
            if (event.pointerType !== "mouse" || !trackRef.current) return;
            drag.current = { x: event.clientX, left: trackRef.current.scrollLeft };
            trackRef.current.style.scrollSnapType = "none";
          }}
          onPointerMove={(event) => {
            const track = trackRef.current;
            if (!drag.current || !track) return;
            track.scrollLeft = drag.current.left - (event.clientX - drag.current.x);
          }}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          className="no-scrollbar mt-14 -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-4 overflow-x-auto snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none"
        >
          {course.builds.map((build, index) => (
            <article
              key={build.label}
              className="group relative snap-start shrink-0 w-[84%] sm:w-[46%] lg:w-[31.5%] rounded-[22px] border border-white/10 bg-gradient-to-b from-[#0E2257] to-[#0A1840] p-7 sm:p-8 flex flex-col overflow-hidden transition-colors hover:border-white/25"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -top-5 right-3 text-[120px] font-extrabold leading-none tracking-[-0.06em] text-white/[0.04]"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className={`relative font-mono text-[12px] tracking-wide ${ACCENTS[index % ACCENTS.length]}`}>
                {build.label}
              </p>
              <h3 className="relative mt-4 text-[24px] sm:text-[26px] font-extrabold tracking-tight leading-[1.15]">
                {build.title} <span className={ACCENTS[index % ACCENTS.length]}>{build.accent}</span>
              </h3>
              <p className="relative mt-4 text-[15px] text-white/65 leading-relaxed">{build.body}</p>
              <div className="relative mt-auto pt-8 flex flex-wrap gap-2">
                {build.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 font-mono text-[11.5px] text-white/75"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <p className="mt-8 flex items-center justify-end gap-3 font-mono text-[10.5px] tracking-[0.22em] uppercase text-white/35">
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden /> Drag to explore builds{" "}
          <ArrowRight className="w-3.5 h-3.5" aria-hidden />
        </p>
      </div>
    </section>
  );
}
