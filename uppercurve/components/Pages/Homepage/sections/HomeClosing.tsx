"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Course } from "@/components/Pages/Courses/courseData";
import { CourseHeading, DarkGrid, GradientText, PrimaryCta } from "@/components/Pages/Courses/CourseLanding/ui";
import CourseEnrollModal from "@/components/Pages/Courses/CourseEnrollModal";

const STEPS = [
  {
    title: "Starting Phase", body: "Join a FREE Certification Live Workshop or become part of the Community & Explore what interests you, learn from others and find your starting point.", tag: "WORKSHOPS · COMMUNITY"
  },
  { title: "Building Phase", body: "Move from watching to Building. Learn through structured courses, Hands-on Sessions & Projects that challenge you to think and build.", tag: "COURSES · PROJECTS" },
  { title: "Show your Work", body: "Knowledge matters but Proof matters more. Build a portfolio, complete meaningful projects & Earn certifications that reflect your capabilities.", tag: "PORTFOLIO · CERTIFICATIONS" },
  { title: "Go Further", body: "Put your skills to work & Explore jobs, internships, and opportunities that can turn what you've built into what's next.", tag: "JOBS · OPPORTUNITIES" },
];

/** The route through UpperCurve, as a rising line of four steps. */
export function Path() {
  return (
    <section className="relative overflow-hidden bg-[#06102B] text-white">
      <DarkGrid />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <CourseHeading
          dark
          eyebrow="How it works"
          title={
            <>
              Every Step is a Step <GradientText>UP.</GradientText>
            </>
          }
          description="A clear path from learning new skills to creating work that opens doors."
        />
        <ol className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:items-end lg:[--rise:32px]">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="relative rounded-[22px] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-7 transition-colors hover:border-white/25"
              style={{ marginBottom: `calc(var(--rise, 0px) * ${index})` }}
            >
              <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#7DD3FC]">{`Step 0${index + 1}`}</span>
              <p className="mt-10 text-[26px] font-extrabold tracking-tight">{step.title}</p>
              <p className="mt-2 text-[14.5px] text-white/60 leading-relaxed">{step.body}</p>
              <p className="mt-6 pt-4 border-t border-white/10 font-mono text-[10.5px] tracking-[0.16em] uppercase text-white/40">{step.tag}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function HomeFaq({ course }: { course: Course }) {
  const faqs = [
    {
      question: "What is UpperCurve?",
      answer:
        "UpperCurve is a learning platform for the AI era. We run live courses, free events and a community, and connect you to jobs, so you can learn a skill, prove it with real work and move up in your career.",
    },
    {
      question: "Are the events really free?",
      answer:
        "Yes, Every live event, workshop and competition on our events page is free. You can join without paying anything.",
    },
    {
      question: `Who is the ${course.title} ${course.titleAccent} for?`,
      answer:
        "It's for professionals, students and educators who want to go beyond using AI and start building with it. If you want to ship real AI agents and have something to show for it, this is for you.",
    },
    {
      question: "Do I need a technical background?",
      answer:
        "No, We start with no-code automations and build up step by step, with live help and 1:1 mentorship along the way. If you're curious and ready to build, you can start.",
    },
    {
      question: "How do I stay in the loop?",
      answer:
        "Join the Free WhatsApp Community. You'll hear about new events, cohort dates and job openings First.",
    },
  ];
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5">
          <CourseHeading eyebrow="FAQ" title="Questions, answered." />
        </div>
        <div className="lg:col-span-7 space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl border border-[#E6EAF2] bg-[#F8FAFC] open:bg-white open:shadow-[0_20px_40px_-28px_rgba(11,27,61,0.35)] [&_summary::-webkit-details-marker]:hidden"
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

export function HomeCta({ course }: { course: Course }) {
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28">
        <div className="relative overflow-hidden rounded-[32px] bg-[#06102B] px-6 py-16 sm:px-16 sm:py-24 text-center text-white">
          <DarkGrid />
          <div aria-hidden className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-72 w-[900px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(0,82,255,0.5),transparent_62%)]" />
          <div className="relative">
            <h2 className="text-[40px] sm:text-6xl lg:text-[80px] font-extrabold tracking-[-0.045em] leading-[0.98]">
              Ready to take
              <br />
              <GradientText>the next step?</GradientText>
            </h2>
            <p className="mt-7 text-[16px] sm:text-lg text-white/65 max-w-lg mx-auto leading-relaxed">
              Learn through Hands-on Experiences, build real projects & evelop skills that move your career forward.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <PrimaryCta onClick={() => setIsEnrollModalOpen(true)}>Enroll Now</PrimaryCta>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 border border-white/25 text-white hover:bg-white hover:text-[#0B1B3D] font-bold text-xs sm:text-[13px] tracking-wider uppercase px-7 py-4 rounded-[4px] transition-colors"
              >
                Explore Free Events
              </Link>
            </div>
          </div>
        </div>
      </div>

      <CourseEnrollModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        courseTitle={`${course.title} ${course.titleAccent || ""}`.trim()}
      />
    </section>
  );
}
