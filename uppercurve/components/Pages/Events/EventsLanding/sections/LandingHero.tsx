import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, MapPin } from "lucide-react";
import type { EventDetailModel } from "../../shared/model";
import { CATEGORY_CONFIG } from "../../shared/categoryConfig";
import Countdown from "../Countdown";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-5 first:pl-0">
      <p className="text-2xl sm:text-[28px] font-extrabold text-[#0B1B3D] tracking-tight leading-none">{value}</p>
      <p className="mt-1.5 text-[12px] font-semibold tracking-[0.12em] uppercase text-[#94A3B8]">{label}</p>
    </div>
  );
}

/** The next event, with the one after it fanned out behind. */
function Spotlight({ next, after }: { next: EventDetailModel; after?: EventDetailModel }) {
  const config = CATEGORY_CONFIG[next.category];
  const host = next.speakers[0];
  return (
    <div className="relative mx-auto w-full max-w-[480px] lg:max-w-none">
      {after?.bannerUrl ? (
        <div
          aria-hidden
          className="hidden sm:block absolute top-8 bottom-24 left-16 -right-5 rotate-[6deg] rounded-[26px] overflow-hidden shadow-[0_30px_60px_-30px_rgba(11,27,61,0.45)]"
        >
          <Image src={after.bannerUrl} alt="" fill sizes="440px" className="object-cover" />
          <div className="absolute inset-0 bg-[#0B1B3D]/25" />
        </div>
      ) : null}

      <Link
        href={`/events/${next.slug}`}
        className="group relative block rounded-[26px] bg-white border border-[#E6EAF2] overflow-hidden shadow-[0_50px_90px_-40px_rgba(11,27,61,0.55)] transition-transform duration-500 hover:-translate-y-1"
      >
        <div className="relative aspect-[16/11] bg-[#0B1B3D] overflow-hidden">
          {next.bannerUrl ? (
            <Image
              src={next.bannerUrl}
              alt={next.title}
              fill
              priority
              sizes="(min-width: 1024px) 480px, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-tr from-[#021338] via-[#052b82] to-[#0d59eb]" />
          )}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#06102B]/90 via-[#06102B]/25 to-transparent" />
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#0B1B3D] shadow-sm">
              <span className={`w-1.5 h-1.5 rounded-full ${config.accent.dot}`} aria-hidden />
              {config.label}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0052FF] px-2.5 py-1 text-[11px] font-bold tracking-wide text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" aria-hidden />
              Next up
            </span>
          </div>
          {next.startsAt ? (
            <div className="absolute inset-x-4 bottom-4">
              <Countdown startsAt={next.startsAt} />
            </div>
          ) : null}
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-[19px] font-extrabold text-[#0B1B3D] leading-snug tracking-tight">{next.title}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-[#475569]">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-[#94A3B8]" aria-hidden />
              {next.dateLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="w-3.5 h-3.5 text-[#94A3B8]" aria-hidden />
              {next.timeLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" aria-hidden />
              {next.mode}
            </span>
          </div>
          <div className="mt-5 pt-5 border-t border-[#EEF1F6] flex items-center justify-between gap-4">
            {host ? (
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="relative w-8 h-8 rounded-full overflow-hidden bg-[#E2E8F0] shrink-0">
                  {host.photoUrl ? <Image src={host.photoUrl} alt="" fill sizes="32px" className="object-cover" /> : null}
                </span>
                <span className="min-w-0 text-[12.5px] leading-tight">
                  <span className="block font-bold text-[#0B1B3D] truncate">{host.name}</span>
                  <span className="block text-[#64748B] truncate">{host.designation}</span>
                </span>
              </div>
            ) : (
              <span />
            )}
            <span className="shrink-0 inline-flex items-center gap-1.5 text-[12px] font-bold tracking-wider uppercase text-[#0052FF]">
              Reserve a seat
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function LandingHero({ upcoming }: { upcoming: EventDetailModel[] }) {
  const [next, after] = upcoming;
  const online = upcoming.some((e) => e.mode !== "In person");
  const inPerson = upcoming.some((e) => e.mode !== "Online");
  const where = online && inPerson ? "Online & in Bengaluru" : inPerson ? "In Bengaluru" : "Online";
  const formats = new Set(upcoming.map((e) => e.category)).size;
  const attending = upcoming.reduce((sum, e) => sum + e.attending, 0);

  return (
    <section className="relative overflow-hidden bg-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(ellipse_70%_60%_at_30%_0%,#E4EEFF_0%,rgba(255,255,255,0)_70%)]" />
        <div className="absolute -right-40 top-10 w-[560px] h-[560px] rounded-full bg-[radial-gradient(circle,rgba(0,194,255,0.14),transparent_65%)]" />
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(#C9D6EE_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_65%_55%_at_35%_10%,black,transparent)]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24">
        <div className="grid lg:grid-cols-12 gap-14 lg:gap-12 items-center">
          <div className="lg:col-span-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#D6E4FF] bg-white/80 backdrop-blur px-3.5 py-1.5 text-[12px] font-semibold text-[#0B1B3D] shadow-sm">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#0052FF] opacity-60 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-[#0052FF]" />
              </span>
              UpperCurve Events · {where}
            </p>

            <h1 className="mt-7 text-[40px] sm:text-6xl lg:text-[68px] font-extrabold text-[#0B1B3D] tracking-tight leading-[1.06]">
              <span className="bg-[#EBF3FF] px-3 sm:px-4 py-0.5 rounded-2xl mr-2 sm:mr-3 inline-block shadow-sm">Live</span>
              AI events that end with{" "}
              <span className="bg-gradient-to-r from-[#0052FF] via-[#0077FF] to-[#00C2FF] bg-clip-text text-transparent">
                something you built.
              </span>
            </h1>

            <p className="mt-7 text-base sm:text-lg text-[#334155] leading-relaxed max-w-xl">
              Workshops, assessed micro-certificates and one-day builds for educators and builders — taught by
              practitioners, not presenters.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href="#events"
                className="inline-flex items-center gap-2 bg-[#0052FF] hover:bg-[#0043CC] text-white font-bold text-xs sm:text-[13px] tracking-wider uppercase px-7 py-3.5 rounded-[4px] shadow-[0_10px_24px_-10px_rgba(0,82,255,0.6)] transition-all active:scale-[0.98]"
              >
                Browse events <ArrowRight className="w-4 h-4" aria-hidden />
              </a>
              <Link
                href="/community"
                className="inline-flex items-center gap-2 border border-[#0B1B3D]/80 text-[#0B1B3D] hover:bg-[#0B1B3D] hover:text-white font-bold text-xs sm:text-[13px] tracking-wider uppercase px-7 py-3.5 rounded-[4px] transition-colors"
              >
                Join the community
              </Link>
            </div>

            {upcoming.length ? (
              <div className="mt-12 flex divide-x divide-[#E2E8F0]">
                <Stat value={String(upcoming.length)} label="Upcoming" />
                <Stat value={String(formats)} label={formats === 1 ? "Format" : "Formats"} />
                {attending > 0 ? <Stat value={`${attending.toLocaleString("en-IN")}+`} label="Attending" /> : null}
                <Stat value="₹0" label="To attend" />
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-5">
            {next ? (
              <Spotlight next={next} after={after} />
            ) : (
              <div className="rounded-[26px] border border-dashed border-[#CBD5E1] p-10 text-center text-[#64748B]">
                New events are being scheduled. Check back soon.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
