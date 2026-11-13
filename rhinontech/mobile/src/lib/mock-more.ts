import type { BrandId, Priority, Task, TaskStatus } from "./mock-data";
import type { Tone } from "./tone";

/* ────────────────────────────────────────────────────────────────────────────
 * Data for the modules drawn in phases 1–3 beyond the first cut: project boards, CRM depth,
 * outreach, chatbot, documents, performance, hiring, pages, analytics, ideas, events,
 * audit and permissions. Same fictional day as mock-data.ts (Wed 11 Nov 2026).
 * ──────────────────────────────────────────────────────────────────────────── */

/* ── Attachments ─────────────────────────────────────────────────────────── */

export type AttachKind = "image" | "pdf" | "doc" | "sheet";
export type Attachment = { id: string; name: string; kind: AttachKind; size: string };

/** What the camera, photo library and file picker "return" in the prototype. */
export const PICKS: Record<"camera" | "photos" | "files", Attachment[]> = {
  camera: [{ id: "cam", name: "Scan 14-32.jpg", kind: "image", size: "1.8 MB" }],
  photos: [
    { id: "ph1", name: "IMG_2231.jpg", kind: "image", size: "2.4 MB" },
    { id: "ph2", name: "Receipt-lunch.jpg", kind: "image", size: "980 KB" },
  ],
  files: [
    { id: "f1", name: "Q4-report.pdf", kind: "pdf", size: "412 KB" },
    { id: "f2", name: "Pricing-sheet.xlsx", kind: "sheet", size: "86 KB" },
  ],
};

/* ── Work: more tasks, client requests, files ────────────────────────────── */

const mk = (
  id: string,
  title: string,
  project: string,
  assignee: string,
  status: TaskStatus,
  priority: Priority,
  due: string,
  group: Task["group"],
): Task => ({
  id,
  title,
  project,
  priority,
  status,
  due,
  group,
  assignee,
  est: 2,
  description: "",
  subtasks: [],
  comments: [],
  tags: [],
});

/** Teammates' tasks, so a project board has something on every column. */
export const MORE_TASKS: Task[] = [
  mk(
    "p1",
    "Add rate-limit headers to exports",
    "Atlas Billing",
    "dev",
    "In progress",
    "Medium",
    "Thu 12 Nov",
    "week",
  ),
  mk(
    "p2",
    "QA the 50k-row export",
    "Atlas Billing",
    "zoya",
    "Pending",
    "High",
    "Today · 5:00 PM",
    "today",
  ),
  mk(
    "p3",
    "Invoice PDF template polish",
    "Atlas Billing",
    "neha",
    "Done",
    "Low",
    "Done Tue",
    "today",
  ),
  mk(
    "p4",
    "Confirmation email copy",
    "Client Portal",
    "aanya",
    "Pending",
    "Medium",
    "Fri 13 Nov",
    "week",
  ),
  mk(
    "p5",
    "Rate-limit the request form",
    "Client Portal",
    "dev",
    "Done",
    "High",
    "Done Mon",
    "today",
  ),
  mk(
    "p6",
    "Mobile Safari layout bug",
    "Client Portal",
    "neha",
    "In progress",
    "High",
    "Thu 12 Nov",
    "week",
  ),
  mk(
    "p7",
    "Onboarding flow frames",
    "Mobile App",
    "aanya",
    "In progress",
    "Medium",
    "Today · 4:00 PM",
    "today",
  ),
  mk(
    "p8",
    "Clock-in screen build",
    "Mobile App",
    "neha",
    "In progress",
    "High",
    "Mon 16 Nov",
    "later",
  ),
  mk("p9", "Set up EAS builds", "Mobile App", "arjun", "Pending", "Medium", "Mon 16 Nov", "later"),
  mk(
    "p10",
    "Push notification service",
    "Mobile App",
    "dev",
    "Pending",
    "High",
    "Fri 13 Nov",
    "week",
  ),
  mk("p11", "Case study layout", "Website Relaunch", "tara", "Done", "Low", "Done Tue", "today"),
  mk(
    "p12",
    "Redirect map for old URLs",
    "Website Relaunch",
    "arjun",
    "Pending",
    "Low",
    "Fri 13 Nov",
    "week",
  ),
  mk(
    "p13",
    "Scorecard template",
    "Onboarding Revamp",
    "meera",
    "Pending",
    "Medium",
    "Mon 16 Nov",
    "later",
  ),
  mk(
    "p14",
    "Interview loop doc",
    "Onboarding Revamp",
    "isha",
    "In progress",
    "Low",
    "Fri 13 Nov",
    "week",
  ),
];

/** Day of November a task is due (for the project calendar). */
export function dueDay(due: string): number | null {
  const m = due.match(/(\d{1,2}) Nov/);
  if (m?.[1]) return Number(m[1]);
  if (due.startsWith("Today") || due.startsWith("Done")) return 11;
  if (due.startsWith("Overdue")) return 10;
  return null;
}

export type ClientRequest = {
  id: string;
  projectId: string;
  by: string;
  title: string;
  body: string;
  at: string;
  status: "New" | "Converted";
};
export const CLIENT_REQUESTS: ClientRequest[] = [
  {
    id: "cr1",
    projectId: "portal",
    by: "Sameer Patil · Bluepine",
    title: "Add CSV export to the portal",
    body: "Our finance team wants to download the request list every Friday.",
    at: "Yesterday",
    status: "New",
  },
  {
    id: "cr2",
    projectId: "portal",
    by: "Sameer Patil · Bluepine",
    title: "Can requests show an SLA timer?",
    body: "We'd like to see how long each request has been open.",
    at: "Mon",
    status: "New",
  },
  {
    id: "cr3",
    projectId: "atlas",
    by: "Priya Nambiar · Northwind",
    title: "Quarterly invoice summary email",
    body: "A one-page summary sent to finance on the first of each quarter.",
    at: "Tue",
    status: "New",
  },
  {
    id: "cr4",
    projectId: "atlas",
    by: "Priya Nambiar · Northwind",
    title: "Dark mode for the dashboard",
    body: "Nice to have for the ops floor displays.",
    at: "Last week",
    status: "Converted",
  },
];

export const PROJECT_FILES: Record<string, (Attachment & { by: string; at: string })[]> = {
  atlas: [
    {
      id: "pf1",
      name: "Atlas-architecture.pdf",
      kind: "pdf",
      size: "1.2 MB",
      by: "dev",
      at: "Mon",
    },
    {
      id: "pf2",
      name: "Export-benchmarks.xlsx",
      kind: "sheet",
      size: "212 KB",
      by: "zoya",
      at: "Tue",
    },
    {
      id: "pf3",
      name: "Invoice-template-v3.png",
      kind: "image",
      size: "640 KB",
      by: "neha",
      at: "Tue",
    },
  ],
  portal: [
    {
      id: "pf4",
      name: "Request-form-flow.pdf",
      kind: "pdf",
      size: "820 KB",
      by: "aanya",
      at: "Fri",
    },
    { id: "pf5", name: "Client-feedback.doc", kind: "doc", size: "54 KB", by: "me", at: "Thu" },
  ],
  mobile: [
    {
      id: "pf6",
      name: "Onboarding-frames.pdf",
      kind: "pdf",
      size: "3.1 MB",
      by: "aanya",
      at: "Today",
    },
    { id: "pf7", name: "Icon-set.png", kind: "image", size: "380 KB", by: "aanya", at: "Mon" },
  ],
  site: [
    { id: "pf8", name: "Sitemap.xlsx", kind: "sheet", size: "48 KB", by: "tara", at: "Last week" },
  ],
  onboarding: [
    { id: "pf9", name: "Hiring-scorecard.doc", kind: "doc", size: "36 KB", by: "meera", at: "Mon" },
  ],
};

/* ── CRM: leads, accounts, activity ──────────────────────────────────────── */

