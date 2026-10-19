// All copy and media for the page lives here, so rebranding is a one-file job.
// Inline markers understood by <Rich>: *strong* (full ink) and _muted_ (faded).
// Facts mirror rhinonlabs/lib/site.ts — keep the two in sync.

export const site = {
  name: "Rhinon Labs",
  title: "Rhinon Labs — MVP, AI & Software Development for Startups",
  description:
    "Rhinon Labs is a product and automation studio in Hyderabad, India that designs, builds and launches MVPs, AI agents, workflow automations, internal dashboards, websites and mobile apps for startups and growing businesses — usually within 2–4 weeks.",
  email: "prabhat@rhinon.tech",
  phone: "+91 8249 291 789",
  phoneHref: "tel:+918249291789",
  city: "Hyderabad",
  bookingUrl: "https://www.rhinonlabs.com/schedule-call",
  socials: [
    { label: "IN", href: "https://www.linkedin.com/company/rhinonlabs" },
    { label: "IG", href: "https://www.instagram.com/rhinonlabs/" },
    { label: "WA", href: "https://wa.me/918249291789" },
    { label: "X", href: "https://x.com/RhinonLabs" },
  ],
};

export const navLinks = [
  { label: "Home", href: "#top" },
  { label: "About", href: "#company" },
  { label: "Case Studies", href: "#case" },
  { label: "Blog", href: "#news" },
  { label: "Team", href: "#team" },
  { label: "Contact", href: "#contact" },
];

export const hero = {
  rating: "20+",
  ratingNote: "Trusted by *startups and SMBs worldwide*",
  avatars: ["/images/avatar-1.jpg", "/images/avatar-2.jpg", "/images/avatar-3.jpg", "/images/avatar-4.jpg", "/images/avatar-5.jpg"],
  title: "Ship 3× faster",
  subtitle: "without hiring a tech team",
  lead: "Scale your operations, *not your headcount.*",
  callout: "A free automation audit and a custom roadmap. *Zero-risk consultation*",
  primary: { label: "Schedule a free call", href: "#contact" },
  secondary: { label: "See how it works", href: "#path" },
  clients: ["/svg/client-1.svg", "/svg/client-2.svg", "/svg/client-3.svg", "/svg/client-4.svg", "/svg/client-5.svg"],
};

export const company = {
  video: {
    label: "How we work",
    duration: "2:30",
    title: "From idea to launched product in 2–4 weeks",
    thumb: "/images/video-thumb.jpg",
    note: "We’re a *product and automation studio* that *designs, builds and launches* for founders and growing businesses.",
  },
  intro: {
    index: "01",
    label: "Who we are",
    text: "We’re a product and automation studio in Hyderabad. We design, build and launch MVPs, AI agents, workflow automations, internal dashboards, websites and mobile apps — and we handle the technical side end-to-end.",
    person: { name: "Rhinon Labs", role: "Product & Automation Studio", photo: "/images/jessica.jpg" },
  },
  services: {
    index: "02",
    label: "Services",
    title: "_While you run the business,_ we build scalable systems",
    lead: "Fixed scope, fixed timeline, agreed before we start. _We build around the tools you already use — and you own the code, designs and infrastructure._",
    cta: { label: "About us", href: "#team" },
    items: [
      {
        title: "MVP development",
        image: "/images/service-1.jpg",
        text: "Web and mobile MVPs cut down to the one workflow that proves your idea — sign-up, onboarding, payments and an admin panel, shipped with weekly releases to a live staging link.",
        tags: ["MVP", "WebApps", "MobileApps"],
      },
      {
        title: "AI agents",
        image: "/images/service-2.jpg",
        text: "Inbox, sales, document and operations agents wired into your real tools — email, CRM, docs and databases — with logging for every action and a clear handover to your team.",
        tags: ["AIAgents", "LLM", "Copilots"],
      },
      {
        title: "Workflow automation",
        image: "/images/service-3.jpg",
        text: "Reliable custom automations with error handling and alerts — not a fragile chain of zaps. Integrations, onboarding flows, triggered emails and automated reporting.",
        tags: ["Automation", "Integrations", "NoMoreManualWork"],
      },
      {
        title: "Internal dashboards & tools",
        image: "/images/service-4.jpg",
        text: "Operations dashboards, client portals, admin panels and custom CRMs shaped around how your team actually works — live data, roles and permissions included.",
        tags: ["Dashboards", "InternalTools"],
      },
    ],
  },
};

