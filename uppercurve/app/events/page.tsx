import type { Metadata } from "next";
import EventsLanding from "@/components/Pages/Events/EventsLanding/EventsLanding";
import { buildEventDetail } from "@/components/Pages/Events/shared/model";
import { CATEGORY_CONFIG } from "@/components/Pages/Events/shared/categoryConfig";
import { getPublishedEvents } from "@/services/eventService";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Events, Workshops & Certificates | UpperCurve",
  description:
    "Discover upcoming UpperCurve Events: Free AI Certificate Workshops that help you learn and grow.",
  alternates: {
    canonical: "/events",
  },
};

const byStart = (a: { startsAt: string | null }, b: { startsAt: string | null }) =>
  (a.startsAt ?? "9999").localeCompare(b.startsAt ?? "9999");

export default async function Page({ searchParams }: { searchParams: Promise<{ format?: string }> }) {
  const [{ format }, raw] = await Promise.all([searchParams, getPublishedEvents()]);

  // Internal cohorts keep working by direct link; they are just not advertised.
  const events = raw.map((api) => buildEventDetail(api)).filter((e) => CATEGORY_CONFIG[e.category].publicListing);

  const upcoming = events.filter((e) => !e.isPast).sort(byStart);
  const past = events.filter((e) => e.isPast).sort((a, b) => byStart(b, a));

  return <EventsLanding upcoming={upcoming} past={past} initialFormat={format} />;
}
