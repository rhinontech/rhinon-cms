import Link from "next/link";
import { ArrowRight, MailCheck, MousePointerClick, PlayCircle, Plus } from "lucide-react";
import type { EventDetailModel } from "../../shared/model";
import { CATEGORY_CONFIG } from "../../shared/categoryConfig";
import { SectionHeading } from "../../shared/ui";

export function HowItWorks() {
  const steps = [
    { icon: MousePointerClick, title: "Register in a minute", body: "Name and email. No account, no payment, no catch." },
    { icon: MailCheck, title: "Get your joining details", body: "The link, the prep list and a calendar invite land in your inbox." },
    { icon: PlayCircle, title: "Learn live, keep the recording", body: "Build alongside the host. Recordings and material follow within 48 hours." },
  ];
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-4">
      <SectionHeading align="center" eyebrow="How it works" title="From sign-up to seat in three steps" />
      <ol className="relative mt-14 grid md:grid-cols-3 gap-10 md:gap-6">
        <div aria-hidden className="hidden md:block absolute top-7 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-[#CBD5E1] to-transparent" />
        {steps.map((step, index) => (
          <li key={step.title} className="relative text-center px-4">
            <span className="relative mx-auto grid place-items-center w-14 h-14 rounded-2xl bg-white border border-[#E2E8F0] shadow-[0_10px_24px_-14px_rgba(11,27,61,0.35)]">
              <step.icon className="w-6 h-6 text-[#0052FF]" aria-hidden />
              <span className="absolute -top-2 -right-2 grid place-items-center w-6 h-6 rounded-full bg-[#0B1B3D] text-white text-[11px] font-bold">
                {index + 1}
              </span>
            </span>
            <p className="mt-6 text-[17px] font-extrabold text-[#0B1B3D]">{step.title}</p>
            <p className="mt-2 text-[14.5px] text-[#64748B] leading-relaxed max-w-xs mx-auto">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const FAQS = [
  {
    question: "Are UpperCurve events really free?",
    answer: "Yes. Every public event — workshops, micro-certificates, intensives and build days — is free. You only register so we can send the joining details.",
  },
  {
    question: "Do I need to be an UpperCurve learner?",
    answer: "No. Events are open to anyone. Many attendees are educators, designers and developers meeting us for the first time.",
  },
  {
    question: "What is the difference between a workshop and a micro-certificate?",
    answer: "A workshop is a single live session with a certificate of participation. A micro-certificate runs over several evenings and is awarded only after a live review of what you built.",
  },
  {
    question: "What if I cannot attend live?",
    answer: "Registered attendees receive the recording and material within 48 hours. Assessed micro-certificates still require the final live review.",
  },
  {
    question: "Where do in-person events happen?",
    answer: "At the UpperCurve campus in Bengaluru. The exact address and entry details come with your registration confirmation.",
  },
];

export function LandingFaq() {
  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
      <SectionHeading align="center" eyebrow="FAQ" title="Questions, answered" />
      <div className="mt-12 divide-y divide-[#E8ECF3] border-y border-[#E8ECF3]">
        {FAQS.map((faq) => (
          <details key={faq.question} className="group py-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[16px] font-semibold text-[#0B1B3D]">
              {faq.question}
              <span className="grid place-items-center shrink-0 w-7 h-7 rounded-full border border-[#E2E8F0] text-[#475569] transition-transform duration-200 group-open:rotate-45 group-open:border-[#0052FF] group-open:text-[#0052FF]">
                <Plus className="w-4 h-4" aria-hidden />
              </span>
            </summary>
            <p className="mt-3 pr-12 text-[15px] text-[#475569] leading-relaxed">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/** Only rendered once there is a season behind us. */
export function PastEvents({ past }: { past: EventDetailModel[] }) {
  if (!past.length) return null;
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
      <SectionHeading eyebrow="Archive" title="Past events" />
      <ul className="mt-8 divide-y divide-[#EEF1F6] border-y border-[#EEF1F6]">
        {past.slice(0, 8).map((event) => (
          <li key={event.slug}>
            <Link href={`/events/${event.slug}`} className="group flex items-center justify-between gap-6 py-4">
              <span className="min-w-0">
                <span className="block text-[15px] font-bold text-[#0B1B3D] group-hover:text-[#0052FF] truncate">
                  {event.title}
                </span>
                <span className="block text-[13px] text-[#64748B]">
                  {CATEGORY_CONFIG[event.category].label} · {event.dateLabel}
                </span>
              </span>
              <ArrowRight className="w-4 h-4 shrink-0 text-[#94A3B8] group-hover:text-[#0052FF]" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LandingCta() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-24">
      <div className="relative overflow-hidden rounded-[32px] bg-[#EBF3FF] border border-[#D6E4FF] px-6 py-14 sm:px-16 sm:py-16">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 w-[460px] h-[460px] rounded-full bg-[radial-gradient(circle,rgba(0,82,255,0.16),transparent_65%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(#B9CCF2_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_right,black,transparent_65%)]" />
        <div className="relative grid lg:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <h2 className="text-3xl sm:text-[42px] font-extrabold text-[#0B1B3D] tracking-tight leading-[1.08]">
              Never miss the next one.
            </h2>
            <p className="mt-4 text-[15px] sm:text-base text-[#334155] max-w-xl leading-relaxed">
              New events are announced to the UpperCurve community first — along with the recordings, prompt libraries
              and build notes from every session.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/community"
              className="inline-flex items-center gap-2 bg-[#0052FF] hover:bg-[#0043CC] text-white font-bold text-xs sm:text-[13px] tracking-wider uppercase px-7 py-3.5 rounded-[4px] shadow-[0_10px_24px_-10px_rgba(0,82,255,0.6)] transition-colors"
            >
              Join the community <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
            <a
              href="#events"
              className="inline-flex items-center gap-2 bg-white border border-[#D6E4FF] text-[#0B1B3D] hover:border-[#0052FF] font-bold text-xs sm:text-[13px] tracking-wider uppercase px-7 py-3.5 rounded-[4px] transition-colors"
            >
              Browse events
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
