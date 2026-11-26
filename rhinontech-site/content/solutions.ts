/**
 * Solution pages: /solutions/<slug>. One per kind of service business we sell to
 * (docs/RHINONTECH_WEBSITE_REVAMP.md §1.2, §5.3). Every workflow step must name a product
 * that really does that job today; nothing here may promise invoicing, proposals, time
 * tracking UI or WhatsApp (not built; claims register §2.6).
 */

export type Solution = {
  slug: string;
  name: string;
  /** The search this page targets (keyword map, §3.2). */
  keyword: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  sub: string;
  /** Short line for menus and hub cards. */
  short: string;
  pains: { title: string; body: string }[];
  workflow: { stage: string; product: string; line: string }[];
  setup: string[];
  compare: string[];
  faq: { q: string; a: string }[];
};

export const SOLUTIONS: Solution[] = [
  {
    slug: "agencies",
    name: "Agencies",
    keyword: "crm for agencies",
    metaTitle: "CRM for Agencies: Leads to Client Projects",
    metaDescription: "An AI CRM for agencies: capture enquiries with an AI agent, follow up with AI-drafted email, and turn won deals into projects clients follow in a portal. Free for up to 5 people.",
    h1: "The AI CRM for agencies",
    sub: "From the first enquiry on your website to the last file you hand over: pitches, follow-ups, projects and client updates in one workspace, with your team's chat, docs and leave alongside.",
    short: "Enquiry to retainer, in one workspace",
    pains: [
      { title: "Enquiries slip through", body: "Website forms land in someone's inbox and the follow-up depends on who remembers. The AI Agent answers visitors at once and every lead lands in the pipeline." },
      { title: "Won work gets retyped", body: "The brief lives in the CRM, the tasks in a project tool, the files in a drive. Convert a won deal and the project starts with the client already attached." },
      { title: "Clients chase for updates", body: "Status calls eat the week. Clients follow their project's tasks in a portal and send requests there instead of to your WhatsApp." },
    ],
    workflow: [
      { stage: "Enquiry", product: "ai-agent", line: "The AI Agent answers questions about your services and saves the visitor as a lead." },
      { stage: "Follow-up", product: "outreach", line: "Outreach drafts a personal follow-up; you approve it before it sends." },
      { stage: "Pitch", product: "crm", line: "Move the deal through your stages, with every email on its timeline." },
      { stage: "Kick-off", product: "projects", line: "Convert the won deal into a project in one click." },
      { stage: "Delivery", product: "projects", line: "Tasks, boards and a client portal keep the client informed." },
      { stage: "Brief and notes", product: "docs", line: "Briefs, processes and meeting notes sit next to the project." },
    ],
    setup: ["Pipeline stages: Enquiry → Discovery call → Pitch sent → Negotiation → Won", "A standard set of kick-off tasks per service, written once in Docs and added to each new project", "A client portal for each active project, shared with the client's contacts"],
    compare: ["honeybook-alternative", "hubspot-alternative", "clickup-alternative"],
    faq: [
      { q: "Is Rhinon Tech a good CRM for a small agency?", a: "It is built for teams of 5 to 50 that win clients and then deliver projects for them. It is free for up to 5 people, so a small agency can start without a contract." },
      { q: "Can clients see their project?", a: "Yes. Each project can have a portal where the client sees its tasks and sends requests. Clients don't need an account." },
      { q: "Does it handle proposals and invoices?", a: "Not yet. Track the proposal as a pipeline stage and keep your billing tool for invoices for now." },
    ],
  },
  {
    slug: "consultancies",
    name: "Consultancies",
    keyword: "consulting crm",
    metaTitle: "Consulting CRM for Small Consultancies",
    metaDescription: "A consulting CRM that follows each engagement from first conversation to delivered work: leads, deals, projects, documents and client updates in one place.",
    h1: "A consulting CRM that follows the whole engagement",
    sub: "Keep every relationship, proposal stage, engagement plan and document together, so the next conversation with a client starts where the last one ended.",
    short: "Relationships and engagements together",
    pains: [
      { title: "Relationships live in inboxes", body: "Each partner keeps their own threads. In Rhinon every email with a lead sits on one shared timeline." },
      { title: "Engagements start from scratch", body: "Converting a won deal creates the engagement project with the client attached, so nothing is re-entered." },
      { title: "Know-how is scattered", body: "Method notes, templates and engagement documents live in Docs, next to the work they describe." },
    ],
    workflow: [
      { stage: "First conversation", product: "crm", line: "Capture the contact and the opportunity in one place." },
      { stage: "Nurture", product: "outreach", line: "AI-drafted, approved follow-ups keep warm leads warm." },
      { stage: "Engagement", product: "projects", line: "The won deal becomes an engagement project with its tasks." },
      { stage: "Knowledge", product: "docs", line: "Method notes and deliverables stay in the workspace." },
      { stage: "Client updates", product: "projects", line: "Clients follow progress in their portal." },
    ],
    setup: ["Stages: Introduction → Scoping → Proposal → Agreed → Won", "Your standard engagement phases, added as tasks on each new project", "A Docs tree for methods, templates and past deliverables"],
    compare: ["hubspot-alternative", "zoho-alternative", "monday-alternative"],
    faq: [
      { q: "Can several consultants share the same client history?", a: "Yes. Emails and activity sit on the lead's timeline, and roles decide who can see what." },
      { q: "Does Rhinon Tech track billable hours?", a: "Not in the product yet. Use your current time tracker alongside it for now." },
    ],
  },
  {
    slug: "it-services",
    name: "IT & software services",
    keyword: "crm for software companies",
    metaTitle: "CRM for Software & IT Services Companies",
    metaDescription: "A CRM for software and IT services companies: turn won deals into projects with sprints and boards, keep clients updated in a portal, and run the team in the same app.",
    h1: "The CRM for software and IT services companies",
    sub: "Go from scoping call to sprint board without retyping the brief, and give clients a portal instead of a weekly status email.",
    short: "Scoping call to sprint board",
    pains: [
      { title: "Scope gets lost in hand-off", body: "Sales notes rarely reach the delivery team intact. The project keeps the link to the deal it came from." },
      { title: "Clients want visibility", body: "A read-only client portal shows the project's tasks across list, board, Gantt and calendar views." },
      { title: "Too many tools for a small team", body: "Chat, docs, leave and reviews sit in the same workspace as clients and code delivery." },
    ],
    workflow: [
      { stage: "Lead", product: "ai-agent", line: "The AI Agent qualifies visitors from your own documentation." },
      { stage: "Scoping", product: "crm", line: "Deals move through your stages with notes and emails attached." },
      { stage: "Delivery", product: "projects", line: "Convert to a project with sprints, boards and a Gantt view." },
      { stage: "Team", product: "chat", line: "Channels, threads and calls of up to 8 people." },
      { stage: "Specs", product: "docs", line: "Specs and runbooks live next to the project." },
    ],
    setup: ["Stages: Lead → Scoping → Estimate → Signed", "Sprints on each client project, with board, list and Gantt views", "A portal per client project for read-only progress"],
    compare: ["clickup-alternative", "monday-alternative", "odoo-alternative"],
    faq: [
      { q: "Does Rhinon Tech support sprints?", a: "Yes. Projects include sprints alongside list, board, calendar and Gantt views." },
      { q: "Can clients see internal comments or files?", a: "No. The client portal shows tasks and requests only; files, comments and team details stay internal." },
    ],
  },
  {
    slug: "professional-services",
    name: "Professional services",
    keyword: "service business software",
    metaTitle: "Software for Service Businesses",
    metaDescription: "Service business software that keeps each client's leads, work and conversations on one timeline, with an AI agent, outreach, projects and team tools in one app.",
    h1: "Software for service businesses, in one workspace",
    sub: "Win the client, do the work, keep them informed, and run the team behind it, without five separate tools.",
    short: "One timeline for every client",
    pains: [
      { title: "Every client lives in five tools", body: "CRM, email, project app, chat and spreadsheets each hold a piece. Rhinon keeps them on one record." },
      { title: "Follow-up depends on memory", body: "The AI Agent and approved outreach drafts make sure no enquiry waits." },
      { title: "The team runs on spreadsheets", body: "Onboarding, leave, attendance and reviews are included for teams of up to 5 free." },
    ],
    workflow: [
      { stage: "Win", product: "crm", line: "Leads and deals with every conversation attached." },
      { stage: "Answer", product: "ai-agent", line: "Website visitors get answers from your own content." },
      { stage: "Deliver", product: "projects", line: "Won deals become projects with a client portal." },
      { stage: "Run the team", product: "hr", line: "Hiring, records and e-signed offer letters." },
      { stage: "Time off", product: "attendance", line: "Clock-in, leave requests and approvals." },
    ],
    setup: ["One pipeline per service line", "A Docs checklist for each repeat service, so every project starts the same way", "Roles so each person sees only what they need"],
    compare: ["zoho-alternative", "hubspot-alternative", "honeybook-alternative"],
    faq: [
      { q: "Is Rhinon Tech a PSA tool?", a: "It covers the client side of professional services: leads, deals, projects and client updates. Time-tracking and billing screens are not built yet." },
      { q: "Can we start with just the CRM?", a: "Yes. Use one product or all of them; they share one login." },
    ],
  },
  {
    slug: "startups",
    name: "Startups",
    keyword: "crm for startups",
    metaTitle: "Free CRM for Startups with AI Outreach",
    metaDescription: "A free CRM for startups selling services or B2B: AI-drafted cold email you approve, an AI agent on your site, and projects for the clients you win. Free for up to 5 people.",
    h1: "The CRM for startups whose founders still sell",
    sub: "Find prospects, write the first email with AI, track every deal and deliver for the first clients, free for a team of up to 5.",
    short: "Founder-led sales, free to start",
    pains: [
      { title: "No time to write every email", body: "Outreach researches each lead and drafts a tailored email; you approve or edit before it sends." },
      { title: "Leads in a spreadsheet", body: "Import the sheet once and every lead and deal moves through a real pipeline." },
      { title: "Budget for five tools", body: "CRM, outreach, projects, chat and HR are free for up to 5 people." },
    ],
    workflow: [
      { stage: "Prospect", product: "outreach", line: "AI drafts personal cold emails and sequences follow up." },
      { stage: "Capture", product: "ai-agent", line: "Your website answers visitors and saves leads." },
      { stage: "Close", product: "crm", line: "Track every deal and conversation." },
      { stage: "Deliver", product: "projects", line: "Turn the first wins into projects." },
    ],
    setup: ["Import your lead spreadsheet", "A three-step outreach sequence with an approval step", "One pipeline for founder-led deals"],
    compare: ["hubspot-alternative", "zoho-alternative", "clickup-alternative"],
    faq: [
      { q: "Is it really free for a startup?", a: "Yes, for up to 5 people, with 50 emails and 20 AI drafts a day and no time limit." },
      { q: "Will AI send emails without me?", a: "No. Drafts wait for your approval before anything is sent." },
    ],
  },
];

export const solutionBySlug = (slug: string): Solution | undefined => SOLUTIONS.find((s) => s.slug === slug);
