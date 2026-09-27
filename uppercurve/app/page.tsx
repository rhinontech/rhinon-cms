import Homepage from "@/components/Pages/Homepage/Homepage";
import { COURSES } from "@/components/Pages/Courses/courseData";
import { buildEventDetail } from "@/components/Pages/Events/shared/model";
import { CATEGORY_CONFIG } from "@/components/Pages/Events/shared/categoryConfig";
import { getPublishedEvents } from "@/services/eventService";
import { getBlogs } from "@/services/blogService";

// Events change daily and the API is read without caching, as on /events.
export const dynamic = "force-dynamic";

const byStart = (a: { startsAt: string | null }, b: { startsAt: string | null }) =>
  (a.startsAt ?? "9999").localeCompare(b.startsAt ?? "9999");

export default async function Page() {
  const [raw, posts] = await Promise.all([getPublishedEvents(), getBlogs()]);
  const events = raw.map((api) => buildEventDetail(api)).filter((e) => CATEGORY_CONFIG[e.category].publicListing);

  return (
    <Homepage
      course={COURSES[0]}
      upcoming={events.filter((e) => !e.isPast).sort(byStart)}
      past={events.filter((e) => e.isPast).sort((a, b) => byStart(b, a))}
      posts={posts}
    />
  );
}
