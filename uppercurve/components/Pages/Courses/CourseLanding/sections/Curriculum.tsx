"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { Course, CourseModule, ModuleTone } from "../../courseData";
import { CourseHeading } from "../ui";

/** Clears the sticky navbar. */
const STACK_TOP = 88;
/** How much of each earlier card peeks above the next one. */
const STACK_STEP = 18;

const TONES: Record<
  ModuleTone,
  { card: string; text: string; muted: string; ghost: string; pill: string; chip: string }
> = {
  ice: {
    card: "bg-[#EBF3FF] border-[#0B1B3D]",
    text: "text-[#0B1B3D]",
    muted: "text-[#0B1B3D]/70",
    ghost: "text-[#0B1B3D]/[0.07]",
    pill: "border-[#0B1B3D] text-[#0B1B3D]",
    chip: "bg-white border-[#0B1B3D] text-[#0B1B3D]",
  },
  sky: {
    card: "bg-[#A9E4FF] border-[#0B1B3D]",
    text: "text-[#0B1B3D]",
    muted: "text-[#0B1B3D]/70",
    ghost: "text-[#0B1B3D]/[0.08]",
    pill: "border-[#0B1B3D] text-[#0B1B3D]",
    chip: "bg-white border-[#0B1B3D] text-[#0B1B3D]",
  },
  blue: {
    card: "bg-[#0052FF] border-[#0B1B3D]",
    text: "text-white",
    muted: "text-white/75",
    ghost: "text-white/[0.1]",
    pill: "border-white/80 text-white",
    chip: "bg-white border-white text-[#0B1B3D]",
  },
  deep: {
    card: "bg-[#052B82] border-[#0B1B3D]",
    text: "text-white",
    muted: "text-white/70",
    ghost: "text-white/[0.08]",
    pill: "border-white/70 text-white",
    chip: "bg-white border-white text-[#0B1B3D]",
  },
  navy: {
    card: "bg-[#0B1B3D] border-[#0B1B3D]",
    text: "text-white",
    muted: "text-white/65",
    ghost: "text-white/[0.07]",
    pill: "border-white/60 text-white",
    chip: "bg-white border-white text-[#0B1B3D]",
  },
  outline: {
    card: "bg-white border-dashed border-[#0B1B3D]",
    text: "text-[#0B1B3D]",
    muted: "text-[#0B1B3D]/70",
    ghost: "text-[#0B1B3D]/[0.06]",
    pill: "border-[#0B1B3D] text-[#0B1B3D]",
    chip: "bg-[#EBF3FF] border-[#0B1B3D] text-[#0B1B3D]",
  },
};

/** "AI agents for automation" → upper-case lead-in, accent kept as written. */
function ModuleTitle({ module }: { module: CourseModule }) {
  const { title, accent } = module;
  const at = accent ? title.toLowerCase().lastIndexOf(accent.toLowerCase()) : -1;
  if (at < 0) return <>{title.toUpperCase()}</>;
  return (
    <>
      {title.slice(0, at).toUpperCase()}
      <span className="tracking-[-0.03em]">{title.slice(at, at + accent!.length)}</span>
      {title.slice(at + accent!.length).toUpperCase()}
    </>
  );
}

function ModuleCard({ module, index }: { module: CourseModule; index: number }) {
  const [open, setOpen] = useState(false);
  const tone = TONES[module.tone];
  const number = String(module.week).padStart(2, "0");

  return (
    <article
      className={`relative overflow-hidden rounded-[28px] border-[1.5px] ${tone.card} ${tone.text} px-6 sm:px-12 pt-7 sm:pt-10 pb-8 sm:pb-10 min-h-[440px] sm:min-h-[500px] flex flex-col shadow-[0_-20px_50px_-30px_rgba(11,27,61,0.45)]`}
    >
      <span
        aria-hidden
        className={`pointer-events-none select-none absolute -top-4 sm:-top-8 right-2 sm:right-6 text-[150px] sm:text-[260px] font-extrabold leading-none tracking-[-0.06em] ${tone.ghost}`}
      >
        {number}
      </span>

      <span
        className={`relative self-start inline-flex items-center rounded-full border-[1.5px] px-4 sm:px-5 py-2 font-mono text-[11px] sm:text-[13px] tracking-[0.2em] uppercase ${tone.pill}`}
      >
        Module {number} · Week {module.week}
      </span>

      <h3 className="relative mt-10 sm:mt-16 max-w-4xl text-[30px] sm:text-5xl lg:text-[60px] font-extrabold tracking-[-0.035em] leading-[1]">
        <ModuleTitle module={module} />
      </h3>

      <div className="relative mt-6 flex flex-wrap items-center gap-x-4 gap-y-2.5">
        {module.tools.map((tool) => (
          <span key={tool} className="inline-flex items-center gap-2 font-mono text-[12.5px] sm:text-[13.5px]">
            <span className={`grid place-items-center w-8 h-8 rounded-lg border-[1.5px] font-sans text-[12px] font-bold ${tone.chip}`}>
              {tool.charAt(0)}
            </span>
            {tool}
          </span>
        ))}
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2 sm:gap-2.5">
        {module.topics.map((topic, t) => (
          <span
            key={topic}
            className={`inline-flex items-center rounded-full border-[1.5px] px-3.5 sm:px-4 py-1.5 sm:py-2 font-mono text-[11.5px] sm:text-[13px] ${tone.pill}`}
            style={{ rotate: `${(((index + t) % 3) - 1) * 0.4}deg` }}
          >
            {topic}
          </span>
        ))}
      </div>

      <div
        className={`relative grid transition-[grid-template-rows,opacity,margin] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? "grid-rows-[1fr] opacity-100 mt-8" : "grid-rows-[0fr] opacity-0 mt-0"
        }`}
      >
        <ol className="overflow-hidden grid sm:grid-cols-2 gap-x-10">
          {module.lessons.map((lesson, l) => (
            <li
              key={lesson}
              className={`flex gap-4 py-3.5 border-t ${tone.text === "text-white" ? "border-white/15" : "border-[#0B1B3D]/15"}`}
            >
              <span className={`font-mono text-[12px] pt-0.5 ${tone.muted}`}>
                {number}.{l + 1}
              </span>
              <span className="text-[15px] leading-relaxed font-medium">{lesson}</span>
            </li>
          ))}
        </ol>
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={`relative mt-auto pt-8 self-center`}
      >
        <span
          className={`inline-flex items-center gap-2 rounded-full border-[1.5px] px-5 py-2 font-mono text-[11px] font-bold tracking-[0.18em] uppercase transition-transform hover:-translate-y-0.5 ${tone.pill}`}
        >
          {open ? <Minus className="w-3.5 h-3.5" aria-hidden /> : <Plus className="w-3.5 h-3.5" aria-hidden />}
          {open ? "Collapse syllabus" : "Expand syllabus"}
        </span>
      </button>
    </article>
  );
}

