/** An event as the admin API returns it. */
export interface IEvent {
  id: number | string;
  eventTitle: string;
  eventSubtitle?: string;
  eventStartDate: string;
  eventEndDate: string;
  eventStartTime?: string;
  eventEndTime?: string;
  eventType: "Teardown" | "Hackathon" | "Workshop";
  ctaType: "Join Waitlist" | "Register Now";
  speakers: {
    name: string;
    designation: string;
    company: string;
    photoUrl?: string;
  }[];
  tags: string[];
  isPublished: boolean;
  numberOfAttendees: number;
  eventCreativeUrl: string;
  eventSlug: string;
  canAcceptResponse: boolean;
  locationType?: string;
  location?: string;
  eventCategory?: string;
  eventDetails?: Record<string, unknown> | null;
  /** Present on the list endpoint only. */
  registrations?: { total: number; approved: number; waitlist: number };
  createdAt?: string;
}
