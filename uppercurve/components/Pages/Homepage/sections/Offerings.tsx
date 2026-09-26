import Link from "next/link";
import { ArrowUpRight, Briefcase, CalendarDays, GraduationCap, Users } from "lucide-react";
import type { Course } from "@/components/Pages/Courses/courseData";
import { CourseHeading, GradientText } from "@/components/Pages/Courses/CourseLanding/ui";

/** Everything UpperCurve offers today, each tile a door into its own page. */
export default function Offerings({ course, upcomingCount }: { course: Course; upcomingCount: number }) {
  const tiles = [
    {
      href: "/events",
      icon: CalendarDays,
      eyebrow: "Free · live",
      title: "Live events",
      body: "Workshops, micro-certificates and one-day builds — online and in Bengaluru. Every one of them free.",
      meta: upcomingCount ? `${upcomingCount} upcoming` : "New dates soon",
    },
    {
      href: "/community",
      icon: Users,
      eyebrow: "Peers",
      title: "Community",
      body: "Ambitious people learning in public — recordings, prompt libraries and build notes from every session.",
      meta: "Join free",
    },
    {
      href: "/jobs",
      icon: Briefcase,
      eyebrow: "Careers",
      title: "Jobs",
      body: "Roles for people who build with AI, curated for the skills you are learning here.",
      meta: "Browse roles",
    },
  ];

  return (
    <section className="bg-[#F6F8FC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <CourseHeading
          eyebrow="What we offer"
          title={
            <>
              Where curiosity meets <GradientText>capability.</GradientText>
            </>
          }
          description="One place to learn the skill, prove it with real work, and turn it into your next role."
        />

        <div className="mt-14 grid lg:grid-cols-12 gap-4 sm:gap-5">
          <Link
            href={`/courses/${course.slug}`}
            className="group relative lg:col-span-6 lg:row-span-3 overflow-hidden rounded-[28px] bg-[#0B1B3D] text-white p-8 sm:p-10 flex flex-col min-h-[420px] transition-transform duration-500 hover:-translate-y-1"
          >
            <div aria-hidden className="pointer-events-none absolute -right-24 -bottom-24 w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(0,82,255,0.55),transparent_65%)]" />
            <span aria-hidden className="pointer-events-none absolute -top-6 right-4 text-[180px] font-extrabold leading-none tracking-[-0.06em] text-white/[0.05]">
              01
            </span>
            <div className="relative flex items-center justify-between">
              <span className="grid place-items-center w-12 h-12 rounded-2xl bg-white/10 border border-white/15">
                <GraduationCap className="w-6 h-6 text-[#7DD3FC]" aria-hidden />
              </span>
              <ArrowUpRight className="w-6 h-6 text-white/40 transition-all group-hover:text-white group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </div>
            <ul className="relative mt-10 space-y-2.5">
              {course.builds.slice(0, 3).map((build) => (
                <li
                  key={build.label}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors group-hover:border-white/15"
                >
                  <span className="text-[14.5px] font-semibold text-white/85">{`${build.title} ${build.accent}`}</span>
                  <span className="shrink-0 font-mono text-[10.5px] tracking-wide text-[#7DD3FC]">{build.label}</span>
                </li>
              ))}
            </ul>
            <p className="relative mt-auto pt-10 font-mono text-[11px] tracking-[0.2em] uppercase text-emerald-300">
              Flagship course · enrolling now
            </p>
            <h3 className="relative mt-3 text-4xl sm:text-5xl font-extrabold tracking-[-0.035em] leading-[1]">
              {course.title} <GradientText>{course.titleAccent}</GradientText>
            </h3>
            <p className="relative mt-4 text-[15.5px] text-white/65 leading-relaxed max-w-md">{course.metaDescription}</p>
            <div className="relative mt-7 flex flex-wrap gap-2">
              {course.stats.map((stat) => (
                <span key={stat.label} className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 font-mono text-[11.5px] text-white/80">
                  {`${stat.value} ${stat.label.toLowerCase()}`}
                </span>
              ))}
            </div>
          </Link>

          {tiles.map((tile, index) => (
            <Link
              key={tile.href}
              href={tile.href}
              className="group relative lg:col-span-6 overflow-hidden rounded-[24px] border border-[#E6EAF2] bg-white p-6 sm:p-7 grid grid-cols-[auto_1fr_auto] gap-5 items-start transition-all duration-500 hover:-translate-y-1 hover:border-[#D6E4FF] hover:shadow-[0_28px_50px_-30px_rgba(11,27,61,0.35)]"
            >
              <span className="grid place-items-center w-12 h-12 rounded-2xl bg-[#EBF3FF]">
                <tile.icon className="w-[22px] h-[22px] text-[#0052FF]" aria-hidden />
              </span>
              <span>
                <span className="block font-mono text-[10.5px] tracking-[0.2em] uppercase text-[#94A3B8]">
                  {`0${index + 2} · ${tile.eyebrow}`}
                </span>
                <span className="mt-1.5 block text-[20px] font-extrabold tracking-tight text-[#0B1B3D]">{tile.title}</span>
                <span className="mt-1.5 block text-[14.5px] text-[#475569] leading-relaxed">{tile.body}</span>
                <span className="mt-3 inline-block text-[12.5px] font-bold text-[#0052FF]">{tile.meta}</span>
              </span>
              <ArrowUpRight className="w-5 h-5 text-[#94A3B8] transition-all group-hover:text-[#0052FF] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
