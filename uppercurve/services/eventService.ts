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

export interface RegistrationResult {
  success: boolean;
  message?: string;
  alreadyRegistered?: boolean;
  guestType?: "Approved" | "Waitlist" | "Declined";
  /** Opens the guest's own registration page: /events/<slug>/registered?token=… */
  token?: string;
  /** The guest's own code to share. */
  referralCode?: string;
}

/**
 * Registers a guest. Workshops put guests on the waitlist until an admin
 * approves them; Teardowns and Hackathons confirm at once. Either way an
 * enrollment email goes out from the backend.
 */
export async function registerForEvent(payload: RegisterGuestPayload): Promise<RegistrationResult> {
  try {
    const res = await fetch(`${API_BASE}/public/events/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, message: data.error || data.message || "Failed to register for event" };
    }
    return {
      success: true,
      message: data.message,
      alreadyRegistered: data.alreadyRegistered,
      guestType: data.guestType,
      token: data.token,
      referralCode: data.referralCode,
    };
  } catch (err) {
    console.error("[registerForEvent] Network error:", err);
    return { success: false, message: "Network error. Please try again." };
  }
}

export interface GuestPage {
  guest: {
    name: string;
    email: string | null;
    guestType: "Approved" | "Waitlist" | "Declined";
    userType: string | null;
    ownReferralCode: string | null;
    feedbackSubmitted: boolean;
    certificateApproved: boolean;
    certificateId: string | null;
    registeredAt: string;
  };
  event: {
    title: string;
    slug: string;
    type: string;
    category: string;
    startDate: string;
    endDate: string;
    startTime: string | null;
    endTime: string | null;
    location: string | null;
    locationType: string | null;
    bannerUrl: string | null;
    acceptingFeedback: boolean;
    whatsappLink: string | null;
  };
}

/** A guest's own registration page, from the signed token in their link. */
export async function getGuestPage(slug: string, token: string): Promise<GuestPage | { error: string }> {
  try {
    const res = await fetch(`${API_BASE}/public/events/${encodeURIComponent(slug)}/guest?token=${encodeURIComponent(token)}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    const data = await res.json().catch(() => ({}));
    return res.ok ? (data as GuestPage) : { error: data.message || "This link isn't valid." };
  } catch {
    return { error: "We couldn't reach the server. Please try again." };
  }
}

export async function submitFeedback(
  slug: string,
  token: string,
  feedbackData: Record<string, string | number | boolean>
): Promise<{ success: boolean; message?: string; code?: string }> {
  try {
    const res = await fetch(`${API_BASE}/public/events/${encodeURIComponent(slug)}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ token, feedbackData }),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { success: true } : { success: false, message: data.error || "Could not submit", code: data.code };
  } catch {
    return { success: false, message: "Network error. Please try again." };
  }
}

export interface CertificateCheck {
  valid: boolean;
  certificateId?: string;
  name?: string;
  certificateName?: string;
  issuedAt?: string;
  imageUrl?: string;
  event?: { title: string; slug: string; startDate: string; endDate: string };
}

export async function verifyCertificate(id: string): Promise<CertificateCheck> {
  try {
    const res = await fetch(`${API_BASE}/public/certificates/${encodeURIComponent(id)}`, { cache: "no-store" });
    return (await res.json().catch(() => ({ valid: false }))) as CertificateCheck;
  } catch {
    return { valid: false };
  }
}

export async function checkGuestStatus(slug: string, email: string): Promise<"Approved" | "Waitlist" | "Declined" | null> {
  try {
    const res = await fetch(`${API_BASE}/public/events/check-guest-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, email }),
    });
    const data = await res.json().catch(() => ({}));
    return data?.result === "SUBMITTED" ? data.guestType : null;
  } catch {
    return null;
  }
}
