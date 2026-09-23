import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventDetails from "@/components/Pages/Events/EventDetails/EventDetails";
import { getEventBySlug, upcomingEvents } from "@/components/Pages/Events/eventsData";

export function generateStaticParams() {
  return upcomingEvents.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  if (!event) {
    return { title: "Event not found — UpperCurve" };
  }
  return {
    title: `${event.title} — UpperCurve Events`,
    description: event.tagline,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  return <EventDetails event={event} />;
}
