import type { EventCategory, Faq } from "./model";

/**
 * What makes each category's page different.
 *
 * One composition renders every event; the category decides the badge and
 * accent, what the schedule and outcomes are called, whether a certificate is
 * awarded, and which highlight block explains the format. That keeps seven
 * categories visibly distinct without seven page trees drifting apart.
 *
 * Tailwind only ships classes it can find as literal strings, so every accent
 * is spelled out in full here rather than assembled at runtime.
 */
export type Highlight = "assessment" | "intensive" | "buildday" | "internal" | "community" | null;

export interface CategoryConfig {
  label: string;
  /** One-line pitch for the format, on the events landing page. */
  summary: string;
  /** Typical shape of the format, e.g. "2–3 hours · online". */
  formatLength: string;
  /**
   * Whether events of this category appear on the public listing. An internal
   * cohort's page still works by direct link; it just isn't advertised.
   */
  publicListing: boolean;
  eyebrow: string;
  accent: {
    /** Eyebrow text and small icons. */
    text: string;
    /** Soft tint behind badges and icon wells. */
    soft: string;
    /** The dot beside the eyebrow. */
    dot: string;
  };
  scheduleTitle: string;
  scheduleEyebrow: string;
  outcomesTitle: string;
  certificate: "completion" | "participation" | null;
  highlight: Highlight;
  /** Shown above the register button, when the category restricts who may attend. */
  restriction?: string;
  faqs: Faq[];
}

const SHARED_FAQS: Faq[] = [
  {
    question: "Is there a fee?",
    answer: "No. UpperCurve events are free to attend — you only need to register so we can send the joining details.",
  },
  {
    question: "Will I get a recording?",
    answer: "Registered attendees receive the recording and any shared material by email within 48 hours of the session.",
  },
  {
    question: "What do I need to bring?",
    answer: "A laptop with a modern browser. For build sessions, a free account on the tools listed in the agenda — we send the list with your confirmation.",
  },
];

