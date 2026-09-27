import Link from "next/link";
import type { Course } from "@/components/Pages/Courses/courseData";
import { DarkGrid, GradientText, PrimaryCta } from "@/components/Pages/Courses/CourseLanding/ui";

/** Card colours for the fanned deck, matching the course page's module stack. */
const DECK = ["bg-[#EBF3FF] text-[#0B1B3D]", "bg-[#A9E4FF] text-[#0B1B3D]", "bg-[#0052FF] text-white", "bg-[#052B82] text-white"];

/** The flagship course, pitched in one block, with its modules fanned out like a deck. */
export default function FeaturedCourse({ course }: { course: Course }) {
  const deck = course.modules.slice(0, DECK.length);
  return (
    <section className="relative overflow-hidden bg-[#06102B] text-white">
      <DarkGrid />
      <div aria-hidden className="pointer-events-none absolute right-0 top-1/4 w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(0,82,255,0.3),transparent_62%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 grid lg:grid-cols-12 gap-16 lg:gap-10 items-center">
        <div className="lg:col-span-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#7DD3FC]/30 bg-[#0052FF]/15 px-3.5 py-1.5 font-mono text-[10.5px] tracking-[0.2em] uppercase text-[#7DD3FC]">
            New · {course.title} {course.titleAccent}
          </p>
          <h2 className="mt-6 text-[40px] sm:text-6xl lg:text-[68px] font-extrabold tracking-[-0.04em] leading-[1]">
            Go from 0 to 1 in <GradientText>agentic AI.</GradientText>
          </h2>
          <p className="mt-6 text-lg text-white/65 leading-relaxed max-w-lg">
            A six-week live cohort. You won&apos;t just understand agents — you&apos;ll build fifteen of them, and launch one of your own on Demo Day.
          </p>

          <dl className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-y-6 max-w-lg">
            {course.stats.map((stat) => (
              <div key={stat.label} className="pr-3">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="text-3xl font-extrabold tracking-tight leading-none">{stat.value}</dd>
                <dd className="mt-2 font-mono text-[10px] tracking-[0.16em] uppercase text-white/45">{stat.label}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <PrimaryCta href={`/courses/${course.slug}#pricing`}>Enroll now</PrimaryCta>
            <Link
              href={`/courses/${course.slug}#curriculum`}
              className="inline-flex items-center gap-2 border border-white/25 text-white hover:bg-white hover:text-[#0B1B3D] font-bold text-xs sm:text-[13px] tracking-wider uppercase px-7 py-4 rounded-[4px] transition-colors"
            >
              View curriculum
            </Link>
          </div>
        </div>

        {/* The deck: each module card offset and turned a little further. */}
        <Link href={`/courses/${course.slug}#curriculum`} aria-label="See the full curriculum" className="group lg:col-span-6 relative h-[400px] sm:h-[460px]">
          {deck.map((module, index) => {
            const fromTop = deck.length - 1 - index;
            return (
              <div
                key={module.week}
                className={`absolute inset-x-2 sm:inset-x-8 rounded-[24px] border-[1.5px] border-[#0B1B3D] p-6 sm:p-8 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${DECK[index]}`}
                style={{
                  top: `${index * 58}px`,
                  zIndex: index,
                  transform: `rotate(${(index % 2 ? 1 : -1) * fromTop * 1.4}deg) scale(${1 - fromTop * 0.03})`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full border-[1.5px] border-current px-3.5 py-1 font-mono text-[10.5px] tracking-[0.2em] uppercase">
                    {`Module 0${module.week} · Week ${module.week}`}
                  </span>
                  <span className="text-4xl font-extrabold tracking-[-0.05em] opacity-15">{`0${module.week}`}</span>
                </div>
                <p className="mt-6 text-2xl sm:text-[30px] font-extrabold tracking-[-0.03em] leading-[1.05] uppercase">{module.title}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {module.topics.slice(0, 3).map((topic) => (
                    <span key={topic} className="rounded-full border-[1.5px] border-current px-3 py-1 font-mono text-[11px]">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          <span className="absolute -bottom-4 right-8 z-10 rounded-full bg-white px-4 py-2 font-mono text-[10.5px] font-bold tracking-[0.18em] uppercase text-[#0B1B3D] shadow-lg transition-transform group-hover:-translate-y-1">
            + {course.modules.length - deck.length} more modules
          </span>
        </Link>
      </div>
    </section>
  );
}
