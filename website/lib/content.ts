// All copy and media for the page lives here, so rebranding is a one-file job.
// Inline markers understood by <Rich>: *strong* (full ink) and _muted_ (faded).

export const site = {
  name: "Effica",
  title: "Effica · Practical AI Consulting & Workflow Automation for SMEs",
  description:
    "Effica helps small and mid-sized businesses implement AI and automation that actually delivers. We turn repetitive tasks into efficient systems, simplify adoption, and create measurable outcomes — strategy, tools, training, all transparent and tailored.",
  email: "hello@effica.com",
  phone: "(312) 555-2468",
  phoneHref: "tel:555-666-7777",
  city: "London",
  bookingUrl: "https://cal.com/",
  socials: [
    { label: "FB", href: "https://www.facebook.com/" },
    { label: "IG", href: "https://www.instagram.com/" },
    { label: "BE", href: "https://www.behance.net/" },
    { label: "X", href: "https://x.com/" },
  ],
};

export const navLinks = [
  { label: "Home", href: "#top" },
  { label: "About", href: "#company" },
  { label: "Case Studies", href: "#case" },
  { label: "News", href: "#news" },
  { label: "Careers", href: "#team" },
  { label: "Contact", href: "#contact" },
];

export const hero = {
  rating: "4.9/5",
  ratingNote: "Based on *230 verified reviews*",
  avatars: ["/images/avatar-1.jpg", "/images/avatar-2.jpg", "/images/avatar-3.jpg", "/images/avatar-4.jpg", "/images/avatar-5.jpg"],
  title: "A clear AI plan",
  subtitle: "for your business",
  lead: "We help businesses apply AI where it actually matters — *without the noise.*",
  callout: "A 30-minute call to clarify your next steps. *Zero obligations*",
  primary: { label: "Schedule a free assessment", href: "#contact" },
  secondary: { label: "See how it works", href: "#path" },
  clients: ["/svg/client-1.svg", "/svg/client-2.svg", "/svg/client-3.svg", "/svg/client-4.svg", "/svg/client-5.svg"],
};

export const company = {
  video: {
    label: "How we work",
    duration: "2:30",
    title: "How we help you use AI without the hype",
    thumb: "/images/video-thumb.jpg",
    note: "We’re a hands-on *team of AI consultants* focused on *helping small and mid-size businesses* use automation where it matters most.",
  },
  intro: {
    index: "01",
    label: "Who we are",
    text: "We’re a hands-on team of AI consultants focused on helping small and mid-size businesses use automation where it matters most. We cut through the noise and implement it with no disruption.",
    person: { name: "Jessica Burns", role: "Client Success Manager", photo: "/images/jessica.jpg" },
  },
  services: {
    index: "02",
    label: "Services",
    title: "_Turning repetitive work into_ time-saving systems",
    lead: "We provide practical AI consulting and automation services for companies that want results — not just theory. _Our work is tailored, transparent, and focused on the areas of your business where AI makes a real impact._",
    cta: { label: "About us", href: "#team" },
    items: [
      {
        title: "AI consulting & strategy",
        image: "/images/service-1.jpg",
        text: "Whether you’re just exploring possibilities or looking to scale existing tools, we build a clear plan that aligns with your goals.",
        tags: ["AIConsulting", "BusinessAutomation"],
      },
      {
        title: "Workflow automation",
        image: "/images/service-2.jpg",
        text: "We design and deploy automation systems that take repetitive tasks off your plate — from handling emails and reports to streamlining admin and customer service processes.",
        tags: ["SaveTime", "WorkSmarter", "NoMoreManualWork"],
      },
      {
        title: "Custom AI tools & integrations",
        image: "/images/service-3.jpg",
        text: "Need something more specific? We develop lightweight AI solutions tailored to your operations — from data analysis tools to smart assistants.",
        tags: ["AITools", "TailoredTech"],
      },
      {
        title: "Team onboarding & training",
        image: "/images/service-4.jpg",
        text: "AI only works when your team knows how to use it. We offer simple onboarding, documentation, and ongoing support to make sure everyone feels confident — even without a technical background.",
        tags: ["AITraining"],
      },
    ],
  },
};

