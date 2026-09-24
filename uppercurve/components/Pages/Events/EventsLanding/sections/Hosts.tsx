import Image from "next/image";
import Link from "next/link";
import type { EventDetailModel, Speaker } from "../../shared/model";
import { SectionHeading } from "../../shared/ui";

/** Everyone hosting this season, each linked to the first event they run. */
export default function Hosts({ upcoming }: { upcoming: EventDetailModel[] }) {
  const hosts = new Map<string, { speaker: Speaker; event: EventDetailModel; count: number }>();
  for (const event of upcoming) {
    for (const speaker of event.speakers) {
      const existing = hosts.get(speaker.name);
      if (existing) existing.count += 1;
      else hosts.set(speaker.name, { speaker, event, count: 1 });
    }
  }
  const list = [...hosts.values()].slice(0, 12);
  if (!list.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          eyebrow="Your hosts"
          title="Taught by practitioners, not presenters"
          description="People who design curricula, ship learning products and run classrooms — teaching what they do on Monday."
        />
      </div>
      <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
        {list.map(({ speaker, event, count }) => (
          <Link key={speaker.name} href={`/events/${event.slug}`} className="group">
            <div className="relative aspect-[4/5] rounded-[20px] overflow-hidden bg-[#E2E8F0]">
              {speaker.photoUrl ? (
                <Image
                  src={speaker.photoUrl}
                  alt={speaker.name}
                  fill
                  sizes="(min-width: 1024px) 200px, (min-width: 640px) 33vw, 50vw"
                  className="object-cover grayscale-[35%] transition-all duration-500 group-hover:grayscale-0 group-hover:scale-[1.04]"
                />
              ) : (
                <span className="grid place-items-center w-full h-full text-4xl font-extrabold text-[#94A3B8]">
                  {speaker.name.charAt(0)}
                </span>
              )}
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#06102B]/80 via-transparent to-transparent" />
              <span className="absolute bottom-3 left-3 rounded-full bg-white/15 backdrop-blur border border-white/20 px-2 py-0.5 text-[10.5px] font-semibold text-white">
                {count} {count === 1 ? "event" : "events"}
              </span>
            </div>
            <p className="mt-3 text-[15px] font-bold text-[#0B1B3D] group-hover:text-[#0052FF] transition-colors">
              {speaker.name}
            </p>
            <p className="text-[13px] text-[#64748B] leading-snug">{speaker.designation}</p>
            {speaker.company ? <p className="text-[12px] font-semibold text-[#94A3B8]">{speaker.company}</p> : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
