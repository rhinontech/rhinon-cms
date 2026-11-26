/**
 * Comparison pages: /compare/<slug>.
 *
 * Rules (docs/RHINONTECH_WEBSITE_REVAMP.md §5.4, §2.6):
 * - Every competitor value comes from that company's own pages, read on `lastChecked`, and the
 *   pages are listed in `sources`. If their page didn't show something, it is "unlisted", never "no".
 * - Rhinon values must match the live product (claims register, §2.6).
 * - Each page says honestly when the competitor is the better choice.
 * - No competitor logos. Re-check the facts at least every quarter and bump `lastChecked`.
 */

export type Mark = "yes" | "partial" | "no" | "unlisted";
export type Cell = { mark: Mark; note?: string };

/** The rows every comparison can draw on. Keys stay stable; labels are what visitors read. */
export const ROWS = {
  agent: "AI chatbot / live chat on your website",
  outreach: "Cold email sequences",
  inbox: "Team email inbox",
  crm: "CRM: leads, deals and pipeline",
  projects: "Projects and tasks",
  portal: "Client portal",
  handoff: "Won deal becomes a project in the same app",
  chat: "Team chat and video calls",
  docs: "Docs and internal wiki",
  hr: "HR records, onboarding, offer letters",
  attendance: "Attendance and leave",
  performance: "Performance reviews",
  payroll: "Payroll",
  billing: "Proposals, invoices and payments",
  free: "Free plan",
} as const;
export type RowKey = keyof typeof ROWS;

/** Rhinon Tech, as it is today. Keep in step with the product and the claims register. */
export const RHINON: Record<RowKey, Cell> = {
  agent: { mark: "yes", note: "AI Agent trained on your site and docs, with live hand-off, tickets and a help center (paid add-on)" },
  outreach: { mark: "yes", note: "AI drafts you approve; sequences with waits, branches and A/B splits" },
  inbox: { mark: "partial", note: "Team email and shared addresses; no single-thread assignment yet" },
  crm: { mark: "yes" },
  projects: { mark: "yes", note: "List, board, calendar and Gantt" },
  portal: { mark: "yes", note: "Clients see their project's tasks and send requests" },
  handoff: { mark: "yes", note: "Convert a won deal into a project in one click" },
  chat: { mark: "yes", note: "Channels and group calls of up to 8 people" },
  docs: { mark: "yes" },
  hr: { mark: "yes", note: "Offer letters and NDAs with e-signing" },
  attendance: { mark: "yes" },
  performance: { mark: "yes" },
  payroll: { mark: "partial", note: "Salary runs and payslips; no ESI or statutory filings" },
  billing: { mark: "no" },
  free: { mark: "yes", note: "Up to 5 people, no time limit" },
};

export type Comparison = {
  slug: string;
  competitor: string;
  /** The search this page targets (keyword map, §3.2). */
  keyword: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  /** Two honest sentences: who should pick which. */
  verdict: string;
  chooseThem: string[];
  chooseRhinon: string[];
  rows: RowKey[];
  them: Partial<Record<RowKey, Cell>>;
  pricing: string;
  moving: string;
  faq: { q: string; a: string }[];
  sources: { label: string; url: string }[];
  lastChecked: string;
};

const ALL_ROWS: RowKey[] = ["agent", "outreach", "inbox", "crm", "projects", "portal", "handoff", "chat", "docs", "hr", "attendance", "performance", "payroll", "billing", "free"];
const MOVING_CSV = "Export your contacts and leads as a spreadsheet and import them into the Rhinon CRM. Direct importers for other tools are not built yet, so book a demo and we will help you move projects and history.";