export type Lifecycle = "New" | "Contacted" | "Engaged" | "Qualified" | "Unqualified" | "Customer";
export const LIFECYCLES: Lifecycle[] = [
  "New",
  "Contacted",
  "Engaged",
  "Qualified",
  "Unqualified",
  "Customer",
];

export type CrmLead = {
  id: string;
  name: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  status: "New" | "Contacted" | "Interested" | "Replied";
  lifecycle: Lifecycle;
  source: string;
  last: string;
  owner: string;
};
export const CRM_LEADS: CrmLead[] = [
  {
    id: "ld1",
    name: "Priya Nambiar",
    company: "Northwind Logistics",
    title: "VP Operations",
    email: "priya@northwind.example",
    phone: "+91 98200 11111",
    status: "Replied",
    lifecycle: "Engaged",
    source: "Outreach",
    last: "Replied today",
    owner: "rohan",
  },
  {
    id: "ld2",
    name: "Tanvi Shah",
    company: "Kestrel Health",
    title: "COO",
    email: "tanvi@kestrel.example",
    phone: "+91 98200 22222",
    status: "Interested",
    lifecycle: "Qualified",
    source: "Referral",
    last: "Call booked",
    owner: "rohan",
  },
  {
    id: "ld3",
    name: "Nikhil Rao",
    company: "Orbit Foods",
    title: "Head of Ops",
    email: "nikhil@orbit.example",
    phone: "+91 98200 33333",
    status: "New",
    lifecycle: "New",
    source: "Website chat",
    last: "Yesterday",
    owner: "rohan",
  },
  {
    id: "ld4",
    name: "Ira Dsouza",
    company: "Lumen Studios",
    title: "Founder",
    email: "ira@lumen.example",
    phone: "+91 98200 44444",
    status: "Contacted",
    lifecycle: "Contacted",
    source: "Outreach",
    last: "2 days ago",
    owner: "rohan",
  },
  {
    id: "ld5",
    name: "Manav Gill",
    company: "Harbor & Co",
    title: "CEO",
    email: "manav@harbor.example",
    phone: "+91 98200 55555",
    status: "Interested",
    lifecycle: "Customer",
    source: "Event",
    last: "Won",
    owner: "rohan",
  },
  {
    id: "ld6",
    name: "Sameer Patil",
    company: "Bluepine Retail",
    title: "Finance Controller",
    email: "sameer@bluepine.example",
    phone: "+91 98200 66666",
    status: "Replied",
    lifecycle: "Engaged",
    source: "Support",
    last: "Today",
    owner: "rohan",
  },
];

export type Account = {
  id: string;
  name: string;
  industry: string;
  city: string;
  size: string;
  since: string;
  note: string;
};
export const ACCOUNTS: Account[] = [
  {
    id: "ac1",
    name: "Northwind Logistics",
    industry: "Logistics",
    city: "Mumbai",
    size: "800 people",
    since: "Oct 2026",
    note: "Evaluating 40 seats. Finance closes the quarter on the 28th.",
  },
  {
    id: "ac2",
    name: "Kestrel Health",
    industry: "Healthcare",
    city: "Bengaluru",
    size: "1,200 people",
    since: "Nov 2026",
    note: "Four clinics. SSO and an on-prem data option are the blockers.",
  },
  {
    id: "ac3",
    name: "Bluepine Retail",
    industry: "Retail",
    city: "Pune",
    size: "350 people",
    since: "Aug 2026",
    note: "Existing pilot. Export bug is blocking their month-end close.",
  },
  {
    id: "ac4",
    name: "Harbor & Co",
    industry: "Shipping",
    city: "Chennai",
    size: "220 people",
    since: "Nov 2026",
    note: "Signed the annual plan on Tuesday. Case study in progress.",
  },
  {
    id: "ac5",
    name: "Lumen Studios",
    industry: "Media",
    city: "Delhi",
    size: "60 people",
    since: "Nov 2026",
    note: "Proposal sent Monday. Follow up Thursday.",
  },
  {
    id: "ac6",
    name: "Orbit Foods",
    industry: "Food and beverage",
    city: "Hyderabad",
    size: "140 people",
    since: "Nov 2026",
    note: "Inbound from the website chat. Needs a demo.",
  },
];

export type ActivityKind = "call" | "email" | "meeting" | "note";
export type Activity = {
  id: string;
  on: string;
  kind: ActivityKind;
  text: string;
  by: string;
  at: string;
};
export const ACTIVITIES: Activity[] = [
  {
    id: "ac-1",
    on: "d1",
    kind: "call",
    text: "Walked through pricing. Asked for the SLA add-on priced separately.",
    by: "rohan",
    at: "Mon 4:10 PM",
  },
  {
    id: "ac-2",
    on: "d1",
    kind: "email",
    text: "Sent the 40-seat proposal with onboarding support.",
    by: "rohan",
    at: "Fri",
  },
  {
    id: "ac-3",
    on: "d3",
    kind: "meeting",
    text: "Demo with COO and two clinic managers. They liked approvals.",
    by: "rohan",
    at: "Tue 11:00 AM",
  },
  {
    id: "ac-4",
    on: "d3",
    kind: "note",
    text: "Needs SSO and an on-prem option before signing.",
    by: "me",
    at: "Tue",
  },
  {
    id: "ac-5",
    on: "ld1",
    kind: "email",
    text: "Replied asking whether 99.9% is measured monthly or quarterly.",
    by: "rohan",
    at: "Today 9:32 AM",
  },
];

/* ── Outreach & automation ───────────────────────────────────────────────── */

export type Campaign = {
  id: string;
  brand: BrandId;
  name: string;
  channel: "Email" | "LinkedIn";
  status: "Draft" | "Active" | "Paused" | "Completed";
  sent: number;
  opened: number;
  replied: number;
  bounced: number;
  leads: number;
  runTime: string;
};
export const CAMPAIGNS: Campaign[] = [
  {
    id: "cp1",
    brand: "tech",
    name: "Atlas — logistics ops leads",
    channel: "Email",
    status: "Active",
    sent: 412,
    opened: 168,
    replied: 23,
    bounced: 9,
    leads: 540,
    runTime: "10:30",
  },
  {
    id: "cp2",
    brand: "tech",
    name: "Founder intros — SaaS",
    channel: "Email",
    status: "Paused",
    sent: 188,
    opened: 71,
    replied: 9,
    bounced: 4,
    leads: 260,
    runTime: "11:00",
  },
  {
    id: "cp3",
    brand: "tech",
    name: "LinkedIn — case study push",
    channel: "LinkedIn",
    status: "Active",
    sent: 36,
    opened: 0,
    replied: 5,
    bounced: 0,
    leads: 80,
    runTime: "09:00",
  },
  {
    id: "cp4",
    brand: "tech",
    name: "Q3 win-back",
    channel: "Email",
    status: "Completed",
    sent: 640,
    opened: 262,
    replied: 31,
    bounced: 14,
    leads: 640,
    runTime: "10:00",
  },
  {
    id: "cp5",
    brand: "labs",
    name: "Labs newsletter launch",
    channel: "Email",
    status: "Draft",
    sent: 0,
    opened: 0,
    replied: 0,
    bounced: 0,
    leads: 1200,
    runTime: "08:30",
  },
  {
    id: "cp6",
    brand: "uppercurve",
    name: "Startup founders — /build",
    channel: "Email",
    status: "Active",
    sent: 96,
    opened: 44,
    replied: 12,
    bounced: 2,
    leads: 300,
    runTime: "10:00",
  },
];

