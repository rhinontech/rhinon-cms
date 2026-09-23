import React from "react";
import EventsHero from "./EventsHero/EventsHero";
import FeaturedMasterclass from "./FeaturedMasterclass/FeaturedMasterclass";
import UpcomingEventsSection from "./UpcomingEventsSection/UpcomingEventsSection";
import PastEventsTimeline from "./PastEventsTimeline/PastEventsTimeline";
import TopicFAQSection from "../Homepage/TopicFAQSection/TopicFAQSection";

export function EventsPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center">
      <div className="w-full max-w-7xl">
        <EventsHero />
      </div>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
        <FeaturedMasterclass />
      </div>
      {/* <div id="upcoming" className="w-full max-w-7xl mx-auto max-sm:px-5">
        <UpcomingEventsSection />
      </div> */}
      {/* <div id="past-events" className="w-full max-w-7xl mx-auto max-sm:px-5">
        <PastEventsTimeline />
      </div> */}
      <div id="faqs" className="w-full  mx-auto">
        <TopicFAQSection />
      </div>
    </main>
  );
}

export default EventsPage;
