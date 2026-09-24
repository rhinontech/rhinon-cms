import Image from "next/image";
import Link from "next/link";
import { CalendarDays, CalendarPlus, ChevronRight, Clock3, Hourglass, Lock, MapPin } from "lucide-react";
import type { EventDetailModel } from "../../shared/model";
import type { CategoryConfig } from "../../shared/categoryConfig";
import { RegisterButton, ShareButton } from "../registration";
import { Pill } from "../../shared/ui";

function MetaItem({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  accent: CategoryConfig["accent"];
}) {
  return (
    <div className="flex items-start gap-3 min-w-0">
      <span className={`shrink-0 grid place-items-center w-10 h-10 rounded-xl ${accent.soft}`}>
        <Icon className={`w-[18px] h-[18px] ${accent.text}`} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold tracking-[0.14em] uppercase text-[#94A3B8]">
          {label}
        </span>
        <span className="block text-[15px] font-semibold text-[#0B1B3D] leading-snug line-clamp-2">
          {value}
        </span>
      </span>
    </div>
  );
}

export default function Hero({ event, config }: { event: EventDetailModel; config: CategoryConfig }) {
  const hosts = event.speakers.slice(0, 3);
  const hostNames =
    hosts.length <= 2
      ? hosts.map((h) => h.name).join(" & ")
      : `${hosts[0].name}, ${hosts[1].name} & ${event.speakers.length - 2} more`;

  return (
    <section className="relative overflow-hidden bg-white">
      {/* The homepage's cool radial wash, so the page reads as the same product. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,#E7F0FF_0%,rgba(255,255,255,0)_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(#C7D5EE_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-14 sm:pb-20">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-[#64748B]">
          <Link href="/events" className="hover:text-[#0052FF] transition-colors">
            Events
          </Link>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden />
          <span className="text-[#0B1B3D] font-medium">{config.label}</span>
        </nav>

        <div className="mt-8 grid lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`inline-flex items-center gap-2 text-xs sm:text-[13px] font-semibold tracking-[0.2em] uppercase ${config.accent.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${config.accent.dot}`} aria-hidden />
                {config.eyebrow}
              </span>
              {event.type !== "Workshop" ? (
                <Pill className="bg-[#0B1B3D] text-white">{event.type}</Pill>
              ) : null}
              {event.isPast ? <Pill className="bg-[#F1F5F9] text-[#475569]">Past event</Pill> : null}
            </div>

            <h1 className="mt-5 text-[34px] sm:text-5xl lg:text-[54px] font-extrabold text-[#0B1B3D] tracking-tight leading-[1.08]">
              {event.title}
            </h1>
            {event.subtitle ? (
              <p className="mt-5 text-base sm:text-lg text-[#334155] leading-relaxed max-w-2xl">
                {event.subtitle}
              </p>
            ) : null}

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 max-w-2xl">
              <MetaItem icon={CalendarDays} label="Date" value={event.dateLabel} accent={config.accent} />
              <MetaItem icon={Clock3} label="Time" value={event.timeLabel} accent={config.accent} />
              <MetaItem icon={MapPin} label="Location" value={event.location} accent={config.accent} />
              <MetaItem icon={Hourglass} label="Duration" value={event.durationLabel} accent={config.accent} />
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <RegisterButton
                label={event.ctaLabel}
                disabled={!event.canRegister}
                disabledLabel={event.isPast ? "Event has ended" : "Registrations closed"}
              />
              {event.calendarUrl && !event.isPast ? (
                <a
                  href={event.calendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#0B1B3D] hover:text-[#0052FF] transition-colors"
                >
                  <CalendarPlus className="w-4 h-4" aria-hidden />
                  Add to calendar
                </a>
              ) : null}
              <ShareButton title={event.title} />
            </div>

            {config.restriction ? (
              <p className="mt-5 inline-flex items-center gap-2 text-[13px] text-[#475569] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2">
                <Lock className="w-3.5 h-3.5" aria-hidden />
                {config.restriction}
              </p>
            ) : null}

            {hosts.length ? (
              <div className="mt-9 flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {hosts.map((host) => (
                    <span
                      key={host.name}
                      className="relative w-9 h-9 rounded-full ring-2 ring-white overflow-hidden bg-[#E2E8F0]"
                    >
                      {host.photoUrl ? (
                        <Image src={host.photoUrl} alt="" fill sizes="36px" className="object-cover" />
                      ) : (
                        <span className="grid place-items-center w-full h-full text-xs font-bold text-[#475569]">
                          {host.name.charAt(0)}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
                <p className="text-[13px] text-[#64748B]">
                  Hosted by <span className="font-semibold text-[#0B1B3D]">{hostNames}</span>
                </p>
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-5">
            <div className="relative">
              <div className="relative aspect-[4/3] rounded-[22px] overflow-hidden bg-[#0B1B3D] ring-1 ring-[#0B1B3D]/5 shadow-[0_40px_80px_-30px_rgba(11,27,61,0.45)]">
                {event.bannerUrl ? (
                  <Image
                    src={event.bannerUrl}
                    alt={event.title}
                    fill
                    priority
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#021338] via-[#052b82] to-[#0d59eb]" />
                )}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-[#0B1B3D]/45 via-transparent to-transparent"
                />
                <Pill className="absolute top-4 left-4 bg-white/95 text-[#0B1B3D] shadow-sm backdrop-blur">
                  <span className={`w-1.5 h-1.5 rounded-full ${config.accent.dot}`} aria-hidden />
                  {config.label}
                </Pill>
              </div>

              {/* Floating date tile — the one fact people scan for first. */}
              <div className="absolute -bottom-7 left-5 sm:-left-6 flex items-center gap-4 bg-white rounded-2xl pl-3 pr-5 py-3 border border-[#E6EAF2] shadow-[0_20px_40px_-18px_rgba(11,27,61,0.35)]">
                <div className="text-center w-14 rounded-xl overflow-hidden border border-[#E6EAF2]">
                  <div className="bg-[#0052FF] text-white text-[10px] font-bold tracking-[0.18em] py-1">
                    {event.shortDate.month}
                  </div>
                  <div className="text-2xl font-extrabold text-[#0B1B3D] py-1 leading-none">
                    {event.shortDate.day}
                  </div>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#0B1B3D]">{event.mode}</p>
                  <p className="text-xs text-[#64748B]">
                    {event.seats > 0 ? `${event.seats} seats` : event.durationLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
