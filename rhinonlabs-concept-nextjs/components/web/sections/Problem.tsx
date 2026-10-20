"use client";

// 01 The problem — the video + statement layout from website/components/sections/Company.tsx
// (its top half), with the concept's problem copy and word-by-word scroll fill.
import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import GridLines, { Cross } from "@/components/web/ui/GridLines";
import Reveal, { CurtainImage } from "@/components/web/ui/Reveal";
import Rich from "@/components/web/ui/Rich";
import { Play } from "@/components/web/ui/Icons";
import { grid4, mono, section } from "@/components/web/ui/styles";
import { Kicker, Tick } from "@/components/site/primitives";
import { problem } from "@/lib/web/content";
import { cn } from "@/lib/utils";

// [text, emphasised?] runs; emphasised runs are set in electric serif italics.
const statement: [string, boolean][] = [
  ["Your team isn’t slow.", false],
  ["Your systems are.", true],
  ["Data gets copied between tools, follow-ups live in someone’s memory, and every answer starts with “let me check.” We find the manual work hiding in your business — and build the", false],
  ["systems", true],
  ["that take it off your plate.", false],
];

const facts = ["Built around the tools you already use", "You own the code and the data", "Optional support after launch"];

/** Words brighten in sequence as the statement scrolls up the screen. */
function useScrollFill() {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const words = [...el.querySelectorAll<HTMLElement>("[data-w]")];
    let queued = false;
    const update = () => {
      queued = false;
      const vh = window.innerHeight;
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 1.5) return;
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.55)));
      const head = p * (words.length + 5);
      words.forEach((w, j) => w.style.setProperty("--o", (0.14 + 0.86 * Math.min(1, Math.max(0, (head - j) / 5))).toFixed(3)));
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return ref;
}

export default function Problem() {
  const { video } = problem;
  const fillRef = useScrollFill();

  return (
    <section id="why" data-theme="dark" className={cn(section, "theme-dark pt-[82px] pb-[66px] max-[809px]:pt-[55px]")}>
      <GridLines crosses />

      <div className={cn(grid4, "items-start")}>
        <aside className="sticky top-[150px] col-start-1 pt-[85px] max-[809px]:relative max-[809px]:top-0 max-[809px]:mb-20 max-[809px]:pt-0">
          <Reveal className="relative px-2.5 pt-5 pb-2.5">
            <Cross style={{ left: 0, top: 0 }} />
            <Cross style={{ left: "100%", top: 0 }} />
            <Cross style={{ left: 0, top: "100%" }} />
            <Cross style={{ left: "100%", top: "100%" }} />
            <div className="flex justify-between px-1.5">
              <span className={mono}>{video.label}</span>
              <span className={cn(mono, "inline-flex items-center gap-1")}>
                <i className="size-[5px] rounded-full bg-sec-muted" /> <strong>{video.duration}</strong>
              </span>
            </div>
            <h3 className="mx-1.5 mt-[34px] mb-5 font-display text-[17px] leading-[1.05] font-bold tracking-[-0.04em] uppercase">
              {video.title}
            </h3>
            <button aria-label="Play video" className="group/thumb relative block aspect-[322/205] w-full overflow-hidden rounded-[6px]">
              <CurtainImage
                src={video.thumb}
                alt="Product team reviewing app screens"
                className="absolute! inset-0 transition-transform duration-800 ease-expo group-hover/thumb:scale-104"
              />
              <motion.span
                whileHover={{ scale: 1.12 }}
                transition={{ type: "spring", bounce: 0.4 }}
                className="absolute top-1/2 left-1/2 -mt-9 -ml-9 grid size-[72px] place-items-center rounded-full bg-white/28 text-white backdrop-blur-[10px] [&_svg]:ml-1 [&_svg]:w-[26px]"
              >
                <Play />
              </motion.span>
            </button>
          </Reveal>
          <Reveal delay={0.15}>
            <p className={cn(mono, "mt-[60px] ml-auto max-w-[290px] pr-2.5 text-right max-[809px]:mt-10 max-[809px]:ml-0 max-[809px]:text-left")}>
              <Rich text={video.note} />
            </p>
          </Reveal>
        </aside>

        <div className="col-[3/span_2] max-[809px]:col-start-1">
          <Kicker idx={problem.index}>{problem.label}</Kicker>
          <p
            ref={fillRef}
            className="max-w-[1240px] font-sans text-[clamp(26px,3.2vw,52px)] leading-[1.08] font-medium tracking-[-0.04em] [&_em]:font-serif [&_em]:text-[1.08em] [&_em]:font-normal [&_em]:tracking-[-0.01em] [&_em]:italic"
          >
            {statement.map(([text, em], ri) => {
              const words = text.split(" ").map((w, wi) => (
                <span
                  key={wi}
                  data-w=""
                  className={em ? "text-[oklch(54.6%_0.245_262.881/var(--o,0.14))]" : "text-[rgb(245_245_242/var(--o,0.14))]"}
                >
                  {w}{" "}
                </span>
              ));
              return em ? <em key={ri}>{words}</em> : <span key={ri}>{words}</span>;
            })}
          </p>
          <ul className={cn(mono, "mt-[60px] grid gap-3 border-t border-paper-2/12 pt-[22px] text-paper-2/60")}>
            {facts.map((f, i) => (
              <li key={f} data-reveal="" style={{ "--d": `${i * 90}ms` } as React.CSSProperties} className="flex items-center gap-2.5">
                <Tick />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
