import { format, formatDistanceToNowStrict } from "date-fns";

/** Whole days from now until `iso`, rounded up — "1 day left" until the very last moment. Negative once past. */
export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Number.isNaN(ms) ? null : Math.ceil(ms / 86_400_000);
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : format(d, "d MMM yyyy");
}

export function dateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : format(d, "d MMM yyyy, h:mm a");
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : `${formatDistanceToNowStrict(d)} ago`;
}

/** "1 day" / "3 days" — the plural the copy needs, without a stray "1 days". */
export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
