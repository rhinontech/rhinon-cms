"use client";

import React, { useState } from "react";
import Link from "next/link";
import { UpcomingEvent, upcomingEvents } from "../eventsData";
import SaveSeatForm from "./SaveSeatForm";
import TopicFAQSection from "../../Homepage/TopicFAQSection/TopicFAQSection";
import EventHero from "./EventHero";
import EventCompaniesMarquee from "./EventCompaniesMarquee";
import EventAiNewsMarquee from "./EventAiNewsMarquee";
import EventWhoShouldJoin from "./EventWhoShouldJoin";
import EventCurriculum from "./EventCurriculum";
import EventAiToolKit from "./EventAiToolKit";
import EventReferralRewards from "./EventReferralRewards";
import EventCertificateSection from "./EventCertificateSection";
import EventCommunityTestimonials from "./EventCommunityTestimonials";
import EventCountdownCta from "./EventCountdownCta";
import EventStickyBar from "./EventStickyBar";
import EventRegistrationModal from "./EventRegistrationModal";

const serifStyle = { fontFamily: 'Georgia, "Times New Roman", Times, serif' };

function FactRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-100 last:border-0 font-poppins">
      <div className="flex items-center gap-2.5 text-gray-500 text-xs font-normal">
        <span className="text-indigo-600 shrink-0">{icon}</span>
        <span>{label}</span>
      </div>
      <span className="text-xs sm:text-sm font-medium text-gray-900 text-right">
        {value}
      </span>
    </div>
  );
}

export function EventDetails({ event }: { event: UpcomingEvent }) {
  const moreEvents = upcomingEvents.filter((e) => e.slug !== event.slug).slice(0, 3);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const handleOpenRegister = () => {
    setIsRegisterModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-white flex flex-col items-center">
      {/* Top Breadcrumb Bar */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-2">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-full border border-gray-200 shadow-2xs group font-poppins"
        >
          <svg
            className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 text-indigo-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span>Back to All Events</span>
        </Link>
      </div>

      {/* Hero Section matching screenshot UI in UpperCurve white theme */}
      <div className="w-full">
        <EventHero
          title={event.title}
          description={event.tagline}
          startDate={event.dateLabel}
          startTime={event.time}
          duration="5+ Hours of Live AI PM Training"
          onRegisterClick={handleOpenRegister}
        />
      </div>

      {/* Infinite Moving Companies Marquee (Right to Left) */}
      <EventCompaniesMarquee />

      {/* AI Layoffs & News Infinite Moving Marquee (Right to Left) */}
      <EventAiNewsMarquee />

      {/* Who Should Join Micro-Certification Section */}
      <EventWhoShouldJoin />

      {/* Curriculum: What You'll Learn in 5 Hours Section */}
      <EventCurriculum />

      {/* AI Tool Kit: Tools You Will Learn Section */}
      <EventAiToolKit />

      {/* Unlock Exclusive Rewards by Referring Section */}
      <EventReferralRewards />

      {/* Earn Your Certificate of Participation Section */}
      <EventCertificateSection />

      {/* Hear from the Community Infinite Marquee Section */}
      <EventCommunityTestimonials />

      {/* Live Session Countdown & Registration CTA Section */}
      <EventCountdownCta
        eventTitle={event.title}
        onRegisterClick={handleOpenRegister}
      />

      {/* FAQ Section at bottom */}
      <div className="w-full border-t border-gray-200/80 bg-white pb-20 sm:pb-24">
        <TopicFAQSection />
      </div>

      {/* Bottom Sticky Action Bar matching screenshot */}
      <EventStickyBar
        eventTitle={event.title}
        originalPrice="₹4,999"
        discountedPrice="Free"
        slotsLeft="30 Slots"
        onRegisterClick={handleOpenRegister}
      />

      {/* Event Registration Form Modal */}
      <EventRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        eventTitle={event.title}
        eventDate={event.dateLabel}
        eventTime={event.time}
        eventId={(event as any).id}
        eventSlug={event.slug}
      />
    </main>
  );
}

export default EventDetails;
