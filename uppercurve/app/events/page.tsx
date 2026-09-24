import type { Metadata } from "next";
import EventsPage from "@/components/Pages/Events/EventsPage";
import { getEvents } from "@/services/eventService";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Events — UpperCurve",
  description:
    "Live workshops, build jams, career nights and community meetups from UpperCurve. Free for students, online and in person.",
};

export default async function Page() {
  const events = await getEvents();
  return <EventsPage events={events} />;
}