export type OutreachDraft = {
  id: string;
  brand: BrandId;
  lead: string;
  company: string;
  title: string;
  stage: string;
  subject: string;
  body: string;
  status: "pending" | "approved" | "rejected";
};
const DRAFT_SEEDS: Omit<OutreachDraft, "status">[] = [
  {
    id: "dr1",
    brand: "tech",
    lead: "Anita Desai",
    company: "Kestrel Logistics",
    title: "Head of Ops",
    stage: "Stage 1 · first touch",
    subject: "Delays between depot and billing?",
    body: "Anita, most logistics teams we speak to lose a day a week reconciling depot sheets against invoices. Rhinon puts both in one place so ops sees what billing sees. Worth 15 minutes next week to look at how Northwind runs it?",
  },
  {
    id: "dr2",
    brand: "tech",
    lead: "Marcus Webb",
    company: "Bluepine Retail",
    title: "COO",
    stage: "Stage 2 · follow-up",
    subject: "Re: month-end close",
    body: "Marcus, following up on the export issue your team hit. A fix ships this week. Once it's live, we can look at the approvals flow that cut Harbor's close from six days to three.",
  },
  {
    id: "dr3",
    brand: "tech",
    lead: "Ira Dsouza",
    company: "Lumen Studios",
    title: "Founder",
    stage: "Stage 3 · proof",
    subject: "How Harbor & Co closes faster",
    body: "Ira, quick proof point: Harbor & Co moved invoicing and approvals into one workspace and cut turnaround by 40%. The case study is attached. Happy to walk through how it would map to Lumen.",
  },
  {
    id: "dr4",
    brand: "tech",
    lead: "Rahul Menon",
    company: "Orbit Foods",
    title: "Ops Manager",
    stage: "Stage 1 · first touch",
    subject: "One place for orders and invoices",
    body: "Rahul, teams running three depots usually keep orders in one tool and invoices in another. We replace both with a single workspace your ops lead can read at a glance. Open to a short demo?",
  },
  {
    id: "dr5",
    brand: "tech",
    lead: "Tanvi Shah",
    company: "Kestrel Health",
    title: "COO",
    stage: "Stage 4 · close",
    subject: "SSO and on-prem: next steps",
    body: "Tanvi, we can deliver SAML SSO this quarter and offer a dedicated data region. I've drafted a one-page plan for your security team. Can we confirm a start date this week?",
  },
  {
    id: "dr6",
    brand: "labs",
    lead: "Dev Kapoor",
    company: "Quill Labs",
    title: "CTO",
    stage: "Stage 1 · first touch",
    subject: "Shipping faster with fewer meetings",
    body: "Dev, engineering teams that move approvals into the product save about four meetings a week. We built Labs to do that. Want a look?",
  },
  {
    id: "dr7",
    brand: "uppercurve",
    lead: "Anjali Rao",
    company: "PetPass",
    title: "Founder",
    stage: "Stage 1 · first touch",
    subject: "Your /build idea",
    body: "Anjali, thanks for submitting PetPass. We back a handful of founders each quarter and your problem statement stood out. Can we talk this week?",
  },
];

export const DRAFTS: OutreachDraft[] = DRAFT_SEEDS.map((d) => ({ ...d, status: "pending" }));

export type SentItem = {
  id: string;
  brand: BrandId;
  lead: string;
  company: string;
  subject: string;
  status: "Sent" | "Opened" | "Replied" | "Bounced";
  at: string;
};
export const SENT: SentItem[] = [
  {
    id: "s1",
    brand: "tech",
    lead: "Priya Nambiar",
    company: "Northwind",
    subject: "Atlas pricing for 40 seats",
    status: "Replied",
    at: "Today 9:32",
  },
  {
    id: "s2",
    brand: "tech",
    lead: "Sunil Rao",
    company: "Apex Freight",
    subject: "Seeing delays between depot and billing?",
    status: "Opened",
    at: "Today 8:40",
  },
  {
    id: "s3",
    brand: "tech",
    lead: "Meena Iyer",
    company: "Orchid Pharma",
    subject: "One place for orders and invoices",
    status: "Sent",
    at: "Yesterday",
  },
  {
    id: "s4",
    brand: "tech",
    lead: "Karan Shah",
    company: "Bright Mart",
    subject: "Re: month-end close",
    status: "Bounced",
    at: "Yesterday",
  },
  {
    id: "s5",
    brand: "tech",
    lead: "Tanvi Shah",
    company: "Kestrel Health",
    subject: "Intro: Kestrel Health <> Rhinon",
    status: "Replied",
    at: "Sun",
  },
  {
    id: "s6",
    brand: "labs",
    lead: "Nora Blake",
    company: "Fieldnote",
    subject: "Labs newsletter beta",
    status: "Opened",
    at: "Tue",
  },
];

export type Flow = {
  id: string;
  brand: BrandId;
  name: string;
  trigger: string;
  active: boolean;
  enrolled: number;
  steps: number;
};
export const FLOWS: Flow[] = [
  {
    id: "fl1",
    brand: "tech",
    name: "Welcome sequence",
    trigger: "New lead from the website",
    active: true,
    enrolled: 56,
    steps: 4,
  },
  {
    id: "fl2",
    brand: "tech",
    name: "Re-engage cold leads",
    trigger: "No reply after 21 days",
    active: false,
    enrolled: 120,
    steps: 5,
  },
  {
    id: "fl3",
    brand: "tech",
    name: "Post-demo follow-up",
    trigger: "Demo marked as held",
    active: true,
    enrolled: 18,
    steps: 3,
  },
  {
    id: "fl4",
    brand: "tech",
    name: "Event follow-up",
    trigger: "Guest checked in",
    active: true,
    enrolled: 44,
    steps: 2,
  },
  {
    id: "fl5",
    brand: "labs",
    name: "Newsletter onboarding",
    trigger: "Subscribed",
    active: true,
    enrolled: 210,
    steps: 3,
  },
  {
    id: "fl6",
    brand: "uppercurve",
    name: "Idea received",
    trigger: "Idea submitted",
    active: true,
    enrolled: 31,
    steps: 2,
  },
];

/* ── Chatbot ─────────────────────────────────────────────────────────────── */

export type BotMsg = { id: string; who: "visitor" | "bot" | "agent"; text: string; at: string };
export type BotChat = {
  id: string;
  visitor: string;
  place: string;
  page: string;
  source: string;
  device: string;
  status: "bot" | "waiting" | "agent" | "closed";
  time: string;
  messages: BotMsg[];
};
export const BOT_CHATS: BotChat[] = [
  {
    id: "bc1",
    visitor: "Rahul from Pune",
    place: "Pune, India",
    page: "/pricing",
    source: "Google",
    device: "Chrome · Mac",
    status: "waiting",
    time: "2m",
    messages: [
      { id: "1", who: "visitor", text: "Do you support SSO?", at: "9:36" },
      {
        id: "2",
        who: "bot",
        text: "Yes. SAML SSO is available on the Business plan, along with SCIM user provisioning.",
        at: "9:36",
      },
      {
        id: "3",
        who: "visitor",
        text: "Can I talk to someone about our setup? We have 300 people.",
        at: "9:38",
      },
      { id: "4", who: "bot", text: "Of course. I'm bringing in a teammate now.", at: "9:38" },
    ],
  },
  {
    id: "bc2",
    visitor: "Maya Fernandes",
    place: "Mumbai, India",
    page: "/features/approvals",
    source: "LinkedIn",
    device: "Safari · iPhone",
    status: "bot",
    time: "5m",
    messages: [
      { id: "1", who: "visitor", text: "How do approvals work for reimbursements?", at: "9:34" },
      {
        id: "2",
        who: "bot",
        text: "Employees submit a claim with a receipt. Their manager approves or rejects it in one tap, and approved claims are paid with the next payslip.",
        at: "9:34",
      },
    ],
  },
  {
    id: "bc3",
    visitor: "Visitor 4790",
    place: "Berlin, Germany",
    page: "/",
    source: "Direct",
    device: "Firefox · Windows",
    status: "agent",
    time: "12m",
    messages: [
      { id: "1", who: "visitor", text: "Is there a free trial?", at: "9:26" },
      {
        id: "2",
        who: "bot",
        text: "There is a 14-day trial with no card needed. Want me to set one up?",
        at: "9:26",
      },
      {
        id: "3",
        who: "visitor",
        text: "Yes please, and does it include the mobile app?",
        at: "9:28",
      },
      {
        id: "4",
        who: "agent",
        text: "Hi, this is Kabir from Rhinon. The trial includes the mobile app. What's your work email?",
        at: "9:30",
      },
    ],
  },
  {
    id: "bc4",
    visitor: "Sneha Rao",
    place: "Hyderabad, India",
    page: "/book-demo",
    source: "Email",
    device: "Chrome · Android",
    status: "waiting",
    time: "1m",
    messages: [
      { id: "1", who: "visitor", text: "I booked a demo but never got the invite.", at: "9:40" },
      {
        id: "2",
        who: "bot",
        text: "Sorry about that. I'll get a teammate to resend it.",
        at: "9:40",
      },
    ],
  },
  {
    id: "bc5",
    visitor: "Liam O'Connor",
    place: "Dublin, Ireland",
    page: "/docs/api",
    source: "Google",
    device: "Chrome · Linux",
    status: "closed",
    time: "1h",
    messages: [
      { id: "1", who: "visitor", text: "What are the API rate limits?", at: "8:31" },
      {
        id: "2",
        who: "bot",
        text: "600 requests per minute per key. A 429 includes a Retry-After header.",
        at: "8:31",
      },
      { id: "3", who: "visitor", text: "Perfect, thanks!", at: "8:32" },
    ],
  },
];

