import { FREE_PLAN, STARTER_PLAN } from "@/content/plans";

/**
 * Plan §5.2 sections every product page needs but that are not visuals: how it works, who uses it,
 * what is free and what is paid, the closest alternative, and the extra FAQs. One shared structure,
 * but each product's own words (the 6 November feedback: never one layout with words swapped in).
 * Claims must match the product and the claims register (docs/RHINONTECH_WEBSITE_REVAMP.md §2.6).
 */

export type ProductDepth = {
  steps: { title: string; body: string }[];
  uses: { solution: string; line: string }[];
  plan: { free: string; paid: string };
  compare: { slug: string; line: string }[];
  faq: { q: string; a: string }[];
};

const FREE_ALL = `Free for up to ${FREE_PLAN.seats} people, with no time limit.`;

export const PRODUCT_DEPTH: Record<string, ProductDepth> = {
  crm: {
    steps: [
      { title: "Bring your leads in", body: "Import a spreadsheet, point your website forms at the CRM, or let the AI Agent save the visitors it talks to." },
      { title: "Work the pipeline", body: "Move deals through your own stages with a value and close date. Every email, note and chat lands on the timeline." },
      { title: "Hand the win to delivery", body: "Convert a won deal into a project in one click, with the client and contacts attached." },
    ],
    uses: [
      { solution: "agencies", line: "Track pitches from enquiry to signed, with every follow-up on the deal." },
      { solution: "consultancies", line: "Every partner's emails with a client on one shared timeline." },
      { solution: "startups", line: "Move the founder's lead spreadsheet into a real pipeline." },
    ],
    plan: { free: `${FREE_ALL} Leads, deals, pipelines, reports and timelines included.`, paid: `Starter adds the AI Agent, which saves website visitors to the CRM, and raises the team to ${STARTER_PLAN.seats} people.` },
    compare: [
      { slug: "hubspot-alternative", line: "HubSpot's CRM is deeper on marketing; Rhinon keeps going into projects." },
      { slug: "pipedrive-alternative", line: "Pipedrive is a polished pipeline with no free plan; Rhinon is free for 5." },
    ],
    faq: [
      { q: "Can I set my own pipeline stages?", a: "Yes. Name the stages that match how you sell, from first call to signed." },
      { q: "Can I record why a deal was lost?", a: "Yes. A lost reason is captured when a deal closes, and pipeline reports show what is moving." },
      { q: "Can I export my leads?", a: "Yes. Export any filtered list as a spreadsheet." },
    ],
  },
  "ai-agent": {
    steps: [
      { title: "Train it on your content", body: "Point it at your website and upload the files and help articles it should answer from." },
      { title: "Add one line to your site", body: "Paste the snippet before the closing body tag. The same line adds visitor analytics." },
      { title: "Let it answer, then take over", body: "It answers visitors and saves their details to the CRM. Your team can step into any chat live." },
    ],
    uses: [
      { solution: "agencies", line: "Answers questions about your services at any hour and saves the enquiry as a lead." },
      { solution: "it-services", line: "Answers technical questions from your own documentation and qualifies the visitor." },
      { solution: "professional-services", line: "Visitors get answers from your service pages instead of waiting for a reply." },
    ],
    plan: { free: "Not on the Free plan. Everything else in Rhinon Tech is free for up to 5 people.", paid: `Starter includes 1 AI Agent with ${STARTER_PLAN.aiAgentRepliesPerDay.toLocaleString("en-IN")} replies a day. Enterprise includes up to 3 AI Agents with no reply cap.` },
    compare: [
      { slug: "chatbase-alternative", line: "Chatbase is a specialist agent; Rhinon's agent writes straight into its own CRM." },
      { slug: "hubspot-alternative", line: "Both have AI chat; Rhinon includes projects and a client portal too." },
    ],
    faq: [
      { q: "What if it does not know the answer?", a: "It says so instead of guessing, and your team can take over the chat or open a ticket." },
      { q: "Is there a help center?", a: "Yes. Write help articles that visitors can read and the AI Agent can answer from." },
      { q: "Can it talk on the phone?", a: "No. Visitors chat with the AI Agent; your team can call a visitor from the dashboard. There is no AI voice agent." },
    ],
  },
  outreach: {
    steps: [
      { title: "Choose who to write to", body: "Pick leads from the CRM or import a list. Each campaign has its own daily limit, send time and days." },
      { title: "Let AI draft each email", body: "Outreach researches each lead and writes a personal draft. Edit any line, or approve as it is." },
      { title: "Send as a sequence", body: "Waits, if/then branches and A/B splits follow up for you. Replies land on the lead's timeline." },
    ],
    uses: [
      { solution: "startups", line: "Founders send personal cold emails without writing each one." },
      { solution: "agencies", line: "A follow-up for every pitch that has gone quiet, drafted and waiting for approval." },
      { solution: "consultancies", line: "Warm contacts from last quarter get a personal note, not a newsletter." },
    ],
    plan: { free: `${FREE_PLAN.emailsPerDay} emails and ${FREE_PLAN.aiDraftsPerDay} AI drafts a day, for up to ${FREE_PLAN.seats} people.`, paid: `Starter raises that to ${STARTER_PLAN.emailsPerDay} emails and ${STARTER_PLAN.aiDraftsPerDay} AI drafts a day, and lets you send from your own email domain.` },
    compare: [
      { slug: "freshsales-alternative", line: "Freshsales has strong sequences; Rhinon adds projects and an AI Agent." },
      { slug: "hubspot-alternative", line: "HubSpot's sequences are in Sales Hub; Rhinon's are in the same free workspace." },
    ],
    faq: [
      { q: "What does the AI use to write a draft?", a: "Research on each lead, such as their company and role, plus the goal and tone you set for the campaign." },
      { q: "Can I add LinkedIn and call steps to a sequence?", a: "Yes. Sequences can include LinkedIn and call tasks alongside emails." },
    ],
  },
  inbox: {
    steps: [
      { title: "Connect your addresses", body: "Each person gets their own address, and shared addresses such as hello@ can be handed to one owner." },
      { title: "Read and reply in one place", body: "Email sits in the same app as the CRM, so a client's reply is one click from their record." },
      { title: "Hand over when needed", body: "Move a shared address to a teammate and its whole history moves with it." },
    ],
    uses: [
      { solution: "agencies", line: "The hello@ address stays with whoever handles new business this month." },
      { solution: "professional-services", line: "Client emails sit next to the client's record instead of one person's mailbox." },
      { solution: "consultancies", line: "Partners keep their own addresses in the same workspace as the CRM." },
    ],
    plan: { free: `${FREE_ALL} Team email and shared addresses included.`, paid: "Starter lets you send from your own email domain." },
    compare: [{ slug: "hubspot-alternative", line: "HubSpot's shared inbox is part of Service Hub; Rhinon's sits next to the CRM for free." }],
    faq: [
      { q: "Can I assign single conversations to different people?", a: "Not yet. A shared address belongs to one person at a time." },
      { q: "Can customers email our workspace address directly?", a: "Receiving customer email on your workspace address is not available yet. Connect your own domain to send from it." },
    ],
  },
  projects: {
    steps: [
      { title: "Start from the deal", body: "Convert a won deal and the project opens with the client and contacts attached, or create one from scratch." },
      { title: "Plan the work", body: "List, board, calendar and Gantt views, sprints, subtasks, blockers and recurring tasks." },
      { title: "Share a portal", body: "Send the client a private link to follow tasks and send requests. Internal files and comments stay private." },
    ],
    uses: [
      { solution: "agencies", line: "Creative rounds on a board, with change requests arriving through the portal." },
      { solution: "it-services", line: "Sprints and a Gantt for each client build, with the scope linked from the deal." },
      { solution: "consultancies", line: "Engagement phases as tasks, with the client following progress." },
    ],
    plan: { free: `${FREE_ALL} Projects, every view and the client portal included.`, paid: `Starter raises the team to ${STARTER_PLAN.seats} people.` },
    compare: [
      { slug: "clickup-alternative", line: "ClickUp has more views and automations; Rhinon has the CRM built in." },
      { slug: "teamwork-alternative", line: "Teamwork has time tracking and billing; Rhinon starts earlier, with the lead." },
    ],
    faq: [
      { q: "Is there time tracking?", a: "Not yet. Tasks hold estimates, but logging time is not built. Keep your time tracker alongside it." },
      { q: "Are there project templates?", a: "Not yet. Keep a kick-off checklist in Docs and add those tasks to each new project." },
    ],
  },
  chat: {
    steps: [
      { title: "Open channels", body: "Create channels for teams and projects, and message anyone directly." },
      { title: "Reply in threads", body: "Keep a discussion together with threaded replies, mentions and attachments." },
      { title: "Call in one click", body: "Start a group call of up to 8 people, or send a guest link so a client can join." },
    ],
    uses: [
      { solution: "agencies", line: "A channel per client project, with the brief open in Docs beside it." },
      { solution: "it-services", line: "Engineering discussion next to the sprint board, not in another app." },
      { solution: "consultancies", line: "Guest meeting links for client calls, without the client creating an account." },
    ],
    plan: { free: `${FREE_ALL} Channels, threads, calls and guest links included.`, paid: `Starter raises the team to ${STARTER_PLAN.seats} people.` },
    compare: [{ slug: "slack-alternative", line: "Slack has the bigger ecosystem; Rhinon puts chat next to your clients and projects." }],
    faq: [
      { q: "How many people can join a call?", a: "Group calls hold up to 8 people." },
      { q: "Can I pin or edit messages?", a: "Yes. Messages can be edited and pinned in a conversation." },
    ],
  },
  docs: {
    steps: [
      { title: "Write it once", body: "Create a doc in a click and type. Rich text, embeds and images are built in." },
      { title: "Organise it in a tree", body: "Nest docs so a handbook holds its policies and a client folder holds its briefs." },
      { title: "Find it next to the work", body: "Docs live in the same workspace as projects and clients, so the brief is one click away." },
    ],
    uses: [
      { solution: "agencies", line: "Client briefs and kick-off checklists next to each project." },
      { solution: "consultancies", line: "Methods, frameworks and past deliverables in one tree." },
      { solution: "it-services", line: "Specs and runbooks next to the client's sprint board." },
    ],
    plan: { free: `${FREE_ALL} Docs, the tree and sharing included.`, paid: `Starter raises the team to ${STARTER_PLAN.seats} people.` },
    compare: [{ slug: "notion-alternative", line: "Notion is the more flexible wiki; Rhinon adds the CRM and projects." }],
    faq: [
      { q: "Can I import from Notion or Google Docs?", a: "There is no importer yet. Copy across the pages your team uses every day." },
      { q: "Can I control who sees a doc?", a: "Yes. Share settings decide who in the workspace can open each doc." },
    ],
  },
  hr: {
    steps: [
      { title: "Send the offer", body: "Write an offer letter or NDA from your template; the candidate signs with a typed or drawn signature." },
      { title: "Onboard the hire", body: "Create the employee and they get a company email and an onboarding link to complete their profile." },
      { title: "Keep one record", body: "Employment, schedule, compensation, documents, leave and reviews stay on the person's record." },
    ],
    uses: [
      { solution: "agencies", line: "Freelancers and new hires sign NDAs online before they see client work." },
      { solution: "professional-services", line: "Every employee's records and documents in the same app as the client work." },
      { solution: "startups", line: "The first hires get a real offer letter and onboarding, without an HR tool." },
    ],
    plan: { free: `${FREE_ALL} Records, onboarding, offer letters and e-signing included.`, paid: `Starter raises the team to ${STARTER_PLAN.seats} people.` },
    compare: [{ slug: "zoho-alternative", line: "Zoho People goes deeper on HR; Rhinon keeps HR next to client work." }],
    faq: [
      { q: "Can I edit the offer letter wording?", a: "Yes. Letters are built from templates you can edit, and AI can rewrite a selected sentence." },
      { q: "Can I keep employee documents?", a: "Yes. Upload documents to the employee's record; files sit in private storage." },
    ],
  },
  attendance: {
    steps: [
      { title: "Clock in", body: "People clock in and out; sessions left open close automatically at night." },
      { title: "Request leave", body: "Choose a leave type you defined, and the request goes to the manager." },
      { title: "Approve and plan", body: "Managers approve in a tap, and approved leave shows on the team calendar." },
    ],
    uses: [
      { solution: "agencies", line: "See who is out next week before you plan the next creative round." },
      { solution: "it-services", line: "Sprint planning starts from the team calendar, not a spreadsheet of leave." },
      { solution: "professional-services", line: "Leave balances and approvals without a separate HR tool." },
    ],
    plan: { free: `${FREE_ALL} Clock-ins, leave types, balances and the team calendar included.`, paid: `Starter raises the team to ${STARTER_PLAN.seats} people.` },
    compare: [{ slug: "zoho-alternative", line: "Zoho People has more leave rules; Rhinon keeps leave next to the projects." }],
    faq: [{ q: "Is Attendance connected to the rest of Rhinon?", a: "Yes. Leave and attendance sit on the employee's record, next to their HR details, reviews and payroll setup." }],
  },
  performance: {
    steps: [
      { title: "Start a cycle", body: "Pick quarterly, annual or probation, and choose who takes part." },
      { title: "Set goals", body: "Each goal belongs to a person and a cycle, so it is reviewed, not forgotten." },
      { title: "Collect reviews", body: "Self reviews move to managers, and the team view shows who has not finished." },
    ],
    uses: [
      { solution: "agencies", line: "Quarterly reviews for a creative team, with goals tied to the work they delivered." },
      { solution: "it-services", line: "Probation reviews for new engineers, on the same record as their onboarding." },
      { solution: "professional-services", line: "Annual reviews without a separate performance tool." },
    ],
    plan: { free: `${FREE_ALL} Cycles, goals, reviews and the team view included.`, paid: `Starter raises the team to ${STARTER_PLAN.seats} people.` },
    compare: [{ slug: "zoho-alternative", line: "Zoho People has appraisals; Rhinon's reviews sit next to the projects people worked on." }],
    faq: [{ q: "Can people review themselves?", a: "Yes. A review starts with a self review, moves to the manager and ends with a submission the person can read." }],
  },
  payroll: {
    steps: [
      { title: "Set the salary structure", body: "Basic, HRA, travel, medical and other components on each person's record." },
      { title: "Run the month", body: "Review gross and net across the team, process the run and mark it paid." },
      { title: "Share payslips", body: "Payslips and reimbursements in ₹, with PF, professional tax and the TDS amount you set." },
    ],
    uses: [
      { solution: "agencies", line: "Monthly salary runs and payslips for a small team, exported for the CA." },
      { solution: "startups", line: "The first payslips, without buying a payroll tool before you need one." },
      { solution: "professional-services", line: "Reimbursements and payslips on the same record as leave and reviews." },
    ],
    plan: { free: `${FREE_ALL} Salary runs, payslips and reimbursements included.`, paid: `Starter raises the team to ${STARTER_PLAN.seats} people.` },
    compare: [{ slug: "zoho-alternative", line: "Zoho Payroll files statutory returns; Rhinon runs salary and payslips, and you export for your CA." }],
    faq: [{ q: "Does it file PF or TDS returns?", a: "No. It calculates the amounts on each payslip; filing ECR, Form 16 or challans stays with your CA." }],
  },
};
