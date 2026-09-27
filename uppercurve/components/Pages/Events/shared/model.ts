import type { ApiEvent } from "@/services/eventService";

export type EventCategory =
  | "Community"
  | "Normal"
  | "MicroCertificate"
  | "GenAiMicroCertificate"
  | "Claude"
  | "ClaudeOneDay"
  | "InternalCohort";

const CATEGORIES: EventCategory[] = [
  "Community",
  "Normal",
  "MicroCertificate",
  "GenAiMicroCertificate",
  "Claude",
  "ClaudeOneDay",
  "InternalCohort",
];

export interface Speaker {
  name: string;
  designation: string;
  company: string;
  photoUrl?: string;
}

export interface ScheduleSlot {
  /** Time or session marker: "6:00 PM", "Evening 2", "Day 1". */
  label: string;
  title: string;
  points: string[];
}

export interface Faq {
  question: string;
  answer: string;
}

/** Everything the detail page renders, with every field already defaulted. */
export interface EventDetailModel {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: EventCategory;
  type: string;
  ctaLabel: string;
  canRegister: boolean;
  isPast: boolean;
  bannerUrl?: string;

  /** ISO start instant in IST ("2026-10-11T18:00:00+05:30"), for countdowns and sorting. */
  startsAt: string | null;
  dateLabel: string;
  shortDate: { month: string; day: string };
  timeLabel: string;
  durationLabel: string;
  dayCount: number;
  mode: "Online" | "In person" | "Hybrid";
  location: string;
  /** numberOfAttendees — the attendee figure the admin sets for social proof ("300+ attending"), not a capacity. */
  attending: number;

  speakers: Speaker[];
  about: string[];
  outcomes: string[];
  schedule: ScheduleSlot[];
  audience: string[];
  topics: string[];
  faqs: Faq[];

  whatsappLink?: string;
  certificateUrl?: string;
  calendarUrl?: string;
}

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const strings = (value: unknown): string[] => list(value).map(text).filter(Boolean);

type Loose = Record<string, unknown>;
/** Treats any non-object as empty, so deep reads of admin JSON never throw. */
const obj = (value: unknown): Loose =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Loose) : {};

/** "2026-10-11" -> local Date, without the UTC shift `new Date(str)` applies. */
function parseDay(value: unknown): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text(value));
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** "6:00 PM" -> minutes past midnight. */
function parseTime(value: unknown): number | null {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(text(value));
  if (!match) return null;
  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hours += 12;
  return hours * 60 + Number(match[2]);
}

