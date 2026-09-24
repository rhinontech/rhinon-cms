import { UpcomingEvent, upcomingEvents } from "@/components/Pages/Events/eventsData";

import { API_BASE } from "./api";

export interface ApiEventSpeaker {
  name: string;
  company?: string;
  designation?: string;
  photoUrl?: string;
}

export interface ApiEvent {
  id: string;
  eventTitle: string;
  eventSubtitle?: string | null;
  eventStartDate: string;
  eventEndDate: string;
  eventStartTime?: string | null;
  eventEndTime?: string | null;
  speakers?: ApiEventSpeaker[] | null;
  numberOfAttendees?: number;
  eventCreativeUrl?: string | null;
  isPublished: boolean;
  eventType: string;
  eventCategory?: string;
  ctaType?: string;
  location?: string | null;
  locationType?: string | null;
  tags?: string[];
  eventDetails?: Record<string, any> | null;
  eventSlug: string;
  canAcceptResponse: boolean;
  createdAt?: string;
  updatedAt?: string;

  // Legacy fallback fields
  title?: string;
  slug?: string;
}

const GRADIENTS = [
  "bg-gradient-to-br from-indigo-500 via-indigo-700 to-slate-950",
  "bg-gradient-to-br from-cyan-500 via-sky-700 to-slate-950",
  "bg-gradient-to-br from-emerald-500 via-teal-700 to-slate-950",
  "bg-gradient-to-br from-purple-500 via-fuchsia-700 to-slate-950",
  "bg-gradient-to-br from-amber-500 via-orange-700 to-stone-950",
  "bg-gradient-to-br from-rose-500 via-pink-700 to-slate-950",
];

const CHIP_MAP: Record<string, string> = {
  Workshop: "bg-indigo-50 border-indigo-100 text-indigo-600",
  Teardown: "bg-cyan-50 border-cyan-100 text-cyan-600",
  Hackathon: "bg-purple-50 border-purple-100 text-purple-700",
  Showcase: "bg-amber-50 border-amber-100 text-amber-600",
  Community: "bg-emerald-50 border-emerald-100 text-emerald-700",
};

export function adaptApiEventToUpcomingEvent(
  api: ApiEvent,
  index = 0
): UpcomingEvent {
  const slug = api.eventSlug || api.slug || "";
  const title = api.eventTitle || api.title || "Untitled Event";
  const tagline =
    api.eventSubtitle ||
    api.eventDetails?.tagline ||
    "Hands-on masterclass and workshop with industry experts and mentors.";

  // Parse dates
  let month = "Upcoming";
  let day = "";
  let dateLabel = "Upcoming Session";

  const rawDate = api.eventStartDate;
  if (rawDate) {
    try {
      const parts = rawDate.split("-");
      let d: Date;
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          // DD-MM-YYYY
          d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
      } else {
        d = new Date(rawDate);
      }

      if (!isNaN(d.getTime())) {
        month = d.toLocaleDateString("en-US", { month: "short" });
        day = String(d.getDate()).padStart(2, "0");
        dateLabel = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      } else {
        dateLabel = rawDate;
      }
    } catch {
      dateLabel = rawDate;
    }
  }

  // Format time
  let time = "6:00 PM IST";
  if (api.eventStartTime && api.eventEndTime) {
    time = `${api.eventStartTime} - ${api.eventEndTime} IST`;
  } else if (api.eventStartTime) {
    time = `${api.eventStartTime} IST`;
  }

  const isOffline =
    api.locationType?.toLowerCase().includes("person") ||
    api.locationType?.toLowerCase().includes("offline");

  const mode: "Online" | "In person" = isOffline ? "In person" : "Online";
  const location = api.location || (isOffline ? "Bengaluru · UpperCurve Campus" : "Online · Zoom");
  const type = api.eventType || "Workshop";

  // Gradient & Chip
  const gradient = GRADIENTS[(index + slug.length) % GRADIENTS.length];
  const chip = CHIP_MAP[type] || "bg-indigo-50 border-indigo-100 text-indigo-600";

  // Extract agenda / takeaways from eventDetails or fallbacks
  const details = api.eventDetails || {};
  const about: string[] = Array.isArray(details.about) && details.about.length > 0
    ? details.about
    : [
      tagline,
      "Gain real-world mental models, live guided project building experience, and network directly with top industry mentors and fellow peers.",
    ];

  const agenda = Array.isArray(details.agenda) && details.agenda.length > 0
    ? details.agenda
    : [
      { time: api.eventStartTime || "Start", item: `Kickoff & Introduction: ${title}` },
      { time: "Midway", item: "Live Framework Demonstration & Practical Walkthrough" },
      { time: api.eventEndTime || "End", item: "Interactive Q&A, Feedback & Next Steps" },
    ];

  const takeaways = Array.isArray(details.takeaways) && details.takeaways.length > 0
    ? details.takeaways
    : [
      "Hands-on frameworks and templates you can implement immediately",
      "Direct networking with top mentors and peers",
      "Official certificate of participation",
    ];

  return {
    id: api.id,
    slug,
    title,
    tagline,
    type,
    month,
    day,
    dateLabel,
    time,
    location,
    mode,
    gradient,
    chip,
    about,
    agenda,
    takeaways,
    bannerUrl: api.eventCreativeUrl || undefined,
    speakers: api.speakers || [],
    canAcceptResponse: api.canAcceptResponse,
  };
}