export const advantages = {
  index: "03",
  label: "Why us?",
  title: "_Why founders_ choose Rhinon Labs",
  lead: "Fast delivery, affordable pricing, AI-powered development",
  listTitle: "What you get _with us:_",
  items: [
    "Zero *technical complexity*",
    "Predictable *ROI*",
    "Flexible, structured *process*",
    "Full ownership of your code",
  ],
  source: { label: "Source:", value: "Rhinon Labs client projects", date: "2026" },
  stats: [
    { value: 85, prefix: "−", suffix: "%", label: "Fewer manual tasks" },
    { value: 98, suffix: "%", label: "Workflow accuracy" },
    { value: 50, suffix: "+", label: "Tools integrated" },
  ],
  mobile: {
    label: "24/7 automation",
    title: "Your operations, always in your pocket",
    lead: "Approve, track and adjust the systems we build for you — from real-time dashboards to automation alerts, right from your phone",
  },
};

export const path = {
  index: "05",
  label: "How we do it",
  title: "From chaos to _a working system_",
  lead: "No jargon. No big reveal at the end. Just weekly progress you can see.",
  steps: [
    "Scope — cut the idea down to the one workflow that matters, with a fixed timeline",
    "Design — screens and system architecture, reviewed with you before we build",
    "Build — weekly releases to a live staging link, wired into your existing tools",
    "Launch — deployment, domains, analytics and app-store submission handled",
  ],
  cta: { label: "Book a free audit", href: "#contact" },
  pie: { value: 85, note: "Clients typically see an *85% reduction in manual tasks* once their systems are live." },
  delay: {
    label: "Sound familiar?",
    title: "Every month you wait, the chaos gets _more expensive._",
    rows: [
      { text: "Data *scattered across tools*", value: 83, tag: "/data" },
      { text: "Automation that *didn’t fix the chaos*", value: 55, tag: "/automation" },
      { text: "*Hiring more* just for operations", value: 66, tag: "/headcount" },
      { text: "No *clarity* inside tasks", value: 32, tag: "/visibility" },
    ],
  },
};

export const caseStudy = {
  index: "06",
  label: "Results",
  title: "Case study",
  lead: "Apexis Pro — a mobile-first SaaS that gives construction teams one controlled place for drawings, snags, RFIs and signed-off handover.",
  meta: [
    { label: "Product:", value: "Apexis Pro" },
    { label: "Industry:", value: "Architecture & Construction" },
    { label: "Challenge:", value: "Drawings, snags and approvals scattered across chats and email" },
  ],
  cta: { label: "Read the full story", href: "https://www.rhinonlabs.com/case-studies/apexispro" },
  stats: [
    { value: 2, suffix: "", label: "Platforms — web & native mobile" },
    { value: 1, prefix: "", suffix: "", label: "Source of truth for every drawing" },
  ],
  quote:
    "We scope the one workflow that proves the product, ship it in weekly releases, and stay on after launch to grow it with you.",
  author: { name: "Rhinon Labs", role: "Product team", photo: "/images/andrew.jpg" },
  image: "/images/case-bg.jpg",
};

export const moreCases = {
  label: "More projects",
  items: [
    {
      name: "FurrCircle",
      year: "2026",
      image: "/images/case-finedge.jpg",
      logo: "/svg/case-finedge.svg",
      blurb: "Our own flagship product — an all-in-one app for pet parents that blends a pet-first social network, a digital health passport and a local pet community.",
    },
    {
      name: "SR Fitout",
      year: "2026",
      image: "/images/case-brightpath.jpg",
      logo: "/svg/case-brightpath.svg",
      blurb: "A turnkey digital front door for a Bengaluru interior & civil construction studio — a fast marketing site with an online project-intake portal and an admin dashboard.",
    },
    {
      name: "Apexis Pro",
      year: "2026",
      image: "/images/case-norse.jpg",
      logo: "/svg/case-norse.svg",
      blurb: "A mobile-first SaaS that gives construction teams one controlled place for drawings, snags, RFIs and signed-off handover — across web and native mobile.",
    },
    {
      name: "RichHarbor",
      year: "2025",
      image: "/images/case-educore.jpg",
      logo: "/svg/case-educore.svg",
      blurb: "A web platform designed and built end-to-end by Rhinon Labs, from first screens to production deployment.",
    },
    {
      name: "RT Dashboard",
      year: "2025",
      image: "/images/case-craftworks.jpg",
      logo: "/svg/case-craftworks.svg",
      blurb: "An internal operations dashboard that pulls numbers from every system into one live view — no more weekly spreadsheet stitching.",
    },
    {
      name: "Al Rooha",
      year: "2025",
      image: "/images/case-healthfirst.jpg",
      logo: "/svg/case-healthfirst.svg",
      blurb: "A brand website and digital presence designed, built and launched by Rhinon Labs.",
    },
  ],
};

