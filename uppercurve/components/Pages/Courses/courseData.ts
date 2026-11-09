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
  metaTitle: "Agentic AI Launchpad | 6-Week Live Cohort | UpperCurve",
  metaDescription:
    "Build and Ship 10+ AI Agents in 6-Weeks | Live sessions | 1:1 Mentorship with a Verified Certificate.",
  eyebrow: " 6 Weeks Live Cohort · Limited Seats",
  tagline: "Go beyond just using AI, Learn to build AI Agents that actually Work.",
  cohortLabel: "Next cohort",
  enrollHref: "/community",
  tasterHref: "/events",
  heroCard: {
    title: "Go from Prompting to",
    accent: "Deploying.",
    body: "In six weeks, you’ll build practical AI Agents from scratch, work on real projects & develop the confidence to deploy what you create.",
    points: [
      "10+ Hands-On Agent Projects.",
      "Live Weekly Sessions with 1:1 Doubt Solving.",
      "No Coding Experience Needed to Start.",
    ],
  },
  stats: [
    { value: "6", label: "Weeks Live Hands-On Program" },
    { value: "10+", label: "AI Agent Building" },
    { value: "", label: "Certification Course" },
    { value: "1:1", label: "Mentorship Guidance" },
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
    { cadence: "Every week", title: "Live Build Sessions", body: "You learn live from mentors who build AI agents at work, follow a simple weekly rhythm, and finish with a working agent in your portfolio." },
    { cadence: "Every week", title: "Doubt-Solving Labs", body: "Stuck somewhere? Clear your doubts in small-group labs and office hours, so you never fall behind." },
    { cadence: "Weeks 5–6", title: "Personal Mentor Reviews", body: "Get two 1:1 reviews on your capstone, so your agent is solid before it goes live." },
    { cadence: "Week 6", title: "Demo Day Showcase", body: "Present your live agent to mentors and peers, and add a real project to your portfolio." },
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
      "Credible proof of hands - on agentic AI experience.",
      "Verifiable online through a unique Credential ID.",
      "Linked to real projects employers can open and review.",
    ],
  },
  testimonials: [],
  inclusions: [
    { lead: "6 weeks of live training,", rest: "with recordings of every session." },
    { lead: "10+ guided projects,", rest: "including your own capstone agent." },
    { lead: "Ready-to-use agent templates", rest: "for Claude Code and Codex, built for real work." },
    { lead: "1:1 capstone mentorship,", rest: "followed by a live Demo Day presentation." },
    { lead: "Private builder community", rest: "with weekly office hours." },
    { lead: "Verified Certificate in Agentic AI Engineering,", rest: "shareable on LinkedIn." },
  ],
  faqs: [
    {
      question: "What is the Agentic AI Launchpad?",
      answer:
        "The Agentic AI Launchpad is a 6-week live cohort where you learn to build, deploy and ship AI agents. You start with no-code automations and progress to multi-agent systems, with 1:1 mentor guidance and a capstone project presented at Demo Day.",
    },
    {
      question: "What is agentic AI, and how is it different from ChatGPT?",
      answer:
        "Agentic AI refers to AI systems that can plan, make decisions and take actions to complete a goal on their own. A chatbot like ChatGPT replies to your prompts. An AI agent can carry out multi-step tasks, such as researching, booking meetings or updating databases, using real tools and apps.",
    },
    {
      question: "Who is this AI agents course designed for?",
      answer:
        "The course is designed for working professionals, students, founders, product managers and developers who want to build with AI rather than just use it. Beginners start comfortably with no-code tools, while experienced learners will find the advanced modules challenging.",
    },
    {
      question: "Can I learn to build AI agents without coding experience?",
      answer:
        "Yes. The first two weeks are completely no-code, using tools like n8n, Make.com and Lovable. Coding is introduced gradually, with AI coding assistants like Claude Code and Cursor doing most of the heavy lifting.",
    },
    {
      question: "Which AI tools will I learn in this course?",
      answer:
        "You’ll work hands-on with Claude, Claude Code, OpenAI, n8n, Make.com, CrewAI, LangGraph, MCP, ElevenLabs, Lovable, Supabase, Cursor, Python and Hugging Face. These are the tools teams use to build and deploy AI agents today.",
    },
    {
      question: "What kind of AI agents will I build?",
      answer:
        "You’ll build 10+ projects. They include workflow automations, an AI voice agent, a “chat with your data” RAG agent, a multi-agent research team and a full-stack web app. Your capstone is a personal AI assistant connected to your calendar, files and apps.",
    },
    {
      question: "How much time do I need to commit each week?",
      answer:
        "Plan for around 3–4 hours per week. That covers two live evening sessions plus time to work on your weekly project. Build labs and office hours make sure you never stay stuck for long.",
    },
    {
      question: "What if I miss a live session?",
      answer:
        "Every live session is recorded and shared within the same week, so you can catch up at your own pace. You can also bring any questions to the weekly office hours.",
    },
    {
      question: "Will I receive a certificate after completing the course?",
      answer:
        "Yes. You’ll earn the Certificate in Agentic AI Engineering after presenting your capstone at Demo Day. Each certificate carries a unique credential ID that employers can verify, and you can share it directly on LinkedIn.",
    },
    {
      question: "How will this course help my career?",
      answer:
        "You’ll graduate with a portfolio of deployed AI agents, which is practical proof of your skills. This prepares you for in-demand roles such as AI Product Manager, AI Agent Engineer, Forward Deployed Engineer and AI Automation Consultant.",
    },
    {
      question: "How can I contact the UpperCurve team?",
      answer:
        "You can reach us by joining the UpperCurve community or by attending one of our free live workshops.",
    },
  ],
};

export const COURSES: Course[] = [agenticAiLaunchpad];

export function getCourse(slug: string): Course | undefined {
  return COURSES.find((course) => course.slug === slug);
}