export type TicketMsg = { id: string; who: "customer" | "agent"; text: string; at: string };
export type Ticket = {
  id: string;
  subject: string;
  from: string;
  status: "Open" | "Pending" | "Resolved";
  priority: "Low" | "Medium" | "High";
  assignee: string | null;
  updated: string;
  messages: TicketMsg[];
};
export const TICKETS: Ticket[] = [
  {
    id: "tk1",
    subject: "Invoice export failing on large accounts",
    from: "Sameer Patil",
    status: "Open",
    priority: "High",
    assignee: "me",
    updated: "9m",
    messages: [
      {
        id: "1",
        who: "customer",
        text: "Exports over a quarter fail with a gateway error. This blocks our close.",
        at: "Today 8:57",
      },
      {
        id: "2",
        who: "agent",
        text: "Reproduced. A fix is in review. Two-month ranges work meanwhile.",
        at: "Today 9:20",
      },
    ],
  },
  {
    id: "tk2",
    subject: "Need a GST invoice copy",
    from: "Neeraj Bhatt",
    status: "Pending",
    priority: "Medium",
    assignee: "meera",
    updated: "2h",
    messages: [
      {
        id: "1",
        who: "customer",
        text: "Please resend the GST invoice for October.",
        at: "Today 7:10",
      },
      {
        id: "2",
        who: "agent",
        text: "Sent to your billing email. Can you confirm it arrived?",
        at: "Today 7:40",
      },
    ],
  },
  {
    id: "tk3",
    subject: "How do I add a teammate?",
    from: "Aisha Khan",
    status: "Resolved",
    priority: "Low",
    assignee: "me",
    updated: "Yesterday",
    messages: [
      {
        id: "1",
        who: "customer",
        text: "Where do I invite someone to my workspace?",
        at: "Tue 3:10 PM",
      },
      {
        id: "2",
        who: "agent",
        text: "Settings, then Accounts, then Invite. They'll get an email.",
        at: "Tue 3:20 PM",
      },
    ],
  },
  {
    id: "tk4",
    subject: "SSO setup help",
    from: "Vikas Rane",
    status: "Open",
    priority: "Medium",
    assignee: null,
    updated: "3h",
    messages: [
      {
        id: "1",
        who: "customer",
        text: "We're stuck at the SAML metadata step.",
        at: "Today 6:50",
      },
    ],
  },
  {
    id: "tk5",
    subject: "Webhook retries not firing",
    from: "Joel Mathew",
    status: "Open",
    priority: "High",
    assignee: "dev",
    updated: "5h",
    messages: [
      {
        id: "1",
        who: "customer",
        text: "Failed deliveries aren't being retried after the first attempt.",
        at: "Today 4:30",
      },
    ],
  },
];

export type LiveVisitor = {
  id: string;
  name: string;
  place: string;
  page: string;
  source: string;
  since: string;
  x: number;
  y: number;
};
export const VISITORS: LiveVisitor[] = [
  {
    id: "v1",
    name: "Rahul from Pune",
    place: "Pune",
    page: "/pricing",
    source: "Google",
    since: "6m",
    x: 70,
    y: 52,
  },
  {
    id: "v2",
    name: "Maya Fernandes",
    place: "Mumbai",
    page: "/features/approvals",
    source: "LinkedIn",
    since: "9m",
    x: 68,
    y: 55,
  },
  {
    id: "v3",
    name: "Visitor 4790",
    place: "Berlin",
    page: "/",
    source: "Direct",
    since: "14m",
    x: 50,
    y: 30,
  },
  {
    id: "v4",
    name: "Sneha Rao",
    place: "Hyderabad",
    page: "/book-demo",
    source: "Email",
    since: "3m",
    x: 71,
    y: 57,
  },
  {
    id: "v5",
    name: "Visitor 4801",
    place: "London",
    page: "/blog",
    source: "Google",
    since: "2m",
    x: 47,
    y: 28,
  },
  {
    id: "v6",
    name: "Visitor 4803",
    place: "New York",
    page: "/pricing",
    source: "Direct",
    since: "1m",
    x: 24,
    y: 36,
  },
  {
    id: "v7",
    name: "Visitor 4805",
    place: "Singapore",
    page: "/features",
    source: "Google",
    since: "8m",
    x: 79,
    y: 64,
  },
  {
    id: "v8",
    name: "Visitor 4806",
    place: "Delhi",
    page: "/",
    source: "Direct",
    since: "4m",
    x: 70,
    y: 47,
  },
];

/* ── Documents ───────────────────────────────────────────────────────────── */

export type DocKind = "offer" | "contract" | "id" | "appraisal" | "nda" | "other";
export type DocItem = {
  id: string;
  name: string;
  kind: DocKind;
  date: string;
  size: string;
  state: "ok" | "to-sign" | "signed";
};
export const DOCS: DocItem[] = [
  {
    id: "dc1",
    name: "Updated NDA, version 2",
    kind: "nda",
    date: "Sent Mon",
    size: "96 KB",
    state: "to-sign",
  },
  {
    id: "dc2",
    name: "Handbook acknowledgement",
    kind: "other",
    date: "Sent Tue",
    size: "64 KB",
    state: "to-sign",
  },
  {
    id: "dc3",
    name: "Offer letter — Engineering Lead",
    kind: "offer",
    date: "12 Mar 2022",
    size: "184 KB",
    state: "signed",
  },
  {
    id: "dc4",
    name: "Non-disclosure agreement",
    kind: "nda",
    date: "12 Mar 2022",
    size: "92 KB",
    state: "signed",
  },
  {
    id: "dc5",
    name: "Employment contract",
    kind: "contract",
    date: "12 Mar 2022",
    size: "310 KB",
    state: "ok",
  },
  { id: "dc6", name: "PAN card", kind: "id", date: "14 Mar 2022", size: "1.1 MB", state: "ok" },
  {
    id: "dc7",
    name: "Appraisal letter 2026",
    kind: "appraisal",
    date: "1 Apr 2026",
    size: "140 KB",
    state: "ok",
  },
  {
    id: "dc8",
    name: "Form 16 · FY 2025-26",
    kind: "other",
    date: "15 Jun 2026",
    size: "220 KB",
    state: "ok",
  },
];
export const DOC_KIND: Record<DocKind, { label: string; tone: Tone }> = {
  offer: { label: "Offer", tone: "leaf" },
  contract: { label: "Contract", tone: "cobalt" },
  id: { label: "ID proof", tone: "sky" },
  appraisal: { label: "Appraisal", tone: "violet" },
  nda: { label: "NDA", tone: "coral" },
  other: { label: "Other", tone: "sun" },
};

