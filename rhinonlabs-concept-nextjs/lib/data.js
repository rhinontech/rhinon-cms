// All homepage content in one place. Copy comes from rhinonlabs.com (services,
// process, examples, case studies, FAQs); concept-only microcopy is marked.

export const siteConfig = {
  site: "https://www.rhinonlabs.com",
  phone: "+91 8249 291 789",
  phoneHref: "tel:+918249291789",
  whatsapp: "https://wa.me/918249291789",
  email: "prabhat@rhinon.tech",
  bookCall: "https://www.rhinonlabs.com/schedule-call",
};

// Tools the systems plug into (text only — no third-party logos)
export const tools = [
  "Slack", "HubSpot", "Gmail", "Google Sheets", "Notion", "Stripe", "Razorpay", "WhatsApp",
  "Zoho", "Shopify", "Airtable", "Zoom", "QuickBooks", "OpenAI", "Claude", "Google Calendar",
];

// Hero "live preview" — illustrative events, clearly labelled as an example
export const events = [
  ["form.submitted", "CRM updated", "#sales pinged on Slack"],
  ["lead.created", "scored 82/100", "routed to the right rep"],
  ["invoice.overdue", "reminder sent on WhatsApp"],
  ["email.received", "tagged \"support\"", "reply drafted"],
  ["meeting.ended", "4 tasks created in Notion"],
  ["contract.signed", "folder created", "team notified"],
  ["order.placed", "Sheets synced", "dashboard refreshed"],
];

// Before / After — concept microcopy, illustrative timings
export const onboarding = [
  { step: "Create the client folder", manual: "10 min" },
  { step: "Copy their details into the CRM", manual: "15 min" },
  { step: "Send the contract", manual: "10 min" },
  { step: "Chase the signature", manual: "2 days" },
  { step: "Raise the first invoice", manual: "20 min" },
  { step: "Tell the team on Slack", manual: "5 min" },
];

// From the homepage "Examples" section
export const systems = [
  { cat: "dashboards", title: "Centralized Client Portal", desc: "A single login for your clients to see project status and files." },
  { cat: "dashboards", title: "Real-Time KPI Tracker", desc: "See your revenue, margins, and lead costs in one live view." },
  { cat: "dashboards", title: "Project Health Monitor", desc: "Spot bottlenecked tasks before they delay your delivery." },
  { cat: "dashboards", title: "Sales Pipeline Visualizer", desc: "See exactly where every dollar is stuck in your sales funnel." },
  { cat: "dashboards", title: "Team Capacity Planner", desc: "Know exactly who is over-worked and who has room for more." },
  { cat: "dashboards", title: "Marketing ROI Dashboard", desc: "Stop guessing which ad channel is actually making money." },
  { cat: "automation", title: "Auto-Pilot Onboarding", desc: "Automatically create folders, send contracts, and Slack the team." },
  { cat: "automation", title: "Lead Distribution Engine", desc: "Route leads from your site to the right sales rep in seconds." },
  { cat: "automation", title: "Automated Invoice", desc: "Sync your CRM with Stripe/Quickbooks to follow up on late pay." },
  { cat: "automation", title: "Meeting-to-Task Sync", desc: "Turn Zoom transcripts into actionable tasks in your PM tool." },
  { cat: "automation", title: "Cross-Platform Data Sync", desc: "Keep your CRM, Email tool, and Sheets perfectly mirrored." },
  { cat: "automation", title: "Multi-Channel Notifications", desc: "Get critical business alerts in Slack / WhatsApp, not email." },
  { cat: "agents", title: "AI Email Triage", desc: "An agent that reads incoming mail, tags it, and drafts replies." },
  { cat: "agents", title: "24/7 Support Bot", desc: "An AI trained on your docs to answer 80% of routine FAQs." },
  { cat: "agents", title: "Smart Lead Researcher", desc: "AI scans a lead's website and writes a personalized intro." },
  { cat: "agents", title: "Auto-Content Repurposer", desc: "Turn one long-form blog or video into 10 social media posts." },
  { cat: "agents", title: "Document Data Extractor", desc: "AI reads PDFs/Invoices and enters the data into your system." },
  { cat: "agents", title: "AI Appointment Setter", desc: "An agent that chats/calls with leads to qualify and book." },
];

// From the homepage "Process" section; "deliverable" lines are concept microcopy
export const process = [
  { title: "Free Discovery Call", desc: "We understand how your business runs today. Where most time is lost, where work feels messy, and what's slowing your team down.", get: "A clear picture of where your time goes" },
  { title: "Strategy Sprint", desc: "We map out the exact systems and automations needed to fix the gaps and give you a clear plan before anything is built.", get: "A fixed scope and timeline" },
  { title: "Build & Connect", desc: "We design and build your dashboards, automations, and AI tools and connect everything to your existing systems.", get: "Working systems, wired into your tools" },
  { title: "Deploy & Enablement", desc: "We deploy the system, train your team and make sure everything runs smoothly.", get: "A trained team and optional ongoing support" },
];

