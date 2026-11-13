import { api } from "./api";
import { defineLive, replace, toneAt, write } from "./live-core";
import { EVENTS, type EventItem } from "./mock-more";
import { type Guest, type Post } from "./mock-more";
import { actions, getState, hydrate } from "./store";

/**
 * The Content module for the platform team: published brands' blogs and case studies
 * waiting for approval, plus events and door check-in. Registered as "content" so the
 * brand switcher's resync("content") reaches it.
 */

type ApiSite = { id: string; slug: string };
type ApiEvent = {
  id: string; title?: string | null; eventTitle?: string | null; eventStartDate?: string | null; eventStartTime?: string | null;
  location?: string | null; numberOfAttendees?: number | null; siteId?: string | null;
  registrations?: { total: number; approved: number; waitlist: number; checkedIn: number } | null;
};
type ApiPost = {
  id: string; title: string; excerpt?: string | null; authorName?: string | null; readTime?: string | null;
  content?: string | null; contentBlocks?: { type: string; html?: string }[] | null; siteId?: string | null; status: "Draft" | "Published";
};

/** Which content type an id belongs to, so an approval hits the right endpoint. */
const postKind = new Map<string, "blogs" | "case-studies">();

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function whenLabel(date?: string | null, time?: string | null): string {
  if (!date) return "Date TBC";
  const d = new Date(`${date.slice(0, 10)}T${(time || "00:00").slice(0, 5)}:00`);
  if (isNaN(d.getTime())) return date;
  const day = `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  if (!time) return day;
  const h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${day} · ${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** Strip HTML to a few readable paragraphs for the in-app reader. */
function paras(p: ApiPost): string[] {
  const html = (p.contentBlocks?.filter((b) => b.type === "paragraph").map((b) => b.html || "").join("\n") || p.content || "");
  return html
    .replace(/<\/(p|h[1-6]|li|div)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&ldquo;|&rdquo;/g, '"').replace(/&rsquo;/g, "'")
    .split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 8);
}
const wordsOf = (p: ApiPost): number => paras(p).join(" ").split(/\s+/).filter(Boolean).length;
const mapStatus = (s: "Draft" | "Published"): Post["status"] => (s === "Published" ? "Approved" : "Review");

async function syncContent() {
  const slug = getState().brand;
  // uuid → brand slug, so an event/post shows under the brand that owns it.
  const sites = await api<ApiSite[]>("/sites").catch(() => [] as ApiSite[]);
  const bySite = new Map(sites.map((s) => [s.id, s.slug]));

  // ── events + live counts ──────────────────────────────────────────────
  const evRes = await api<{ events: ApiEvent[] }>("/events").catch(() => ({ events: [] as ApiEvent[] }));
  replace(EVENTS, (evRes.events || []).map((e, i): EventItem => {
    const r = e.registrations || { total: 0, approved: 0, waitlist: 0, checkedIn: 0 };
    return {
      id: e.id, title: e.title || e.eventTitle || "Untitled event",
      when: whenLabel(e.eventStartDate, e.eventStartTime), where: e.location || "Venue TBC",
      capacity: e.numberOfAttendees || 0, brand: (e.siteId && bySite.get(e.siteId)) || slug, tone: toneAt(i),
      approved: r.approved, checkedIn: r.checkedIn,
    };
  }));

  // ── posts: drafts to approve + published, blogs and case studies ──────
  postKind.clear();
  const [blogs, studies] = await Promise.all([
    api<ApiPost[]>(`/content/blogs?domain=${encodeURIComponent(slug)}`).catch(() => [] as ApiPost[]),
    api<ApiPost[]>("/content/case-studies").catch(() => [] as ApiPost[]),
  ]);
  const toPost = (p: ApiPost, kind: Post["kind"], endpoint: "blogs" | "case-studies"): Post => {
    postKind.set(p.id, endpoint);
    return {
      id: p.id, title: p.title, brand: (p.siteId && bySite.get(p.siteId)) || slug, author: p.authorName || "—",
      kind, words: wordsOf(p), excerpt: p.excerpt || "", paragraphs: paras(p), status: mapStatus(p.status),
    };
  };
  const posts: Post[] = [
    ...blogs.map((b) => toPost(b, "Blog", "blogs")),
    ...studies.map((s) => toPost(s, "Case study", "case-studies")),
  ].sort((a, b) => (a.status === "Review" ? -1 : 1) - (b.status === "Review" ? -1 : 1));
  hydrate({ posts });
}

/** Load one event's approved guests for the door screen. */
export async function loadEventGuests(eventId: string): Promise<void> {
  const res = await api<{ guests: Guest[] }>(`/events/${eventId}/guests`).catch(() => ({ guests: [] as Guest[] }));
  hydrate({ guests: { ...getState().guests, [eventId]: res.guests } });
}

defineLive({
  name: "content",
  sync: syncContent,
  blank: () => { replace(EVENTS, []); hydrate({ posts: [], guests: {} }); },
  install: ({ orig }) => {
    // Checking a guest in posts to the door endpoint; scanNext rides on this too.
    actions.checkIn = (eventId, guestId, value = true) => {
      orig.checkIn(eventId, guestId, value);
      write("content", () => api(`/events/${eventId}/guests/${guestId}/checkin`, { method: "POST", body: { value } }));
    };
    // Approving a post publishes it; "Request changes" leaves it as a draft (no backend state for it yet).
    actions.decidePost = (id, status) => {
      orig.decidePost(id, status);
      if (status === "Approved") {
        const kind = postKind.get(id) ?? "blogs";
        write("content", () => api(`/content/${kind}/${id}`, { method: "PUT", body: { status: "Published" } }));
      }
    };
  },
});
