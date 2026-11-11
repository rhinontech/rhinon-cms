/** Indian digit grouping: 124280 -> "1,24,280". Done by hand so server and browser always agree. */
export function inr(n: number): string {
  const s = Math.round(Math.abs(n)).toString();
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${last3}` : last3;
  return `${n < 0 ? "-" : ""}${grouped}`;
}

export const rupee = (n: number) => `₹${inr(n)}`;

/** 1840000 -> "₹18.4L", 12000000 -> "₹1.2Cr" */
export function lakh(n: number): string {
  if (n >= 10_000_000) return `₹${trim(n / 10_000_000)}Cr`;
  if (n >= 100_000) return `₹${trim(n / 100_000)}L`;
  return `₹${inr(n)}`;
}
const trim = (x: number) => (Math.round(x * 10) / 10).toString();

export const pad = (n: number) => n.toString().padStart(2, "0");

/** Milliseconds -> "02:14:09" */
export function hms(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

/** Milliseconds -> "2h 14m" */
export function hm(ms: number): string {
  const mins = Math.max(0, Math.floor(ms / 60000));
  return `${Math.floor(mins / 60)}h ${pad(mins % 60)}m`;
}

/** A clock time like "09:41" from an epoch. */
export function clockTime(ts: number): string {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
export const MONTH_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** ISO date "2026-11-21" -> UTC Date, so weekday maths never drifts with the viewer's timezone. */
export function fromIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1));
}

export function toIso(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

/** "21 Nov" */
export function shortDate(iso: string): string {
  const d = fromIso(iso);
  return `${d.getUTCDate()} ${MONTH_SHORT[d.getUTCMonth()] ?? ""}`;
}

/** Weekdays (Mon–Fri) between two ISO dates, inclusive. */
export function workingDays(fromIsoDate: string, toIsoDate: string): number {
  const a = fromIso(fromIsoDate);
  const b = fromIso(toIsoDate);
  let count = 0;
  for (let t = a.getTime(); t <= b.getTime(); t += 86_400_000) {
    const dow = new Date(t).getUTCDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

/** "21 Nov" or "21–22 Nov" */
export function rangeLabel(fromIsoDate: string, toIsoDate: string): string {
  if (fromIsoDate === toIsoDate) return shortDate(fromIsoDate);
  const a = fromIso(fromIsoDate);
  const b = fromIso(toIsoDate);
  if (a.getUTCMonth() === b.getUTCMonth()) {
    return `${a.getUTCDate()}–${b.getUTCDate()} ${MONTH_SHORT[b.getUTCMonth()] ?? ""}`;
  }
  return `${shortDate(fromIsoDate)} – ${shortDate(toIsoDate)}`;
}