export const CATEGORY_CONFIG: Record<EventCategory, CategoryConfig> = {
  Normal: {
    label: "Workshop",
    summary: "A focused, hands-on session on one skill you can use the next day.",
    formatLength: "2–3 hours · live",
    publicListing: true,
    eyebrow: "Live workshop",
    accent: { text: "text-[#0052FF]", soft: "bg-[#EBF3FF]", dot: "bg-[#0052FF]" },
    scheduleTitle: "Session agenda",
    scheduleEyebrow: "Agenda",
    outcomesTitle: "What you will walk away with",
    certificate: "participation",
    highlight: null,
    faqs: SHARED_FAQS,
  },
  Community: {
    label: "Community",
    summary: "Practitioners comparing what actually works — and what quietly failed.",
    formatLength: "Evenings · hybrid",
    publicListing: true,
    eyebrow: "Community meetup",
    accent: { text: "text-[#0E8A8A]", soft: "bg-[#E6F7F7]", dot: "bg-[#00B3B3]" },
    scheduleTitle: "How the evening runs",
    scheduleEyebrow: "Run of show",
    outcomesTitle: "Why people come back",
    certificate: null,
    highlight: "community",
    faqs: [
      {
        question: "Do I need to be an UpperCurve learner?",
        answer: "No. Community meetups are open to anyone working on or curious about the topic — learners, alumni and newcomers alike.",
      },
      ...SHARED_FAQS,
    ],
  },
  MicroCertificate: {
    label: "Micro-Certificate",
    summary: "A short, assessed programme that ends with something you shipped.",
    formatLength: "4 evenings · assessed",
    publicListing: true,
    eyebrow: "Assessed micro-certificate",
    accent: { text: "text-[#4338CA]", soft: "bg-[#EEF2FF]", dot: "bg-[#4F46E5]" },
    scheduleTitle: "Curriculum",
    scheduleEyebrow: "Session by session",
    outcomesTitle: "What you will be able to do",
    certificate: "completion",
    highlight: "assessment",
    faqs: [
      {
        question: "How is the certificate awarded?",
        answer: "Attend every session, submit the build, and pass the live review in the final session. The certificate reflects what you shipped, not attendance alone.",
      },
      {
        question: "What if I miss a session?",
        answer: "Recordings are shared after each session. You can catch up, but the final live review must be attended to earn the certificate.",
      },
      ...SHARED_FAQS.slice(0, 1),
    ],
  },
  GenAiMicroCertificate: {
    label: "GenAI Micro-Certificate",
    summary: "Rebuild your own course with AI, with the design decisions kept human.",
    formatLength: "4 evenings · assessed",
    publicListing: true,
    eyebrow: "GenAI micro-certificate",
    accent: { text: "text-[#6D28D9]", soft: "bg-[#F3EEFF]", dot: "bg-[#7C3AED]" },
    scheduleTitle: "Curriculum",
    scheduleEyebrow: "Session by session",
    outcomesTitle: "What you will be able to do",
    certificate: "completion",
    highlight: "assessment",
    faqs: [
      {
        question: "Do I need a technical background?",
        answer: "No. The programme is built for educators and designers. You will use AI tools directly; no code is required.",
      },
      {
        question: "How is the certificate awarded?",
        answer: "Attend every session and complete the peer-reviewed rebuild of one of your own modules. Reviews happen live in the final session.",
      },
      ...SHARED_FAQS.slice(0, 1),
    ],
  },
  Claude: {
    label: "Claude Intensive",
    summary: "A two-day intensive on long-context workflows for learning teams.",
    formatLength: "2 days · hands-on",
    publicListing: true,
    eyebrow: "Claude intensive",
    accent: { text: "text-[#C2410C]", soft: "bg-[#FFF3EB]", dot: "bg-[#EA580C]" },
    scheduleTitle: "Agenda",
    scheduleEyebrow: "Hands-on blocks",
    outcomesTitle: "What your team takes home",
    certificate: "participation",
    highlight: "intensive",
    faqs: [
      {
        question: "Do I need a paid Claude plan?",
        answer: "No. A free account is enough to follow along; we point out where a team plan changes what is possible.",
      },
      ...SHARED_FAQS,
    ],
  },
  ClaudeOneDay: {
    label: "One-Day Build",
    summary: "Arrive with an idea, leave with a prototype people can click.",
    formatLength: "1 day · in person",
    publicListing: true,
    eyebrow: "One-day build · Claude",
    accent: { text: "text-[#C2410C]", soft: "bg-[#FFF3EB]", dot: "bg-[#EA580C]" },
    scheduleTitle: "How the day runs",
    scheduleEyebrow: "Build day",
    outcomesTitle: "What you leave with",
    certificate: "participation",
    highlight: "buildday",
    faqs: [
      {
        question: "Can I come without a team?",
        answer: "Yes. Most people arrive solo — teams of up to three form in the first hour around the problems people bring.",
      },
      {
        question: "Do I need to code?",
        answer: "It helps, but it is not required. Every team pairs an educator with at least one builder, and mentors are on the floor all day.",
      },
      ...SHARED_FAQS.slice(0, 1),
    ],
  },
  InternalCohort: {
    label: "Internal Cohort",
    summary: "Faculty-only training that takes our own sessions apart.",
    formatLength: "3 days · internal",
    publicListing: false,
    eyebrow: "Internal · Faculty only",
    accent: { text: "text-[#334155]", soft: "bg-[#F1F5F9]", dot: "bg-[#475569]" },
    scheduleTitle: "Programme",
    scheduleEyebrow: "Day by day",
    outcomesTitle: "What changes afterwards",
    certificate: null,
    highlight: "internal",
    restriction: "Open to UpperCurve instructors and teaching assistants only.",
    faqs: [
      {
        question: "Who can attend?",
        answer: "UpperCurve instructors and teaching assistants. Join the waitlist with your work email and the programme team will confirm your place.",
      },
      {
        question: "Is attendance mandatory?",
        answer: "It is expected for anyone teaching in the next cohort. Speak to your programme lead if the dates clash.",
      },
    ],
  },
};
