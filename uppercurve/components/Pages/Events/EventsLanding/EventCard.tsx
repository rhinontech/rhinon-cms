import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Award, MapPin, Video } from "lucide-react";
import type { EventDetailModel } from "../shared/model";
import { CATEGORY_CONFIG } from "../shared/categoryConfig";

export default function EventCard({ event, priority = false }: { event: EventDetailModel; priority?: boolean }) {
  const config = CATEGORY_CONFIG[event.category];
  const hosts = event.speakers.slice(0, 3);
  const ModeIcon = event.mode === "Online" ? Video : MapPin;

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex h-full flex-col rounded-[22px] bg-white border border-[#E6EAF2] overflow-hidden transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-1.5 hover:border-[#D6E2F5] hover:shadow-[0_32px_60px_-30px_rgba(11,27,61,0.35)]"
    >
      <div className="relative aspect-[16/10] bg-[#0B1B3D] overflow-hidden">
        {event.bannerUrl ? (
          <Image
            src={event.bannerUrl}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.05]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-[#021338] via-[#052b82] to-[#0d59eb]" />
        )}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#06102B]/75 via-transparent to-transparent" />

        <span className="absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#0B1B3D] shadow-sm">
          <span className={`w-1.5 h-1.5 rounded-full ${config.accent.dot}`} aria-hidden />
          {config.label}
        </span>

        <div className="absolute top-3.5 right-3.5 w-12 rounded-xl overflow-hidden bg-white text-center shadow-[0_8px_20px_-8px_rgba(0,0,0,0.4)]">
          <div className="bg-[#0052FF] text-white text-[9px] font-bold tracking-[0.18em] py-0.5">{event.shortDate.month}</div>
          <div className="text-lg font-extrabold text-[#0B1B3D] py-0.5 leading-none">{event.shortDate.day}</div>
        </div>

        <span className="absolute bottom-3.5 left-3.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-white">
          <ModeIcon className="w-3.5 h-3.5" aria-hidden />
          {event.mode === "Online" ? "Online" : event.location.split("·")[0].trim()}
        </span>
        {event.type !== "Workshop" ? (
          <span className="absolute bottom-3.5 right-3.5 rounded-md bg-white/15 backdrop-blur px-2 py-0.5 text-[11px] font-bold text-white border border-white/20">
            {event.type}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className={`text-[12px] font-semibold tracking-[0.08em] uppercase ${config.accent.text}`}>
          {event.dateLabel} · {event.durationLabel}
        </p>
        <h3 className="mt-2 text-[18px] font-extrabold text-[#0B1B3D] leading-snug tracking-tight">{event.title}</h3>
        {event.subtitle ? (
          <p className="mt-2 text-[14px] text-[#64748B] leading-relaxed line-clamp-2">{event.subtitle}</p>
        ) : null}

        <div className="mt-auto pt-5">
          <div className="pt-4 border-t border-[#EEF1F6] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {hosts.length ? (
                <div className="flex -space-x-2 shrink-0">
                  {hosts.map((h) => (
                    <span key={h.name} className="relative w-7 h-7 rounded-full ring-2 ring-white overflow-hidden bg-[#E2E8F0]">
                      {h.photoUrl ? <Image src={h.photoUrl} alt="" fill sizes="28px" className="object-cover" /> : null}
                    </span>
                  ))}
                </div>
              ) : null}
              {config.certificate ? (
                <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#475569] truncate">
                  <Award className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  Certificate
                </span>
              ) : (
                <span className="text-[12px] font-semibold text-[#475569] truncate">Free</span>
              )}
            </div>
            <span className="grid place-items-center w-9 h-9 shrink-0 rounded-full border border-[#E2E8F0] text-[#0B1B3D] transition-all duration-300 group-hover:bg-[#0052FF] group-hover:border-[#0052FF] group-hover:text-white group-hover:rotate-45">
              <ArrowUpRight className="w-4 h-4" aria-hidden />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
