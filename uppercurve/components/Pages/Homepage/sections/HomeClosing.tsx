import Link from "next/link";
import { Plus } from "lucide-react";
import type { Course } from "@/components/Pages/Courses/courseData";
import { CourseHeading, DarkGrid, GradientText, PrimaryCta } from "@/components/Pages/Courses/CourseLanding/ui";

const STEPS = [
  { title: "Start free", body: "Join a live event or the community. No account, no payment — just show up and build.", tag: "Events · community" },
  { title: "Go deep", body: "Take a cohort when you are ready to commit: live sessions, weekly builds, real deadlines.", tag: "Courses" },
  { title: "Prove it", body: "Every programme ends in something shipped and reviewed — plus a certificate anyone can verify.", tag: "Portfolio · certificate" },
  { title: "Move up", body: "Take the work into interviews, promotions and roles that did not exist two years ago.", tag: "Jobs" },
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
              Every step is a step <GradientText>up.</GradientText>
            </>
          }
          description="Start with an evening. Stay for a cohort. Leave with work you can show."
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
        "A career growth platform where ambitious people learn practical skills, build real experience, connect with the right people, and move their careers forward.",
    },
    {
      question: "Are the events really free?",
      answer: "Yes. Every public event — workshops, micro-certificates, intensives and build days — is free. You only register so we can send the joining details.",
    },
    {
      question: `Who is the ${course.title} ${course.titleAccent} for?`,
      answer: course.faqs[0]?.answer ?? course.metaDescription,
    },
    {
      question: "Do I need a technical background?",
      answer: "No. Our events and our course both start from the basics, with AI tools doing the heavy lifting. If you already code, the later sessions go deep enough to stay interesting.",
    },
    {
      question: "How do I stay in the loop?",
      answer: "Join the UpperCurve community. New events, cohort dates and the material from every session are shared there first.",
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
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28">
        <div className="relative overflow-hidden rounded-[32px] bg-[#06102B] px-6 py-16 sm:px-16 sm:py-24 text-center text-white">
          <DarkGrid />
          <div aria-hidden className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-72 w-[900px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(0,82,255,0.5),transparent_62%)]" />
          <div className="relative">
            <h2 className="text-[40px] sm:text-6xl lg:text-[80px] font-extrabold tracking-[-0.045em] leading-[0.98]">
              Ready to move
              <br />
              <GradientText>up the curve?</GradientText>
            </h2>
            <p className="mt-7 text-[16px] sm:text-lg text-white/65 max-w-lg mx-auto leading-relaxed">
              Start with a free live event tonight, or commit to six weeks that change what you can build.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <PrimaryCta href={`/courses/${course.slug}`}>Explore the course</PrimaryCta>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 border border-white/25 text-white hover:bg-white hover:text-[#0B1B3D] font-bold text-xs sm:text-[13px] tracking-wider uppercase px-7 py-4 rounded-[4px] transition-colors"
              >
                Browse free events
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
