import type { IEvent } from "../types";

export type EventCategory =
  | "Normal"
  | "Community"
  | "MicroCertificate"
  | "GenAiMicroCertificate"
  | "Claude"
  | "ClaudeOneDay"
  | "InternalCohort";

export interface CategoryMeta {
  label: string;
  blurb: string;
  certificate: "Completion" | "Participation" | null;
  /** Tailwind class for the category's accent dot — mirrors the public site. */
  dot: string;
  /** The event type the category requires, if it requires one. */
  forcesType?: EventType;
}

/**
 * What each category does on the public page, stated where the editor chooses
 * it. Kept in step with uppercurve's categoryConfig: the certificate each one
 * awards and the accent it is shown in.
 */
export const CATEGORIES: Record<EventCategory, CategoryMeta> = {
  Normal: { label: "Workshop", blurb: "A single live, hands-on session.", certificate: "Participation", dot: "bg-blue-600" },
  Community: { label: "Community", blurb: "A meetup — no certificate, a peer-group feel.", certificate: null, dot: "bg-teal-500" },
  MicroCertificate: { label: "Micro-Certificate", blurb: "Several sessions, ends in a live review.", certificate: "Completion", dot: "bg-indigo-600" },
  GenAiMicroCertificate: { label: "GenAI Micro-Certificate", blurb: "Assessed programme on designing with GenAI.", certificate: "Completion", dot: "bg-violet-600" },
  Claude: { label: "Claude Intensive", blurb: "The two-day hands-on intensive.", certificate: "Participation", dot: "bg-orange-600" },
  ClaudeOneDay: { label: "One-Day Build", blurb: "A one-day build ending in demos.", certificate: "Participation", dot: "bg-orange-600" },
  InternalCohort: {
    label: "Internal Cohort",
    blurb: "Faculty only — hidden from the public listing.",
    certificate: null,
    dot: "bg-slate-500",
    forcesType: "Workshop",
  },
};

export type EventType = "Workshop" | "Hackathon" | "Teardown";
export type LocationType = "Online" | "Offline" | "Hybrid";

export interface Host {
  name: string;
  designation: string;
  company: string;
  photoUrl: string;
}
export interface AgendaSlot {
  label: string;
  title: string;
}
export interface Faq {
  question: string;
  answer: string;
}

/** Everything the editor edits, in the shape the public page reads. */
export interface EventFormState {
  title: string;
  summary: string;
  slug: string;
  category: EventCategory;
  type: EventType;
  ctaType: "Register Now" | "Join Waitlist";
  startDate: string;
  endDate: string;
  /** "HH:mm", as <input type="time"> uses; stored as "7:00 PM". */
  startTime: string;
  endTime: string;
  locationType: LocationType;
  location: string;
  capacity: number;
  bannerUrl: string;
  hosts: Host[];
  about: string;
  outcomes: string[];
  agenda: AgendaSlot[];
  audience: string[];
  topics: string[];
  faqs: Faq[];
  whatsappLink: string;
  certificateUrl: string;
  acceptingRegistrations: boolean;
  isPublished: boolean;
}

export const EMPTY_FORM: EventFormState = {
  title: "",
  summary: "",
  slug: "",
  category: "Normal",
  type: "Workshop",
  ctaType: "Register Now",
  startDate: "",
  endDate: "",
  startTime: "18:00",
  endTime: "20:00",
  locationType: "Online",
  location: "Online · Zoom",
  capacity: 100,
  bannerUrl: "",
  hosts: [],
  about: "",
  outcomes: [],
  agenda: [],
  audience: [],
  topics: [],
  faqs: [],
  whatsappLink: "",
  certificateUrl: "",
  acceptingRegistrations: true,
  isPublished: false,
};