/**
 * Six module cards that stack as you scroll. Each card is sticky a little
 * lower than the one before; as the next card slides over it, the covered
 * card eases back — scaled down and tilted — so the stack reads as a deck.
 */
export default function Curriculum({ course }: { course: Course }) {
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const slots = slotRefs.current;
    const cards = cardRefs.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;

    // A card taller than the space below its sticky line would have its
    // bottom (and the syllabus toggle) buried by the next card, so such a
    // card sticks higher — only once its bottom has scrolled into view.
    const placeTops = () => {
      const viewport = window.innerHeight;
      slots.forEach((slot, i) => {
        const card = cards[i];
        if (!slot || !card) return;
        const ideal = STACK_TOP + i * STACK_STEP;
        slot.style.top = `${Math.min(ideal, viewport - card.offsetHeight - 24)}px`;
      });
    };

    const update = () => {
      frame = 0;
      if (reduced) return;
      // How far each card has travelled onto the stack: 0 below it, 1 docked.
      const arrived = slots.map((slot, i) => {
        if (!slot || i === 0) return 0;
        const dockAt = parseFloat(slot.style.top) || STACK_TOP;
        const distance = slot.getBoundingClientRect().top - dockAt;
        return Math.min(1, Math.max(0, 1 - distance / (window.innerHeight * 0.75)));
      });
      cards.forEach((card, i) => {
        if (!card) return;
        const depth = arrived.slice(i + 1).reduce((sum, value) => sum + value, 0);
        const cover = arrived[i + 1] ?? 0;
        const tilt = (i % 2 === 0 ? -1 : 1) * 1.6 * cover;
        card.style.transform = `scale(${1 - Math.min(depth, 4) * 0.035}) rotate(${tilt}deg)`;
        card.style.filter = depth > 0 ? `brightness(${1 - Math.min(depth, 3) * 0.06})` : "";
      });
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const resize = new ResizeObserver(() => {
      placeTops();
      schedule();
    });
    cards.forEach((card) => card && resize.observe(card));
    window.addEventListener("resize", placeTops);
    window.addEventListener("scroll", schedule, { passive: true });
    placeTops();
    update();

    return () => {
      resize.disconnect();
      window.removeEventListener("resize", placeTops);
      window.removeEventListener("scroll", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section id="curriculum" className="scroll-mt-20 bg-[#F6F8FC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-24 sm:pb-36">
        <CourseHeading
          eyebrow={`The curriculum · ${course.modules.length} weeks · ${course.modules.length} modules`}
          title="The deepest agent syllabus you can take live."
          description="Every module ends with something running in the real world. Scroll through the stack — this is what the six weeks actually look like."
        />

        <div className="mt-14 sm:mt-20 max-w-6xl mx-auto">
          {course.modules.map((module, index) => (
            <div
              key={module.week}
              ref={(node) => {
                slotRefs.current[index] = node;
              }}
              className="sticky mb-10 sm:mb-16 last:mb-0"
              style={{ top: STACK_TOP + index * STACK_STEP, zIndex: index + 1 }}
            >
              <div
                ref={(node) => {
                  cardRefs.current[index] = node;
                }}
                className="origin-top will-change-transform"
              >
                <ModuleCard module={module} index={index} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
