import Image from "next/image";
import { BadgeCheck, Check } from "lucide-react";
import type { Course } from "../../courseData";
import { CourseHeading } from "../ui";

/** The credential, drawn in the brand so it always matches the course name. */
function CertificateCard({ course }: { course: Course }) {
  return (
    <div className="[container-type:inline-size] w-full">
      <div className="relative aspect-[1.3/1] rounded-[3cqw] overflow-hidden bg-gradient-to-br from-[#0B1B3D] via-[#0A2466] to-[#0052FF] text-white shadow-[0_60px_100px_-40px_rgba(5,43,130,0.8)] ring-1 ring-white/10">
        <div
          aria-hidden
          className="absolute -top-[25cqw] -right-[25cqw] w-[70cqw] h-[70cqw] rounded-full opacity-30 [background:repeating-radial-gradient(circle,transparent_0_1.4cqw,rgba(255,255,255,0.25)_1.4cqw_1.55cqw)]"
        />
        <div aria-hidden className="absolute inset-[2.6cqw] rounded-[2cqw] border border-[#7DD3FC]/35" />

        <div className="relative h-full flex flex-col p-[7cqw]">
          <div className="flex items-start justify-between">
            <p className="font-mono text-[2.2cqw] tracking-[0.3em] uppercase text-[#7DD3FC]">UpperCurve · Credential</p>
            <span className="flex items-center gap-[1.2cqw]">
              <Image src="/uppercurve_logo_nav.png" alt="" width={160} height={87} className="w-[8cqw] h-auto brightness-0 invert" />
              <span className="text-[2.8cqw] font-extrabold tracking-tight">UPPERCURVE</span>
            </span>
          </div>

          <p className="mt-[6cqw] text-[5.6cqw] font-extrabold tracking-tight leading-[1.1] max-w-[80cqw]">
            {course.certificate.title}
          </p>
          <p className="mt-[3cqw] font-mono text-[1.9cqw] tracking-[0.28em] uppercase text-white/55">This certifies that</p>
          <p className="mt-[1.4cqw] font-serif italic text-[5cqw] text-[#7DD3FC] leading-none">Your Name Here</p>
          <div aria-hidden className="mt-[1.6cqw] h-px w-[40cqw] bg-white/30" />
          <p className="mt-[2.6cqw] text-[2.4cqw] text-white/75 leading-relaxed max-w-[78cqw]">{course.certificate.statement}</p>

          <div className="mt-auto flex items-end justify-between">
            <div>
              <p className="text-[2.6cqw] font-bold">Programme Director</p>
              <p className="font-mono text-[1.8cqw] tracking-[0.2em] uppercase text-white/50">UpperCurve</p>
            </div>
            <div className="text-right">
              <p className="inline-flex items-center gap-[1cqw] text-[3cqw] font-bold">
                <BadgeCheck className="w-[3.6cqw] h-[3.6cqw] text-[#7DD3FC]" aria-hidden />
                Verified
              </p>
              <p className="font-mono text-[1.8cqw] tracking-[0.2em] uppercase text-white/50">Unique credential ID</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Certificate({ course }: { course: Course }) {
  return (
    <section className="bg-[#F6F8FC] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 grid lg:grid-cols-2 gap-14 lg:gap-16 items-center">
        <div>
          <CourseHeading
            eyebrow="Proof you can show"
            title="Get recognised for your agentic expertise."
            description="Finish the cohort and earn a certificate backed by real shipped work, not watch-time. Put it on LinkedIn next to the projects it certifies."
          />
          <ul className="mt-9 divide-y divide-[#E2E8F0] border-y border-[#E2E8F0] max-w-xl">
            {course.certificate.points.map((point) => (
              <li key={point} className="flex items-start gap-3.5 py-4 text-[15.5px] text-[#334155]">
                <Check className="w-4 h-4 mt-1 shrink-0 text-[#0052FF]" strokeWidth={3} aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative px-2 sm:px-8">
          <div aria-hidden className="absolute inset-8 rotate-[6deg] rounded-[28px] bg-[#A9E4FF]" />
          <div className="relative -rotate-[3deg] transition-transform duration-700 hover:rotate-0">
            <CertificateCard course={course} />
          </div>
        </div>
      </div>
    </section>
  );
}
