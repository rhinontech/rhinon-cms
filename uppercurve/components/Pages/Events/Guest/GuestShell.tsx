import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import type { GuestPage } from "@/services/eventService";

export function formatEventDates(event: Pick<GuestPage["event"], "startDate" | "endDate" | "startTime" | "endTime">) {
  const fmt = (v: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v || "");
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : v;
  };
  const days = event.endDate && event.endDate !== event.startDate ? `${fmt(event.startDate)} – ${fmt(event.endDate)}` : fmt(event.startDate);
  const time = event.startTime ? ` · ${event.startTime}${event.endTime ? ` – ${event.endTime}` : ""} IST` : "";
  return days + time;
}

/** Page frame for a guest's personal pages: the event they're here for, then their content. */
export function GuestShell({ event, eyebrow, children }: { event?: GuestPage["event"]; eyebrow: string; children: ReactNode }) {
  return (
    <main className="w-full bg-white font-[family-name:var(--font-plus-jakarta)] text-[#0B1B3D]">
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,#E7F0FF_0%,rgba(255,255,255,0)_70%)]" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 pt-8 sm:pt-12 pb-20">
          {event ? (
            <Link href={`/events/${event.slug}`} className="inline-flex items-center gap-1.5 text-[13px] text-[#64748B] hover:text-[#0052FF]">
              <ArrowLeft className="size-3.5" /> Back to the event
            </Link>
          ) : (
            <Link href="/events" className="inline-flex items-center gap-1.5 text-[13px] text-[#64748B] hover:text-[#0052FF]">
              <ArrowLeft className="size-3.5" /> All events
            </Link>
          )}
          <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#0052FF]">{eyebrow}</p>
          {event ? (
            <div className="mt-4 flex items-center gap-4">
              {event.bannerUrl ? (
                <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-[#E2E8F0]">
                  <Image src={event.bannerUrl} alt="" fill sizes="64px" className="object-cover" />
                </span>
              ) : null}
              <div className="min-w-0">
                <h1 className="text-[22px] sm:text-[28px] font-extrabold leading-tight tracking-tight">{event.title}</h1>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-[#64748B]">
                  <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" /> {formatEventDates(event)}</span>
                  {event.location ? <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" /> {event.location}</span> : null}
                </p>
              </div>
            </div>
          ) : null}
          <div className="mt-8 space-y-5">{children}</div>
        </div>
      </section>
    </main>
  );
}

export function GuestCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-[#E6EAF2] bg-white p-6 sm:p-8 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_18px_40px_-24px_rgba(16,24,40,0.18)] ${className}`}>
      {children}
    </div>
  );
}

export const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-[4px] bg-[#0052FF] px-6 py-3.5 text-[13px] font-bold uppercase tracking-wider text-white shadow-[0_10px_24px_-10px_rgba(0,82,255,0.6)] transition hover:bg-[#0043CC]";
export const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-[4px] border border-[#CBD5E1] bg-white px-6 py-3.5 text-[13px] font-bold uppercase tracking-wider text-[#0B1B3D] transition hover:border-[#0052FF] hover:text-[#0052FF]";

/** For links that turn out to be wrong or tampered with. */
export function InvalidLink({ message }: { message: string }) {
  return (
    <GuestShell eyebrow="Registration">
      <GuestCard className="text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">This link doesn&apos;t work</h1>
        <p className="mx-auto mt-2 max-w-md text-[15px] text-[#475569]">
          {message} Use the link from your latest email from us, or register again with the same address to get it back.
        </p>
        <Link href="/events" className={`${primaryButton} mt-6`}>Browse events</Link>
      </GuestCard>
    </GuestShell>
  );
}
