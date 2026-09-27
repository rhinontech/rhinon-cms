import Link from "next/link";
import { Check } from "lucide-react";
import type { Course } from "../../courseData";
import { DarkGrid, GradientText, PrimaryCta } from "../ui";

/**
 * Dark opener: the pitch on the left, the enrolment card on the right, the
 * tool strip underneath, then the one-line manifesto and the numbers.
 */
export default function Hero({ course }: { course: Course }) {
  return (
    <section className="relative overflow-hidden bg-[#06102B] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-[10%] w-[720px] h-[720px] rounded-full bg-[radial-gradient(circle,rgba(0,82,255,0.35),transparent_62%)]" />
        <div className="absolute top-20 -right-40 w-[620px] h-[620px] rounded-full bg-[radial-gradient(circle,rgba(0,194,255,0.18),transparent_65%)]" />
      </div>
      <DarkGrid />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-14 sm:pt-24 pb-16 sm:pb-24">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          <div className="lg:col-span-7">
            <p className="inline-flex items-center gap-2.5 font-mono text-[11px] sm:text-xs tracking-[0.22em] uppercase text-white/60">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#00C2FF] opacity-70 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-[#00C2FF]" />
              </span>
              {course.eyebrow}
            </p>

            <h1 className="mt-7 text-[52px] sm:text-7xl lg:text-[92px] font-extrabold tracking-[-0.04em] leading-[0.95]">
              {course.title}
              <br />
              <GradientText>{course.titleAccent}</GradientText>
            </h1>

            <p className="mt-8 text-lg sm:text-[22px] font-medium text-white/80 leading-snug max-w-xl">
              {course.tagline}
            </p>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-y-6 max-w-xl">
              {course.stats.map((stat) => (
                <div key={stat.label} className="pr-4 sm:border-r last:border-r-0 border-white/10 sm:[&:not(:first-child)]:pl-5">
                  <p className="text-[28px] sm:text-[32px] font-extrabold tracking-tight leading-none">{stat.value}</p>
                  <p className="mt-2 font-mono text-[10px] tracking-[0.16em] uppercase text-white/45">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative rounded-[24px] border border-white/12 bg-gradient-to-b from-white/[0.09] to-white/[0.03] backdrop-blur-xl shadow-[0_40px_90px_-30px_rgba(0,20,80,0.9)] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 font-mono text-[10.5px] tracking-[0.18em] uppercase">
                <span className="inline-flex items-center gap-2 text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden />
                  Enrolling now
                </span>
                <span className="text-white/45">{course.cohortLabel}</span>
              </div>
              <div className="p-6 sm:p-8">
                <p className="text-2xl sm:text-[28px] font-extrabold tracking-tight leading-[1.15]">
                  {course.heroCard.title} <span className="text-[#7DD3FC]">{course.heroCard.accent}</span>
                </p>
                <p className="mt-3 text-[15px] text-white/65 leading-relaxed">{course.heroCard.body}</p>
                <ul className="mt-7 divide-y divide-white/10 border-y border-white/10">
                  {course.heroCard.points.map((point) => (
                    <li key={point} className="flex items-center gap-3 py-3.5 text-[14.5px] text-white/90">
                      <span className="grid place-items-center w-5 h-5 rounded-full bg-[#0052FF]/30 text-[#7DD3FC] shrink-0">
                        <Check className="w-3 h-3" strokeWidth={3} aria-hidden />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
                <PrimaryCta href="#pricing" className="mt-7 w-full">
                  Claim your seat
                </PrimaryCta>
                <p className="mt-4 text-center text-[13px] text-white/45">
                  Not ready?{" "}
                  <Link href={course.tasterHref} className="text-white/75 underline underline-offset-4 hover:text-white">
                    Try a free live workshop
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tool strip */}
      <div className="relative border-y border-white/10 bg-white/[0.02] py-8">
        <p className="text-center font-mono text-[10.5px] tracking-[0.24em] uppercase text-white/40">
          Every agent tool that matters. Covered.
        </p>
        <div className="mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div className="flex w-max animate-marquee-reverse [animation-duration:40s] gap-3">
            {[...course.tools, ...course.tools].map((tool, index) => (
              <span
                key={`${tool}-${index}`}
                aria-hidden={index >= course.tools.length}
                className="inline-flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 font-mono text-[13px] text-white/80 whitespace-nowrap"
              >
                <span className="grid place-items-center w-6 h-6 rounded-md bg-white text-[#0B1B3D] text-[11px] font-bold font-sans">
                  {tool.charAt(0)}
                </span>
                {tool}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Manifesto */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <p className="max-w-5xl text-[34px] sm:text-5xl lg:text-[64px] font-extrabold tracking-[-0.035em] leading-[1.06]">
          <span className="text-white/35">Everyone is</span> talking <span className="text-white/35">to AI.</span>{" "}
          <span className="inline bg-[#0052FF] px-2 -mx-0.5 rounded-md box-decoration-clone">Almost no one</span>{" "}
          <span className="text-white/35">is</span> deploying <span className="text-white/35">it.</span>
        </p>
        <p className="mt-8 text-lg sm:text-xl text-white/65">
          Learn to <span className="text-white font-semibold">build, deploy and ship</span> production-ready AI agents
          in <span className="text-[#7DD3FC] font-semibold">six weeks</span>.
        </p>
      </div>
    </section>
  );
}
