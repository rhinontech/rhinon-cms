export type JobCategory = "PRODUCT" | "ENGINEERING";
export type JobLevel = "ASSOCIATE" | "MID-SENIOR LEVEL" | "ENTRY LEVEL" | "LEAD / DIRECTOR" | "INTERNSHIP";
export type JobType = "FULL-TIME" | "PART-TIME" | "CONTRACT" | "REMOTE";

export interface JobListing {
  id: string;
  title: string;
  company: string;
  category: JobCategory;
  level: JobLevel;
  type: JobType;
  location: string;
  fullLocation?: string;
  postedAt: string;
  applyUrl: string;
  logoUrl?: string;
  logoBg?: string;
  logoText?: string;
  minimumQualifications: string[];
  preferredQualifications: string[];
  skills: string[];
  description: string;
  responsibilities: string[];
}

export const DUMMY_JOBS: JobListing[] = [
  {
    id: "job-1",
    title: "Product Owner",
    company: "InfoVision Inc.",
    category: "PRODUCT",
    level: "MID-SENIOR LEVEL",
    type: "FULL-TIME",
    location: "Bengaluru",
    fullLocation: "Bengaluru, Karnataka, India",
    postedAt: "Posted 1 month ago",
    applyUrl: "https://www.infovision.com/careers",
    logoBg: "bg-white border-gray-200 text-rose-600",
    logoText: "INFOVISION",
    minimumQualifications: [
      "Bachelor's Degree in Information Technology, Business or related field of study",
      "4+ years experience in product management, information technology, or related field such as business analysis",
      "Exposure within the banking domain or FinTech and Rewards & Loyalty programs",
    ],
    preferredQualifications: [
      "4+ years in product management, business analysis, information technology, financial services, payment, online and mobile platforms, or digital and tech platforms",
    ],
    skills: [
      "Agile Methodology",
      "Information Technology (IT)",
      "Business Analysis",
      "Product Management",
    ],
    description:
      "The Product Owner 2 role focuses on optimizing the end-user experience and maintaining clarity for the development team. The product owner is aligned to a scrum team and drives the feature backlog.",
    responsibilities: [
      "Prioritize and maintain product backlog. Regularly refine and update backlog items based on feedback and change requirements. Lead grooming sessions and define timelines in partnership with engineering.",
      "Partner with product manager to gather and document product requirements. This involves conducting interviews, surveys, and workshops to understand user needs and translating them into actionable items.",
      "Lead sprint planning sessions and ensure the team understands the priorities. This involves setting clear objectives for each sprint and ensuring the team has the necessary resources to achieve them. Analyze business impact and drive enhancements based on data.",
      "Write detailed user stories and acceptance criteria for the development team. This includes breaking down high-level requirements into smaller, actionable tasks that can be easily understood and implemented by the team.",
      "Build partnerships within the Scrum team, ensure stable and operational capabilities, and manage cross-functional team dependencies.",
    ],
  },
  {
    id: "job-2",
    title: "Product Manager",
    company: "Visa",
    category: "PRODUCT",
    level: "MID-SENIOR LEVEL",
    type: "FULL-TIME",
    location: "Bengaluru East",
    fullLocation: "Bengaluru East, Karnataka, India",
    postedAt: "Posted 1 month ago",
    applyUrl: "https://www.visa.com/careers",
    logoBg: "bg-[#1434CB] border-blue-800 text-white font-black italic",
    logoText: "V",
    minimumQualifications: [
      "BS/BA degree in Computer Science, Engineering, Business or related field",
      "3-5 years of product management experience with digital payment systems or consumer platforms",
      "Strong understanding of API design, microservices architectures, and distributed systems",
    ],
    preferredQualifications: [
      "Experience with global payment rails, card networks, and regulatory compliance standards",
      "Proven track record of driving cross-border financial products to high volume scale",
    ],
    skills: [
      "Payment Gateways",
      "Product Strategy",
      "Data Analytics",
      "Cross-functional Leadership",
      "API Integrations",
    ],
    description:
      "As a Product Manager at Visa, you will drive the next generation of frictionless digital transactions across emerging markets. You will partner with global engineering, compliance, and design teams to build scalable payment infrastructure.",
    responsibilities: [
      "Define product roadmap and strategic vision for merchant payment solutions.",
      "Collaborate with engineering teams to scope architectural specifications and release cadences.",
      "Conduct customer discovery interviews with enterprise partners to uncover high-impact workflow bottlenecks.",
      "Track key performance indicators including transaction success rates, authorization latency, and merchant adoption.",
    ],
  },
  {
    id: "job-3",
    title: "Product Associate",
    company: "Duruper",
    category: "PRODUCT",
    level: "ASSOCIATE",
    type: "FULL-TIME",
    location: "Bengaluru",
    fullLocation: "Bengaluru, Karnataka, India",
    postedAt: "Posted 1 month ago",
    applyUrl: "#",
    logoBg: "bg-slate-900 border-slate-700 text-amber-400 font-black",
    logoText: "D",
    minimumQualifications: [
      "Bachelor's degree in any quantitative or technical discipline",
      "1-2 years of experience in product operations, product analysis, or engineering",
      "Strong proficiency in SQL, user journey mapping, and wireframing tools",
    ],
    preferredQualifications: [
      "Prior experience working in an early-stage venture-backed startup environment",
    ],
    skills: ["SQL", "Figma", "User Research", "Agile Execution", "Jira"],
    description:
      "Duruper is seeking a proactive Product Associate to support our growth and user engagement features. You will bridge customer feedback and engineering execution.",
    responsibilities: [
      "Analyze weekly funnel retention cohorts and identify points of customer churn.",
      "Draft concise product requirement documents (PRDs) and user journey diagrams.",
      "Coordinate QA testing, bug triaging, and feature rollouts with developers.",
    ],
  },
  {
    id: "job-4",
    title: "Full Stack Engineer",
    company: "Shipturtle",
    category: "ENGINEERING",
    level: "MID-SENIOR LEVEL",
    type: "FULL-TIME",
    location: "Remote",
    fullLocation: "Remote (India)",
    postedAt: "Posted 3 weeks ago",
    applyUrl: "https://www.shipturtle.com",
    logoBg: "bg-[#FF5722] border-orange-600 text-white font-bold",
    logoText: "ST",
    minimumQualifications: [
      "3+ years of full-stack engineering experience with React, Node.js, and TypeScript",
      "Hands-on experience managing relational databases (PostgreSQL or MySQL) at scale",
      "Familiarity with cloud deployments (AWS, Docker, CI/CD pipelines)",
    ],
    preferredQualifications: [
      "Experience with multi-tenant SaaS architectures and marketplace logistics APIs",
    ],
    skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "AWS", "GraphQL"],
    description:
      "Shipturtle powers multi-vendor e-commerce logistics. We are seeking a full-stack engineer to lead end-to-end feature development across merchant dashboards and courier routing services.",
    responsibilities: [
      "Design and maintain scalable REST and GraphQL APIs for real-time order tracking.",
      "Build high-performance React frontends with modern state management.",
      "Optimize query performance across distributed databases handling millions of webhook events.",
    ],
  },
  {
    id: "job-5",
    title: "Frontend Engineer (React/Next)",
    company: "Greenlever",
    category: "ENGINEERING",
    level: "ASSOCIATE",
    type: "FULL-TIME",
    location: "Hyderabad",
    fullLocation: "Hyderabad, Telangana, India",
    postedAt: "Posted 2 weeks ago",
    applyUrl: "#",
    logoBg: "bg-[#86efac] border-emerald-400 text-emerald-950 font-bold",
    logoText: "GL",
    minimumQualifications: [
      "2+ years of professional frontend development with Next.js, React, and TailwindCSS",
      "Solid understanding of browser rendering performance, SEO, and web accessibility standards",
    ],
    preferredQualifications: [
      "Experience building animated, responsive interactive dashboards",
    ],
    skills: ["Next.js", "React", "TypeScript", "TailwindCSS", "Performance Optimization"],
    description:
      "Greenlever is creating sustainability and clean-energy tracking dashboards. Join our frontend team to craft fast, responsive digital tools for enterprise climate teams.",
    responsibilities: [
      "Implement pixel-perfect UI components and micro-interactions.",
      "Work closely with product designers to maintain a unified design system.",
      "Audit Core Web Vitals to keep load times under 1 second across all screen sizes.",
    ],
  },
  {
    id: "job-6",
    title: "Software Development Engineer",
    company: "Barclays",
    category: "ENGINEERING",
    level: "MID-SENIOR LEVEL",
    type: "FULL-TIME",
    location: "Pune",
    fullLocation: "Pune, Maharashtra, India",
    postedAt: "Posted 1 month ago",
    applyUrl: "https://home.barclays/careers",
    logoBg: "bg-[#00aeef] border-sky-500 text-white font-bold",
    logoText: "BC",
    minimumQualifications: [
      "Bachelor's degree in Computer Science or related STEM discipline",
      "4+ years of backend development in Java/Spring Boot or C# .NET",
      "Experience with message brokers like Apache Kafka or RabbitMQ",
    ],
    preferredQualifications: [
      "Knowledge of financial risk models, security compliance, and microservices architecture",
    ],
    skills: ["Java", "Spring Boot", "Kafka", "Microservices", "Docker", "Kubernetes"],
    description:
      "Join the Barclays technology group in Pune to build resilient, high-throughput financial transaction processing platforms supporting millions of global banking accounts.",
    responsibilities: [
      "Develop ultra-reliable backend microservices with 99.999% uptime guarantees.",
      "Implement automated unit and integration test suites using JUnit and Mockito.",
      "Participate in design reviews and architectural governance boards.",
    ],
  },
  {
    id: "job-7",
    title: "Technical Product Manager",
    company: "Razorpay",
    category: "PRODUCT",
    level: "MID-SENIOR LEVEL",
    type: "FULL-TIME",
    location: "Bengaluru",
    fullLocation: "Bengaluru, Karnataka, India",
    postedAt: "Posted 4 days ago",
    applyUrl: "https://razorpay.com/jobs",
    logoBg: "bg-[#0C2340] border-blue-900 text-[#528FF0] font-black",
    logoText: "Rz",
    minimumQualifications: [
      "4+ years of product management experience in fintech, developer tools, or cloud platforms",
      "Strong technical background with ability to read code and evaluate API schemas",
    ],
    preferredQualifications: [
      "Deep understanding of checkout optimizations, banking webhooks, and UPI payment architecture",
    ],
    skills: ["Developer Tools", "Payment Systems", "REST APIs", "Analytics", "System Design"],
    description:
      "At Razorpay, you will own developer-first payment products that power hundreds of thousands of digital businesses across India and Southeast Asia.",
    responsibilities: [
      "Own the end-to-end checkout and SDK developer experience.",
      "Synthesize feedback from high-growth enterprise clients to direct technical roadmap.",
      "Coordinate with engineering teams to minimize checkout latency and maximize payment conversions.",
    ],
  },
  {
    id: "job-8",
    title: "AI & Platform Engineer",
    company: "Zepto",
    category: "ENGINEERING",
    level: "ASSOCIATE",
    type: "FULL-TIME",
    location: "Bengaluru",
    fullLocation: "Bengaluru, Karnataka, India",
    postedAt: "Posted 6 days ago",
    applyUrl: "https://www.zeptonow.com",
    logoBg: "bg-[#880e4f] border-pink-900 text-amber-300 font-black",
    logoText: "Zp",
    minimumQualifications: [
      "2+ years building backend systems and ML serving pipelines using Python, Go, or Node.js",
      "Experience with vector databases, embeddings, and prompt evaluation systems",
    ],
    preferredQualifications: [
      "Experience deploying models at high request volumes with low latency budgets",
    ],
    skills: ["Python", "PyTorch", "FastAPI", "Vector Databases", "Redis", "Kafka"],
    description:
      "Zepto's AI platform team powers dynamic delivery dispatch, catalog search embeddings, and intelligent demand forecasting algorithms. Build real-time systems that move physical goods in minutes.",
    responsibilities: [
      "Build model inference microservices with sub-50ms latency.",
      "Implement real-time vector search for instant item recommendations.",
      "Design fault-tolerant batch data pipelines for catalog understanding.",
    ],
  },
  {
    id: "job-9",
    title: "Associate Product Manager",
    company: "Swiggy",
    category: "PRODUCT",
    level: "ASSOCIATE",
    type: "FULL-TIME",
    location: "Bengaluru",
    fullLocation: "Bengaluru, Karnataka, India",
    postedAt: "Posted 1 week ago",
    applyUrl: "https://careers.swiggy.com",
    logoBg: "bg-[#FC8019] border-orange-600 text-white font-black",
    logoText: "SW",
    minimumQualifications: [
      "1-3 years in product management, strategy, or high-growth tech operations",
      "Obsession with consumer experience, data analysis, and iterative experimentation",
    ],
    preferredQualifications: [
      "Experience running A/B experiments and analyzing statistical significance",
    ],
    skills: ["A/B Testing", "Mixpanel", "Product Analytics", "Customer Empathy", "Wireframing"],
    description:
      "Join Swiggy's consumer delivery experience team. You will drive feature discovery, cart optimization, and loyalty retention for tens of millions of food and grocery shoppers.",
    responsibilities: [
      "Run weekly multivariate experiments to optimize cart conversion rate.",
      "Work closely with user research teams to identify friction in checkout journeys.",
      "Partner with engineering and operations to build seamless delivery status tracking.",
    ],
  },
  {
    id: "job-10",
    title: "Senior Backend Engineer (Go/Distributed)",
    company: "CRED",
    category: "ENGINEERING",
    level: "LEAD / DIRECTOR",
    type: "FULL-TIME",
    location: "Bengaluru",
    fullLocation: "Bengaluru, Karnataka, India",
    postedAt: "Posted 2 weeks ago",
    applyUrl: "https://cred.club/careers",
    logoBg: "bg-black border-zinc-800 text-white font-mono font-bold",
    logoText: "CR",
    minimumQualifications: [
      "5+ years of software engineering in Golang or distributed systems",
      "Deep understanding of distributed consensus, message queues, and high-concurrency systems",
    ],
    preferredQualifications: [
      "Experience architecting financial transaction ledgers with strict idempotency",
    ],
    skills: ["Golang", "Distributed Systems", "Kafka", "PostgreSQL", "gRPC", "Kubernetes"],
    description:
      "Build resilient, zero-downtime financial platforms at CRED. You will own high-throughput transaction pipelines processing billions in bill payments with millisecond precision.",
    responsibilities: [
      "Architect mission-critical payment settlement and reward distribution engines.",
      "Enforce engineering best practices, code quality, and fault-tolerant architecture.",
      "Mentor engineers across team boundaries and drive long-term technical vision.",
    ],
  },
  {
    id: "job-11",
    title: "Developer Experience Engineer",
    company: "Postman",
    category: "ENGINEERING",
    level: "MID-SENIOR LEVEL",
    type: "FULL-TIME",
    location: "Remote",
    fullLocation: "Remote (Global)",
    postedAt: "Posted 5 days ago",
    applyUrl: "https://www.postman.com/company/careers",
    logoBg: "bg-[#FF6C37] border-orange-500 text-white font-bold",
    logoText: "PM",
    minimumQualifications: [
      "3+ years building developer documentation, SDKs, open source tools, or developer platforms",
      "Proficiency in TypeScript, Python, or Go",
    ],
    preferredQualifications: [
      "Passionate developer community builder with published open source repositories",
    ],
    skills: ["Developer Relations", "TypeScript", "REST APIs", "Documentation", "CLI Tooling"],
    description:
      "Postman is used by over 30 million developers. Help shape the API developer experience by building interactive playgrounds, SDKs, and developer workflow automation.",
    responsibilities: [
      "Build reference implementations and starter kits showcasing API workflows.",
      "Gather feedback from developer forums and contribute fixes to official SDKs.",
      "Write concise, clear guides and tutorials for new platform capabilities.",
    ],
  },
  {
    id: "job-12",
    title: "Product Growth Specialist",
    company: "Atlassian",
    category: "PRODUCT",
    level: "ASSOCIATE",
    type: "FULL-TIME",
    location: "Bengaluru",
    fullLocation: "Bengaluru, Karnataka, India",
    postedAt: "Posted 1 week ago",
    applyUrl: "https://www.atlassian.com/company/careers",
    logoBg: "bg-[#0052CC] border-blue-700 text-white font-bold",
    logoText: "AT",
    minimumQualifications: [
      "2-4 years in product-led growth, acquisition funnels, or SaaS expansion",
      "Strong analytical ability with proficiency in SQL, Amplitude, and user testing",
    ],
    preferredQualifications: [
      "Experience optimizing freemium-to-paid conversion loops for enterprise collaboration software",
    ],
    skills: ["Product-Led Growth", "Amplitude", "Funnel Optimization", "Onboarding", "SQL"],
    description:
      "Drive product-led growth for Jira and Confluence. You will design and test self-serve onboarding flows, viral team invite mechanics, and license upgrade experiences.",
    responsibilities: [
      "Design onboarding experiments that improve time-to-first-value for new workspaces.",
      "Analyze behavioral metrics to uncover leading indicators of team retention.",
      "Partner with product marketing to launch contextual in-app guidance tours.",
    ],
  },
];

export function getJobById(id: string): JobListing | undefined {
  return DUMMY_JOBS.find((j) => j.id === id);
}
