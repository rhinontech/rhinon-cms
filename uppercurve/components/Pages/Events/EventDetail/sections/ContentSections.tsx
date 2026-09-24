import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import type { EventDetailModel } from "../../shared/model";
import type { CategoryConfig } from "../../shared/categoryConfig";
import { Card, Section, SectionHeading } from "../../shared/ui";

export function AboutSection({ event, config }: { event: EventDetailModel; config: CategoryConfig }) {
  if (!event.about.length) return null;
  const [lead, ...rest] = event.about;
  return (
    <Section id="about">
      <SectionHeading eyebrow="About this event" title="What this session is about" accentClass={config.accent.text} />
      <p className="mt-6 text-lg text-[#0B1B3D] leading-relaxed font-medium">{lead}</p>
      {rest.map((paragraph) => (
        <p key={paragraph} className="mt-4 text-[15px] sm:text-base text-[#475569] leading-relaxed">
          {paragraph}
        </p>
      ))}
    </Section>
  );
}

export function OutcomesSection({ event, config }: { event: EventDetailModel; config: CategoryConfig }) {
  if (!event.outcomes.length) return null;
  return (
    <Section id="outcomes">
      <SectionHeading eyebrow="Outcomes" title={config.outcomesTitle} accentClass={config.accent.text} />
      <ul className="mt-8 grid sm:grid-cols-2 gap-4">
        {event.outcomes.map((outcome) => (
          <li key={outcome}>
            <Card className="h-full p-5 flex gap-3.5">
              <span className={`shrink-0 grid place-items-center w-9 h-9 rounded-xl ${config.accent.soft}`}>
                <CheckCircle2 className={`w-[18px] h-[18px] ${config.accent.text}`} aria-hidden />
              </span>
              <span className="text-[15px] text-[#1E293B] leading-relaxed">{outcome}</span>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function ScheduleSection({ event, config }: { event: EventDetailModel; config: CategoryConfig }) {
  if (!event.schedule.length) return null;
  return (
    <Section id="schedule">
      <SectionHeading eyebrow={config.scheduleEyebrow} title={config.scheduleTitle} accentClass={config.accent.text} />
      <ol className="mt-8 relative">
        {event.schedule.map((slot, index) => {
          const last = index === event.schedule.length - 1;
          return (
            <li key={`${slot.label}-${index}`} className="relative grid grid-cols-[auto_1fr] gap-x-5">
              <div className="flex flex-col items-center">
                <span
                  className={`grid place-items-center w-9 h-9 rounded-full text-[13px] font-bold border-2 border-white shadow-[0_0_0_1px_#E2E8F0] ${
                    index === 0 ? "bg-[#0052FF] text-white" : "bg-white text-[#0B1B3D]"
                  }`}
                >
                  {index + 1}
                </span>
                {last ? null : <span className="w-px flex-1 bg-[#E2E8F0] my-1" aria-hidden />}
              </div>
              <div className={last ? "pb-0" : "pb-7"}>
                {slot.label ? (
                  <p className={`text-[12px] font-semibold tracking-[0.12em] uppercase ${config.accent.text}`}>
                    {slot.label}
                  </p>
                ) : null}
                <p className="mt-1 text-[16px] font-semibold text-[#0B1B3D] leading-snug">{slot.title}</p>
                {slot.points.length ? (
                  <ul className="mt-2 space-y-1">
                    {slot.points.map((point) => (
                      <li key={point} className="text-[14px] text-[#64748B] leading-relaxed">
                        {point}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

export function SpeakersSection({ event, config }: { event: EventDetailModel; config: CategoryConfig }) {
  if (!event.speakers.length) return null;
  const single = event.speakers.length === 1;
  return (
    <Section id="speakers">
      <SectionHeading
        eyebrow={single ? "Your host" : "Your hosts"}
        title={single ? "Learn from a practitioner" : "Learn from practitioners"}
        accentClass={config.accent.text}
      />
      <div className={`mt-8 grid gap-4 ${single ? "" : "sm:grid-cols-2"}`}>
        {event.speakers.map((speaker) => (
          <Card key={speaker.name} className="p-4 flex items-center gap-4">
            <div className="relative shrink-0 w-[72px] h-[72px] rounded-2xl overflow-hidden bg-[#E2E8F0]">
              {speaker.photoUrl ? (
                <Image src={speaker.photoUrl} alt={speaker.name} fill sizes="72px" className="object-cover" />
              ) : (
                <span className="grid place-items-center w-full h-full text-xl font-bold text-[#475569]">
                  {speaker.name.charAt(0)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[16px] font-bold text-[#0B1B3D]">{speaker.name}</p>
              {speaker.designation ? (
                <p className="text-[14px] text-[#475569]">{speaker.designation}</p>
              ) : null}
              {speaker.company ? (
                <p className={`mt-1 text-[12px] font-semibold tracking-wide ${config.accent.text}`}>
                  {speaker.company}
                </p>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}

export function AudienceSection({ event, config }: { event: EventDetailModel; config: CategoryConfig }) {
  if (!event.audience.length && !event.topics.length) return null;
  return (
    <Section id="audience">
      <SectionHeading
        eyebrow={event.audience.length ? "Who it is for" : "Topics"}
        title={event.audience.length ? "Built for" : "What we will cover"}
        accentClass={config.accent.text}
      />
      {event.audience.length ? (
        <ul className="mt-6 flex flex-wrap gap-2.5">
          {event.audience.map((who) => (
            <li
              key={who}
              className="capitalize text-[14px] font-medium text-[#0B1B3D] bg-white border border-[#E2E8F0] rounded-full px-4 py-2"
            >
              {who}
            </li>
          ))}
        </ul>
      ) : null}
      {event.topics.length ? (
        <div className={event.audience.length ? "mt-8" : "mt-6"}>
          {event.audience.length ? (
            <p className="text-[12px] font-semibold tracking-[0.14em] uppercase text-[#94A3B8] mb-3">Topics</p>
          ) : null}
          <ul className="flex flex-wrap gap-2">
            {event.topics.map((topic) => (
              <li
                key={topic}
                className={`text-[13px] font-semibold rounded-md px-3 py-1.5 ${config.accent.soft} ${config.accent.text}`}
              >
                #{topic.replace(/\s+/g, "-").toLowerCase()}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Section>
  );
}
