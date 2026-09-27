import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarPlus } from "lucide-react";
import type { EventDetailModel, Speaker } from "@/components/Pages/Events/shared/model";
import type { BlogPost } from "@/components/Pages/Blog/blogData";
import EventCard from "@/components/Pages/Events/EventsLanding/EventCard";
import { CourseHeading } from "@/components/Pages/Courses/CourseLanding/ui";

/*
 * The sections fed by the API. Each hides itself when there is nothing to
 * show, except upcoming events, which says so — an empty homepage section
 * reads as broken, an honest "being scheduled" does not.
 */

function SeeAll({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 border border-[#0B1B3D]/80 text-[#0B1B3D] hover:bg-[#0B1B3D] hover:text-white font-bold text-xs tracking-wider uppercase px-6 py-3.5 rounded-[4px] transition-colors"
    >
      {children}
      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

export function UpcomingEvents({ upcoming }: { upcoming: EventDetailModel[] }) {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <CourseHeading
            eyebrow="Upcoming events"
            title="Learn live. It's free."
            description="Join a session, build alongside the host, and meet people moving in the same direction."
          />
          {upcoming.length ? <SeeAll href="/events">Discover all events</SeeAll> : null}
        </div>
        {upcoming.length ? (
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcoming.slice(0, 3).map((event, index) => (
              <EventCard key={event.slug} event={event} priority={index === 0} />
            ))}
          </div>
        ) : (
          <div className="mt-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-[24px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-8 sm:p-10">
            <div className="flex items-start gap-4">
              <span className="grid place-items-center w-12 h-12 shrink-0 rounded-2xl bg-[#EBF3FF]">
                <CalendarPlus className="w-6 h-6 text-[#0052FF]" aria-hidden />
              </span>
              <div>
                <p className="text-[19px] font-extrabold text-[#0B1B3D]">The next season is being scheduled.</p>
                <p className="mt-1 text-[15px] text-[#475569]">New events are announced to the community first.</p>
              </div>
            </div>
            <SeeAll href="/community">Join the community</SeeAll>
          </div>
        )}
      </div>
    </section>
  );
}

/** Past sessions, as a row to scroll through. */
export function WorkshopLibrary({ past }: { past: EventDetailModel[] }) {
  if (!past.length) return null;
  return (
    <section className="bg-[#F6F8FC] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <CourseHeading
          eyebrow="Workshop library"
          title="Every session, still worth your evening."
          description="A growing archive of what we have taught — recordings and material are shared with everyone who registered."
        />
        <div className="no-scrollbar mt-12 -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2">
          {past.slice(0, 10).map((event) => (
            <div key={event.slug} className="snap-start shrink-0 w-[82%] sm:w-[46%] lg:w-[31.5%]">
              <EventCard event={event} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Everyone who has hosted with us, most recent first. */
export function Hosts({ events }: { events: EventDetailModel[] }) {
  const hosts = new Map<string, Speaker>();
  for (const event of events) for (const speaker of event.speakers) if (!hosts.has(speaker.name)) hosts.set(speaker.name, speaker);
  const list = [...hosts.values()].slice(0, 8);
  if (!list.length) return null;

  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <CourseHeading
          eyebrow="Who you learn from"
          title="Practitioners, not presenters."
          description="People who design products, ship AI systems and run teams — teaching what they do on Monday."
        />
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {list.map((speaker) => (
            <div key={speaker.name} className="group">
              <div className="relative aspect-[4/5] rounded-[22px] overflow-hidden bg-[#E2E8F0]">
                {speaker.photoUrl ? (
                  <Image
                    src={speaker.photoUrl}
                    alt={speaker.name}
                    fill
                    sizes="(min-width: 1024px) 300px, (min-width: 640px) 33vw, 50vw"
                    className="object-cover grayscale-[40%] transition-all duration-700 group-hover:grayscale-0 group-hover:scale-[1.04]"
                  />
                ) : (
                  <span className="grid place-items-center w-full h-full text-5xl font-extrabold text-[#94A3B8]">{speaker.name.charAt(0)}</span>
                )}
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#06102B]/85 via-transparent to-transparent" />
                <div className="absolute inset-x-4 bottom-4 text-white">
                  <p className="text-[16px] font-extrabold leading-tight">{speaker.name}</p>
                  <p className="mt-0.5 text-[12.5px] text-white/70 leading-snug line-clamp-2">
                    {[speaker.designation, speaker.company].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LatestPosts({ posts }: { posts: BlogPost[] }) {
  if (!posts.length) return null;
  return (
    <section className="bg-[#F6F8FC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <CourseHeading eyebrow="From the blog" title="Notes from the curve." />
          <SeeAll href="/blog">Read the blog</SeeAll>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {posts.slice(0, 3).map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-[22px] bg-white border border-[#E6EAF2] overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_28px_50px_-30px_rgba(11,27,61,0.35)]"
            >
              <div className={`relative aspect-[16/10] overflow-hidden ${post.coverImage ? "bg-[#0B1B3D]" : post.gradient}`}>
                {post.coverImage ? (
                  // Blog covers can live on any host an editor pastes, so no next/image here.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                ) : null}
              </div>
              <div className="p-6 flex flex-col flex-1">
                <p className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-[#0052FF]">
                  {`${post.category} · ${post.readTime}`}
                </p>
                <p className="mt-3 text-[18px] font-extrabold tracking-tight text-[#0B1B3D] leading-snug line-clamp-2 group-hover:text-[#0052FF] transition-colors">
                  {post.title}
                </p>
                <p className="mt-2 text-[14.5px] text-[#475569] leading-relaxed line-clamp-2">{post.excerpt}</p>
                <span className="mt-auto pt-5 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#0B1B3D]">
                  {post.dateLabel}
                  <ArrowUpRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0052FF]" aria-hidden />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
