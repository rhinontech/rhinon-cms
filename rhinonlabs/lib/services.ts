// Service landing pages (/services/[slug]). Each one targets a distinct search
// intent — keep titles/descriptions unique and keep claims consistent with the
// homepage FAQ (2–4 week delivery, end-to-end build, optional retainer).

export interface ServiceFaq {
  question: string;
  answer: string;
}

export interface Service {
  slug: string;
  /** Short name used in nav, cards and breadcrumbs */
  name: string;
  /** <title> (the layout template appends " | Rhinon Labs") */
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  headline: string;
  /** Second line of the H1, set in the italic serif accent like the homepage hero */
  headlineAccent: string;
  intro: string;
  /** Who this is for — concrete situations, not personas */
  forYouIf: string[];
  /** What we actually build */
  /** icon: a key of SERVICE_ICONS in ServiceDetail */
  builds: { title: string; description: string; icon: string }[];
  process: { step: string; description: string }[];
  outcomes: string[];
  faqs: ServiceFaq[];
  /** Blog / case-study slugs on this site that go deeper on the topic */
  relatedBlogs: string[];
  relatedCaseStudies: string[];
}

export const services: Service[] = [
  {
    slug: "mvp-development",
    name: "MVP Development",
    metaTitle: "MVP Development for Startups — Launch in Weeks",
    metaDescription:
      "Turn your startup idea into a working MVP in weeks, not months. Rhinon Labs designs, builds and launches web and mobile MVPs for founders — no in-house tech team needed.",
    eyebrow: "MVP Development",
    headline: "Launch your MVP in weeks,",
    headlineAccent: "without hiring a tech team",
    intro:
      "You have the idea and the customers you want to reach. We turn it into a real product people can sign up for and pay for — scoped tightly, built fast, and ready to grow once you've proven demand.",
    forYouIf: [
      "You're a non-technical founder with a validated problem and no engineering team",
      "You need something investors and early users can actually use, not a slide deck",
      "An agency quoted you six months and a budget you don't have",
      "You've tried no-code tools and hit their limits",
    ],
    builds: [
      { icon: "globe", title: "Web app MVPs", description: "Sign-up, onboarding, the core workflow, payments and an admin panel — the parts users touch on day one." },
      { icon: "smartphone", title: "Mobile MVPs", description: "Cross-platform iOS and Android apps from one codebase, so you launch on both stores at once." },
      { icon: "sparkles", title: "AI-powered products", description: "LLM features built into the product itself — copilots, generation, search and smart automation." },
      { icon: "mouse", title: "Clickable prototypes", description: "When you need to test with users or raise before writing production code." },
    ],
    process: [
      { step: "Scope", description: "A short working session to cut the idea down to the one workflow that proves it. You get a fixed scope and timeline before we start." },
      { step: "Design", description: "Screens for every step of that workflow, reviewed with you before development." },
      { step: "Build", description: "Weekly releases to a live staging link, so you see progress instead of waiting for a big reveal." },
      { step: "Launch", description: "Deployment, domains, analytics and app-store submission handled — then optional ongoing support as you grow." },
    ],
    outcomes: [
      "A live product your first users can sign up for",
      "Code and infrastructure you fully own",
      "A foundation that scales past the MVP instead of a throwaway prototype",
    ],
    faqs: [
      { question: "How long does it take to build an MVP?", answer: "Most MVPs are scoped and delivered in 2–4 weeks. Larger products with several user roles or native mobile apps take longer — you get a clear timeline before any work starts." },
      { question: "Do I need to be technical?", answer: "No. We handle design, development, deployment and hosting end-to-end. You need to know your customer and the problem; we translate that into product decisions with you." },
      { question: "Will I own the code?", answer: "Yes. The code, designs and infrastructure accounts are yours. Nothing is locked into our systems." },
      { question: "What happens after launch?", answer: "You can take the product in-house, or keep us on an optional monthly or quarterly retainer to keep improving it as you learn from users." },
    ],
    relatedBlogs: ["automate-first-in-a-product-led-growth-motion"],
    relatedCaseStudies: ["apexispro", "furrcircle-the-all-in-one-app-for-pet-parents"],
  },
  {
    slug: "ai-agents",
    name: "AI Agents & Automation",
    metaTitle: "AI Agent Development for Businesses",
    metaDescription:
      "Custom AI agents that draft replies, qualify leads, summarise documents and run multi-step tasks inside your existing tools. Built and deployed by Rhinon Labs.",
    eyebrow: "AI Agents",
    headline: "AI agents that do",
    headlineAccent: "real work for your team",
    intro:
      "Not another chatbot on your website. We build AI agents that read your data, make decisions and take action across your tools — drafting, sorting, summarising and following up while your team focuses on the work that needs a person.",
    forYouIf: [
      "Your team spends hours a day on email, lead qualification or data entry",
      "Information lives in documents and inboxes nobody has time to read",
      "You've tried ChatGPT internally but it doesn't connect to your systems",
      "You want AI in your workflow without sending sensitive data to public models",
    ],
    builds: [
      { icon: "mail", title: "Inbox & support agents", description: "Read incoming messages, draft accurate replies from your knowledge base and route what needs a human." },
      { icon: "target", title: "Sales & lead agents", description: "Enrich and score new leads, update the CRM and write personalised follow-ups." },
      { icon: "file", title: "Document & knowledge agents", description: "Search, summarise and extract data from contracts, reports and internal docs." },
      { icon: "cog", title: "Operations agents", description: "Multi-step tasks across your tools — reports, reconciliations, scheduling and handoffs." },
    ],
    process: [
      { step: "Audit", description: "We map where time goes today and pick the tasks where an agent saves the most hours safely." },
      { step: "Design", description: "We define what the agent can see, what it can do on its own and where it hands over to your team." },
      { step: "Build & connect", description: "The agent is wired into your real tools — email, CRM, docs, databases — with logging for every action." },
      { step: "Tune", description: "We run it alongside your team, measure accuracy and tighten it before it works unsupervised." },
    ],
    outcomes: [
      "Hours of repetitive work taken off your team every week",
      "Faster responses to customers and leads",
      "Clear logs of what the agent did and why",
    ],
    faqs: [
      { question: "What's the difference between a chatbot and an AI agent?", answer: "A chatbot answers questions. An agent takes actions — it can read your inbox, update your CRM, create documents and move work between tools, with rules for when to ask a human." },
      { question: "Is our data safe?", answer: "Yes. We use secure API connections and, where needed, private model deployments. Your data isn't used to train public models, and you keep full control over it." },
      { question: "What if the agent makes a mistake?", answer: "Agents are built with guardrails: limited permissions, human approval for sensitive actions, and a full log of every step so mistakes are visible and easy to correct." },
      { question: "Which AI models do you use?", answer: "We pick the model per task based on accuracy, cost and privacy needs, and keep the system able to switch models as better ones arrive." },
    ],
    relatedBlogs: ["chatbot-vs-ai-agent-real-difference", "ai-agents-vs-traditional-automatio"],
    relatedCaseStudies: [],
  },
  {
    slug: "workflow-automation",
    name: "Workflow Automation",
    metaTitle: "Workflow Automation Services for SMBs",
    metaDescription:
      "Connect your tools and automate the manual work between them — onboarding, follow-ups, reporting and data entry. Custom workflow automation by Rhinon Labs.",
    eyebrow: "Workflow Automation",
    headline: "Stop copying data",
    headlineAccent: "between tools by hand",
    intro:
      "Most teams run on a patchwork of apps and a lot of copy-paste. We connect your tools so data moves on its own — onboarding, reminders, follow-ups and reports happen automatically, and nothing falls through the cracks.",
    forYouIf: [
      "The same information gets typed into three different tools",
      "Follow-ups and reminders depend on someone remembering",
      "Your Zapier setup has become fragile and expensive",
      "Onboarding a client or employee is a checklist someone runs by hand",
    ],
    builds: [
      { icon: "plug", title: "Tool integrations", description: "CRM, forms, email, payments, spreadsheets and project tools connected so they stay in sync." },
      { icon: "userplus", title: "Onboarding flows", description: "Client and employee onboarding that sends documents, creates accounts and assigns tasks automatically." },
      { icon: "clock", title: "Scheduled & triggered emails", description: "Reminders, renewals and follow-ups sent at the right moment, based on real events." },
      { icon: "chart", title: "Automated reporting", description: "Numbers pulled from every system into one report, delivered on schedule." },
    ],
    process: [
      { step: "Map", description: "We document how work moves today and where it stalls or gets duplicated." },
      { step: "Prioritise", description: "We pick the automations that remove the most manual hours first." },
      { step: "Build", description: "Reliable custom automations with error handling and alerts — not a fragile chain of zaps." },
      { step: "Hand over", description: "Documentation and training so your team understands what runs, when, and why." },
    ],
    outcomes: [
      "Less manual data entry and fewer mistakes",
      "Follow-ups that happen every time, on time",
      "Lower spend on overlapping SaaS subscriptions",
    ],
    faqs: [
      { question: "Should we use Zapier or custom automation?", answer: "Zapier is great for a few simple connections. Once automations become business-critical, high-volume or complex, custom automation is usually cheaper to run and far more reliable. We'll tell you honestly which fits." },
      { question: "Can you work with the tools we already use?", answer: "Yes. We build around your existing tools wherever they have an API, rather than forcing you to switch." },
      { question: "Will automation disrupt our current operations?", answer: "No. We roll changes out in stages and run new automations alongside the old process until they're proven." },
      { question: "What if something breaks?", answer: "Every automation has error handling and alerts, so failures are caught immediately. Optional support plans cover fixes and changes." },
    ],
    relatedBlogs: ["zapier-vs-custom-automation", "why-arent-your-tools-talking-to-each-other", "automating-onboarding", "time-triggered-email-automation"],
    relatedCaseStudies: [],
  },
  {
    slug: "internal-dashboards",
    name: "Internal Dashboards & Tools",
    metaTitle: "Custom Internal Dashboards & Business Tools",
    metaDescription:
      "Custom internal dashboards and tools that put your CRM, projects, finances and operations in one place. Built for growing teams by Rhinon Labs.",
    eyebrow: "Internal Tools",
    headline: "See your whole business",
    headlineAccent: "in one place",
    intro:
      "When answers live in spreadsheets, inboxes and one person's head, every question becomes a meeting. We build internal dashboards and tools around how your team really works — so status, numbers and next steps are visible to everyone who needs them.",
    forYouIf: [
      "You keep asking “where are we on this?” and waiting for an answer",
      "Key processes depend on one person's memory",
      "Your spreadsheets have outgrown spreadsheets",
      "Off-the-shelf software forces your team into the wrong workflow",
    ],
    builds: [
      { icon: "layout", title: "Operations dashboards", description: "Live views of projects, pipeline, revenue and team workload in one screen." },
      { icon: "users", title: "Client & project portals", description: "Give clients status, files and approvals without email back-and-forth." },
      { icon: "shield", title: "Admin panels", description: "Manage bookings, orders, inventory or intake requests with roles and permissions." },
      { icon: "database", title: "Custom CRMs", description: "A CRM shaped around your sales process instead of a generic one you work around." },
    ],
    process: [
      { step: "Discover", description: "We sit with the people who'll use the tool and learn the questions they need answered daily." },
      { step: "Design", description: "Screens built around those questions, reviewed with your team before development." },
      { step: "Build", description: "Connected to your existing data sources, with roles so everyone sees what's relevant to them." },
      { step: "Roll out", description: "Training and a gradual switch-over, then improvements as your team uses it." },
    ],
    outcomes: [
      "Fewer status meetings and chase-up messages",
      "Knowledge that lives in a system, not one person",
      "Decisions based on live numbers instead of last month's spreadsheet",
    ],
    faqs: [
      { question: "Why build a custom tool instead of buying software?", answer: "Off-the-shelf tools are built for the average company. A custom tool fits your process exactly, can replace several subscriptions, and grows with you." },
      { question: "Can it pull data from our existing systems?", answer: "Yes. Dashboards connect to the tools and databases you already use, so the numbers stay live without manual updates." },
      { question: "Who can access what?", answer: "Everything is built with roles and permissions, so team members, managers and clients each see only what they should." },
      { question: "Can our team change it later?", answer: "Yes. Systems are modular and documented, so your team can make small changes, or we can extend it on a support plan." },
    ],
    relatedBlogs: ["who-actually-owns-ops-in-a-five-person-team", "dependent-on-one-persons-memory"],
    relatedCaseStudies: ["srfitout"],
  },
  {
    slug: "web-development",
    name: "Website & Web App Development",
    metaTitle: "Website & Web App Development for Startups and SMBs",
    metaDescription:
      "Fast, SEO-ready websites and custom web applications for startups and growing businesses — from landing pages to full platforms. Designed and built by Rhinon Labs.",
    eyebrow: "Web Development",
    headline: "Websites and web apps",
    headlineAccent: "that load fast and convert",
    intro:
      "From a marketing site that turns visitors into leads to a full web application with logins, payments and dashboards — we design and build web products that are fast, easy to manage and ready to rank on Google.",
    forYouIf: [
      "Your current website is slow, dated or hard to update",
      "You need a landing page live for a launch or campaign",
      "You want a customer portal, booking flow or web app — not just pages",
      "You need a site your team can update without a developer",
    ],
    builds: [
      { icon: "globe", title: "Marketing websites", description: "Fast, responsive and SEO-ready, with a CMS so your team can publish without a developer." },
      { icon: "rocket", title: "Landing pages", description: "Focused pages built to convert for launches, ads and campaigns." },
      { icon: "code", title: "Web applications", description: "Logins, payments, dashboards and the business logic behind them." },
      { icon: "calendar", title: "Booking & intake systems", description: "Registrations, bookings and lead intake that flow straight into your tools." },
    ],
    process: [
      { step: "Plan", description: "Goals, pages and conversion paths agreed up front, with SEO built into the structure." },
      { step: "Design", description: "A design that fits your brand, reviewed on real devices before build." },
      { step: "Build", description: "Modern, fast code with analytics, forms and integrations wired in." },
      { step: "Launch", description: "Domain, hosting, search console and redirects handled so you don't lose existing traffic." },
    ],
    outcomes: [
      "A faster site that's easier to find on Google",
      "More enquiries from the same traffic",
      "Content your team can update themselves",
    ],
    faqs: [
      { question: "Will my new website be SEO-friendly?", answer: "Yes. Every site ships with clean page structure, metadata, sitemaps, structured data and fast load times — the technical basics search engines look for." },
      { question: "Can I update the content myself?", answer: "Yes. We set up a content management system so your team can edit pages and publish posts without touching code." },
      { question: "Do you handle hosting and domains?", answer: "Yes. We deploy and configure hosting, domains and SSL, or work with your existing setup." },
      { question: "How long does a website take?", answer: "Landing pages can be live in days. Most marketing sites and smaller web apps are delivered within 2–4 weeks, with a clear timeline agreed before we start." },
    ],
    relatedBlogs: ["event-registration-system"],
    relatedCaseStudies: ["srfitout"],
  },
  {
    slug: "mobile-app-development",
    name: "Mobile App Development",
    metaTitle: "Mobile App Development — iOS & Android",
    metaDescription:
      "Cross-platform iOS and Android app development for startups and businesses. Rhinon Labs designs, builds and launches mobile apps on both stores from one codebase.",
    eyebrow: "Mobile Apps",
    headline: "iOS and Android apps,",
    headlineAccent: "launched together",
    intro:
      "We build mobile apps from a single codebase that runs natively on iPhone and Android — so you launch on both stores at once, maintain one product, and ship updates faster.",
    forYouIf: [
      "Your customers expect an app, not just a website",
      "You need iOS and Android without paying for two teams",
      "Your field team works from phones and needs offline-friendly tools",
      "You want push notifications, camera, location or payments in your product",
    ],
    builds: [
      { icon: "smartphone", title: "Consumer apps", description: "Polished apps with onboarding, profiles, payments and push notifications." },
      { icon: "clipboard", title: "Field & team apps", description: "Tools for staff on the move — checklists, photos, sign-offs and sync when back online." },
      { icon: "layers", title: "Companion apps", description: "Mobile versions of your existing web platform, sharing the same backend." },
      { icon: "rocket", title: "App store launch", description: "Builds, listings and review submission for the App Store and Google Play." },
    ],
    process: [
      { step: "Scope", description: "The core screens and flows for version one, agreed with a clear timeline." },
      { step: "Design", description: "Native-feeling screens for both platforms, tested on real devices." },
      { step: "Build", description: "Regular test builds on your phone so you see progress every week." },
      { step: "Ship", description: "Store submission, analytics and crash reporting set up — then updates as users give feedback." },
    ],
    outcomes: [
      "One app on both the App Store and Google Play",
      "Lower build and maintenance cost than two native teams",
      "Faster updates from a single codebase",
    ],
    faqs: [
      { question: "Do you build native or cross-platform apps?", answer: "We build cross-platform apps that compile to native iOS and Android. For most products this gives native performance at roughly half the cost of two separate apps." },
      { question: "Do you handle App Store and Play Store publishing?", answer: "Yes. We prepare the builds, store listings and screenshots, and manage the review process for both stores." },
      { question: "Can the app share a backend with our website?", answer: "Yes. The app can use the same backend and data as your web platform, so everything stays in sync." },
      { question: "Can you maintain the app after launch?", answer: "Yes — OS updates, bug fixes and new features on an optional support plan." },
    ],
    relatedBlogs: [],
    relatedCaseStudies: ["furrcircle-the-all-in-one-app-for-pet-parents", "apexispro"],
  },
];

export const getService = (slug: string) => services.find((s) => s.slug === slug);
