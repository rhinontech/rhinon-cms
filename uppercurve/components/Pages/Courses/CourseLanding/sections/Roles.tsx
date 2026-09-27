"use client";

import { useEffect, useRef } from "react";
import type { Course } from "../../courseData";
import { CourseHeading, DarkGrid } from "../ui";

/** Career outcomes, each row lighting up as it passes the middle of the screen. */
export default function Roles({ course }: { course: Course }) {
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const focus = window.innerHeight * 0.55;
      rowRefs.current.forEach((row) => {
        if (!row) return;
        const rect = row.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - focus);
        const light = 1 - Math.min(1, distance / (window.innerHeight * 0.4));
        row.style.opacity = String(0.22 + light * 0.78);
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#06102B] text-white">
      <DarkGrid />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <CourseHeading
            dark
            eyebrow="Where this takes you"
            title="These roles barely existed two years ago. They are hiring now."
            description="Finish the cohort with a portfolio of working agents and you are a credible candidate for the fastest-growing roles in tech."
          />
          <p className="inline-flex items-center gap-2 font-mono text-[10.5px] tracking-[0.2em] uppercase text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
            Hiring signal · live
          </p>
        </div>

        <ol className="mt-14 border-t border-white/10">
          {course.roles.map((role, index) => (
            <li
              key={role.title}
              ref={(node) => {
                rowRefs.current[index] = node;
              }}
              className="grid grid-cols-[2.5rem_1fr] md:grid-cols-[4rem_1.3fr_1fr] gap-x-4 gap-y-3 items-center py-8 sm:py-10 border-b border-white/10 transition-opacity duration-300"
            >
              <span className="font-mono text-[13px] text-white/40">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <p className="text-[28px] sm:text-5xl font-extrabold tracking-[-0.03em] leading-[1] uppercase">{role.title}</p>
                <p className="mt-2.5 font-mono text-[10.5px] tracking-[0.22em] uppercase text-[#7DD3FC]">{role.track}</p>
              </div>
              <p className="col-start-2 md:col-start-3 text-[15px] sm:text-base text-white/65 leading-relaxed">{role.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