/** Event times are entered in IST, so the instant is pinned to +05:30. */
function startsAtFor(day: unknown, minutes: number | null): string | null {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(text(day));
  if (!match) return null;
  const m = minutes ?? 0;
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${match[1]}T${hh}:${mm}:00+05:30`;
}

const fmt = (date: Date, options: Intl.DateTimeFormatOptions) =>
  date.toLocaleDateString("en-US", options);

function dateLabelFor(start: Date | null, end: Date | null): string {
  if (!start) return "Date to be announced";
  if (!end || end.getTime() === start.getTime()) {
    return fmt(start, { month: "short", day: "numeric", year: "numeric" });
  }
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  return sameMonth
    ? `${fmt(start, { month: "short", day: "numeric" })} – ${end.getDate()}, ${end.getFullYear()}`
    : `${fmt(start, { month: "short", day: "numeric" })} – ${fmt(end, { month: "short", day: "numeric", year: "numeric" })}`;
}

function durationFor(dayCount: number, minutesPerDay: number | null): string {
  const hours = minutesPerDay ? Math.round((minutesPerDay / 60) * 10) / 10 : null;
  const perDay = hours ? `${hours} ${hours === 1 ? "hour" : "hours"}` : "";
  if (dayCount <= 1) return perDay || "Single session";
  return perDay ? `${dayCount} days · ${hours}h each` : `${dayCount} days`;
}

function modeFor(locationType: unknown): EventDetailModel["mode"] {
  const value = text(locationType).toLowerCase();
  if (value.includes("hybrid")) return "Hybrid";
  if (value.includes("offline") || value.includes("person")) return "In person";
  return "Online";
}

/** Google Calendar "add event" link, in IST. */
function calendarUrlFor(
  title: string,
  details: string,
  location: string,
  start: Date | null,
  startMinutes: number | null,
  endMinutes: number | null
): string | undefined {
  if (!start) return undefined;
  const stamp = (date: Date, minutes: number | null) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    if (minutes === null) return `${y}${m}${d}`;
    const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
    const mm = String(minutes % 60).padStart(2, "0");
    return `${y}${m}${d}T${hh}${mm}00`;
  };
  // A multi-day event is added as its first session, which is what people
  // actually need a reminder for.
  const dates = `${stamp(start, startMinutes)}/${stamp(start, endMinutes ?? startMinutes)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates,
    ctz: "Asia/Kolkata",
    details,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Reads both shapes of eventDetails:
 *  - about / agenda / takeaways, which the seed and uppercurve's own pages use;
 *  - section1_carousel / eventFlow / section2_iconPoints / section4_Header /
 *    whoShouldAttend / exclusiveBenefits, which the admin Workshop and Teardown
 *    forms write.
 * Whichever the event carries wins, so an event created in the admin panel
 * renders as fully as a seeded one.
 */
export function buildEventDetail(api: ApiEvent, now = new Date()): EventDetailModel {
  const details = obj(api.eventDetails);
  const title = text(api.eventTitle) || text(api.title) || "Untitled event";
  const subtitle =
    text(details.tagline) || text(api.eventSubtitle) || text(obj(details.DetailHeader).Subtitle);

  const category = (CATEGORIES as string[]).includes(text(api.eventCategory))
    ? (api.eventCategory as EventCategory)
    : "Normal";

  const start = parseDay(api.eventStartDate);
  const end = parseDay(api.eventEndDate) ?? start;
  const startMinutes = parseTime(api.eventStartTime);
  const endMinutes = parseTime(api.eventEndTime);
  const dayCount =
    start && end ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1) : 1;
  const minutesPerDay =
    startMinutes !== null && endMinutes !== null && endMinutes > startMinutes
      ? endMinutes - startMinutes
      : null;

  const timeLabel =
    text(api.eventStartTime) && text(api.eventEndTime)
      ? `${text(api.eventStartTime)} – ${text(api.eventEndTime)} IST`
      : text(api.eventStartTime)
        ? `${text(api.eventStartTime)} IST`
        : "Time to be announced";

  const mode = modeFor(api.locationType);
  const location = text(api.location) || (mode === "Online" ? "Online · Zoom" : "Bengaluru");

  const about = strings(details.about).length
    ? strings(details.about)
    : [text(obj(details.section1_carousel).description), text(obj(details.section1_carousel).note)].filter(Boolean);

  const outcomes = strings(details.takeaways).length
    ? strings(details.takeaways)
    : strings(obj(details.section4_Header).names).length
      ? strings(obj(details.section4_Header).names)
      : list(obj(details.exclusiveBenefits).items)
          .map((item) => text(obj(item).description) || text(obj(item).title))
          .filter(Boolean);

  const schedule: ScheduleSlot[] = list(details.agenda).length
    ? list(details.agenda).map((slot) => ({
        label: text(obj(slot).time),
        title: text(obj(slot).item),
        points: [],
      }))
    : list(obj(details.eventFlow).items).length
      ? list(obj(details.eventFlow).items).map((item) => {
          const lines = list(obj(item).subPoints).map((p) => text(obj(p).text)).filter(Boolean);
          return { label: text(obj(item).title), title: lines[0] ?? "", points: lines.slice(1) };
        })
      : list(obj(details.section2_iconPoints).points).map((point, index) => ({
          label: `Part ${index + 1}`,
          title: text(obj(point).title),
          points: list(obj(point).subtitles)
            .map((sub) => (typeof sub === "string" ? sub : text(obj(sub).title)))
            .filter(Boolean),
        }));

  const tags = strings(api.tags);
  const topics = strings(obj(details.section3_coloredTags).names).length
    ? strings(obj(details.section3_coloredTags).names)
    : tags;

  const speakers: Speaker[] = list(api.speakers)
    .map((raw) => ({
      name: text(obj(raw).name),
      designation: text(obj(raw).designation),
      company: text(obj(raw).company),
      photoUrl: text(obj(raw).photoUrl) || undefined,
    }))
    .filter((s) => s.name);

  const faqs: Faq[] = list(details.faqs)
    .map((f) => ({ question: text(obj(f).question), answer: text(obj(f).answer) }))
    .filter((f) => f.question && f.answer);

  const lastDay = end ?? start;
  const isPast = lastDay ? lastDay.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() : false;

  return {
    id: api.id,
    slug: text(api.eventSlug) || text(api.slug),
    title,
    subtitle,
    category,
    type: text(api.eventType) || "Workshop",
    ctaLabel: text(api.ctaType) || "Register Now",
    // Registration is open until the event has passed. canAcceptResponse is the
    // feedback switch, not a registration one (as in Product Space).
    canRegister: !isPast,
    isPast,
    bannerUrl: text(api.eventCreativeUrl) || undefined,

    startsAt: startsAtFor(api.eventStartDate, startMinutes),
    dateLabel: dateLabelFor(start, end),
    shortDate: start
      ? { month: fmt(start, { month: "short" }).toUpperCase(), day: String(start.getDate()) }
      : { month: "TBA", day: "—" },
    timeLabel,
    durationLabel: durationFor(dayCount, minutesPerDay),
    dayCount,
    mode,
    location,
    attending: Number(api.numberOfAttendees) || 0,

    speakers,
    about,
    outcomes,
    schedule: schedule.filter((slot) => slot.title || slot.label),
    audience: strings(obj(details.whoShouldAttend).names),
    topics,
    faqs,

    whatsappLink: text(obj(details.whatsappLink).Link) || undefined,
    certificateUrl: text(obj(details.certificateSection).certificateUrl) || undefined,
    calendarUrl: calendarUrlFor(title, subtitle, location, start, startMinutes, endMinutes),
  };
}
