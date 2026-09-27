import Link from "next/link";
import { ArrowUpRight, CalendarDays, Sparkles } from "lucide-react";
import type { Course } from "@/components/Pages/Courses/courseData";
import type { EventDetailModel } from "@/components/Pages/Events/shared/model";
import { DarkGrid, GradientText, PrimaryCta } from "@/components/Pages/Courses/CourseLanding/ui";

/** The brand's own curve, rising left to right, with a milestone on each bend. */
const CURVE = "M 20 380 C 180 372, 270 330, 340 262 S 440 90, 580 40";
const MILESTONES = [
  { x: 110, y: 372, label: "Learn", delay: "0.9s" },
  { x: 229, y: 337, label: "Build", delay: "1.4s" },
  { x: 420, y: 150, label: "Ship", delay: "1.9s" },
  { x: 560, y: 46, label: "Grow", delay: "2.4s" },
];

function CurveVisual({ course, nextEvent }: { course: Course; nextEvent?: EventDetailModel }) {
  return (
    <div className="relative w-full aspect-[600/440] max-w-[620px] mx-auto">
      <div className="absolute inset-0 rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.01] overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:40px_40px]"
        />
        <svg viewBox="0 0 600 440" className="absolute inset-0 w-full h-full" aria-hidden>
          <defs>
            <linearGradient id="home-curve" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#0052FF" />
              <stop offset="100%" stopColor="#00C2FF" />
            </linearGradient>
            <linearGradient id="home-curve-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0052FF" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0052FF" stopOpacity="0" />
            </linearGradient>
            <filter id="home-curve-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>
          <path d={`${CURVE} L 580 440 L 20 440 Z`} fill="url(#home-curve-fill)" className="animate-pop-in [animation-delay:1.6s]" />
          <path d={CURVE} pathLength={1} fill="none" stroke="url(#home-curve)" strokeWidth="10" filter="url(#home-curve-glow)" opacity="0.7" className="animate-draw-curve" />
          <path d={CURVE} pathLength={1} fill="none" stroke="url(#home-curve)" strokeWidth="3.5" strokeLinecap="round" className="animate-draw-curve" />
          {MILESTONES.map((point) => (
            <g key={point.label} className="animate-pop-in" style={{ animationDelay: point.delay, transformOrigin: `${point.x}px ${point.y}px` }}>
              <circle cx={point.x} cy={point.y} r="11" fill="#06102B" stroke="#7DD3FC" strokeWidth="2" />
              <circle cx={point.x} cy={point.y} r="4" fill="#7DD3FC" />
              <text x={point.x} y={point.y + 34} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="13" fontFamily="var(--font-geist-mono)" letterSpacing="2">
                {point.label.toUpperCase()}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Floating cards: the flagship course, and the next live event when there is one. */}
      <Link
        href={`/courses/${course.slug}`}
        className="animate-pop-in [animation-delay:1.1s] group absolute -left-3 sm:-left-8 top-[8%] w-[62%] sm:w-[52%] rounded-2xl border border-white/15 bg-[#0B1B3D]/80 backdrop-blur-xl p-4 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)] transition-transform hover:-translate-y-1"
      >
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] uppercase text-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden /> Enrolling now
        </span>
        <span className="mt-2 flex items-start justify-between gap-2 text-[15px] sm:text-[17px] font-extrabold text-white leading-tight">
          {course.title} {course.titleAccent}
          <ArrowUpRight className="w-4 h-4 shrink-0 text-white/50 transition-colors group-hover:text-white" aria-hidden />
        </span>
        <span className="mt-1.5 block text-[12px] text-white/55">6-week live cohort · 15 agents shipped</span>
      </Link>

      <Link
        href={nextEvent ? `/events/${nextEvent.slug}` : "/events"}
        className="animate-pop-in [animation-delay:2.1s] group absolute right-0 sm:-right-6 -bottom-10 sm:bottom-[7%] w-[58%] sm:w-[54%] rounded-2xl border border-white/15 bg-white p-4 text-[#0B1B3D] shadow-[0_30px_60px_-24px_rgba(0,20,80,0.8)] transition-transform hover:-translate-y-1"
      >
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] uppercase text-[#0052FF]">
          {nextEvent ? <CalendarDays className="w-3 h-3" aria-hidden /> : <Sparkles className="w-3 h-3" aria-hidden />}
          {nextEvent ? "Next live event" : "Free live events"}
        </span>
        <span className="mt-2 block text-[14px] sm:text-[15px] font-extrabold leading-snug line-clamp-2">
          {nextEvent ? nextEvent.title : "Hands-on AI workshops, online and in Bengaluru"}
        </span>
        <span className="mt-1.5 block text-[12px] text-[#64748B]">
          {nextEvent ? `${nextEvent.dateLabel} · ${nextEvent.mode} · Free` : "Free to attend · certificate included"}
        </span>
      </Link>
    </div>
  );
}

export default function HomeHero({ course, nextEvent }: { course: Course; nextEvent?: EventDetailModel }) {
  return (
    <section className="relative overflow-hidden bg-[#06102B] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-60 -left-40 w-[820px] h-[820px] rounded-full bg-[radial-gradient(circle,rgba(0,82,255,0.32),transparent_62%)]" />
        <div className="absolute bottom-[-30%] right-[-10%] w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(0,194,255,0.16),transparent_65%)]" />
      </div>
      <DarkGrid />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-28 grid lg:grid-cols-12 gap-14 lg:gap-8 items-center">
        <div className="lg:col-span-6">
          <p className="inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-1.5 font-mono text-[10.5px] sm:text-[11px] tracking-[0.2em] uppercase text-white/65">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#00C2FF] opacity-70 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-[#00C2FF]" />
            </span>
            Career growth for the AI era
          </p>
          <h1 className="mt-7 text-[48px] sm:text-7xl lg:text-[84px] font-extrabold tracking-[-0.045em] leading-[0.98]">
            Move beyond your <GradientText>learning curve.</GradientText>
          </h1>
          <p className="mt-7 text-lg sm:text-xl text-white/70 leading-relaxed max-w-xl">
            Learn practical AI skills live, build real projects, and meet the people who move careers forward.
          </p>
          <p className="mt-5 font-mono text-[12px] tracking-[0.24em] uppercase text-[#7DD3FC]">Learn · Build · Grow</p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <PrimaryCta href={`/courses/${course.slug}`}>Explore the course</PrimaryCta>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 border border-white/25 text-white hover:bg-white hover:text-[#0B1B3D] font-bold text-xs sm:text-[13px] tracking-wider uppercase px-7 py-4 rounded-[4px] transition-colors"
            >
              Browse free events
            </Link>
          </div>
        </div>
        <div className="lg:col-span-6">
          <CurveVisual course={course} nextEvent={nextEvent} />
        </div>
      </div>
    </section>
  );
}
