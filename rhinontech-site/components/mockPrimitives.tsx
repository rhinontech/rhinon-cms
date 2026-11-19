import type { ReactNode } from "react";

const PAL = ["#7c5cff", "#ff8a4c", "#2f5bff", "#ff5fb0", "#10c98f", "#f5a524"];

export function Avatar({ name, i = 0, size = 26 }: { name: string; i?: number; size?: number }) {
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-white"
      style={{ width: size, height: size, fontSize: size * 0.38, background: PAL[i % PAL.length] }}
    >
      {initials}
    </span>
  );
}

export function Pill({ children, color = "#7c5cff" }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-4"
      style={{ color, background: `${color}1a` }}
    >
      {children}
    </span>
  );
}

