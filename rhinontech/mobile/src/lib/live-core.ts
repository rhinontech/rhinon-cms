/**
 * The registry every connected module plugs into. A module says how to fetch its data (`sync`),
 * how to clear its sample data (`blank`) and which store actions should call the API (`install`).
 * Screens keep reading the same lists they always did; sync replaces those lists in place.
 */
import { actions, bumpRev } from "./store";

export type Actions = typeof actions;
export type Writer = (module: string, call: () => Promise<unknown>, after?: () => void) => void;
export type LiveModule = {
  name: string;
  sync: () => Promise<void>;
  /** Empty this module's sample data so it never shows beside a real account. */
  blank?: () => void;
  /** Swap store actions for versions that call the API. */
  install?: (ctx: { orig: Actions; write: Writer }) => void;
};

const registry = new Map<string, LiveModule>();
export const defineLive = (m: LiveModule) => { registry.set(m.name, m); };
export const liveModules = (): LiveModule[] => [...registry.values()];

/** Replace the contents of a module-level list (or record) in place and re-render every screen. */
export function replace<T>(target: T[], fresh: T[]): void {
  target.splice(0, target.length, ...fresh);
  bumpRev();
}
export function assign<T extends object>(target: T, fresh: Partial<T>): void {
  Object.assign(target, fresh);
  bumpRev();
}
export function clearRecord(target: Record<string, unknown>): void {
  for (const k of Object.keys(target)) delete target[k];
}

export const resync = (name: string) => registry.get(name)?.sync().catch(() => {});

/** Run an API write after the optimistic local change; if it fails, say why and restore server truth. */
export const write: Writer = (module, call, after) => {
  call()
    .then(() => { after?.(); return resync(module); })
    .catch((e: Error) => { actions.toast(e.message || "That didn't save", "coral"); void resync(module); });
};

/* ── formatting helpers shared by the adapters ───────────────────────────── */

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_MS = 86_400_000;
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** "2026-11-11" or an ISO timestamp → a local Date at the start of that day. */
export function parseDay(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

export function ago(iso: string | null | undefined): string {
  if (!iso) return "";
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export const hhmm = (iso: string | Date) => {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
export const dayLabel = (iso: string) => { const d = parseDay(iso); return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; };
export const shortDate = (iso: string) => { const d = parseDay(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };

import type { Tone } from "./tone";
export const TONES: Tone[] = ["sun", "sky", "leaf", "violet", "rose", "cobalt", "coral"];
export const toneAt = (i: number): Tone => TONES[Math.abs(i) % TONES.length]!;