export const firstStep = {
  index: "04",
  label: "Easy first step",
  title: "Start smart, start small",
  quote: "Give us 2–4 hours to walk through your current chaos. We’ll hand you a roadmap — and build the first system in weeks.",
  person: { name: "Rhinon Labs", role: "Free automation audit" },
  background: "/images/first-step-bg.jpg",
  portrait: "/images/first-step-woman.png",
};

export const team = {
  index: "07",
  label: "Who we are",
  title: "The team",
  members: [
    {
      role: "Discovery",
      name: "Product Strategy",
      note: "Scope, roadmap, fixed timelines",
      photo: "/images/team-alex.jpg",
      skills: [{ label: "MVP Scoping", level: 0.95 }, { label: "Process Audits", level: 0.85 }, { label: "Roadmapping", level: 0.8 }],
    },
    {
      role: "Design",
      name: "Product Design",
      note: "Web, mobile & dashboards",
      photo: "/images/team-emma.jpg",
      skills: [{ label: "UI/UX Design", level: 0.9 }, { label: "Prototyping", level: 0.8 }, { label: "Design Systems", level: 0.75 }],
    },
    {
      role: "Engineering",
      name: "Full-stack & AI",
      note: "Apps, agents & integrations",
      photo: "/images/team-kevin.jpg",
      skills: [{ label: "AI Agents & LLMs", level: 0.85 }, { label: "Web & Mobile Apps", level: 0.92 }, { label: "API Integrations", level: 0.88 }],
    },
    {
      role: "Ops & Support",
      name: "Launch & Care",
      note: "Deploy, host, maintain",
      photo: "/images/team-laura.jpg",
      skills: [{ label: "Cloud Deployment", level: 0.88 }, { label: "Monitoring", level: 0.8 }, { label: "Ongoing Support", level: 0.9 }],
    },
  ],
  statement: "No salespeople. No handoffs to strangers. You’ll speak directly with the people building it.",
  cta: { label: "Start your project", href: "#contact" },
  note: "Built in Hyderabad, *shipping worldwide*",
};

export const why = {
  index: "08",
  label: "Why us?",
  title: "Why us",
  teamLabel: "The team.",
  avatars: ["/images/why-avatar-1.jpg", "/images/why-avatar-2.jpg", "/images/why-avatar-3.jpg"],
  teamCount: "20+",
  teamNote: "Startups and SMBs that *scaled operations, not headcount*",
  cards: [
    { label: "Delivery", text: "Most projects are scoped and delivered within 2–4 weeks.", value: 4, suffix: "", note: "Weeks or less to launch" },
    { label: "Time saved", text: "Clients reclaim 50+ hours every week from manual work.", value: 50, suffix: "+", note: "Hours saved every week" },
    { label: "ROI", text: "Most clients recover the cost within 90 days.", value: 90, suffix: "", note: "Days to pay for itself" },
  ],
};

// PLACEHOLDER PRICES — Rhinon Labs quotes per project; replace or remove before launch.
export const pricing = {
  title: "Pricing.",
  lead: "Pricing depends on what you build — we scope first, then share a clear estimate.",
  annualDiscount: 0.2,
  plans: [
    {
      name: "Launch",
      note: "For founders validating an idea",
      price: 1500,
      features: ["Scoping session & fixed timeline", "Clickable prototype or landing site", "Deployment & domain setup", "Email support for 14 days"],
      cta: "Book a free call",
    },
    {
      name: "MVP",
      badge: "Popular",
      note: "For founders ready to ship a real product",
      price: 4500,
      features: [
        "Web or cross-platform mobile MVP",
        "Sign-up, core workflow & payments",
        "Admin panel",
        "Weekly releases to staging",
        "Analytics & app-store submission",
        "30 days post-launch support",
      ],
      cta: "Book Free Audit",
      featured: true,
    },
    {
      name: "Automation Retainer",
      note: "For SMBs scaling operations",
      price: 2500,
      features: ["AI agents & workflow automation", "Internal dashboards", "Monthly optimisation", "Dedicated point of contact", "Priority support"],
      cta: "Talk to us",
    },
  ],
};

