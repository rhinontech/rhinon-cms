import type { Metadata } from "next";
import EventsPage from "@/components/Pages/Events/EventsPage";

export const metadata: Metadata = {
  title: "Events — UpperCurve",
  description:
    "Live workshops, build jams, career nights and community meetups from UpperCurve. Free for students, online and in person.",
};

export default function Page() {
  return <EventsPage />;
}