type Loose = Record<string, unknown>;
const obj = (v: unknown): Loose => (v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Loose) : {});
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const text = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const strings = (v: unknown): string[] => list(v).map(text).filter(Boolean);

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** "7:00 PM" -> "19:00" */
export function toTimeInput(value: unknown): string {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(text(value));
  if (!match) return "";
  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hours += 12;
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

/** "19:00" -> "7:00 PM" — the format the public site parses. */
export function fromTimeInput(value: string): string {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return "";
  const hours = Number(match[1]);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${match[2]} ${suffix}`;
}

const CATEGORY_KEYS = Object.keys(CATEGORIES) as EventCategory[];

/**
 * Loads an event into the form. Events written by the previous admin forms
 * keep their content in section1_carousel / eventFlow / section2_iconPoints /
 * section4_Header / exclusiveBenefits; those are read as a fallback, in the
 * same order the public page reads them, so an old event opens showing exactly
 * what visitors see — and saving moves it onto the current fields.
 */
export function toFormState(event: IEvent): EventFormState {
  const d = obj(event.eventDetails);
  const carousel = obj(d.section1_carousel);

  const about = strings(d.about).length
    ? strings(d.about)
    : [text(carousel.description), text(carousel.note)].filter(Boolean);

  const outcomes = strings(d.takeaways).length
    ? strings(d.takeaways)
    : strings(obj(d.section4_Header).names).length
      ? strings(obj(d.section4_Header).names)
      : list(obj(d.exclusiveBenefits).items).map((i) => text(obj(i).description) || text(obj(i).title)).filter(Boolean);

  const agenda: AgendaSlot[] = list(d.agenda).length
    ? list(d.agenda).map((s) => ({ label: text(obj(s).time), title: text(obj(s).item) }))
    : list(obj(d.eventFlow).items).length
      ? list(obj(d.eventFlow).items).map((i) => ({
          label: text(obj(i).title),
          title: list(obj(i).subPoints).map((p) => text(obj(p).text)).filter(Boolean).join(" · "),
        }))
      : list(obj(d.section2_iconPoints).points).map((p, n) => ({ label: `Part ${n + 1}`, title: text(obj(p).title) }));

  const topics = strings(obj(d.section3_coloredTags).names).length
    ? strings(obj(d.section3_coloredTags).names)
    : strings(event.tags);

  const category = CATEGORY_KEYS.includes(event.eventCategory as EventCategory)
    ? (event.eventCategory as EventCategory)
    : "Normal";
  const locationType = (["Online", "Offline", "Hybrid"] as const).find(
    (t) => t.toLowerCase() === text(event.locationType).toLowerCase()
  );

  return {
    title: text(event.eventTitle),
    summary: text(d.tagline) || text(event.eventSubtitle) || text(obj(d.DetailHeader).Subtitle),
    slug: text(event.eventSlug),
    category,
    type: event.eventType ?? "Workshop",
    ctaType: event.ctaType === "Join Waitlist" ? "Join Waitlist" : "Register Now",
    startDate: text(event.eventStartDate).slice(0, 10),
    endDate: text(event.eventEndDate).slice(0, 10),
    startTime: toTimeInput(event.eventStartTime),
    endTime: toTimeInput(event.eventEndTime),
    locationType: locationType ?? "Online",
    location: text(event.location),
    capacity: Number(event.numberOfAttendees) || 0,
    bannerUrl: text(event.eventCreativeUrl),
    hosts: list(event.speakers).map((s) => ({
      name: text(obj(s).name),
      designation: text(obj(s).designation),
      company: text(obj(s).company),
      photoUrl: text(obj(s).photoUrl),
    })),
    about: about.join("\n\n"),
    outcomes,
    agenda: agenda.filter((a) => a.label || a.title),
    audience: strings(obj(d.whoShouldAttend).names),
    topics,
    faqs: list(d.faqs)
      .map((f) => ({ question: text(obj(f).question), answer: text(obj(f).answer) }))
      .filter((f) => f.question || f.answer),
    whatsappLink: text(obj(d.whatsappLink).Link),
    certificateUrl: text(obj(d.certificateSection).certificateUrl),
    acceptingRegistrations: Boolean(event.canAcceptResponse),
    isPublished: Boolean(event.isPublished),
  };
}

/**
 * Keys the previous forms wrote that the editor now owns under other names.
 * They are removed on save: the public page falls back to them whenever the
 * current field is empty, so clearing "About" here would otherwise resurrect
 * the old carousel text on the live page.
 */
const SUPERSEDED_KEYS = [
  "section1_carousel",
  "section2_iconPoints",
  "section4_Header",
  "eventFlow",
  "exclusiveBenefits",
  "DetailHeader",
];

/** Builds the API payload. Unknown eventDetails keys are carried through untouched. */
export function toPayload(form: EventFormState, originalDetails: unknown) {
  const details: Loose = { ...obj(originalDetails) };
  for (const key of SUPERSEDED_KEYS) delete details[key];

  const clean = (values: string[]) => values.map((v) => v.trim()).filter(Boolean);
  const about = form.about
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);

  Object.assign(details, {
    tagline: form.summary.trim(),
    about,
    takeaways: clean(form.outcomes),
    agenda: form.agenda
      .map((a) => ({ time: a.label.trim(), item: a.title.trim() }))
      .filter((a) => a.time || a.item),
    whoShouldAttend: { sectionName: "Who should attend", names: clean(form.audience) },
    section3_coloredTags: { sectionName: "Topics", names: clean(form.topics) },
    faqs: form.faqs
      .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
      .filter((f) => f.question && f.answer),
    whatsappLink: { ...obj(details.whatsappLink), Link: form.whatsappLink.trim() },
    certificateSection: { ...obj(details.certificateSection), certificateUrl: form.certificateUrl.trim() },
  });

  return {
    eventTitle: form.title.trim(),
    eventSubtitle: form.summary.trim(),
    eventSlug: slugify(form.slug),
    eventCategory: form.category,
    eventType: CATEGORIES[form.category].forcesType ?? form.type,
    ctaType: form.ctaType,
    eventStartDate: form.startDate,
    eventEndDate: form.endDate || form.startDate,
    eventStartTime: fromTimeInput(form.startTime),
    eventEndTime: fromTimeInput(form.endTime),
    locationType: form.locationType,
    location: form.location.trim(),
    numberOfAttendees: Math.max(0, Math.round(form.capacity) || 0),
    eventCreativeUrl: form.bannerUrl.trim(),
    speakers: form.hosts
      .filter((h) => h.name.trim())
      .map((h) => ({
        name: h.name.trim(),
        designation: h.designation.trim(),
        company: h.company.trim(),
        ...(h.photoUrl.trim() ? { photoUrl: h.photoUrl.trim() } : {}),
      })),
    tags: clean(form.topics),
    canAcceptResponse: form.acceptingRegistrations,
    isPublished: form.isPublished,
    eventDetails: details,
  };
}

export type SectionId =
  | "basics"
  | "schedule"
  | "banner"
  | "hosts"
  | "about"
  | "outcomes"
  | "agenda"
  | "audience"
  | "faqs"
  | "extras";

export interface ValidationIssue {
  section: SectionId;
  field: keyof EventFormState;
  message: string;
}

export function validate(form: EventFormState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!form.title.trim()) issues.push({ section: "basics", field: "title", message: "Give the event a title." });
  if (!slugify(form.slug)) issues.push({ section: "basics", field: "slug", message: "The page URL can't be empty." });
  if (!form.startDate) issues.push({ section: "schedule", field: "startDate", message: "Pick a start date." });
  if (form.endDate && form.startDate && form.endDate < form.startDate) {
    issues.push({ section: "schedule", field: "endDate", message: "The end date is before the start date." });
  }
  // Times are per session ("7–9 PM each evening"), so this holds for multi-day events too.
  if (form.startTime && form.endTime && form.endTime <= form.startTime) {
    issues.push({ section: "schedule", field: "endTime", message: "The session ends before it starts." });
  }
  return issues;
}
