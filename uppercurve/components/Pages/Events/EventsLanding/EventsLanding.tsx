import type { EventDetailModel } from "../shared/model";
import { SectionHeading } from "../shared/ui";
import LandingHero from "./sections/LandingHero";
import EventsExplorer from "./EventsExplorer";
import Formats from "./sections/Formats";
import CertificateShowcase from "./sections/CertificateShowcase";
import Hosts from "./sections/Hosts";
import { HowItWorks, LandingCta, LandingFaq, PastEvents } from "./sections/Closing";

export default function EventsLanding({
  upcoming,
  past,
  initialFormat,
}: {
  upcoming: EventDetailModel[];
  past: EventDetailModel[];
  initialFormat?: string;
}) {
  return (
    <main className="w-full bg-white text-[#0B1B3D] font-[family-name:var(--font-plus-jakarta)]">
      <LandingHero upcoming={upcoming} />

      <section id="events" className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-24">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <SectionHeading
            eyebrow="Upcoming"
            title="Pick your next session"
            description="Filter by format or by where you want to be. Everything here is free to attend."
          />
        </div>
        {/* Keyed on the format so following a ?format= link from further down
            the page resets the filter instead of keeping the old selection. */}
        <EventsExplorer key={initialFormat ?? "all"} events={upcoming} initialFormat={initialFormat} />
      </section>

      <Formats upcoming={upcoming} />
      <CertificateShowcase upcoming={upcoming} />
      <Hosts upcoming={upcoming} />
      <HowItWorks />
      <LandingFaq />
      <PastEvents past={past} />
      <LandingCta />
    </main>
  );
}