export const advantages = {
  index: "03",
  label: "Why us?",
  title: "_Why companies_ choose Effica®",
  lead: "We make AI adoption simple, strategic, and measurable",
  listTitle: "Our advantages _include:_",
  items: [
    "Clear, actionable *strategy*",
    "Proven *AI frameworks*",
    "Hands-on *implementation*",
    "Transparent costs",
  ],
  source: { label: "Source:", value: "Client feedback & project data", date: "Apr 2025" },
  stats: [
    { value: 3, suffix: "×", label: "Faster approvals" },
    { value: 99, suffix: "%", label: "Uptime" },
    { value: 28, prefix: "+", suffix: "%", label: "Faster responses" },
  ],
  mobile: {
    label: "Real-time AI control",
    title: "Your AI, always in your pocket",
    lead: "Run your business smarter — track performance, approve automations, and get instant insights right from your phone",
  },
};

export const path = {
  index: "05",
  label: "How we do it",
  title: "The fast track to _AI success_",
  lead: "No generic advice. No complex dashboards. Just practical improvements.",
  steps: [
    "Understand your workflow — no jargon, just clear analysis",
    "Spot automation opportunities — specific, relevant use cases",
    "We handle integration and ensure smooth operation.",
    "Implement & optimize — we handle setup & integration",
  ],
  cta: { label: "Start AI journey", href: "#contact" },
  pie: { value: 35, note: "On average, our clients reduce manual work *by 35% in the first month.*" },
  delay: {
    label: "Why delay hurts",
    title: "The longer you wait, the more expensive it becomes _to catch up._",
    rows: [
      { text: "Operational tasks *stay manual*", value: 83, tag: "/workload" },
      { text: "Competitors *move faster*", value: 55, tag: "/growth" },
      { text: "Missed *automation opportunities*", value: 66, tag: "/opportunities" },
      { text: "Time wasted on *repetitive work*", value: 32, tag: "/time" },
    ],
  },
};

export const caseStudy = {
  index: "06",
  label: "Results",
  title: "Case study",
  lead: "LocalRent Co. partnered with Effica to streamline order intake and customer support across 18 locations.",
  meta: [
    { label: "Date:", value: "Mar 2025" },
    { label: "Industry:", value: "Retail & E-commerce" },
    { label: "Challenge:", value: "Manual order management & customer support delays" },
  ],
  cta: { label: "Read the full story", href: "#more-cases" },
  stats: [
    { value: 50, suffix: "+", label: "Hours saved monthly" },
    { value: 15, prefix: "+", suffix: "%", label: "Increase in retention" },
  ],
  quote:
    "They didn’t overwhelm us with jargon or endless options. Just a clear plan, executed quickly. We saw measurable results in the first month.",
  author: { name: "Andrew W.", role: "SEO of LocalRent Co.", photo: "/images/andrew.jpg" },
  image: "/images/case-bg.jpg",
};

const caseBlurb =
  "Norse Star Collective came to us before peak season with a simple request: remove the busywork that slows support and frustrates customers. Weekly reporting also ate half a day and rarely arrived in time to guide decisions.";

export const moreCases = {
  label: "More projects",
  items: [
    { name: "FinEdge Advisors", year: "2025", image: "/images/case-finedge.jpg", logo: "/svg/case-finedge.svg" },
    { name: "BrightPath International Logistics", year: "2025", image: "/images/case-brightpath.jpg", logo: "/svg/case-brightpath.svg" },
    { name: "Norse Star", year: "2025", image: "/images/case-norse.jpg", logo: "/svg/case-norse.svg" },
    { name: "EduCore Learning", year: "2025", image: "/images/case-educore.jpg", logo: "/svg/case-educore.svg" },
    { name: "CraftWorks Manufacturing", year: "2025", image: "/images/case-craftworks.jpg", logo: "/svg/case-craftworks.svg" },
    { name: "HealthFirst Clinics", year: "2024", image: "/images/case-healthfirst.jpg", logo: "/svg/case-healthfirst.svg" },
  ].map((c) => ({ ...c, blurb: caseBlurb })),
};

