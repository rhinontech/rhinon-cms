// Bookable-slot maths for the public /schedule-call page.
// IST is a fixed UTC+5:30 offset with no DST, so native ISO-with-offset parsing is exact and
// no timezone library is needed.

export const BUSINESS_START_HOUR = 9; // 9am IST
export const BUSINESS_END_HOUR = 18; // 6pm IST
export const SLOT_DURATION_MINUTES = 30;
export const BOOKING_WINDOW_DAYS = 90;
/** Don't let someone grab a slot that starts in the next few minutes. */
export const MIN_LEAD_MINUTES = 30;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface Slot {
  startTime: Date;
  endTime: Date;
}

/** The IST calendar date a UTC instant falls on. */
export function istDateStr(when: Date): string {
  const shifted = new Date(when.getTime() + 5.5 * 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${shifted.getUTCFullYear()}-${p(shifted.getUTCMonth() + 1)}-${p(shifted.getUTCDate())}`;
}

export function isValidDateStr(dateStr: string): boolean {
  if (!DATE_RE.test(dateStr)) return false;
  const d = new Date(`${dateStr}T00:00:00+05:30`);
  return !isNaN(d.getTime()) && istDateStr(d) === dateStr;
}

// Weekday of a plain calendar date. Deliberately NOT via `new Date("...T00:00+05:30")` —
// that instant is the previous day in UTC, so getUTCDay() would report the wrong weekday.
function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function isWithinBookingWindow(dateStr: string): boolean {
  const today = new Date(`${istDateStr(new Date())}T00:00:00+05:30`).getTime();
  const target = new Date(`${dateStr}T00:00:00+05:30`).getTime();
  const days = (target - today) / 86_400_000;
  return days >= 0 && days <= BOOKING_WINDOW_DAYS;
}

/** Every business-hours slot on an IST date. Empty on weekends. Does not consider bookings. */
export function generateDaySlots(dateStr: string): Slot[] {
  const weekday = weekdayOf(dateStr);
  if (weekday === 0 || weekday === 6) return [];

  const slots: Slot[] = [];
  const total = (BUSINESS_END_HOUR - BUSINESS_START_HOUR) * 60;
  for (let offset = 0; offset < total; offset += SLOT_DURATION_MINUTES) {
    const hh = String(BUSINESS_START_HOUR + Math.floor(offset / 60)).padStart(2, "0");
    const mm = String(offset % 60).padStart(2, "0");
    const startTime = new Date(`${dateStr}T${hh}:${mm}:00+05:30`);
    slots.push({ startTime, endTime: new Date(startTime.getTime() + SLOT_DURATION_MINUTES * 60_000) });
  }
  return slots;
}

export interface Interval {
  start: Date;
  end: Date;
}

/** Half-open overlap: touching edges (10:00–10:30 vs 10:30–11:00) don't collide. */
export function overlaps(slot: Slot, busy: Interval): boolean {
  return slot.startTime < busy.end && busy.start < slot.endTime;
}

export function isBookable(slot: Slot, busy: Interval[]): boolean {
  const earliest = Date.now() + MIN_LEAD_MINUTES * 60_000;
  if (slot.startTime.getTime() < earliest) return false;
  return !busy.some((b) => overlaps(slot, b));
}

/** Server-side re-check: the submitted start must be a real, still-open slot. */
export function findBookableSlot(startTime: Date, busy: Interval[]): Slot | null {
  if (isNaN(startTime.getTime())) return null;
  const slot = generateDaySlots(istDateStr(startTime)).find((s) => s.startTime.getTime() === startTime.getTime());
  if (!slot) return null;
  return isBookable(slot, busy) ? slot : null;
}
