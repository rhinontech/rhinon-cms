import {
  Bot, CalendarCheck, FileText, FolderKanban, Gauge, Inbox, MessagesSquare, Send, Target, UsersRound, Wallet,
  type LucideIcon,
} from "lucide-react";

export type MockKey =
  | "crm" | "outreach" | "inbox" | "chatbot" | "work" | "chat"
  | "hr" | "payroll" | "attendance" | "performance" | "pages";

export type Group = "Sell" | "Deliver" | "People";

export type Product = {
  slug: string;
  name: string;
  group: Group;
  icon: LucideIcon;
  /** Gradient pair: icon tile, glows and headline accent for this product. */
  tone: [string, string];
  premium?: boolean;
  /** One line for the menu and tiles. */
  short: string;
  headline: [string, string];
  sub: string;
  outcomes: { title: string; body: string }[];
  features: { title: string; body: string; bullets: string[] }[];
  ai?: { title: string; body: string };
  connects: { slug: string; line: string }[];
  faq: { q: string; a: string }[];
  mock: MockKey;
};

export const GROUPS: { name: Group; line: string }[] = [
  { name: "Sell", line: "Find, win and keep customers" },
  { name: "Deliver", line: "Do the work and keep everyone in step" },
  { name: "People", line: "Hire, pay and grow your team" },
];

const FREE_FAQ = {
  q: "Is it free?",
  a: "Yes. Everything in Rhinon Tech is free for your whole team, with no time limit. Only the AI website chatbot is a paid product.",
};

