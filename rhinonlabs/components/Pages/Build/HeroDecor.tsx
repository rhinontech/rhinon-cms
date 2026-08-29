"use client";

import React from "react";
import { motion } from "framer-motion";

// Deterministic pseudo-random so the server and client render the exact same starfield
// (a Math.random() field would hydrate-mismatch and flicker on load).
function rand(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

// Stars are kept to the outer ~28% of each edge so they never crowd the headline column.
const stars = Array.from({ length: 54 }).map((_, i) => {
  const onLeft = i % 2 === 0;
  const spread = rand(i, 1);
  return {
    key: i,
    left: onLeft ? spread * 27 : 73 + spread * 27,
    top: rand(i, 2) * 100,
    size: 1 + rand(i, 3) * 2.2,
    delay: rand(i, 4) * 5,
    duration: 2.6 + rand(i, 5) * 3.4,
    peak: 0.18 + rand(i, 6) * 0.5,
  };
});

// A handful of larger four-point sparkles for depth.
const sparkles = [
  { left: 6, top: 22, size: 26, delay: 0.4, opacity: 0.35 },
  { left: 17, top: 61, size: 16, delay: 1.6, opacity: 0.25 },
  { left: 11, top: 84, size: 20, delay: 2.6, opacity: 0.2 },
  { left: 88, top: 18, size: 20, delay: 1.1, opacity: 0.3 },
  { left: 79, top: 48, size: 28, delay: 2.1, opacity: 0.3 },
  { left: 92, top: 74, size: 15, delay: 3.2, opacity: 0.22 },
];

const Sparkle = ({ size, opacity }: { size: number; opacity: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ opacity }}>
    <path
      d="M12 0c1 8 4 11 12 12-8 1-11 4-12 12-1-8-4-11-12-12C8 11 11 8 12 0Z"
      fill="url(#sparkleFill)"
    />
    <defs>
      <linearGradient id="sparkleFill" x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ffffff" />
        <stop offset="1" stopColor="#6C8CFF" />
      </linearGradient>
    </defs>
  </svg>
);

/** Concentric arcs + orbiting dots — mirrored for the right edge via `flip`. */
const SideOrnament = ({ flip = false }: { flip?: boolean }) => {
  // Unique gradient ids per instance — two copies sharing an id would collide in the DOM.
  const arc = `arcStroke-${flip ? "r" : "l"}`;
  const orb = `orbGlow-${flip ? "r" : "l"}`;
  return (
  <svg
    viewBox="0 0 320 720"
    fill="none"
    className="h-[85%] w-auto"
    style={{ transform: flip ? "scaleX(-1)" : undefined }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id={arc} x1="0" y1="0" x2="320" y2="720" gradientUnits="userSpaceOnUse">
        <stop stopColor="#A3B8CC" stopOpacity="0.35" />
        <stop offset="1" stopColor="#1c2bff" stopOpacity="0.05" />
      </linearGradient>
      <radialGradient id={orb} cx="0.5" cy="0.5" r="0.5">
        <stop stopColor="#6C8CFF" stopOpacity="0.5" />
        <stop offset="1" stopColor="#6C8CFF" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Concentric rings radiating from just off-canvas */}
    <circle cx="-40" cy="360" r="190" stroke={`url(#${arc})`} strokeWidth="1" />
    <circle cx="-40" cy="360" r="270" stroke={`url(#${arc})`} strokeWidth="1" />
    <circle cx="-40" cy="360" r="350" stroke={`url(#${arc})`} strokeWidth="1" strokeDasharray="4 10" />

    {/* Constellation lines */}
    <path
      d="M60 120 L148 196 L112 318 L212 372"
      stroke={`url(#${arc})`}
      strokeWidth="1"
      strokeDasharray="3 7"
    />
    <path d="M96 528 L186 466 L246 546" stroke={`url(#${arc})`} strokeWidth="1" strokeDasharray="3 7" />

    {/* Nodes on the constellation */}
    {[
      [60, 120],
      [148, 196],
      [112, 318],
      [212, 372],
      [96, 528],
      [186, 466],
      [246, 546],
    ].map(([cx, cy]) => (
      <g key={`${cx}-${cy}`}>
        <circle cx={cx} cy={cy} r="14" fill={`url(#${orb})`} />
        <circle cx={cx} cy={cy} r="2" fill="#C7D6EA" fillOpacity="0.7" />
      </g>
    ))}
  </svg>
  );
};

/** Ambient decoration for the /build hero — starfield plus an ornament on each edge. */
export function HeroDecor() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block" aria-hidden="true">
      {/* Edge ornaments, faded towards the centre so they never compete with the copy */}
      <div className="absolute left-0 inset-y-0 flex items-center opacity-40 mask-[linear-gradient(to_right,black,transparent)]">
        <SideOrnament />
      </div>
      <div className="absolute right-0 inset-y-0 flex items-center opacity-40 mask-[linear-gradient(to_left,black,transparent)]">
        <SideOrnament flip />
      </div>

      {/* Twinkling starfield */}
      {stars.map((s) => (
        <motion.span
          key={s.key}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
          }}
          animate={{ opacity: [s.peak * 0.25, s.peak, s.peak * 0.25] }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Larger sparkles */}
      {sparkles.map((s) => (
        <motion.div
          key={`${s.left}-${s.top}`}
          className="absolute"
          style={{ left: `${s.left}%`, top: `${s.top}%` }}
          animate={{ opacity: [0.35, 1, 0.35], scale: [0.9, 1.05, 0.9] }}
          transition={{ duration: 5, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkle size={s.size} opacity={s.opacity} />
        </motion.div>
      ))}
    </div>
  );
}
