import Image from "next/image";
import type { Course } from "../../courseData";
import { CourseHeading } from "../ui";

/**
 * Who teaches and how the six weeks run. The instructor block appears only
 * once a real instructor is set on the course; the weekly rhythm always shows.
 */
export default function Cohort({ course }: { course: Course }) {
  const { instructor } = course;
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <CourseHeading
          eyebrow={instructor ? "Who teaches this" : "How the cohort runs"}
          title={instructor ? "Learn from someone who builds this for a living." : "Built live, reviewed 1:1, shipped in public."}
          description={
            instructor
              ? undefined
              : "Taught by practitioners who ship agents at work — not presenters. Every week has the same rhythm, so building becomes a habit rather than a heroic weekend."
          }
        />

        {instructor ? (
          <div className="mt-14 grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[4/5] rounded-[26px] overflow-hidden bg-[#E2E8F0] shadow-[0_40px_80px_-40px_rgba(11,27,61,0.55)]">
                <Image src={instructor.photoUrl} alt={instructor.name} fill sizes="(min-width: 1024px) 460px, 100vw" className="object-cover" />
              </div>
              <span className="absolute -left-3 bottom-8 rounded-lg bg-[#0B1B3D] px-4 py-2.5 font-mono text-[11px] tracking-[0.2em] uppercase text-white shadow-[4px_4px_0_#0052FF]">
                Your mentor
              </span>
            </div>
            <div className="lg:col-span-7">
              <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B1B3D]">{instructor.name}</h3>
              <p className="mt-4 text-[17px] text-[#475569] leading-relaxed">{instructor.bio}</p>
              <ol className="mt-8 divide-y divide-[#E6EAF2] border-y border-[#E6EAF2]">
                {instructor.credentials.map((credential, index) => (
                  <li key={credential} className="flex gap-5 py-4 text-[15.5px] text-[#334155]">
                    <span className="font-mono text-[#0052FF]">{String(index + 1).padStart(2, "0")}</span>
                    {credential}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}

        <ol className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {course.rhythm.map((item, index) => (
            <li
              key={item.title}
              className="group relative rounded-[22px] border border-[#E6EAF2] bg-[#F8FAFC] p-7 transition-all duration-500 hover:-translate-y-1 hover:bg-white hover:shadow-[0_28px_50px_-30px_rgba(11,27,61,0.35)]"
            >
              <div className="flex items-center justify-between">
                <span className="grid place-items-center w-11 h-11 rounded-xl bg-[#0B1B3D] text-white font-mono text-[13px]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-[#0052FF]">{item.cadence}</span>
              </div>
              <p className="mt-8 text-[19px] font-extrabold tracking-tight text-[#0B1B3D]">{item.title}</p>
              <p className="mt-2 text-[14.5px] text-[#475569] leading-relaxed">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