/**
 * Fetch all published events from backend.
 * Falls back to mock upcomingEvents if backend is unavailable.
 */
export async function getEvents(): Promise<UpcomingEvent[]> {
  try {
    const res = await fetch(`${API_BASE}/public/events`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.events || [];
      if (list.length > 0) {
        return list.map((ev: ApiEvent, idx: number) =>
          adaptApiEventToUpcomingEvent(ev, idx)
        );
      }
    }
  } catch (err) {
    console.warn("[getEvents] Could not fetch live events from API, falling back to static:", err);
  }

  return upcomingEvents;
}

/**
 * Fetch a single event by slug from backend.
 * Falls back to static upcomingEvents if not found in API.
 */
export async function getEventBySlug(slug: string): Promise<UpcomingEvent | null> {
  try {
    const res = await fetch(`${API_BASE}/public/events/${encodeURIComponent(slug)}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      const eventData = data?.event || data;
      if (eventData && (eventData.eventSlug || eventData.slug)) {
        return adaptApiEventToUpcomingEvent(eventData);
      }
    }
  } catch (err) {
    console.warn(`[getEventBySlug] Could not fetch event for slug ${slug}:`, err);
  }

  // Fallback to static
  const found = upcomingEvents.find((e) => e.slug === slug);
  return found || null;
}

export interface RegisterGuestPayload {
  eventId?: string;
  eventSlug?: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  userType?: "Professional" | "Student";
  linkedin?: string;
  referralCode?: string;
  expectation?: string;
  graduationYear?: string;
  collegeName?: string;
}

/**
 * Register a user as a guest/attendee for an event.
 * Posts to backend and creates an EventGuest row visible in the Admin Panel.
 */
export async function registerForEvent(payload: RegisterGuestPayload): Promise<{
  success: boolean;
  message?: string;
  guest?: any;
  alreadyRegistered?: boolean;
}> {
  try {
    const res = await fetch(`${API_BASE}/public/events/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.error || data.message || "Failed to register for event",
      };
    }

    return {
      success: true,
      message: data.message || "Registration successful!",
      guest: data.guest,
      alreadyRegistered: data.alreadyRegistered,
    };
  } catch (err: any) {
    console.error("[registerForEvent] Network error:", err);
    return {
      success: false,
      message: err.message || "Network error. Please try again.",
    };
  }
}
