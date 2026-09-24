import type { ReactNode } from "react";
import type { EventCategory, EventDetailModel } from "../shared/model";
import { CATEGORY_CONFIG, type CategoryConfig } from "../shared/categoryConfig";
import { RegistrationProvider } from "./registration";
import Hero from "./sections/Hero";
import RegistrationCard from "./sections/RegistrationCard";
import Highlight from "./sections/Highlight";
import CertificateSection from "./sections/Certificate";
import {
  AboutSection,
  AudienceSection,
  OutcomesSection,
  ScheduleSection,
  SpeakersSection,
} from "./sections/ContentSections";
import { FaqSection, FinalCta, MobileRegisterBar, MoreEvents } from "./sections/Closing";

type SectionKey = "about" | "highlight" | "outcomes" | "schedule" | "speakers" | "certificate" | "audience" | "faq";

/**
 * Reading order per category. A certificate track leads with how the
 * certificate is earned and calls its schedule a curriculum; a community night
 * leads with why people keep coming; an internal cohort keeps its preparation
 * notes after the programme.
 */
const ORDER: Record<EventCategory, SectionKey[]> = {
  Normal: ["about", "outcomes", "schedule", "speakers", "certificate", "audience", "faq"],
  Community: ["about", "highlight", "schedule", "outcomes", "speakers", "audience", "faq"],
  MicroCertificate: ["about", "highlight", "schedule", "outcomes", "speakers", "certificate", "audience", "faq"],
  GenAiMicroCertificate: ["about", "highlight", "schedule", "outcomes", "speakers", "certificate", "audience", "faq"],
  Claude: ["about", "highlight", "schedule", "outcomes", "speakers", "certificate", "audience", "faq"],
  ClaudeOneDay: ["about", "highlight", "schedule", "outcomes", "speakers", "certificate", "audience", "faq"],
  InternalCohort: ["about", "schedule", "outcomes", "highlight", "speakers", "faq"],
};

function renderSection(key: SectionKey, event: EventDetailModel, config: CategoryConfig): ReactNode {
  switch (key) {
    case "about":
      return <AboutSection key={key} event={event} config={config} />;
    case "highlight":
      return config.highlight ? (
        <div key={key} className="py-10 sm:py-12">
          <Highlight event={event} config={config} />
        </div>
      ) : null;
    case "outcomes":
      return <OutcomesSection key={key} event={event} config={config} />;
    case "schedule":
      return <ScheduleSection key={key} event={event} config={config} />;
    case "speakers":
      return <SpeakersSection key={key} event={event} config={config} />;
    case "certificate":
      return <CertificateSection key={key} event={event} config={config} />;
    case "audience":
      return <AudienceSection key={key} event={event} config={config} />;
    case "faq":
      return <FaqSection key={key} event={event} config={config} />;
  }
}

export default function EventDetail({
  event,
  moreEvents,
}: {
  event: EventDetailModel;
  moreEvents: EventDetailModel[];
}) {
  const config = CATEGORY_CONFIG[event.category];

  return (
    <RegistrationProvider
      event={{
        id: event.id,
        slug: event.slug,
        title: event.title,
        dateLabel: event.dateLabel,
        timeLabel: event.timeLabel,
      }}
    >
      <main className="w-full bg-white text-[#0B1B3D] font-[family-name:var(--font-plus-jakarta)] pb-20 lg:pb-0">
        <Hero event={event} config={config} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-6">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
            <div className="lg:col-span-8 min-w-0">
              {ORDER[event.category].map((key) => renderSection(key, event, config))}
            </div>
            <aside className="hidden lg:block lg:col-span-4">
              <div className="sticky top-24">
                <RegistrationCard event={event} config={config} />
              </div>
            </aside>
          </div>
        </div>

        <FinalCta event={event} config={config} />
        <MoreEvents events={moreEvents} />
        <MobileRegisterBar event={event} />
      </main>
    </RegistrationProvider>
  );
}