// Live case studies (rhinonlabs.com/case-studies)
export const work = [
  {
    slug: "furrcircle-the-all-in-one-app-for-pet-parents",
    name: "FurrCircle",
    title: "The all-in-one app for pet parents",
    tag: "Consumer / Pet Tech",
    kind: "Web · iOS · Android",
    img: "/img/work-furrcircle.webp",
    desc: "Our own flagship product — an all-in-one app for pet parents that blends a pet-first social network, a digital health passport, and a local pet community, shipped across web, iOS, and Android.",
  },
  {
    slug: "srfitout",
    name: "SR Fitout",
    title: "Turnkey studio, online",
    tag: "Interior Design & Civil Construction",
    kind: "Marketing site + intake portal",
    img: "/img/work-srfitout.webp",
    desc: "A turnkey digital front door for a Bengaluru interior & civil construction studio — a fast marketing site with an online project-intake portal and an admin dashboard to manage every enquiry.",
  },
  {
    slug: "apexispro",
    name: "Apexis Pro",
    title: "One place for every drawing and snag",
    tag: "Architecture & Construction",
    kind: "SaaS · Web + native mobile",
    img: "/img/work-apexispro.webp",
    desc: "A mobile-first SaaS that gives construction teams one controlled place for drawings, snags, RFIs, and signed-off handover — across web and native mobile.",
  },
];

export const more = [
  { name: "RichHarbor", desc: "Investing platform for unlisted shares and upcoming IPOs", img: "/img/more-richharbor.webp" },
  { name: "Al Rooha", desc: "Website for a global exporter of premium rice", img: "/img/more-alrooha.webp" },
  { name: "Rhinon", desc: "All-in-one customer growth platform: chat, CRM and support", img: "/img/more-rhinon.webp" },
];

// Same figures the live homepage shows
export const stats = [
  { value: 50, suffix: "+", label: "Tools integrated" },
  { value: 85, suffix: "%", label: "Reduction in manual tasks" },
  { text: "24/7", label: "Automation uptime" },
  { text: "2–4", unit: "wks", label: "Typical delivery" },
];

// From the shared FAQ
export const faqs = [
  ["Do we need to be technical to work with you?", "Not at all. We handle the technical side end-to-end. We build it, we deploy it, we maintain it. You just run your business. We only need to explain how your business currently works and where things feel inefficient."],
  ["How long does it take to build a system?", "It depends on complexity, but most projects are scoped and delivered within 2-4 weeks. You'll get a clear timeline before we begin."],
  ["What if we already use multiple tools?", "That's completely fine, most of our clients do. We build around your existing tools and connect them properly instead of forcing you to replace everything. In fact, you might be able to replace a lot of tools with one solution."],
  ["Will this disrupt our current operations?", "No. We design and implement systems carefully so your day-to-day operations continue running smoothly during the transition."],
  ["Do you offer ongoing support?", "Yes. After deployment, we offer optional monthly or quarterly support (retainer plan) to optimize and expand your systems as your business grows."],
  ["What industries do you work with?", "We work with growing service businesses, agencies, and SMBs across industries. If your operations rely on repetitive work, scattered tools, or manual processes, we can help."],
];

// SVG icon strings for system cards
export const ICONS = {
  dashboards: '<svg class="sys__icon" viewBox="0 0 30 30" aria-hidden="true"><rect pathLength="1" x="3.5" y="3.5" width="23" height="23" rx="4"/><path pathLength="1" d="M3.5 11.5h23M11.5 11.5v15"/><path pathLength="1" d="M15.5 21.5l3-4 3 2 3-5"/></svg>',
  automation: '<svg class="sys__icon" viewBox="0 0 30 30" aria-hidden="true"><path pathLength="1" d="M5 10.5h16.5l-4-4"/><path pathLength="1" d="M25 19.5H8.5l4 4"/><circle pathLength="1" cx="5" cy="19.5" r="1.6"/><circle pathLength="1" cx="25" cy="10.5" r="1.6"/></svg>',
  agents: '<svg class="sys__icon" viewBox="0 0 30 30" aria-hidden="true"><circle pathLength="1" cx="15" cy="15" r="5"/><path pathLength="1" d="M15 3.5V8M15 22v4.5M3.5 15H8M22 15h4.5M6.9 6.9l3.2 3.2M19.9 19.9l3.2 3.2M6.9 23.1l3.2-3.2M19.9 10.1l3.2-3.2"/></svg>',
};

export const CAT_LABELS = { dashboards: "Dashboard", automation: "Automation", agents: "AI agent" };

export const HAND_ICON = '<svg class="i-hand" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="5" r="2.6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M3 14c.6-2.6 2.6-4 5-4s4.4 1.4 5 4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';

export const BOLT_ICON = '<svg class="i-auto" viewBox="0 0 16 16" aria-hidden="true"><path d="M9.2 1.5 3.5 9h4l-1 5.5L12.5 7h-4l.7-5.5Z" fill="currentColor"/></svg>';