export const firstStep = {
  index: "04",
  label: "Easy first step",
  title: "Start smart, start small",
  quote: "Pick one routine task. We’ll automate it end-to-end and keep everything else unchanged.",
  person: { name: "Jessica Burns", role: "Client Success Manager" },
  background: "/images/first-step-bg.jpg",
  portrait: "/images/first-step-woman.png",
};

export const team = {
  index: "07",
  label: "Who we are",
  title: "The team",
  members: [
    {
      role: "AI Consultant",
      name: "Alex Carter",
      note: "15 years in tech strategy",
      photo: "/images/team-alex.jpg",
      skills: [{ label: "AI Strategy Development", level: 0.95 }, { label: "Data Visualization", level: 0.6 }, { label: "Business Process Analysis", level: 0.82 }],
    },
    {
      role: "Implementation Specialist",
      name: "Emma Lee",
      note: "Workflow automation expert",
      photo: "/images/team-emma.jpg",
      skills: [{ label: "Workflow Automation", level: 0.82 }, { label: "No-Code Tool Integration", level: 0.7 }, { label: "User Onboarding", level: 0.6 }],
    },
    {
      role: "AI Systems Engineer",
      name: "Kevin D.",
      note: "Backend & integrations",
      photo: "/images/team-kevin.jpg",
      skills: [{ label: "Machine Learning Models", level: 0.6 }, { label: "Backend Development", level: 0.9 }, { label: "API & System Integrations", level: 0.78 }],
    },
    {
      role: "Client Relations",
      name: "Laura Stern",
      note: "Your favorite contact",
      photo: "/images/team-laura.jpg",
      skills: [{ label: "Project Coordination", level: 0.6 }, { label: "Technical Documentation", level: 0.8 }, { label: "Client Communication", level: 0.9 }],
    },
  ],
  statement: "No salespeople. No bots. You’ll speak directly with us.",
  cta: { label: "Start your project", href: "#contact" },
  note: "Dedicated to your growth *worldwide*",
};

export const why = {
  index: "08",
  label: "Why us?",
  title: "Why us",
  teamLabel: "The team.",
  avatars: ["/images/why-avatar-1.jpg", "/images/why-avatar-2.jpg", "/images/why-avatar-3.jpg"],
  teamCount: "8+",
  teamNote: "How we change the way *your business works*",
  cards: [
    { label: "ROI Timeline", text: "Most clients recover their investment within 1.5 months.", value: 45, suffix: "", note: "Avg. ROI in 45 days" },
    { label: "Time saved", text: "On average, clients reduce manual work by 35 hours/month.", value: 35, suffix: "+", note: "Hours saved every month" },
    { label: "Workflow Impact", text: "We help businesses automate up to 60% of repetitive workflows.", value: 60, suffix: "", note: "% of routine tasks automated" },
  ],
};

export const pricing = {
  title: "Pricing.",
  lead: "You only pay for what you need — after we show you the plan.",
  annualDiscount: 0.2,
  plans: [
    {
      name: "Starter Plan",
      note: "For small teams or first-time AI users",
      price: 199,
      features: ["AI application plan (PDF)", "Implementation of 1 AI automation", "Post-setup checklist", "Email support for 14 days"],
      cta: "Get Starter Plan",
    },
    {
      name: "Growth Plan",
      badge: "Popular",
      note: "For companies ready to automate multiple workflows",
      price: 899,
      features: [
        "Full workflow analysis",
        "Roadmap with 3+ AI recommendations",
        "Implementation of up to 3 automations",
        "Staff onboarding materials",
        "Priority support for 30 days",
        "Monthly performance report",
      ],
      cta: "Book Free Assessment",
      featured: true,
    },
    {
      name: "Custom Enterprise Plan",
      note: "For teams with 50+ employees or advanced needs",
      price: 7500,
      features: ["Full AI strategy", "Technical implementation", "Maintenance & optimization", "Dedicated manager", "24/7 support"],
      cta: "Get Enterprise Plan",
    },
  ],
};

