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
  eventDetails?: Record<string, unknown> | null;
  eventSlug: string;
  canAcceptResponse: boolean;
  createdAt?: string;
  updatedAt?: string;

  // Legacy fallback fields
  title?: string;
  slug?: string;
}

/**
 * Every published event, raw. Returns [] when the API is unreachable rather
 * than falling back to mock data: the mock events had slugs that 404, so a
 * visitor could click straight from the listing into a dead page.
 */
export async function getPublishedEvents(): Promise<ApiEvent[]> {
  try {
    const res = await fetch(`${API_BASE}/public/events`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data) ? data : data?.events;
    return Array.isArray(list) ? (list as ApiEvent[]) : [];
  } catch (err) {
    console.warn("[getPublishedEvents] Could not fetch events:", err);
    return [];
  }
}

/**
 * The raw API event for the detail page. Unlike getEventBySlug it does not
 * flatten into the listing card shape, because the detail page needs the
 * category, CTA type and the full eventDetails the admin forms write — and it
 * does not fall back to static mock data, so a bad slug is a real 404.
 */
export async function getEventDetailBySlug(slug: string): Promise<ApiEvent | null> {
  try {
    const res = await fetch(`${API_BASE}/public/events/${encodeURIComponent(slug)}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const event = data?.event || data;
    return event && (event.eventSlug || event.slug) ? (event as ApiEvent) : null;
  } catch (err) {
    console.warn(`[getEventDetailBySlug] Could not fetch event ${slug}:`, err);
    return null;
  }
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
  guest?: unknown;
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
  } catch (err) {
    console.error("[registerForEvent] Network error:", err);
    return {
      success: false,
      message: (err instanceof Error && err.message) || "Network error. Please try again.",
    };
  }
}
