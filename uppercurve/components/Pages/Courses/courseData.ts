/**
 * Course content lives here rather than in the CMS for now: there is one
 * course, and its page is mostly bespoke copy. Adding a second course means
 * adding a second entry to COURSES — every section reads from this shape.
 *
 * Optional fields hide their section when absent, so a course never ships
 * with placeholder people, reviews or prices.
 */

/** Each module card's colour, light to dark down the stack. */
export type ModuleTone = "ice" | "sky" | "blue" | "deep" | "navy" | "outline";

export interface CourseModule {
  week: number;
  title: string;
  /** Words in the title to set in the accent colour. */
  accent?: string;
  tools: string[];
  topics: string[];
  /** Shown when the card's syllabus is expanded. */
  lessons: string[];
  tone: ModuleTone;
}

export interface CourseBuild {
  label: string;
  title: string;
  accent: string;
  body: string;
  tags: string[];
}

export interface CourseRole {
  title: string;
  track: string;
  body: string;
}

export interface CourseInstructor {
  name: string;
  photoUrl: string;
  bio: string;
  credentials: string[];
}

export interface CourseTestimonial {
  quote: string;
  name: string;
  role: string;
  company?: string;
  photoUrl?: string;
}

export interface Course {
  slug: string;
  title: string;
  /** Second line of the hero title, set in the brand gradient. */
  titleAccent: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  tagline: string;
  cohortLabel: string;
  /** e.g. "₹49,999". Leave unset to show "fees on request" instead. */
  price?: string;
  enrollHref: string;
  /** Low-commitment alternative shown under the price. */
  tasterHref: string;
  heroCard: { title: string; accent: string; body: string; points: string[] };
  stats: { value: string; label: string }[];
  tools: string[];
  modules: CourseModule[];
  builds: CourseBuild[];
  rhythm: { title: string; body: string; cadence: string }[];
  instructor?: CourseInstructor;
  roles: CourseRole[];
  certificate: { title: string; statement: string; points: string[] };
  testimonials: CourseTestimonial[];
  inclusions: { lead: string; rest: string }[];
  faqs: { question: string; answer: string }[];
}

