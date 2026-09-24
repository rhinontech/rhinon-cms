import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import EventCard from "../../EventsLanding/EventCard";
import type { EventDetailModel } from "../../shared/model";
import type { CategoryConfig } from "../../shared/categoryConfig";
import { RegisterButton } from "../registration";
import { Section, SectionHeading } from "../../shared/ui";

/**
 * Native <details>: accessible, keyboard-friendly, and no client JavaScript.
 * An event's own FAQs (eventDetails.faqs) replace the category defaults.
 */
export function FaqSection({ event, config }: { event: EventDetailModel; config: CategoryConfig }) {
  const faqs = event.faqs.length ? event.faqs : config.faqs;
  if (!faqs.length) return null;
  return (
    <Section id="faq">
      <SectionHeading eyebrow="FAQ" title="Questions, answered" accentClass={config.accent.text} />
      <div className="mt-8 divide-y divide-[#E8ECF3] border-y border-[#E8ECF3]">
        {faqs.map((faq) => (
          <details key={faq.question} className="group py-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[16px] font-semibold text-[#0B1B3D]">
              {faq.question}
              <span className="grid place-items-center shrink-0 w-7 h-7 rounded-full border border-[#E2E8F0] text-[#475569] transition-transform duration-200 group-open:rotate-45 group-open:border-[#0052FF] group-open:text-[#0052FF]">
                <Plus className="w-4 h-4" aria-hidden />
              </span>
            </summary>
            <p className="mt-3 pr-12 text-[15px] text-[#475569] leading-relaxed">{faq.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

export function MoreEvents({ events }: { events: EventDetailModel[] }) {
  if (!events.length) return null;
  return (
    <section className="bg-[#F8FAFC] border-t border-[#EEF1F6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="Keep learning" title="More upcoming events" />
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-[13px] font-bold tracking-wider uppercase text-[#0052FF] hover:text-[#0043CC]"
          >
            All events <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((item) => (
            <EventCard key={item.slug} event={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta({ event, config }: { event: EventDetailModel; config: CategoryConfig }) {
  if (!event.canRegister) return null;
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-16 sm:pb-20">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-tr from-[#021338] via-[#052b82] to-[#0d59eb] px-6 py-12 sm:px-14 sm:py-16 text-white shadow-[0_30px_70px_-30px_rgba(5,43,130,0.6)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(0,194,255,0.35),transparent_65%)]"
        />
        <div className="relative grid lg:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <h2 className="text-3xl sm:text-[40px] font-extrabold tracking-tight leading-[1.1]">
              {config.restriction ? (
                <>
                  Request your place. <span className="font-serif italic font-normal">Faculty only.</span>
                </>
              ) : (
                <>
                  Save your seat. <span className="font-serif italic font-normal">It&apos;s free.</span>
                </>
              )}
            </h2>
            <p className="mt-4 text-[15px] sm:text-base text-white/75 max-w-xl leading-relaxed">
              {event.title} · {event.dateLabel} · {event.timeLabel}
            </p>
          </div>
          <RegisterButton label={event.ctaLabel} variant="light" className="justify-self-start lg:justify-self-end" />
        </div>
      </div>
    </section>
  );
}

/** Phones never see the sticky card, so they get a bar instead. */
export function MobileRegisterBar({ event }: { event: EventDetailModel }) {
  if (!event.canRegister) return null;
  return (
    <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-[#E6EAF2] bg-white/95 backdrop-blur px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-[#0B1B3D] truncate">{event.dateLabel}</p>
          <p className="text-[12px] text-[#64748B] truncate">{event.timeLabel}</p>
        </div>
        <RegisterButton label={event.ctaLabel} className="shrink-0 px-5 py-3" />
      </div>
    </div>
  );
}
