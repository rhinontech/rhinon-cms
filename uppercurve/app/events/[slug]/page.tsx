import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventDetails from "@/components/Pages/Events/EventDetails/EventDetails";
import { getEventBySlug } from "@/services/eventService";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
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
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  return <EventDetails event={event} />;
}