export const belief = {
  index: "10",
  label: "What we believe",
  quote:
    "Freelancers build the task you ask for. We look at the whole workflow, find the bottlenecks you can’t see, and build one system that scales — so you can grow without hiring more people to hold it together.",
  lead: "Scale your operations, not your headcount.",
  founder: { name: "Rhinon Labs", role: "Product & Automation Studio", photo: "/images/founder-laura.jpg" },
  timeline: [
    { year: "2024", logo: "/svg/timeline-2020.svg", text: "Started building products and automations for founders" },
    { year: "2025", logo: "/svg/timeline-2023.svg", text: "Shipped internal dashboards and client platforms" },
    { year: "2026", logo: "/svg/timeline-2024.svg", text: "Launched FurrCircle, our own flagship app" },
    { year: "Now", logo: "/svg/timeline-2025.svg", text: "20+ startups and SMBs trust us worldwide" },
  ],
};

export const news = {
  index: "11",
  label: "Operations, AI & automation",
  title: "Blog",
  allLabel: "All articles",
  posts: [
    { date: "August 5, 2026", title: "Who Actually Owns “Ops” in a Five-Person Team?", image: "/images/news-1.jpg" },
    { date: "August 4, 2026", title: "Is Your Business Too Dependent on One Person’s Memory?", image: "/images/news-2.jpg" },
    { date: "August 4, 2026", title: "Why Aren’t Your Tools Talking to Each Other?", image: "/images/news-3.jpg" },
    { date: "August 4, 2026", title: "What’s the Real Difference Between a Chatbot and an AI Agent?", image: "/images/news-4.jpg" },
  ],
};

export const newsletter = {
  title: "Newsletter",
  text: "Occasional notes on automation, AI agents and building products faster.",
  cta: "Get the notes",
};

export const faq = {
  index: "12",
  label: "Help & Info",
  title: "FAQ",
  items: [
    {
      q: "Do we need to be technical to work with you?",
      a: "Not at all. We handle the technical side end-to-end. We build it, we deploy it, we maintain it. You just run your business.",
    },
    {
      q: "How long does it take to build a system?",
      a: "It depends on complexity, but most projects are scoped and delivered within 2–4 weeks. You’ll get a clear timeline before we begin.",
    },
    {
      q: "What if we already use multiple tools?",
      a: "That’s completely fine — most of our clients do. We build around your existing tools and connect them properly instead of forcing you to replace everything.",
    },
    {
      q: "How is this different from hiring a freelancer?",
      a: "Freelancers usually build the specific task you ask for. We look at your entire workflow, identify the bottlenecks you might not see, and build a cohesive system that scales.",
    },
    {
      q: "Do you offer ongoing support?",
      a: "Yes. After launch we offer optional monthly or quarterly support retainers to optimise and expand your systems as you grow.",
    },
  ],
  contact: {
    label: "Contact us directly",
    title: "Still unsure?",
    cta: { label: "Ask a question", href: "#contact" },
    quote: "We only need 2–4 hours of your time upfront. After that, we do the heavy lifting.",
    person: { name: "Rhinon Labs", role: "Hyderabad, India", photo: "/images/jessica.jpg" },
  },
};

export const contact = {
  index: "13",
  label: "Ready to start?",
  title: "Get in touch",
  lead: "Tell us how your business works today and where it feels slow. We’ll take it from there.",
  cta: "Let’s talk",
  legal: "By submitting, you agree to our *Terms* and *Privacy Policy*.",
};

export const footer = {
  links: [
    { label: "Privacy Policy", href: "https://www.rhinonlabs.com/privacy-terms" },
    { label: "Terms of Service", href: "https://www.rhinonlabs.com/privacy-terms" },
  ],
  copyright: "© 2026 Rhinon Labs. All rights reserved.",
  credit: { label: "Built by", name: "Rhinon Labs", href: "https://www.rhinonlabs.com/", photo: "/images/creator.jpg" },
};
