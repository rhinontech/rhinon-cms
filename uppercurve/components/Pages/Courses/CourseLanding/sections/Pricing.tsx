import Link from "next/link";
import { Check, Plus } from "lucide-react";
import type { Course } from "../../courseData";
import { CourseHeading, DarkGrid, PrimaryCta } from "../ui";

/** What a seat includes, with the enrolment card pinned alongside. */
export default function Pricing({ course }: { course: Course }) {
  return (
    <section id="pricing" className="scroll-mt-16 relative overflow-clip bg-[#06102B] text-white">
      <DarkGrid />
      <div aria-hidden className="pointer-events-none absolute -right-40 top-1/3 w-[640px] h-[640px] rounded-full bg-[radial-gradient(circle,rgba(0,82,255,0.35),transparent_62%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 grid lg:grid-cols-12 gap-14 lg:gap-12 items-start">
        <div className="lg:col-span-7">
          <CourseHeading
            dark
            eyebrow="Your seat"
            title="An investment in who you become next."
            description="This isn't a course purchase. It's a decision about which side of the AI divide you stand on six weeks from now."
          />
          <ul className="mt-10 border-t border-white/10">
            {course.inclusions.map((item) => (
              <li key={item.lead} className="flex items-start gap-4 py-4 border-b border-white/10 text-[15.5px] sm:text-[17px]">
                <Plus className="w-4 h-4 mt-1.5 shrink-0 text-[#7DD3FC]" strokeWidth={3} aria-hidden />
                <span className="text-white/65">
                  <span className="font-bold text-white">{item.lead}</span>
                  {` ${item.rest}`}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <div className="relative rounded-[26px] bg-white text-[#0B1B3D] p-7 sm:p-9 shadow-[0_50px_100px_-40px_rgba(0,0,0,0.8)]">
            <span className="absolute -top-3.5 right-7 rounded-md bg-[#0052FF] px-3.5 py-1.5 font-mono text-[10.5px] font-bold tracking-[0.18em] uppercase text-white shadow-[3px_3px_0_#0B1B3D]">
              {course.cohortLabel}
            </span>
            <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#0052FF]">One seat · everything included</p>
            {course.price ? (
              <p className="mt-4 text-6xl sm:text-7xl font-extrabold tracking-[-0.04em] leading-none">{course.price}</p>
            ) : (
              <>
                <p className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] leading-[1.05]">Limited seats.</p>
                <p className="mt-3 text-[15px] text-[#475569] leading-relaxed">
                  Fees and batch dates are shared when you apply — so 1:1 mentorship stays 1:1.
                </p>
              </>
            )}
            <div className="mt-7 grid grid-cols-2 gap-2.5">
              {["6 weeks of live training", "15 hands-on projects", "1:1 capstone mentorship", "Certificate for LinkedIn"].map((item) => (
                <span
                  key={item}
                  className="flex items-start gap-2 rounded-xl border border-[#E6EAF2] bg-[#F8FAFC] px-3 py-2.5 text-[13px] font-medium text-[#334155] leading-snug"
                >
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#0052FF]" strokeWidth={3} aria-hidden />
                  {item}
                </span>
              ))}
            </div>
            <PrimaryCta href={course.enrollHref} className="mt-7 w-full">
              {course.price ? "Enroll now" : "Apply for the cohort"}
            </PrimaryCta>
            <p className="mt-6 pt-5 border-t border-dashed border-[#E2E8F0] text-center text-[13.5px] text-[#64748B]">
              Still deciding?{" "}
              <Link href={course.tasterHref} className="font-semibold text-[#0B1B3D] underline underline-offset-4 hover:text-[#0052FF]">
                Attend a free live workshop
              </Link>{" "}
              first.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
