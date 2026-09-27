import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventDetail from "@/components/Pages/Events/EventDetail/EventDetail";
import { buildEventDetail } from "@/components/Pages/Events/shared/model";
import { CATEGORY_CONFIG } from "@/components/Pages/Events/shared/categoryConfig";
import { getEventDetailBySlug, getPublishedEvents } from "@/services/eventService";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const api = await getEventDetailBySlug(slug);
  if (!api) {
    return { title: "Event not found — UpperCurve" };
  }
  const event = buildEventDetail(api);
  return {
    title: `${event.title} — UpperCurve Events`,
    description: event.subtitle || undefined,
    openGraph: {
      title: event.title,
      description: event.subtitle || undefined,
      images: event.bannerUrl ? [{ url: event.bannerUrl }] : undefined,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Rendered on the server so the page arrives complete — no loader, and the
  // content is there for search engines and link previews.
  const [api, all] = await Promise.all([getEventDetailBySlug(slug), getPublishedEvents()]);
  if (!api) notFound();

  const event = buildEventDetail(api);
  const moreEvents = all
    .map((item) => buildEventDetail(item))
    .filter((e) => e.slug !== event.slug && !e.isPast && CATEGORY_CONFIG[e.category].publicListing)
    .sort((a, b) => (a.startsAt ?? "9999").localeCompare(b.startsAt ?? "9999"))
    .slice(0, 3);

  return <EventDetail event={event} moreEvents={moreEvents} />;
}
