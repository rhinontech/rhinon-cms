// Rhinon Tech backend — the same Postgres-backed API the admin-panel writes to.
// Content (blogs, case studies) and lead capture all flow through here.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.rhinontech.in";

export type BlogBlock =
  | { id: string; type: "paragraph"; html: string }
  | { id: string; type: "image"; url: string; alt?: string; credit?: string }
  | { id: string; type: "video"; url: string; caption?: string }
  | { id: string; type: "youtube"; url: string; caption?: string };

export interface BlogFaq {
  question: string;
  answer: string;
}

export interface Blog {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  contentBlocks?: BlogBlock[];
  faqs?: BlogFaq[];
  category?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  slug: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string | null;
  coverImage?: string | null;
  tags: string[];
  readTime: string;
  publishedAt: string;
}

export interface CaseStudyStat {
  value: string;
  suffix?: string;
  label: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  description: string;
  content?: string | null;
  contentBlocks?: BlogBlock[];
  slug: string;
  client?: string | null;
  industry?: string | null;
  category?: string | null;
  timeline?: string | null;
  liveLink?: string | null;
  date?: string | null;
  result?: string | null;
  quote?: string | null;
  image?: string | null;
  images?: string[];
  stats: CaseStudyStat[];
  displayOrder: number;
}

async function getJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getBlogs(): Promise<Blog[]> {
  return (await getJSON<Blog[]>("/public/blogs")) ?? [];
}

export async function getBlog(slug: string): Promise<Blog | null> {
  return getJSON<Blog>(`/public/blogs/${encodeURIComponent(slug)}`);
}

export async function getCaseStudies(): Promise<CaseStudy[]> {
  return (await getJSON<CaseStudy[]>("/public/case-studies")) ?? [];
}

export async function getCaseStudy(slug: string): Promise<CaseStudy | null> {
  return getJSON<CaseStudy>(`/public/case-studies/${encodeURIComponent(slug)}`);
}

export interface PlatformLeadPayload {
  name: string;
  email: string;
  phone: string;
  website: string;
  institutionType: string;
  annualLeadVolume: string;
  teamSize?: string;
  message?: string;
  source?: string;
}

export async function createPlatformLead(payload: PlatformLeadPayload): Promise<void> {
  const res = await fetch(`${API_BASE}/public/platform-leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to submit lead");
  }
}

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface AvailabilityResponse {
  date: string;
  timezone: string;
  slots: AvailabilitySlot[];
}

/** Real availability off the shared Rhinon calendar — booked slots come back available:false. */
export async function getScheduleCallAvailability(dateStr: string): Promise<AvailabilityResponse> {
  const res = await fetch(`${API_BASE}/public/schedule-call/availability?date=${encodeURIComponent(dateStr)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const err = new Error(errData.message || "Could not load available times") as Error & { code?: string };
    err.code = errData.code;
    throw err;
  }
  return res.json();
}

export interface ScheduleCallPayload extends Omit<PlatformLeadPayload, "source"> {
  /** ISO start of the chosen slot. */
  startTime: string;
  timezone: string;
}

export interface ScheduleCallResult {
  ok: boolean;
  /** false when the calendar write failed — the enquiry is saved, but nothing is booked yet. */
  booked: boolean;
  inviteSent: boolean;
  booking: { startTime: string; endTime: string; meetLink: string | null };
}

export async function bookScheduleCall(payload: ScheduleCallPayload): Promise<ScheduleCallResult> {
  const res = await fetch(`${API_BASE}/public/schedule-call`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const err = new Error(errData.message || "Could not book that time") as Error & { code?: string };
    err.code = errData.code;
    throw err;
  }
  return res.json();
}