export type DocRequest = {
  id: string;
  title: string;
  by: string;
  due: string;
  note: string;
  done: boolean;
};
export const DOC_REQUESTS: DocRequest[] = [
  {
    id: "rq1",
    title: "Address proof",
    by: "meera",
    due: "18 Nov",
    note: "Rent agreement or a utility bill from the last three months.",
    done: false,
  },
  {
    id: "rq2",
    title: "Passport-size photo",
    by: "meera",
    due: "14 Nov",
    note: "For your ID card. Plain background, face the camera.",
    done: false,
  },
  {
    id: "rq3",
    title: "Previous employer letter",
    by: "isha",
    due: "10 Nov",
    note: "Relieving or experience letter.",
    done: true,
  },
];

/** The paragraphs shown in the document viewer and signing screen. */
export const DOC_BODY: Record<string, string[]> = {
  dc1: [
    'This agreement is made between Rhinon Tech Private Limited ("the Company") and the employee named below ("the Employee").',
    "1. Confidential information. The Employee agrees to keep confidential all non-public business, technical and customer information, in any form, learned during employment.",
    "2. Permitted use. Confidential information may be used only to perform the Employee's duties for the Company.",
    "3. Return of materials. On request, or when employment ends, the Employee will return or delete all materials containing confidential information.",
    "4. Duration. These obligations continue for three years after employment ends, and indefinitely for trade secrets.",
  ],
  dc2: [
    "I confirm that I have read and understood the Rhinon Tech employee handbook, including the sections on conduct, information security, leave and expenses.",
    "I understand that the handbook may be updated and that I am responsible for reading the changes announced by the Company.",
  ],
};

/* ── Performance ─────────────────────────────────────────────────────────── */

export type Goal = {
  id: string;
  title: string;
  keyResult: string;
  cycle: string;
  progress: number;
  due: string;
};
export const GOALS: Goal[] = [
  {
    id: "g1",
    title: "Cut invoice export p95 to under 3 seconds",
    keyResult: "p95 below 3s on 50k rows",
    cycle: "H2 2026",
    progress: 70,
    due: "30 Nov",
  },
  {
    id: "g2",
    title: "Ship the client portal v1",
    keyResult: "Request form, status page and email alerts live",
    cycle: "H2 2026",
    progress: 55,
    due: "12 Dec",
  },
  {
    id: "g3",
    title: "Mentor two engineers to ownership",
    keyResult: "Each leads a feature end to end",
    cycle: "H2 2026",
    progress: 40,
    due: "31 Dec",
  },
  {
    id: "g4",
    title: "Reduce on-call pages by 30%",
    keyResult: "From 20 to 14 pages a month",
    cycle: "H2 2026",
    progress: 20,
    due: "31 Dec",
  },
  {
    id: "g5",
    title: "Hire two backend engineers",
    keyResult: "Offers accepted and start dates set",
    cycle: "H2 2026",
    progress: 85,
    due: "15 Dec",
  },
];
export const goalState = (g: Goal): "Done" | "On track" | "At risk" =>
  g.progress >= 100 ? "Done" : g.progress >= 45 ? "On track" : "At risk";

export type PastReview = {
  id: string;
  cycle: string;
  rating: number;
  label: string;
  manager: string;
  comment: string;
};
export const PAST_REVIEWS: PastReview[] = [
  {
    id: "pr1",
    cycle: "H1 2026",
    rating: 4,
    label: "Exceeds expectations",
    manager: "vikram",
    comment:
      "Strong ownership of Atlas billing and a calm presence during the March release. Next: delegate more.",
  },
  {
    id: "pr2",
    cycle: "H2 2025",
    rating: 4,
    label: "Exceeds expectations",
    manager: "vikram",
    comment: "Raised the bar on reliability. Keep investing in the team's growth.",
  },
];

export type TeamReview = {
  id: string;
  who: string;
  status: "Not started" | "Self-review in" | "Your review due" | "Completed";
  selfRating: number | null;
  selfNotes: string;
  managerRating: number | null;
  managerNotes: string;
};
export const TEAM_REVIEWS: TeamReview[] = [
  {
    id: "tr1",
    who: "dev",
    status: "Your review due",
    selfRating: 4,
    selfNotes: "Shipped streaming exports and cut p95 latency. Want more design-review time.",
    managerRating: null,
    managerNotes: "",
  },
  {
    id: "tr2",
    who: "aanya",
    status: "Self-review in",
    selfRating: 4,
    selfNotes: "Led the onboarding redesign. I'd like more time with customers.",
    managerRating: null,
    managerNotes: "",
  },
  {
    id: "tr3",
    who: "arjun",
    status: "Self-review in",
    selfRating: 3,
    selfNotes: "Stabilised deploys. Learning more about observability.",
    managerRating: null,
    managerNotes: "",
  },
  {
    id: "tr4",
    who: "neha",
    status: "Not started",
    selfRating: null,
    selfNotes: "",
    managerRating: null,
    managerNotes: "",
  },
  {
    id: "tr5",
    who: "zoya",
    status: "Completed",
    selfRating: 4,
    selfNotes: "Built the regression suite.",
    managerRating: 4,
    managerNotes: "Reliable and thorough. Keep sharing the test playbook.",
  },
];

export const RATING_LABELS = ["Needs work", "Below", "Meets", "Exceeds", "Outstanding"];

/* ── Hiring ──────────────────────────────────────────────────────────────── */

export const HIRING_STAGES = ["Applied", "Screen", "Interview", "Offer", "Hired"] as const;
export type HiringStage = (typeof HIRING_STAGES)[number];

