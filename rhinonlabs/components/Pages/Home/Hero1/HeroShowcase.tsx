"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";

const PROJECTS = [
  { src: "/assets/hero/3.webp", name: "SR Fitout", kind: "Website + client portal" },
  { src: "/assets/hero/work/rt-dashboard-image.webp", name: "Rhinon Tech", kind: "Admin dashboard" },
  { src: "/assets/hero/1.webp", name: "Apexis Pro", kind: "Construction SaaS + mobile" },
  { src: "/assets/hero/work/richharbor-image.webp", name: "RichHarbor", kind: "Fintech platform" },
  { src: "/assets/hero/2.webp", name: "Saleszium", kind: "AI SaaS" },
  { src: "/assets/hero/work/alrooha-image.webp", name: "Al Rooha", kind: "Export business site" },
];

// Slot by distance from the active card: 0 = front, ±1 = beside, ±2 = far back.
const SLOT = {
  0: { x: 0, z: 0, ry: 0, s: 1, o: 1 },
  1: { x: 34, z: -180, ry: -22, s: 0.86, o: 0.85 },
  2: { x: 58, z: -360, ry: -34, s: 0.72, o: 0.5 },
} as const;

const AUTO_MS = 4000;

export default function HeroShowcase() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Deck opens as it scrolls toward the centre of the screen.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  const tilt = useTransform(p, [0, 1], [reduce ? 0 : 28, 0]);
  const spread = useTransform(p, [0, 1], [reduce ? 1 : 0.35, 1]);
  const lift = useTransform(p, [0, 1], [reduce ? 0 : 60, 0]);

  useEffect(() => {
    if (reduce || paused) return;
    const t = setInterval(() => setActive((a) => (a + 1) % PROJECTS.length), AUTO_MS);
    return () => clearInterval(t);
  }, [reduce, paused]);

  const n = PROJECTS.length;

  return (
    <div
      ref={ref}
      className="relative mx-auto w-full max-w-6xl px-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* soft glow under the deck */}
      <div className="pointer-events-none absolute inset-x-[15%] bottom-6 top-1/3 rounded-full bg-[#5b7bff]/25 blur-[100px]" />

      <motion.div
        className="relative mx-auto aspect-[16/7.6] w-full"
        style={{ perspective: 1800, y: lift }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ rotateX: tilt, transformStyle: "preserve-3d", ["--spread" as string]: spread }}
        >
          {PROJECTS.map((proj, i) => {
            let d = i - active;
            if (d > n / 2) d -= n;
            if (d < -n / 2) d += n;
            const abs = Math.min(Math.abs(d), 2) as 0 | 1 | 2;
            const slot = SLOT[abs];
            const dir = Math.sign(d);
            const isFront = d === 0;

            return (
              <motion.button
                key={proj.name}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show ${proj.name}`}
                className="absolute top-0 left-1/2 w-[62%] text-left focus:outline-none md:w-[58%]"
                style={{
                  zIndex: 10 - abs,
                  transformStyle: "preserve-3d",
                }}
                animate={{ x: `calc(-50% + ${dir * slot.x}% * var(--spread))`,
                  z: slot.z,
                  rotateY: dir * slot.ry,
                  scale: slot.s,
                  opacity: Math.abs(d) > 2 ? 0 : slot.o,
                }}
                transition={{ type: "spring", stiffness: 90, damping: 18 }}
              >
                <div
                  className={`overflow-hidden rounded-xl border bg-[#0b0e18] p-1.5 transition-shadow duration-500 ${
                    isFront
                      ? "border-white/25 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.95),0_0_60px_-10px_rgba(91,123,255,0.55)]"
                      : "border-white/10 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)]"
                  }`}
                >
                  {/* browser bar */}
                  <div className="flex items-center gap-1.5 px-2 pb-1.5 pt-0.5">
                    <span className="h-2 w-2 rounded-full bg-white/20" />
                    <span className="h-2 w-2 rounded-full bg-white/20" />
                    <span className="h-2 w-2 rounded-full bg-white/20" />
                  </div>
                  <div className="relative aspect-[16/10] overflow-hidden rounded-lg">
                    <Image
                      src={proj.src}
                      alt={`${proj.name} — ${proj.kind} built by Rhinon Labs`}
                      width={1400}
                      height={875}
                      quality={90}
                      priority={isFront}
                      fetchPriority={isFront ? "high" : "auto"}
                      loading={isFront ? "eager" : "lazy"}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
                      className="h-full w-full object-cover object-top"
                    />
                    {!isFront && <div className="absolute inset-0 bg-black/30" />}
                  </div>
                </div>

                {/* project label */}
                <motion.div
                  initial={false}
                  animate={{ opacity: isFront ? 1 : 0, y: isFront ? 0 : 8 }}
                  transition={{ duration: 0.4, delay: isFront ? 0.25 : 0 }}
                  className="absolute -bottom-12 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs backdrop-blur-md"
                >
                  <span className="font-semibold text-white">{proj.name}</span>
                  <span className="h-1 w-1 rounded-full bg-white/40" />
                  <span className="text-white/65">{proj.kind}</span>
                </motion.div>
              </motion.button>
            );
          })}
        </motion.div>
      </motion.div>

      {/* progress dots */}
      <div className="relative mt-16 flex justify-center gap-2">
        {PROJECTS.map((proj, i) => (
          <button
            key={proj.name}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Show ${proj.name}`}
            className="flex min-w-[44px] min-h-[44px] items-center justify-center p-2"
          >
            <span
              className={`h-1.5 rounded-full transition-transform transition-opacity duration-300 ${
                i === active
                  ? "w-8 bg-white opacity-100"
                  : "w-4 bg-white/30 opacity-60 hover:opacity-100"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
