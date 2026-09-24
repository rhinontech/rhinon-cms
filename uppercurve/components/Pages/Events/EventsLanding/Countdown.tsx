"use client";

import { useSyncExternalStore } from "react";

function partsUntil(target: number, now: number) {
  const total = Math.max(0, target - now);
  return {
    total,
    days: Math.floor(total / 86_400_000),
    hours: Math.floor((total / 3_600_000) % 24),
    minutes: Math.floor((total / 60_000) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}

function subscribe(onTick: () => void) {
  const id = window.setInterval(onTick, 1000);
  return () => window.clearInterval(id);
}
// Whole seconds, so repeated reads within one render return the same value.
const clientNow = () => Math.floor(Date.now() / 1000) * 1000;
const serverNow = () => null;

/**
 * The clock is an external store: the server snapshot is null (rendered as
 * dashes), so the HTML it sends can never disagree with the first client
 * render — a countdown computed on the server would be stale by hydration and
 * trip a mismatch. The client takes over immediately after hydrating.
 */
export default function Countdown({ startsAt }: { startsAt: string }) {
  const target = new Date(startsAt).getTime();
  const now = useSyncExternalStore(subscribe, clientNow, serverNow);

  const parts = now === null ? null : partsUntil(target, now);
  if (parts && parts.total === 0) {
    return (
      <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-white">Happening now</p>
    );
  }

  const cells: [string, number | undefined][] = [
    ["Days", parts?.days],
    ["Hrs", parts?.hours],
    ["Min", parts?.minutes],
    ["Sec", parts?.seconds],
  ];

  return (
    <div className="grid grid-cols-4 gap-2" role="timer" aria-live="off">
      {cells.map(([label, value]) => (
        <div
          key={label}
          className="rounded-xl bg-white/12 border border-white/20 backdrop-blur-md px-2 py-2 text-center"
        >
          <p className="text-[22px] sm:text-2xl font-extrabold text-white tabular-nums leading-none">
            {value === undefined ? "--" : String(value).padStart(2, "0")}
          </p>
          <p className="mt-1 text-[10px] font-semibold tracking-[0.18em] uppercase text-white/70">{label}</p>
        </div>
      ))}
    </div>
  );
}