export type Candidate = {
  id: string;
  name: string;
  role: string;
  stage: HiringStage;
  exp: string;
  source: string;
  summary: string;
};
export const CANDIDATES: Candidate[] = [
  {
    id: "cd1",
    name: "Rahul Verma",
    role: "Backend Engineer",
    stage: "Interview",
    exp: "6 yrs",
    source: "Referral",
    summary:
      "Led a payments migration at a fintech. Strong on Postgres and queues. Less depth on frontend.",
  },
  {
    id: "cd2",
    name: "Sneha Kulkarni",
    role: "Product Designer",
    stage: "Interview",
    exp: "5 yrs",
    source: "LinkedIn",
    summary:
      "Design systems lead at a logistics startup. Portfolio shows clear thinking about dense dashboards.",
  },
  {
    id: "cd3",
    name: "Kavya Iyer",
    role: "Backend Engineer",
    stage: "Screen",
    exp: "4 yrs",
    source: "Website",
    summary: "Go and TypeScript. Open-source maintainer of a queue library.",
  },
  {
    id: "cd4",
    name: "Dhruv Malik",
    role: "QA Engineer",
    stage: "Offer",
    exp: "7 yrs",
    source: "Agency",
    summary: "Built automation for a 40-person team. Asked for a hybrid arrangement.",
  },
  {
    id: "cd5",
    name: "Pooja Nair",
    role: "Sales Development Rep",
    stage: "Applied",
    exp: "2 yrs",
    source: "Website",
    summary: "Outbound at a B2B SaaS company. Exceeded quota three quarters running.",
  },
  {
    id: "cd6",
    name: "Aditya Rao",
    role: "Backend Engineer",
    stage: "Applied",
    exp: "3 yrs",
    source: "LinkedIn",
    summary: "Node and Postgres. Looking to move from services to product.",
  },
  {
    id: "cd7",
    name: "Megha Sinha",
    role: "QA Engineer",
    stage: "Screen",
    exp: "3 yrs",
    source: "Referral",
    summary: "Playwright and API testing. Strong written communication.",
  },
  {
    id: "cd8",
    name: "Farhan Ali",
    role: "Backend Engineer",
    stage: "Hired",
    exp: "5 yrs",
    source: "Referral",
    summary: "Joined 2 Nov. Onboarding on Atlas.",
  },
];
export type Opening = {
  id: string;
  title: string;
  dept: string;
  where: string;
  candidates: number;
  state: "Open" | "On hold";
  posted: string;
};
export const OPENINGS: Opening[] = [
  {
    id: "op1",
    title: "Backend Engineer",
    dept: "Engineering",
    where: "Pune · Hybrid",
    candidates: 14,
    state: "Open",
    posted: "3 Oct",
  },
  {
    id: "op2",
    title: "QA Engineer",
    dept: "Engineering",
    where: "Pune · Hybrid",
    candidates: 9,
    state: "Open",
    posted: "12 Oct",
  },
  {
    id: "op3",
    title: "Product Designer",
    dept: "Design",
    where: "Bengaluru · Remote",
    candidates: 22,
    state: "On hold",
    posted: "20 Sep",
  },
  {
    id: "op4",
    title: "Sales Development Rep",
    dept: "Sales",
    where: "Delhi · Office",
    candidates: 31,
    state: "Open",
    posted: "27 Oct",
  },
];
export type Interview = {
  id: string;
  candidateId: string;
  round: string;
  day: "Yesterday" | "Today" | "Tomorrow" | "Fri";
  time: string;
  where: string;
  rating: number | null;
  rec: "Hire" | "Maybe" | "No hire" | null;
  notes: string;
};
export const INTERVIEWS: Interview[] = [
  {
    id: "iv1",
    candidateId: "cd4",
    round: "Final chat",
    day: "Yesterday",
    time: "16:00",
    where: "Room 1",
    rating: null,
    rec: null,
    notes: "",
  },
  {
    id: "iv2",
    candidateId: "cd1",
    round: "Technical · round 2",
    day: "Today",
    time: "14:30",
    where: "Google Meet",
    rating: null,
    rec: null,
    notes: "",
  },
  {
    id: "iv3",
    candidateId: "cd2",
    round: "Design review",
    day: "Today",
    time: "17:00",
    where: "Google Meet",
    rating: null,
    rec: null,
    notes: "",
  },
  {
    id: "iv4",
    candidateId: "cd3",
    round: "System design",
    day: "Tomorrow",
    time: "11:00",
    where: "Google Meet",
    rating: null,
    rec: null,
    notes: "",
  },
  {
    id: "iv5",
    candidateId: "cd7",
    round: "Screening call",
    day: "Fri",
    time: "10:30",
    where: "Phone",
    rating: null,
    rec: null,
    notes: "",
  },
];

/* ── Pages (wiki) ────────────────────────────────────────────────────────── */

export type WikiIcon = "rocket" | "palette" | "megaphone" | "users" | "book" | "shield";
export type WikiPage = {
  id: string;
  title: string;
  icon: WikiIcon;
  tone: Tone;
  parent: string | null;
  updated: string;
  by: string;
  body: string;
  sharedWith: string[];
  linkShare: boolean;
};
export const WIKI_PAGES: WikiPage[] = [
  {
    id: "wp1",
    title: "Engineering handbook",
    icon: "rocket",
    tone: "cobalt",
    parent: null,
    updated: "Today",
    by: "vikram",
    linkShare: false,
    sharedWith: ["dev", "neha", "zoya", "arjun"],
    body: "# Engineering handbook\n\nHow we build, ship and run Rhinon.\n\n## Principles\n\n- Small changes, shipped often\n- Every change is reviewed by one other person\n- If it pages you twice, fix the cause\n\n> Beta first, production second. Never skip the build.\n\n## Where to start\n\n- Read the **Deploy checklist** before your first release\n- Read the **On-call runbook** before your first shift",
  },
  {
    id: "wp2",
    title: "Deploy checklist",
    icon: "rocket",
    tone: "cobalt",
    parent: "wp1",
    updated: "Yesterday",
    by: "arjun",
    linkShare: false,
    sharedWith: ["dev", "arjun"],
    body: "# Deploy checklist\n\nRun this top to bottom for every release.\n\n- [x] Pull the latest `main` on beta\n- [x] Install and **build**. A failed build never reaches production\n- [ ] Restart the process\n- [ ] Check `/health` returns ok\n- [ ] Smoke-test the export and the portal form\n- [ ] Promote to production\n\n> If anything fails, stop and post in #engineering.",
  },
  {
    id: "wp3",
    title: "On-call runbook",
    icon: "shield",
    tone: "coral",
    parent: "wp1",
    updated: "Mon",
    by: "dev",
    linkShare: false,
    sharedWith: ["dev", "arjun"],
    body: "# On-call runbook\n\n## When you are paged\n\n- Acknowledge within five minutes\n- Open the dashboard and check error rate and latency\n- Post what you see in #engineering\n\n## Common fixes\n\n- Gateway timeouts: check the export queue\n- Email bounces: check the sending domain",
  },
  {
    id: "wp4",
    title: "Design principles",
    icon: "palette",
    tone: "violet",
    parent: null,
    updated: "Tue",
    by: "aanya",
    linkShare: true,
    sharedWith: ["aanya", "neha"],
    body: "# Design principles\n\n## What we believe\n\n- One colour per module, everywhere that module shows up\n- Ink is the primary action. Colour means place or state\n- Every list has loading, empty and error states\n\n> Show the next best action, not every action.",
  },
  {
    id: "wp5",
    title: "Colour and type",
    icon: "palette",
    tone: "violet",
    parent: "wp4",
    updated: "Last week",
    by: "aanya",
    linkShare: false,
    sharedWith: ["aanya"],
    body: "# Colour and type\n\nDisplay type is condensed and heavy. Labels are small and monospaced.\n\n- Display: Barlow Condensed\n- Body: Instrument Sans\n- Labels: DM Mono",
  },
  {
    id: "wp6",
    title: "Brand voice",
    icon: "megaphone",
    tone: "rose",
    parent: null,
    updated: "Last week",
    by: "tara",
    linkShare: true,
    sharedWith: ["tara"],
    body: '# Brand voice\n\nWrite like an operator talking to another operator.\n\n## Do\n\n- Lead with the outcome\n- Use plain words and real numbers\n\n## Don\'t\n\n- Say "revolutionary" or "seamless"\n- Promise what the product can\'t do',
  },
  {
    id: "wp7",
    title: "Onboarding guide",
    icon: "users",
    tone: "leaf",
    parent: null,
    updated: "2 weeks ago",
    by: "meera",
    linkShare: false,
    sharedWith: ["meera", "isha"],
    body: "# Onboarding guide\n\nYour first week at Rhinon.\n\n- [ ] Set your password and sign the letters\n- [ ] Join #engineering and #general\n- [ ] Book a 1:1 with your manager\n- [ ] Ship something small by Friday",
  },
];

/* ── Analytics (per brand) ───────────────────────────────────────────────── */

export type BrandStats = {
  visitors: number;
  views: number;
  avgTime: string;
  bounce: number;
  now: number;
  series7: number[];
  series30: number[];
  sources: { name: string; pct: number }[];
  pages: { path: string; views: number }[];
  places: { name: string; pct: number }[];
};
const wave = (base: number, n: number, seed: number) =>
  Array.from({ length: n }, (_, i) =>
    Math.round(base + Math.sin(i * 0.7 + seed) * base * 0.22 + (i / n) * base * 0.25),
  );