const agenticAiLaunchpad: Course = {
  slug: "agentic-ai-launchpad",
  title: "Agentic AI",
  titleAccent: "Launchpad",
  metaTitle: "Agentic AI Launchpad — UpperCurve",
  metaDescription:
    "A six-week live cohort where you build, deploy and ship fifteen production-ready AI agents — from no-code automations to multi-agent systems on Claude.",
  eyebrow: "Live cohort · 6 weeks · Limited seats",
  tagline: "Most people use AI agents. A few build them. Six weeks from now, which one are you?",
  cohortLabel: "Next cohort",
  enrollHref: "/community",
  tasterHref: "/events",
  heroCard: {
    title: "Go from prompting to",
    accent: "deploying.",
    body: "In six weeks you won't just understand agents — you'll have fifteen of them running.",
    points: [
      "15 real agentic projects, shipped by you",
      "Live weekly sessions with 1:1 capstone reviews",
      "No coding experience needed to start",
    ],
  },
  stats: [
    { value: "6", label: "Weeks, live" },
    { value: "6", label: "Modules" },
    { value: "15", label: "Agents you ship" },
    { value: "1:1", label: "Capstone mentorship" },
  ],
  tools: [
    "Claude",
    "OpenAI",
    "n8n",
    "Make.com",
    "CrewAI",
    "LangGraph",
    "MCP",
    "ElevenLabs",
    "Lovable",
    "Python",
    "Supabase",
    "Cursor",
    "Claude Code",
    "Hugging Face",
  ],
  modules: [
    {
      week: 1,
      title: "Intro to agentic AI & AI for work",
      accent: "AI for work",
      tools: ["Claude", "OpenAI"],
      topics: ["What AI agents are", "Prompting & context engineering", "LLM APIs", "Automating PPTs, Docs & Excel"],
      lessons: [
        "How agents differ from chatbots: goals, tools, memory and loops",
        "Context engineering — structuring instructions that survive real inputs",
        "Calling LLM APIs directly, and choosing between models",
        "Automating the documents you already produce every week",
      ],
      tone: "ice",
    },
    {
      week: 2,
      title: "AI agents for automation",
      accent: "automation",
      tools: ["n8n", "Make.com", "Lovable", "ElevenLabs"],
      topics: ["n8n workflows", "Make.com", "Voice agents", "Vibe coding", "Image & video agents"],
      lessons: [
        "Designing trigger → reason → act workflows in n8n and Make.com",
        "A voice agent that answers, qualifies and books — end to end",
        "Vibe-coding a working product with Lovable",
        "Image and video generation pipelines you can hand to a team",
      ],
      tone: "sky",
    },
    {
      week: 3,
      title: "RAG & agents from scratch",
      accent: "from scratch",
      tools: ["LangGraph", "CrewAI", "MCP", "Python"],
      topics: ["RAG & vector DBs", "Chat with your data", "Tool calling", "MCP servers", "LLM evaluation"],
      lessons: [
        "Embeddings, chunking and retrieval that actually finds the answer",
        "Tool calling and agent loops without a framework, then with one",
        "Building and connecting your own MCP server",
        "Evaluating agents so you know when they are good enough to ship",
      ],
      tone: "blue",
    },
    {
      week: 4,
      title: "Mastering the Claude ecosystem",
      accent: "Claude ecosystem",
      tools: ["Claude", "Artifacts", "Cowork"],
      topics: ["Artifacts", "Projects & skills", "AI memory", "Connectors & MCP", "Claude Cowork"],
      lessons: [
        "Artifacts as shippable mini-apps, not just previews",
        "Projects, skills and memory for assistants that know your work",
        "Connectors and MCP: wiring Claude into calendars, files and apps",
        "Delegating real multi-step work with Claude Cowork",
      ],
      tone: "deep",
    },
    {
      week: 5,
      title: "Claude Code, design & multi-agent systems",
      accent: "multi-agent systems",
      tools: ["Claude Code", "Codex", "Supabase", "Cursor"],
      topics: ["Claude Code · CLI & web", "Codex", "AI design", "Supabase full-stack", "Multi-agent orchestration"],
      lessons: [
        "Shipping a full-stack app with Claude Code and Supabase",
        "Design-to-code workflows that keep a product looking intentional",
        "Orchestrating specialist agents that hand work to each other",
        "Deploying to a real domain, with auth and a database",
      ],
      tone: "navy",
    },
    {
      week: 6,
      title: "Capstone: launch your agent",
      accent: "launch your agent",
      tools: ["1:1 mentorship", "Demo Day"],
      topics: ["Your idea", "1:1 reviews", "Demo Day", "Deployed & public"],
      lessons: [
        "Scope an agent around a problem you or your team really have",
        "Two 1:1 reviews to pressure-test the design and the build",
        "Present it live on Demo Day to mentors and the cohort",
        "Leave with it deployed, public and in your portfolio",
      ],
      tone: "outline",
    },
  ],
  builds: [
    {
      label: "Build 01",
      title: "A website,",
      accent: "live by dinner.",
      body: "Your idea on a real domain in one sitting — designed, coded and deployed with Claude Code. Frontend, database and auth, done.",
      tags: ["Claude Code", "Supabase"],
    },
    {
      label: "Build 02",
      title: "A research team that",
      accent: "never sleeps.",
      body: "A researcher, an analyst and a writer: three agents that search, verify and hand you a finished brief while you are in a meeting.",
      tags: ["CrewAI", "LangGraph"],
    },
    {
      label: "Build 03",
      title: "A voice agent that",
      accent: "picks up.",
      body: "It answers calls, qualifies the lead and books the slot on your calendar — then logs the conversation where your team can see it.",
      tags: ["ElevenLabs", "n8n"],
    },
    {
      label: "Build 04",
      title: "Chat with",
      accent: "your own data.",
      body: "A retrieval agent over your documents that cites its sources, so the answers are ones you can actually forward.",
      tags: ["RAG", "Vector DB"],
    },
    {
      label: "Build 05 · Capstone",
      title: "Your personal",
      accent: "chief of staff.",
      body: "Claude connected to your calendar, files and apps through MCP. One assistant that plans your week and preps your meetings — then Demo Day.",
      tags: ["MCP", "Claude", "Everything above"],
    },
  ],
  rhythm: [
    { cadence: "Every week", title: "Live build sessions", body: "Two evenings a week, building alongside the mentor — not watching slides." },
    { cadence: "Every week", title: "Build labs & office hours", body: "Unblock your project in small groups before it turns into a lost weekend." },
    { cadence: "Weeks 5–6", title: "1:1 capstone reviews", body: "Your design and your build, pressure-tested one-on-one before it goes live." },
    { cadence: "Week 6", title: "Demo Day", body: "Present a deployed agent to mentors and the cohort. It goes straight into your portfolio." },
  ],
  roles: [
    { title: "Forward deployed engineer", track: "Customer-facing", body: "Embed with customers and build agent solutions on-site. One of the fastest-growing titles in AI." },
    { title: "AI product manager", track: "Product", body: "Ship AI products with the judgement of someone who has built agents, not just read about them." },
    { title: "Agent engineer", track: "Engineering", body: "Design, build and maintain production agent systems — the core engineering role of this decade." },
    { title: "AI automation consultant", track: "Independent", body: "Help teams replace repetitive work with automations they can trust and maintain themselves." },
  ],
  certificate: {
    title: "Certificate in Agentic AI Engineering",
    statement:
      "has completed the six-week Agentic AI Launchpad, shipped fifteen agentic projects and presented a production agent at a live Demo Day.",
    points: [
      "Awarded on completion — tied to your Demo Day project",
      "A unique ID anyone can verify",
      "Backed by a portfolio of fifteen projects employers can open",
    ],
  },
  testimonials: [],
  inclusions: [
    { lead: "6 weeks of live sessions", rest: "with recordings of every one" },
    { lead: "15 guided projects", rest: "including your own capstone agent" },
    { lead: "Ready-made agent templates", rest: "for Claude Code and Codex, yours to reuse at work" },
    { lead: "1:1 capstone mentorship", rest: "and a live Demo Day" },
    { lead: "Private builder community", rest: "with weekly office hours" },
    { lead: "Certificate in Agentic AI Engineering", rest: "shareable on LinkedIn" },
  ],
  faqs: [
    {
      question: "Who is this cohort designed for?",
      answer:
        "Professionals, founders, product people and developers who want to build with AI rather than just use it. You do not need to be an engineer — the first two modules are no-code, and code is introduced gradually.",
    },
    {
      question: "Do I need coding experience?",
      answer:
        "No. You start with no-code automation tools and move to code with AI coding assistants doing the heavy lifting. If you already code, the later modules go deep enough to stay interesting.",
    },
    {
      question: "How much time does it take each week?",
      answer:
        "Plan for six to eight hours: the live sessions, plus time on that week's build. Build labs and office hours are there so you are never stuck for long.",
    },
    {
      question: "What will I have at the end?",
      answer:
        "Fifteen working projects, a deployed capstone agent you presented at Demo Day, and a certificate backed by that portfolio.",
    },
    {
      question: "What if I miss a live session?",
      answer:
        "Every session is recorded and shared the same week. Office hours are the place to catch up on anything you missed.",
    },
    {
      question: "Is there a certificate?",
      answer:
        "Yes — the Certificate in Agentic AI Engineering, awarded on completion of the capstone. Every certificate carries an ID anyone can verify.",
    },
    {
      question: "How do I get in touch with questions?",
      answer:
        "Join the UpperCurve community and ask there, or come to one of our free live events first to see how we teach.",
    },
  ],
};

export const COURSES: Course[] = [agenticAiLaunchpad];

export function getCourse(slug: string): Course | undefined {
  return COURSES.find((course) => course.slug === slug);
}
