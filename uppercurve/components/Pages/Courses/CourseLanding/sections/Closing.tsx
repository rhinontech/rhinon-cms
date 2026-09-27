import { Plus } from "lucide-react";
import type { Course } from "../../courseData";
import { CourseHeading, DarkGrid, GradientText, PrimaryCta } from "../ui";

export function CourseFaq({ course }: { course: Course }) {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5">
          <CourseHeading eyebrow="Asked before enrolling" title="The questions everyone actually asks." />
        </div>
        <div className="lg:col-span-7 space-y-3">
          {course.faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl border border-[#E6EAF2] bg-[#F8FAFC] open:bg-white open:shadow-[0_20px_40px_-28px_rgba(11,27,61,0.35)] transition-colors [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 text-[16px] font-bold text-[#0B1B3D]">
                {faq.question}
                <span className="grid place-items-center shrink-0 w-8 h-8 rounded-full border border-[#D6E4FF] bg-white text-[#0B1B3D] transition-all duration-200 group-open:rotate-45 group-open:bg-[#0052FF] group-open:border-[#0052FF] group-open:text-white">
                  <Plus className="w-4 h-4" aria-hidden />
                </span>
              </summary>
              <p className="px-6 pb-6 -mt-1 pr-16 text-[15px] text-[#475569] leading-relaxed">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CourseCta({ course }: { course: Course }) {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28">
        <div className="relative overflow-hidden rounded-[32px] bg-[#06102B] px-6 py-16 sm:px-16 sm:py-24 text-center text-white">
          <DarkGrid />
          <div aria-hidden className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-72 w-[900px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(0,82,255,0.5),transparent_62%)]" />
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 font-mono text-[10.5px] tracking-[0.2em] uppercase text-[#7DD3FC]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C2FF] animate-pulse" aria-hidden />
              {course.cohortLabel} · Seats limited
            </p>
            <h2 className="mt-8 text-[44px] sm:text-7xl lg:text-[96px] font-extrabold tracking-[-0.045em] leading-[0.92] uppercase">
              <span className="block text-white/30">Stop prompting.</span>
              <span className="block">
                Start <GradientText>shipping.</GradientText>
              </span>
            </h2>
            <p className="mt-8 text-[16px] sm:text-lg text-white/65 max-w-md mx-auto leading-relaxed">
              The next cohort starts soon. Seats are capped so every capstone gets a real 1:1 review.
            </p>
            <PrimaryCta href="#pricing" className="mt-10">
              Join the next cohort
            </PrimaryCta>
          </div>
        </div>
      </div>
    </section>
  );
}