export const ANALYTICS: Record<BrandId, BrandStats> = {
  tech: {
    visitors: 12480,
    views: 31860,
    avgTime: "2m 14s",
    bounce: 41,
    now: 8,
    series7: wave(1700, 7, 0),
    series30: wave(1500, 30, 0),
    sources: [
      { name: "Organic search", pct: 46 },
      { name: "Direct", pct: 24 },
      { name: "Social", pct: 17 },
      { name: "Referral", pct: 13 },
    ],
    pages: [
      { path: "/pricing", views: 5120 },
      { path: "/", views: 4890 },
      { path: "/features/approvals", views: 2310 },
      { path: "/blog/close-faster", views: 1740 },
      { path: "/book-demo", views: 1220 },
    ],
    places: [
      { name: "India", pct: 58 },
      { name: "United States", pct: 14 },
      { name: "United Kingdom", pct: 9 },
      { name: "Germany", pct: 6 },
    ],
  },
  labs: {
    visitors: 6210,
    views: 14320,
    avgTime: "1m 52s",
    bounce: 47,
    now: 3,
    series7: wave(850, 7, 1),
    series30: wave(760, 30, 1),
    sources: [
      { name: "Social", pct: 38 },
      { name: "Organic search", pct: 34 },
      { name: "Direct", pct: 18 },
      { name: "Referral", pct: 10 },
    ],
    pages: [
      { path: "/", views: 3100 },
      { path: "/case-studies", views: 2040 },
      { path: "/blog", views: 1460 },
      { path: "/contact", views: 760 },
      { path: "/about", views: 520 },
    ],
    places: [
      { name: "India", pct: 49 },
      { name: "United States", pct: 21 },
      { name: "Canada", pct: 8 },
      { name: "Australia", pct: 6 },
    ],
  },
  uppercurve: {
    visitors: 4380,
    views: 9840,
    avgTime: "3m 05s",
    bounce: 36,
    now: 5,
    series7: wave(600, 7, 2),
    series30: wave(540, 30, 2),
    sources: [
      { name: "Direct", pct: 41 },
      { name: "Organic search", pct: 28 },
      { name: "Social", pct: 21 },
      { name: "Referral", pct: 10 },
    ],
    pages: [
      { path: "/build", views: 3300 },
      { path: "/", views: 2400 },
      { path: "/events", views: 1500 },
      { path: "/blog", views: 920 },
      { path: "/ideas", views: 610 },
    ],
    places: [
      { name: "India", pct: 77 },
      { name: "United States", pct: 8 },
      { name: "Singapore", pct: 5 },
      { name: "UAE", pct: 4 },
    ],
  },
};

/* ── Startup ideas ───────────────────────────────────────────────────────── */

export type IdeaStatus = "New" | "Reviewing" | "Interesting" | "Converted" | "Archived";
export const IDEA_STATUSES: IdeaStatus[] = [
  "New",
  "Reviewing",
  "Interesting",
  "Converted",
  "Archived",
];
export type Idea = {
  id: string;
  title: string;
  founder: string;
  email: string;
  oneLiner: string;
  problem: string;
  stage: "Idea" | "MVP" | "Revenue";
  at: string;
  status: IdeaStatus;
  unread: boolean;
};
export const IDEAS: Idea[] = [
  {
    id: "id1",
    title: "PetPass",
    founder: "Anjali Rao",
    email: "anjali@petpass.example",
    oneLiner: "A shared health record for pet owners and vets.",
    problem:
      "Vaccination and treatment history is scattered across clinics and paper cards. Owners lose it when they move.",
    stage: "MVP",
    at: "Tue 9:45 PM",
    status: "New",
    unread: true,
  },
  {
    id: "id2",
    title: "KisanLedger",
    founder: "Mohan Das",
    email: "mohan@kisan.example",
    oneLiner: "Bookkeeping in Hindi for small farms.",
    problem:
      "Small farms track income and credit in notebooks and miss subsidies they qualify for.",
    stage: "Idea",
    at: "Tue 4:10 PM",
    status: "New",
    unread: true,
  },
  {
    id: "id3",
    title: "ShiftSwap",
    founder: "Isabel Fonseca",
    email: "isabel@shiftswap.example",
    oneLiner: "Shift trading for hourly clinic staff.",
    problem: "Managers trade shifts over WhatsApp. Cover gaps cause overtime and burnout.",
    stage: "Revenue",
    at: "Mon",
    status: "Reviewing",
    unread: false,
  },
  {
    id: "id4",
    title: "Quillstack",
    founder: "Dev Kapoor",
    email: "dev@quill.example",
    oneLiner: "Release notes that write themselves.",
    problem: "Teams skip release notes. Customers never hear about fixes.",
    stage: "MVP",
    at: "Mon",
    status: "Interesting",
    unread: false,
  },
  {
    id: "id5",
    title: "GreenRoute",
    founder: "Pallavi Joshi",
    email: "pallavi@greenroute.example",
    oneLiner: "Lowest-emission routing for last-mile fleets.",
    problem: "Fleet managers optimise for time. Carbon reporting is a separate spreadsheet.",
    stage: "Idea",
    at: "Last week",
    status: "Converted",
    unread: false,
  },
];

/* ── Content: events and posts ───────────────────────────────────────────── */

export type Guest = {
  id: string;
  name: string;
  ticket: "General" | "VIP" | "Speaker";
  company: string;
  checkedIn: boolean;
};
export type EventItem = {
  id: string;
  title: string;
  when: string;
  where: string;
  capacity: number;
  brand: BrandId;
  tone: Tone;
  /** Live counts for the list card; set by sync so the index needn't load every guest. */
  approved?: number;
  checkedIn?: number;
};
export const EVENTS: EventItem[] = [
  {
    id: "ev1",
    title: "Rhinon Build Night",
    when: "Thu 19 Nov · 6:30 PM",
    where: "Pune · The Hive",
    capacity: 120,
    brand: "tech",
    tone: "coral",
  },
  {
    id: "ev2",
    title: "Uppercurve Demo Day",
    when: "Sat 5 Dec · 11:00 AM",
    where: "Bengaluru · Studio 9",
    capacity: 200,
    brand: "uppercurve",
    tone: "leaf",
  },
];
const g = (
  id: string,
  name: string,
  ticket: Guest["ticket"],
  company: string,
  checkedIn = false,
): Guest => ({ id, name, ticket, company, checkedIn });
export const GUESTS: Record<string, Guest[]> = {
  ev1: [
    g("g1", "Aditi Menon", "VIP", "Fieldnote", true),
    g("g2", "Rohit Bansal", "General", "Quill Labs", true),
    g("g3", "Nandini Rao", "Speaker", "Harbor & Co", true),
    g("g4", "Kunal Shah", "General", "Orbit Foods"),
    g("g5", "Zara Ahmed", "General", "Lumen Studios"),
    g("g6", "Vivek Pillai", "VIP", "Kestrel Health"),
    g("g7", "Tara Nanda", "General", "Bright Mart"),
    g("g8", "Imran Qureshi", "General", "Apex Freight"),
    g("g9", "Lakshmi Iyer", "Speaker", "Northwind"),
    g("g10", "Dhruv Sethi", "General", "Bluepine Retail"),
    g("g11", "Esha Gupta", "General", "Orchid Pharma"),
    g("g12", "Harsh Vora", "General", "Fieldnote"),
  ],
  ev2: [
    g("g13", "Pranav Rao", "General", "PetPass"),
    g("g14", "Sana Mirza", "VIP", "Quillstack"),
    g("g15", "Joel Dias", "General", "GreenRoute"),
  ],
};

