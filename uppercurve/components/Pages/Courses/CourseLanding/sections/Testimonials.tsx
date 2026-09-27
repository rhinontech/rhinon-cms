import Image from "next/image";
import type { Course } from "../../courseData";
import { CourseHeading } from "../ui";

/** Only rendered once the course has real reviews to show. */
export default function Testimonials({ course }: { course: Course }) {
  if (!course.testimonials.length) return null;
  return (
    <section className="bg-[#F6F8FC] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28">
        <CourseHeading eyebrow="From people who did it" title="Taken by leaders. Not just learners." />
      </div>
      <div className="-mt-6 sm:-mt-10 pb-20 sm:pb-28 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <div className="flex w-max gap-5 animate-marquee-reverse [animation-duration:60s] hover:[animation-play-state:paused]">
          {[...course.testimonials, ...course.testimonials].map((item, index) => (
            <figure
              key={`${item.name}-${index}`}
              aria-hidden={index >= course.testimonials.length}
              className="w-[340px] sm:w-[420px] shrink-0 rounded-[22px] bg-white border border-[#E6EAF2] p-7 flex flex-col shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.08)]"
            >
              <blockquote className="text-[15.5px] text-[#334155] leading-relaxed">“{item.quote}”</blockquote>
              <figcaption className="mt-auto pt-7 flex items-center gap-3">
                <span className="relative w-11 h-11 rounded-full overflow-hidden bg-[#E2E8F0] shrink-0">
                  {item.photoUrl ? <Image src={item.photoUrl} alt="" fill sizes="44px" className="object-cover" /> : null}
                </span>
                <span className="text-[13px] leading-tight">
                  <span className="block font-bold text-[#0B1B3D] text-[14.5px]">{item.name}</span>
                  <span className="text-[#64748B]">
                    {item.role}
                    {item.company ? <span className="font-semibold text-[#0052FF]">{` · ${item.company}`}</span> : null}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