export const COMPARISONS: Comparison[] = [
  {
    slug: "zoho-alternative",
    competitor: "Zoho One",
    keyword: "zoho alternative",
    metaTitle: "Zoho One Alternative for Service Businesses",
    metaDescription: "Comparing Rhinon Tech and Zoho One: one app from website chat to client project, free for up to 5 people, versus 45+ separate Zoho apps licensed per employee.",
    h1: "A Zoho One alternative built for service businesses",
    verdict: "Zoho One covers more of a business, including finance and statutory Indian payroll, as a suite of 45+ separate apps. Rhinon Tech does the client side of a service business in one app, from website chat to delivered project, and is free for up to 5 people.",
    chooseThem: ["You need accounting, inventory or statutory Indian payroll (PF, ESI, TDS filings) in the same suite", "You want dozens of specialised apps and are happy to license every employee", "Your team is already trained on Zoho"],
    chooseRhinon: ["You sell services and want a won deal to become a project without re-entering it", "You want one app instead of stitching CRM, Projects, Desk and Cliq together", "You are a team of up to 5 and want to start free, with no trial clock"],
    rows: ALL_ROWS,
    them: {
      agent: { mark: "yes", note: "SalesIQ and Desk" },
      outreach: { mark: "partial", note: "Campaigns and Marketing Automation; sales sequences not named" },
      inbox: { mark: "yes", note: "TeamInbox" },
      crm: { mark: "yes", note: "Zoho CRM" },
      projects: { mark: "yes", note: "Zoho Projects and Sprints" },
      portal: { mark: "unlisted" },
      handoff: { mark: "partial", note: "CRM and Projects are separate apps" },
      chat: { mark: "yes", note: "Cliq and Zoho Meeting" },
      docs: { mark: "yes", note: "Writer, WorkDrive, Notebook" },
      hr: { mark: "yes", note: "Zoho People, including offer letters with e-sign" },
      attendance: { mark: "yes", note: "Zoho People" },
      performance: { mark: "yes", note: "Zoho People appraisals" },
      payroll: { mark: "yes", note: "Zoho Payroll India: PF, ESI, PT, TDS" },
      billing: { mark: "unlisted", note: "Finance apps are part of Zoho One; not checked in detail" },
      free: { mark: "no", note: "Zoho One has a 30-day free trial" },
    },
    pricing: "Zoho One is priced per employee per month, billed annually, and its page says a licence is required for every employee. Rhinon Tech is free for up to 5 people; Starter is priced with you.",
    moving: MOVING_CSV,
    faq: [
      { q: "Is Rhinon Tech cheaper than Zoho One?", a: "For a team of up to 5, Rhinon Tech is free with no time limit. Zoho One is licensed per employee for every employee. Larger Rhinon teams move to Starter, which we price with you." },
      { q: "Does Rhinon Tech do Indian payroll like Zoho Payroll?", a: "Not to the same depth. Rhinon runs salary, payslips and reimbursements with PF, professional tax and a TDS amount you set, but it does not calculate ESI or file returns. If statutory payroll is essential, Zoho Payroll is the stronger choice today." },
      { q: "Can I use Rhinon Tech for the client side and keep Zoho for finance?", a: "Yes. Many service businesses only need the lead-to-project side in one place. Rhinon does not connect to Zoho Books directly yet, so finance stays a separate step." },
    ],
    sources: [
      { label: "Zoho One", url: "https://www.zoho.com/one/" },
      { label: "Zoho: all products", url: "https://www.zoho.com/all-products.html" },
      { label: "Zoho Payroll India", url: "https://www.zoho.com/in/payroll/" },
      { label: "Zoho People", url: "https://www.zoho.com/people/" },
    ],
    lastChecked: "2026-11-25",
  },
  {
    slug: "hubspot-alternative",
    competitor: "HubSpot",
    keyword: "hubspot alternative",
    metaTitle: "HubSpot Alternative with Projects and a Client Portal",
    metaDescription: "Comparing Rhinon Tech and HubSpot: both have a free CRM, AI chat and sequences. Rhinon adds projects, a client portal, team chat and HR in the same app.",
    h1: "A HubSpot alternative that keeps going after the deal is won",
    verdict: "HubSpot is the deeper sales, marketing and service platform, with a free CRM and a huge ecosystem. Rhinon Tech covers the same winning-clients basics and then keeps going: the won deal becomes a project, the client gets a portal, and your team chats and plans in the same app.",
    chooseThem: ["You run large marketing programmes and need advanced automation, a CMS and attribution", "You need hundreds of ready-made integrations", "You are a sales-only team that never delivers projects"],
    chooseRhinon: ["You deliver projects for clients after you win them", "You want team chat, docs and HR in the same workspace as the CRM", "You want an AI chatbot, sequences and projects without buying several hubs"],
    rows: ALL_ROWS,
    them: {
      agent: { mark: "yes", note: "Live chat, chatbot builder and help desk" },
      outreach: { mark: "yes", note: "Sequences in Sales Hub" },
      inbox: { mark: "yes", note: "Shared inbox in Service Hub" },
      crm: { mark: "yes", note: "Free CRM" },
      projects: { mark: "partial", note: "Tasks; project management not named" },
      portal: { mark: "partial", note: "Customer portal for support tickets" },
      handoff: { mark: "unlisted" },
      chat: { mark: "no", note: "Meeting scheduler only" },
      docs: { mark: "no", note: "Knowledge base is customer-facing" },
      hr: { mark: "no" },
      attendance: { mark: "no" },
      performance: { mark: "no", note: "Sales performance reports only" },
      payroll: { mark: "no" },
      billing: { mark: "partial", note: "Quotes with e-signature" },
      free: { mark: "yes", note: "Free CRM and free tools" },
    },
    pricing: "HubSpot offers free tools and paid hubs. Rhinon Tech is free for up to 5 people, with the AI Agent on the Starter plan, priced with you.",
    moving: MOVING_CSV,
    faq: [
      { q: "Is Rhinon Tech's CRM as good as HubSpot's?", a: "HubSpot's CRM is more mature, with far more integrations and marketing features. Rhinon's CRM covers leads, deals, pipelines, reports and every email on one timeline, and connects straight to projects and a client portal." },
      { q: "Does Rhinon Tech have an AI chatbot like HubSpot?", a: "Yes. The AI Agent answers from your own site and documents, saves visitors to the CRM and hands over to your team live. It is part of the Starter plan." },
      { q: "Can I import my HubSpot contacts?", a: "Yes, by exporting them to a spreadsheet and importing it. A direct HubSpot importer is not built yet." },
    ],
    sources: [{ label: "HubSpot products", url: "https://www.hubspot.com/products" }, { label: "HubSpot home page", url: "https://www.hubspot.com/" }],
    lastChecked: "2026-11-25",
  },
  {
    slug: "odoo-alternative",
    competitor: "Odoo",
    keyword: "odoo alternative",
    metaTitle: "Odoo Alternative for Agencies and Service Teams",
    metaDescription: "Comparing Rhinon Tech and Odoo: Odoo is a broad open-source ERP; Rhinon Tech is one AI CRM workspace for service businesses, free for up to 5 people.",
    h1: "An Odoo alternative for service businesses that don't need an ERP",
    verdict: "Odoo is a broad, open-source ERP with an app for almost everything, including accounting and inventory. Rhinon Tech is narrower on purpose: the client side of a service business, from website chat to delivered project, ready to use without setting up an ERP.",
    chooseThem: ["You need accounting, inventory, manufacturing or e-commerce", "You want open source you can host and customise yourself", "You have a partner or team to configure it"],
    chooseRhinon: ["You sell services, not stock, and want to start in minutes", "You want an AI agent, AI-written outreach and projects in one workspace", "You are a team of up to 5 and want it free"],
    rows: ALL_ROWS,
    them: {
      agent: { mark: "partial", note: "Live Chat and Helpdesk; chatbot not named" },
      outreach: { mark: "partial", note: "Email Marketing and Marketing Automation; sequences not named" },
      inbox: { mark: "partial", note: "Mail gateway in Discuss, Helpdesk tickets" },
      crm: { mark: "yes", note: "Odoo CRM" },
      projects: { mark: "yes", note: "Odoo Project" },
      portal: { mark: "unlisted" },
      handoff: { mark: "unlisted" },
      chat: { mark: "partial", note: "Discuss; video not named" },
      docs: { mark: "yes", note: "Knowledge and Documents" },
      hr: { mark: "partial", note: "Employees and Sign; onboarding and offer letters not named" },
      attendance: { mark: "partial", note: "Time Off and Timesheets" },
      performance: { mark: "partial", note: "Appraisals" },
      payroll: { mark: "yes", note: "Odoo Payroll" },
      billing: { mark: "unlisted", note: "Accounting apps exist; not checked in detail" },
      free: { mark: "partial", note: "Free trial and an open-source edition" },
    },
    pricing: "Odoo offers a free trial and an open-source edition. Rhinon Tech is free for up to 5 people; Starter is priced with you.",
    moving: MOVING_CSV,
    faq: [
      { q: "Is Rhinon Tech open source like Odoo?", a: "No. Rhinon Tech is a hosted product. If you need to self-host and modify the code, Odoo is the better fit." },
      { q: "Does Rhinon Tech replace an ERP?", a: "No. It has no accounting or inventory. It covers winning clients, delivering their projects and running a small team." },
    ],
    sources: [{ label: "Odoo: all apps", url: "https://www.odoo.com/page/all-apps" }],
    lastChecked: "2026-11-25",
  },
  {
    slug: "clickup-alternative",
    competitor: "ClickUp",
    keyword: "clickup alternative",
    metaTitle: "ClickUp Alternative with a Built-in CRM",
    metaDescription: "Comparing Rhinon Tech and ClickUp: both do projects, docs and chat. Rhinon adds a CRM, AI cold email, an AI website agent and a client portal for service businesses.",
    h1: "A ClickUp alternative with the CRM built in",
    verdict: "ClickUp is a deep, flexible work-management tool with docs, chat and goals. Rhinon Tech does projects, docs and chat too, and adds the client side ClickUp leaves to other tools: a CRM, AI-written outreach, an AI agent on your website and a client portal.",
    chooseThem: ["You manage complex internal work with custom fields, automations and many views", "You don't sell to clients, or your CRM already lives elsewhere", "You need ClickUp's integrations"],
    chooseRhinon: ["You want leads, deals and projects in one record instead of linking two tools", "You want clients to follow their project in a portal", "You want AI to answer website visitors and draft follow-ups"],
    rows: ["agent", "outreach", "crm", "projects", "portal", "handoff", "chat", "docs", "hr", "attendance", "performance", "free"],
    them: {
      agent: { mark: "no", note: "Forms and integrations only" },
      outreach: { mark: "no" },
      crm: { mark: "no", note: "No native CRM on the features page; HubSpot integration" },
      projects: { mark: "yes" },
      portal: { mark: "partial", note: "Invite clients as guests" },
      handoff: { mark: "no" },
      chat: { mark: "yes", note: "Chat and SyncUps" },
      docs: { mark: "yes", note: "Docs, including wikis" },
      hr: { mark: "no" },
      attendance: { mark: "partial", note: "Time tracking" },
      performance: { mark: "partial", note: "Goals" },
      free: { mark: "yes", note: "Free forever plan" },
    },
    pricing: "ClickUp has a free-forever plan and paid tiers. Rhinon Tech is free for up to 5 people; Starter is priced with you.",
    moving: "Export your tasks and leads as spreadsheets and import the leads into the Rhinon CRM. A direct ClickUp importer is not built yet, so book a demo and we will help you move projects.",
    faq: [
      { q: "Is Rhinon Tech's project management as deep as ClickUp's?", a: "ClickUp has more views, custom fields and automations. Rhinon covers tasks, boards, calendars, Gantt and sprints, and links every project back to the deal and client it came from." },
      { q: "Does Rhinon Tech have docs and chat like ClickUp?", a: "Yes. Docs nest in a tree next to your projects, and team chat includes channels, threads and group calls of up to 8 people." },
    ],
    sources: [{ label: "ClickUp features", url: "https://clickup.com/features" }],
    lastChecked: "2026-11-25",
  },
  {
    slug: "monday-alternative",
    competitor: "monday.com",
    keyword: "monday alternative",
    metaTitle: "monday.com Alternative for Service Businesses",
    metaDescription: "Comparing Rhinon Tech and monday.com: both pair a CRM with work management. Rhinon adds an AI website agent, AI cold email, team chat, a client portal and HR.",
    h1: "A monday.com alternative for agencies and service teams",
    verdict: "monday.com is a polished work platform with separate CRM, service and dev products, aimed increasingly at larger companies. Rhinon Tech puts the CRM, projects, an AI agent for your website, outreach, team chat and HR in one app for 5–50 person service businesses.",
    chooseThem: ["You want a highly customisable board-based work OS for many departments", "You need monday's marketplace and enterprise controls", "You don't need team chat or HR in the same tool"],
    chooseRhinon: ["You want the CRM and projects to be one record, not two products", "You want an AI agent on your website and AI-drafted cold email", "You want chat, docs and HR included"],
    rows: ALL_ROWS,
    them: {
      agent: { mark: "partial", note: "monday service tickets; chatbot not named" },
      outreach: { mark: "partial", note: "monday campaigns (email marketing)" },
      inbox: { mark: "no" },
      crm: { mark: "yes", note: "monday CRM" },
      projects: { mark: "yes", note: "monday work management" },
      portal: { mark: "unlisted" },
      handoff: { mark: "unlisted" },
      chat: { mark: "no", note: "Meeting assistants only" },
      docs: { mark: "yes", note: "monday Docs" },
      hr: { mark: "partial", note: "Hiring and onboarding use case" },
      attendance: { mark: "no" },
      performance: { mark: "partial", note: "Goal tracking" },
      payroll: { mark: "no" },
      billing: { mark: "unlisted" },
      free: { mark: "yes", note: "Free plan with unlimited time" },
    },
    pricing: "monday.com has a free plan and paid tiers. Rhinon Tech is free for up to 5 people; Starter is priced with you.",
    moving: MOVING_CSV,
    faq: [
      { q: "Can Rhinon Tech replace monday CRM and monday work management?", a: "For a service business, yes: leads, deals, pipelines, projects, boards and calendars live in one app, and a won deal converts into a project in one click." },
      { q: "Does Rhinon Tech have boards like monday.com?", a: "Yes. Projects have list, board, calendar and Gantt views. monday.com offers more customisation." },
    ],
    sources: [{ label: "monday.com home page", url: "https://monday.com/" }],
    lastChecked: "2026-11-25",
  },
  {
    slug: "honeybook-alternative",
    competitor: "HoneyBook",
    keyword: "honeybook alternative",
    metaTitle: "HoneyBook Alternative Available in India",
    metaDescription: "Comparing Rhinon Tech and HoneyBook: HoneyBook handles proposals, invoices and payments for small US businesses; Rhinon Tech adds an AI agent, outreach and team tools.",
    h1: "A HoneyBook alternative for teams outside the US, and teams that are growing",
    verdict: "HoneyBook is strong at proposals, contracts, invoices and payments for small creative and service businesses, but sign-up is limited to the US, Canada, the UK and Australia. Rhinon Tech works anywhere, adds an AI agent for your website, AI-drafted outreach and team tools, but does not do invoicing or payments yet.",
    chooseThem: ["You need proposals, contracts, invoices and online payments in one place", "You are a solo or very small business in the US, Canada, the UK or Australia", "You don't need team chat or HR"],
    chooseRhinon: ["You are based outside HoneyBook's sign-up countries, including India", "You want an AI agent to answer website visitors and capture leads", "You have a team that needs chat, docs, leave and reviews alongside clients"],
    rows: ["agent", "outreach", "crm", "projects", "portal", "chat", "docs", "hr", "billing", "free"],
    them: {
      agent: { mark: "unlisted" },
      outreach: { mark: "unlisted" },
      crm: { mark: "yes", note: "\"The leading CRM platform for small businesses\"" },
      projects: { mark: "yes", note: "\"Manage every client, project, and payment\"" },
      portal: { mark: "unlisted" },
      chat: { mark: "unlisted" },
      docs: { mark: "unlisted" },
      hr: { mark: "unlisted" },
      billing: { mark: "yes", note: "Proposals, contracts, invoices and payments" },
      free: { mark: "no", note: "Paid plans, no free plan shown" },
    },
    pricing: "HoneyBook's home page listed Starter at $18, Essentials at $29.50 and Premium at $64.50 a month, billed yearly, when we checked. Sign-up was limited to the US, Canada, the UK and Australia. Rhinon Tech is free for up to 5 people.",
    moving: MOVING_CSV,
    faq: [
      { q: "Can I use Rhinon Tech in India?", a: "Yes. Rhinon Tech is built in India and works anywhere. HoneyBook's sign-up was limited to the US, Canada, the UK and Australia when we checked." },
      { q: "Does Rhinon Tech send invoices like HoneyBook?", a: "Not yet. Rhinon has no proposals, invoices or payments today, so keep your billing tool for now." },
    ],
    sources: [{ label: "HoneyBook home page", url: "https://www.honeybook.com/" }],
    lastChecked: "2026-11-25",
  },
  {
    slug: "chatbase-alternative",
    competitor: "Chatbase",
    keyword: "chatbase alternative",
    metaTitle: "Chatbase Alternative with a CRM Built In",
    metaDescription: "Comparing Rhinon Tech's AI Agent and Chatbase: both answer website visitors from your content. Rhinon saves every lead straight into its own CRM and projects.",
    h1: "A Chatbase alternative that puts every lead straight into your CRM",
    verdict: "Chatbase is a dedicated AI agent platform across chat, email and voice, with a long list of integrations. Rhinon Tech's AI Agent is one part of a CRM: it answers visitors from your content, then the lead, the follow-up and the project all live in the same workspace.",
    chooseThem: ["You only want an AI support agent and already have a CRM", "You need an AI agent on voice and email channels", "You want a specialist tool with many integrations"],
    chooseRhinon: ["You want website leads to land in a CRM with no integration to maintain", "You want live hand-off, tickets and a help center next to your sales pipeline", "You also want outreach, projects and a client portal"],
    rows: ["agent", "crm", "outreach", "projects", "portal", "free"],
    them: {
      agent: { mark: "yes", note: "Conversational agents across chat, email and voice" },
      crm: { mark: "unlisted" },
      outreach: { mark: "unlisted" },
      projects: { mark: "unlisted" },
      portal: { mark: "unlisted" },
      free: { mark: "partial", note: "Free trial" },
    },
    pricing: "Chatbase offers a free trial; pricing is on its pricing page. Rhinon's AI Agent is part of the Starter plan, priced with you; everything else is free for up to 5 people.",
    moving: "Point the AI Agent at your website and upload the documents your current bot uses. It is ready to answer once it has read them.",
    faq: [
      { q: "What does Rhinon's AI Agent answer from?", a: "Your website pages, files you upload and help-center articles. It says so when it does not know, and your team can take over the chat." },
      { q: "Can the AI Agent talk on voice like Chatbase?", a: "No. Visitors chat with the AI Agent; your team can call a visitor from the dashboard. There is no AI voice agent." },
    ],
    sources: [{ label: "Chatbase home page", url: "https://www.chatbase.co/" }],
    lastChecked: "2026-11-25",
  },
];

export const comparisonBySlug = (slug: string): Comparison | undefined => COMPARISONS.find((c) => c.slug === slug);