export type Post = {
  id: string;
  title: string;
  brand: BrandId;
  author: string;
  kind: "Case study" | "Blog";
  words: number;
  excerpt: string;
  paragraphs: string[];
  status: "Review" | "Approved" | "Changes requested";
};
export const POSTS: Post[] = [
  {
    id: "po1",
    title: "How Harbor & Co cut invoicing time by 40%",
    brand: "labs",
    author: "tara",
    kind: "Case study",
    words: 1180,
    status: "Review",
    excerpt:
      "Before Rhinon, Harbor's finance team spent two days a week chasing approvals over email.",
    paragraphs: [
      "Before Rhinon, Harbor & Co's finance team spent two days a week chasing approvals over email and spreadsheets.",
      '"We closed the month in three days instead of six," says Manav Gill, CEO. "The approvals view alone paid for the licence."',
      "The rollout took nine working days and needed no new hardware.",
    ],
  },
  {
    id: "po2",
    title: "Seven things we learned shipping a mobile app",
    brand: "tech",
    author: "aanya",
    kind: "Blog",
    words: 1640,
    status: "Review",
    excerpt: "Clock-in has to work in one tap. Everything else is negotiable.",
    paragraphs: [
      "Clock-in has to work in one tap. Everything else is negotiable.",
      "We started with eleven tabs. We shipped with five, and moved the rest behind More.",
      "The surprise: people open the app for approvals more than anything else.",
    ],
  },
  {
    id: "po3",
    title: "Why your idea doesn't need a deck",
    brand: "uppercurve",
    author: "tara",
    kind: "Blog",
    words: 920,
    status: "Review",
    excerpt: "Show us the problem and ten customers who have it.",
    paragraphs: [
      "Show us the problem and ten customers who have it.",
      "A deck tells us how well you present. A conversation with a customer tells us whether you should build.",
    ],
  },
  {
    id: "po4",
    title: "A year of Rhinon Labs",
    brand: "labs",
    author: "tara",
    kind: "Blog",
    words: 760,
    status: "Approved",
    excerpt: "What we built, broke and learned.",
    paragraphs: ["What we built, broke and learned."],
  },
];

/* ── Audit log ───────────────────────────────────────────────────────────── */

export type AuditKind = "security" | "people" | "payroll" | "settings" | "content";
export type AuditEntry = {
  id: string;
  actor: string;
  action: string;
  target: string;
  kind: AuditKind;
  at: string;
  where: string;
};
export const AUDIT: AuditEntry[] = [
  {
    id: "au1",
    actor: "me",
    action: "Signed in with 2FA",
    target: "iPhone 16",
    kind: "security",
    at: "Today 9:12",
    where: "Pune · 49.36.x.x",
  },
  {
    id: "au2",
    actor: "vikram",
    action: "Changed role permissions",
    target: "Manager · approvals",
    kind: "settings",
    at: "Today 8:40",
    where: "Pune · web",
  },
  {
    id: "au3",
    actor: "meera",
    action: "Released payslips",
    target: "October 2026 · 38 people",
    kind: "payroll",
    at: "31 Oct 6:05 PM",
    where: "Mumbai · web",
  },
  {
    id: "au4",
    actor: "meera",
    action: "Created employee",
    target: "Farhan Ali",
    kind: "people",
    at: "30 Oct 11:20 AM",
    where: "Mumbai · web",
  },
  {
    id: "au5",
    actor: "tara",
    action: "Published case study",
    target: "Harbor & Co",
    kind: "content",
    at: "Tue 4:30 PM",
    where: "Kolkata · web",
  },
  {
    id: "au6",
    actor: "arjun",
    action: "Rotated API key",
    target: "Production · email",
    kind: "security",
    at: "Mon 10:02 AM",
    where: "Pune · web",
  },
  {
    id: "au7",
    actor: "me",
    action: "Approved leave",
    target: "Dev Malhotra · 1 day",
    kind: "people",
    at: "Mon 9:50 AM",
    where: "Pune · iPhone",
  },
  {
    id: "au8",
    actor: "vikram",
    action: "Connected Google Calendar",
    target: "Rhinon Tech",
    kind: "settings",
    at: "Last week",
    where: "Pune · web",
  },
  {
    id: "au9",
    actor: "isha",
    action: "Exported candidate list",
    target: "Backend Engineer",
    kind: "people",
    at: "Last week",
    where: "Hyderabad · web",
  },
  {
    id: "au10",
    actor: "arjun",
    action: "Failed sign-in (3 attempts)",
    target: "arjun@rhinontech.in",
    kind: "security",
    at: "Last week",
    where: "Unknown · 103.x.x.x",
  },
];

/* ── Roles and permissions ───────────────────────────────────────────────── */

export type RoleId = "admin" | "hr" | "manager" | "employee";
export type PermResource = {
  id: string;
  label: string;
  group: "Everyday" | "People" | "Sales and support" | "Platform";
};
export const PERM_RESOURCES: PermResource[] = [
  { id: "dashboard", label: "Dashboard", group: "Everyday" },
  { id: "inbox", label: "Inbox", group: "Everyday" },
  { id: "chat", label: "Team chat", group: "Everyday" },
  { id: "work", label: "Work", group: "Everyday" },
  { id: "pages", label: "Pages", group: "Everyday" },
  { id: "meetings", label: "Meetings", group: "Everyday" },
  { id: "attendance", label: "Attendance", group: "People" },
  { id: "leave", label: "Leave", group: "People" },
  { id: "approvals", label: "Approvals", group: "People" },
  { id: "payroll", label: "Payroll admin", group: "People" },
  { id: "performance", label: "Performance", group: "People" },
  { id: "documents", label: "Documents", group: "People" },
  { id: "hiring", label: "Hiring", group: "People" },
  { id: "crm", label: "CRM", group: "Sales and support" },
  { id: "outreach", label: "Outreach", group: "Sales and support" },
  { id: "chatbot", label: "Chatbot", group: "Sales and support" },
  { id: "analytics", label: "Analytics", group: "Platform" },
  { id: "ideas", label: "Startup ideas", group: "Platform" },
  { id: "content", label: "Content and events", group: "Platform" },
  { id: "audit", label: "Audit log", group: "Platform" },
  { id: "settings", label: "Settings", group: "Platform" },
];
export type Perm = { read: boolean; write: boolean };
export type Perms = Record<RoleId, Record<string, Perm>>;

const only = (ids: string[], write: string[] = ids): Record<string, Perm> =>
  Object.fromEntries(
    PERM_RESOURCES.map((r) => [r.id, { read: ids.includes(r.id), write: write.includes(r.id) }]),
  );
const EVERYDAY = [
  "dashboard",
  "inbox",
  "chat",
  "work",
  "pages",
  "meetings",
  "attendance",
  "leave",
  "performance",
  "documents",
];

export function defaultPerms(): Perms {
  return {
    admin: only(PERM_RESOURCES.map((r) => r.id)),
    hr: only([...EVERYDAY, "approvals", "payroll", "hiring"]),
    manager: only([...EVERYDAY, "approvals", "hiring"], [...EVERYDAY, "approvals", "hiring"]),
    employee: only(EVERYDAY, [
      "attendance",
      "leave",
      "work",
      "inbox",
      "chat",
      "performance",
      "documents",
      "pages",
    ]),
  };
}

export const ROLE_META: {
  id: RoleId;
  name: string;
  users: number;
  locked: boolean;
  blurb: string;
}[] = [
  {
    id: "admin",
    name: "Super Admin",
    users: 2,
    locked: true,
    blurb: "Everything, always. Cannot be edited.",
  },
  {
    id: "hr",
    name: "HR",
    users: 3,
    locked: false,
    blurb: "People, payroll, leave, documents and hiring.",
  },
  {
    id: "manager",
    name: "Manager",
    users: 9,
    locked: false,
    blurb: "Approvals, team reviews and hiring for their team.",
  },
  {
    id: "employee",
    name: "Employee",
    users: 41,
    locked: false,
    blurb: "Own work, time, pay and documents.",
  },
];

/** Traffic numbers for a brand; zeros while they load (or when nothing is tracked yet), never undefined. */
export const statsOf = (id: string): BrandStats =>
  ANALYTICS[id] ?? { visitors: 0, views: 0, avgTime: "—", bounce: 0, now: 0, series7: [], series30: [], sources: [], pages: [], places: [] };