export const PRODUCTS: Product[] = [
  {
    slug: "crm",
    name: "CRM",
    group: "Sell",
    icon: Target,
    tone: ["#2f5bff", "#7c5cff"],
    short: "Leads, deals and every email on one timeline",
    headline: ["Every lead and deal,", "finally in one list."],
    sub: "Import a spreadsheet or let leads flow in from your website. Stages, owners and every conversation on one timeline, so nobody asks “where are we with them?” again.",
    outcomes: [
      { title: "One source of truth", body: "Leads from CSV imports and your website forms land in the same pipeline." },
      { title: "No follow-up falls through", body: "Every lead has a stage and an owner, and replies move it along." },
      { title: "Deals you can see", body: "Track deal value by stage and know where the money is." },
    ],
    features: [
      {
        title: "A pipeline your team can read at a glance",
        body: "Move deals through stages and see the value in every column.",
        bullets: ["Stages, owners and deal values", "Filter by status, owner or source", "Notes and history on every lead"],
      },
      {
        title: "Leads from everywhere, without duplicates",
        body: "Import a CSV in a minute or capture leads straight from your website. A repeat enquiry adds to the existing lead instead of creating a second one.",
        bullets: ["CSV import", "Website form capture", "Repeat enquiries merge into one lead"],
      },
      {
        title: "A lifecycle that updates itself",
        body: "Leads move from New to Emailed to Replied on their own. Bounces and unsubscribes are marked so you never email them again.",
        bullets: ["New, Enriched, Emailed, Replied, Interested", "Bounce and unsubscribe protection", "Open and reply tracking"],
      },
    ],
    ai: {
      title: "AI that researches before you reach out",
      body: "Rhinon AI reads a lead's website and the web, then saves a short description, recent news and the likely pain point on the lead.",
    },
    connects: [
      { slug: "outreach", line: "Turn a list into a campaign in one click." },
      { slug: "inbox", line: "Replies land on the lead's timeline." },
      { slug: "chatbot", line: "Chat visitors become leads automatically." },
    ],
    faq: [
      { q: "Can I import my existing contacts?", a: "Yes. Upload a CSV and your leads appear in the pipeline with their details." },
      { q: "Do website enquiries show up by themselves?", a: "Yes. Forms on your website can post straight into the CRM, and the AI chatbot saves the visitors it talks to." },
      FREE_FAQ,
    ],
    mock: "crm",
  },
  {
    slug: "outreach",
    name: "Outreach",
    group: "Sell",
    icon: Send,
    tone: ["#7c5cff", "#e04dd6"],
    short: "AI cold email that sounds like you wrote it",
    headline: ["Cold email that", "sounds like you wrote it."],
    sub: "Write one email. AI researches each lead, tailors the message and queues it on your schedule. You approve before anything goes out.",
    outcomes: [
      { title: "Personal at scale", body: "Every email is written for the person receiving it, not pasted from a template." },
      { title: "You stay in control", body: "Drafts wait for your review. Nothing is sent without your approval." },
      { title: "Know what works", body: "See who opened, who visited and who replied." },
    ],
    features: [
      {
        title: "Research that writes the first line",
        body: "For each lead the AI studies their company, finds something real to say, and drafts the next email in your voice.",
        bullets: ["Company research from the web", "Under 120 words, plain and direct", "Saved as a draft for your review"],
      },
      {
        title: "Campaigns that run on your schedule",
        body: "Pick the leads, the template and the days. Set a daily limit and a send time, then pause or resume whenever you like.",
        bullets: ["Daily send limit and run time", "Choose the days of the week", "Send yourself a test first"],
      },
      {
        title: "Templates, variables and LinkedIn",
        body: "Reusable templates with lead variables, or let AI write one from a prompt. Plan and publish LinkedIn posts from the same place.",
        bullets: ["Lead variables in every template", "AI-generated templates", "LinkedIn posts, videos and articles"],
      },
    ],
    ai: {
      title: "A sales agent with a memory",
      body: "Teach it your ideal customer and how you like to sell. It uses that memory on every draft, and follows up based on what has already happened with each lead.",
    },
    connects: [
      { slug: "crm", line: "Every send and reply updates the lead." },
      { slug: "inbox", line: "Replies come back to your shared inbox." },
      { slug: "chatbot", line: "Warm up leads that visit your site." },
    ],
    faq: [
      { q: "Will it send emails without my approval?", a: "No. Drafts are saved for review, and you decide what goes out." },
      { q: "Can I control how many emails go out a day?", a: "Yes. Each campaign has a daily limit, a send time and the days it runs." },
      FREE_FAQ,
    ],
    mock: "outreach",
  },
  {
    slug: "inbox",
    name: "Inbox",
    group: "Sell",
    icon: Inbox,
    tone: ["#2cd3ff", "#2f5bff"],
    short: "One shared inbox for replies and support",
    headline: ["One inbox for your", "whole team."],
    sub: "Replies to your campaigns and mail to your support address land in one shared inbox, threaded, assigned and tracked until it is done.",
    outcomes: [
      { title: "Nothing slips", body: "Every conversation has a status, from open to resolved." },
      { title: "Clear ownership", body: "Assign a conversation to a teammate and set how urgent it is." },
      { title: "Replies stay with the lead", body: "Outreach replies arrive inside the platform, next to the CRM." },
    ],
    features: [
      {
        title: "Conversations, not a pile of mail",
        body: "Messages are threaded into conversations that your team can read, assign and close together.",
        bullets: ["Open, in progress, resolved, closed", "Priority from low to urgent", "Assign to any teammate"],
      },
      {
        title: "Your workspace has its own address",
        body: "Every workspace gets a company email address, so customers write to your team and not to one person's mailbox.",
        bullets: ["A company address from day one", "Replies to campaigns come straight in", "Support mail in the same place"],
      },
    ],
    connects: [
      { slug: "outreach", line: "Replies to your campaigns arrive here." },
      { slug: "crm", line: "Link a conversation to its lead." },
      { slug: "chatbot", line: "Chat tickets and email in one view of support." },
    ],
    faq: [
      { q: "Who can see the inbox?", a: "Whoever your roles allow. You choose who can read, reply and assign." },
      FREE_FAQ,
    ],
    mock: "inbox",
  },
  {
    slug: "chatbot",
    name: "AI Chatbot",
    group: "Sell",
    icon: Bot,
    tone: ["#ff8a4c", "#ff5fb0"],
    premium: true,
    short: "A website assistant trained on your own content",
    headline: ["A chatbot that answers like", "your best salesperson."],
    sub: "Train it on your website and documents in minutes. It answers visitors day and night, saves their details to the CRM and hands over to your team in live chat or a voice call.",
    outcomes: [
      { title: "Answers at 2 a.m.", body: "Visitors get a real answer from your own content, any time of day." },
      { title: "Leads, not just chats", body: "Details the visitor shares are saved straight to your CRM." },
      { title: "Humans when it matters", body: "Hand a conversation to your team in live chat, or call the visitor." },
    ],
    features: [
      {
        title: "Trained on what you already have",
        body: "Point it at your website and upload your documents. It answers from them and says so when it does not know.",
        bullets: ["Your site and your documents", "Answers grounded in your content", "Live in minutes"],
      },
      {
        title: "Live chat and voice calls",
        body: "When a visitor needs a person, your team takes over inside the same conversation, or calls them from the dashboard.",
        bullets: ["Live handover to your team", "Voice calls to website visitors", "Full conversation history"],
      },
      {
        title: "Tickets and a help center",
        body: "Turn questions into tickets and publish answers in a help center so the next visitor finds them first.",
        bullets: ["Tickets from conversations", "A public help center", "Leads saved to the CRM"],
      },
    ],
    connects: [
      { slug: "crm", line: "Every chat lead is saved to your pipeline." },
      { slug: "inbox", line: "Follow up by email from the same place." },
      { slug: "outreach", line: "Warm leads can join a campaign." },
    ],
    faq: [
      { q: "How do I add it to my site?", a: "Paste one line of code. The same snippet adds visitor analytics." },
      { q: "Is the chatbot free?", a: "It is the one paid product in Rhinon Tech. Everything else is free. Talk to us for chatbot pricing." },
    ],
    mock: "chatbot",
  },
  {
    slug: "work",
    name: "Work",
    group: "Deliver",
    icon: FolderKanban,
    tone: ["#10c98f", "#2cd3ff"],
    short: "Projects, tasks and a portal your clients love",
    headline: ["Deliver client work", "without the chaos."],
    sub: "Projects, tasks, boards and a calendar for every piece of work, plus a private portal where clients follow progress and send change requests.",
    outcomes: [
      { title: "Everyone knows what is next", body: "Tasks have owners, priorities and due dates, and show up where people look." },
      { title: "Clients stay in the loop", body: "A private portal replaces the status email, with no login needed for clients." },
      { title: "Control who sees what", body: "Keep a project open to the workspace, a team, or just the people on it." },
    ],
    features: [
      {
        title: "Tasks with everything attached",
        body: "Status, priority, estimates, due dates, recurrence, blockers, subtasks, comments and tags, all on the task.",
        bullets: ["Subtasks and blockers", "Recurring tasks", "Comments and tags"],
      },
      {
        title: "Views for every role",
        body: "See your own tasks, the whole project, your team's work, or a board that moves as work does.",
        bullets: ["My tasks and team views", "Board view", "Projects from pipeline to completed"],
      },
      {
        title: "A portal your clients can use",
        body: "Share a private link. Clients see how their project is going and send change requests, without creating an account.",
        bullets: ["Progress at a glance", "Change requests from clients", "No client login"],
      },
    ],
    connects: [
      { slug: "chat", line: "Talk about the work without switching tools." },
      { slug: "pages", line: "Keep briefs and notes beside the project." },
      { slug: "attendance", line: "Know who is working and who is away." },
    ],
    faq: [
      { q: "Do my clients need an account?", a: "No. They open a private link to follow progress and send requests." },
      { q: "Can I keep a project private?", a: "Yes. A project can be visible to the whole workspace, to a team, or only to the people on it." },
      FREE_FAQ,
    ],
    mock: "work",
  },
  {
    slug: "chat",
    name: "Team Chat & Meetings",
    group: "Deliver",
    icon: MessagesSquare,
    tone: ["#2f5bff", "#2cd3ff"],
    short: "Chat, group calls and meeting links",
    headline: ["Talk it through,", "without leaving the work."],
    sub: "Message your team, start a group call, or share a meeting link with someone outside the company. All of it lives next to your projects and your customers.",
    outcomes: [
      { title: "One less app", body: "Chat and calls are part of the workspace, not another subscription." },
      { title: "Guests can join", body: "Send a meeting link and anyone can join, without an account." },
      { title: "Context stays close", body: "Conversations sit next to the projects and leads they are about." },
    ],
    features: [
      {
        title: "Team chat",
        body: "Direct messages and group conversations for the whole company, with presence so you know who is around.",
        bullets: ["Direct and group chats", "See who is online", "Notifications inside the app"],
      },
      {
        title: "Group calls and meeting links",
        body: "Start a call from any conversation, or create a link and share it with clients and candidates.",
        bullets: ["Group voice and video", "Shareable meeting links", "Guests join without an account"],
      },
    ],
    connects: [
      { slug: "work", line: "Discuss the project you are working on." },
      { slug: "hr", line: "Run interviews and one-to-ones in a call." },
      { slug: "crm", line: "Take sales calls from the lead record." },
    ],
    faq: [
      { q: "Can people outside my company join a meeting?", a: "Yes. Share a meeting link and guests can join without an account." },
      FREE_FAQ,
    ],
    mock: "chat",
  },
  {
    slug: "pages",
    name: "Pages",
    group: "Deliver",
    icon: FileText,
    tone: ["#4f6bff", "#a78bfa"],
    short: "Docs and notes in a tree, next to the work",
    headline: ["Your team's knowledge,", "written down once."],
    sub: "Nested pages for processes, plans, briefs and notes. Write them where the work happens, and find them again in a tree that makes sense.",
    outcomes: [
      { title: "Write it once", body: "Keep processes and decisions in a page instead of in someone's head." },
      { title: "Find it fast", body: "Pages nest in a tree, so everything has a place." },
      { title: "Beside the work", body: "Docs live in the same workspace as projects, people and customers." },
    ],
    features: [
      {
        title: "A page tree that grows with you",
        body: "Start with an untitled page and nest as many as you need. Notes, SOPs and project briefs sit side by side.",
        bullets: ["Nested pages", "Create a page in one click", "A sidebar tree to browse"],
      },
    ],
    connects: [
      { slug: "work", line: "Attach briefs and notes to projects." },
      { slug: "hr", line: "Keep your handbook and policies in one place." },
      { slug: "chat", line: "Discuss a page with the people it affects." },
    ],
    faq: [FREE_FAQ],
    mock: "pages",
  },
  {
    slug: "hr",
    name: "HR & People",
    group: "People",
    icon: UsersRound,
    tone: ["#ff5fb0", "#7c5cff"],
    short: "Onboarding, records, offer letters and e-signing",
    headline: ["Hire, onboard and sign,", "all in one flow."],
    sub: "A directory, a full record for every person, an onboarding flow for new hires and offer letters signed inside the app. Then the same record feeds payroll.",
    outcomes: [
      { title: "A faster first day", body: "New hires get a company email and a link to set up their own profile." },
      { title: "Paperwork that signs itself", body: "Send offer letters and NDAs for e-signature, typed or drawn." },
      { title: "One record per person", body: "Employment, pay setup, IDs and documents in one place." },
    ],
    features: [
      {
        title: "A complete record for every person",
        body: "Employment type, schedule, location, compensation, salary structure, bank and statutory details, and uploaded documents.",
        bullets: ["Directory with filters", "Compensation and salary structure", "Documents in a secure vault"],
      },
      {
        title: "Onboarding and offboarding",
        body: "Create an employee and they get a company email and an onboarding link. When someone leaves, mark them inactive and close their access.",
        bullets: ["Self-serve onboarding link", "Company email created for you", "Clean offboarding"],
      },
      {
        title: "Offer letters and NDAs, signed in the app",
        body: "Edit the letter, send it, and the candidate signs with a typed or drawn signature. Ask people for documents without chasing them.",
        bullets: ["Typed or drawn e-signature", "Reusable letter templates", "Requests for missing documents"],
      },
    ],
    ai: {
      title: "Rewrite any sentence with AI",
      body: "Select a sentence in a letter template and ask AI to rewrite it. Make it warmer, shorter or more formal without leaving the editor.",
    },
    connects: [
      { slug: "payroll", line: "Salary setup flows into payroll." },
      { slug: "attendance", line: "Attendance and leave follow the same record." },
      { slug: "performance", line: "Reviews attach to each person." },
    ],
    faq: [
      { q: "Do candidates need an account to sign?", a: "No. They open a link and sign with a typed or drawn signature." },
      FREE_FAQ,
    ],
    mock: "hr",
  },
  {
    slug: "payroll",
    name: "Payroll",
    group: "People",
    icon: Wallet,
    tone: ["#ffb547", "#ff8a4c"],
    short: "Monthly runs and payslips, built for India",
    headline: ["Run payroll in the time", "it takes to review it."],
    sub: "Salary structures live on each person's record. Start a monthly run, check the numbers and mark it paid. Payslips are generated for everyone.",
    outcomes: [
      { title: "Set up once", body: "Salary structure sits on the employee record and carries into every run." },
      { title: "Built for Indian payroll", body: "Amounts in ₹ with PF, PT and TDS deductions." },
      { title: "A clear process", body: "Each run moves from draft to processed to paid." },
    ],
    features: [
      {
        title: "Monthly runs you can follow",
        body: "Start a run, review gross and net across your team, process it and mark it paid. Every employee gets a payslip.",
        bullets: ["Draft, processed, paid", "Gross and net per person", "Payslips for everyone"],
      },
      {
        title: "Salary structure and deductions",
        body: "Basic, HRA, travel, medical and other components, with PF, PT and TDS configured per person.",
        bullets: ["Basic, HRA, TA, medical, other", "PF, PT and TDS setup", "Manual entries when you need them"],
      },
    ],
    connects: [
      { slug: "hr", line: "Salary setup lives on the employee record." },
      { slug: "attendance", line: "Attendance and leave inform the month." },
      { slug: "performance", line: "Link appraisals to pay conversations." },
    ],
    faq: [
      { q: "Does it handle Indian deductions?", a: "Yes. Payroll supports PF, PT and TDS configuration, and amounts are in ₹." },
      { q: "Who can see payroll?", a: "Only roles you give access to. You choose who can view and who can run it." },
      FREE_FAQ,
    ],
    mock: "payroll",
  },
  {
    slug: "attendance",
    name: "Attendance & Leave",
    group: "People",
    icon: CalendarCheck,
    tone: ["#2cd3ff", "#10c98f"],
    short: "Clock in, request leave, approve in a tap",
    headline: ["Know who is in,", "and who is away."],
    sub: "Clock in and out from the dashboard, request leave, and let managers approve in a tap. Balances and a team calendar keep everyone planning from the same facts.",
    outcomes: [
      { title: "Honest hours", body: "Self-serve clock in and out, with a daily status for everyone." },
      { title: "Leave without the back and forth", body: "Requests, balances and approvals in one place." },
      { title: "Fixes without chaos", body: "Regularization requests handle missed punches properly." },
    ],
    features: [
      {
        title: "Attendance",
        body: "Employees clock in and out. Open sessions close automatically at night, and admins can review logs and approve corrections.",
        bullets: ["Clock in and out", "Present, absent, holiday, leave", "Regularization requests"],
      },
      {
        title: "Leave",
        body: "Define your leave types, give each person a balance, and let managers approve or decline with a note.",
        bullets: ["Configurable leave types", "Balances per person", "A shared team calendar"],
      },
    ],
    connects: [
      { slug: "payroll", line: "Feeds the monthly payroll run." },
      { slug: "hr", line: "Part of every employee record." },
      { slug: "work", line: "Plan work around who is away." },
    ],
    faq: [
      { q: "Can employees fix a missed clock-in?", a: "Yes. They file a regularization request and a manager approves it." },
      FREE_FAQ,
    ],
    mock: "attendance",
  },
  {
    slug: "performance",
    name: "Performance",
    group: "People",
    icon: Gauge,
    tone: ["#7c5cff", "#2f5bff"],
    short: "Review cycles, goals and feedback",
    headline: ["Reviews people", "actually finish."],
    sub: "Run quarterly, annual or probation review cycles. Set goals for each person, collect reviews from the right people and see progress across your team.",
    outcomes: [
      { title: "Regular, not rare", body: "Quarterly, annual and probation cycles you can start in minutes." },
      { title: "Goals that count", body: "Goals belong to a cycle, so they are reviewed, not forgotten." },
      { title: "Managers see the whole team", body: "A team view shows who has finished and who has not." },
    ],
    features: [
      {
        title: "Cycles, goals and reviews",
        body: "Create a cycle, set goals for each person, and let reviewers submit feedback on their reviewees.",
        bullets: ["Quarterly, annual and probation", "Goals tied to each cycle", "Reviewer to reviewee feedback"],
      },
    ],
    connects: [
      { slug: "hr", line: "Reviews sit on the employee record." },
      { slug: "payroll", line: "Bring appraisals into pay decisions." },
      { slug: "work", line: "Review the work that was actually done." },
    ],
    faq: [FREE_FAQ],
    mock: "performance",
  },
];

export const bySlug = (slug: string): Product | undefined => PRODUCTS.find((p) => p.slug === slug);

export const byGroup = (group: Group): Product[] => PRODUCTS.filter((p) => p.group === group);