export const belief = {
  index: "10",
  label: "What we believe",
  quote:
    "We didn’t build this company to chase trends. We built it to solve real problems — clearly, quietly, and without wasting your time. AI can be useful, but only if it’s done right.",
  lead: "We’re here to make AI work in the real world — without noise, hype, or distractions.",
  founder: { name: "Laura Stern", role: "Founder & AI Consultant", photo: "/images/founder-laura.jpg" },
  timeline: [
    { year: "2020", logo: "/svg/timeline-2020.svg", text: "Founded to rethink how technology solves real problems" },
    { year: "2023", logo: "/svg/timeline-2023.svg", text: "Launched our first scalable platform" },
    { year: "2024", logo: "/svg/timeline-2024.svg", text: "Released Fourpoints, our AI framework" },
    { year: "2025", logo: "/svg/timeline-2025.svg", text: "Introduced Shutterframe for creative industries" },
  ],
};

export const news = {
  index: "11",
  label: "About AI for business",
  title: "News",
  allLabel: "All articles",
  posts: [
    { date: "September 18, 2025", title: "5 Common Mistakes Businesses Make When Adopting AI", image: "/images/news-1.jpg" },
    { date: "September 18, 2025", title: "How to Spot AI Automation Opportunities in Your Workflow", image: "/images/news-2.jpg" },
    { date: "September 3, 2025", title: "How a Small Retail Business Saved 50+ Hours per Month with AI", image: "/images/news-3.jpg" },
    { date: "August 6, 2025", title: "Top 10 AI Tools Every Business Should Consider", image: "/images/news-4.jpg" },
  ],
};

export const newsletter = {
  title: "Newsletter",
  text: "We send occasional updates about new case studies and useful tips.",
  cta: "Get weekly tips",
};

export const faq = {
  index: "12",
  label: "Help & Info",
  title: "FAQ",
  items: [
    {
      q: "How far in advance should I book?",
      a: "No. Our process is built for business owners and teams who have no technical background. We explain every step in plain language and handle all technical setup and integrations for you.",
    },
    {
      q: "How much does the service cost, and what is included?",
      a: "Pricing depends on your needs and project scope. Each plan includes audit, setup, implementation, and ongoing support. No hidden fees — you’ll always know what’s included.",
    },
    {
      q: "What if I don’t have a technical team or any technical knowledge?",
      a: "No worries. We handle the entire process from start to finish, so you don’t need any technical background. Just share your goals — we’ll do the rest.",
    },
    {
      q: "What happens if I want to cancel the subscription?",
      a: "You can cancel anytime. No long-term lock-ins, and everything we’ve built for you stays yours.",
    },
    {
      q: "What if I’m not satisfied with the result?",
      a: "We aim for measurable results. If you’re not satisfied, we’ll adjust the solution or provide a refund depending on the project stage.",
    },
  ],
  contact: {
    label: "Contact us directly",
    title: "Still unsure?",
    cta: { label: "Ask a question", href: "#contact" },
    quote: "My role is to make sure every client feels supported from day one.",
    person: { name: "Jessica Burns", role: "Client Success Manager", photo: "/images/jessica.jpg" },
  },
};

export const contact = {
  index: "13",
  label: "Ready to start?",
  title: "Get in touch",
  lead: "Whether you have questions or just want to explore options, we’re here.",
  cta: "Let’s talk",
  legal: "By submitting, you agree to our *Terms* and *Privacy Policy*.",
};

export const footer = {
  links: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
  copyright: "© 2025 Effica® Studio. All rights reserved.",
  credit: { label: "Created by", name: "Anatolii Dmitrienko", href: "https://templifica.com/", photo: "/images/creator.jpg" },
};
