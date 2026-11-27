import type { MockKey } from "@/content/products";

/**
 * The deeper half of each solution page. Same rules as content/solutions.ts: every line must
 * describe something the product does today (claims register §2.6). No invoicing, proposals,
 * time tracking, WhatsApp or statutory payroll.
 */

export type SolutionDepth = {
  hero: MockKey;
  /** Two product screens with copy written for this kind of business. */
  scenes: { k: MockKey; eyebrow: string; title: string; body: string }[];
  /** A normal week in this kind of business, in Rhinon. */
  week: { day: string; line: string }[];
  /** Feature pages that answer this audience's next question. */
  features: string[];
  /** "The old way" against "the Rhinon way", line for line. */
  old: string[];
  next: string[];
  faq: { q: string; a: string }[];
};

export const SOLUTION_DEPTH: Record<string, SolutionDepth> = {
  agencies: {
    old: ["Enquiries wait in an inbox until someone notices", "The brief is retyped from the CRM into a project app", "Clients chase updates on WhatsApp and calls", "Leave and reviews live in spreadsheets"],
    next: ["The AI Agent answers and saves every enquiry as a lead", "A won deal becomes the project, client attached", "Clients follow tasks and send requests in a portal", "Leave, reviews and payroll sit in the same workspace"],
    hero: "crm",
    scenes: [
      { k: "chatbot", eyebrow: "Enquiries", title: "A visitor asks about your retainer at 11pm. They get an answer.", body: "The AI Agent answers from your service pages, case studies and FAQs, saves the visitor as a lead with the conversation attached, and hands over to your team when someone is online." },
      { k: "work", eyebrow: "Delivery", title: "The won pitch becomes the client's project, and their portal.", body: "Convert the deal and the project starts with the client and contacts attached. Share the portal link so the client follows tasks and sends requests there, not on WhatsApp." },
    ],
    week: [
      { day: "Monday", line: "The pipeline shows three pitches waiting on a reply. Outreach has a follow-up drafted for each; you edit one line and approve." },
      { day: "Tuesday", line: "A brand you pitched last month signs. Convert the deal and the project opens with the client and contacts attached; add the kick-off tasks from your checklist in Docs." },
      { day: "Wednesday", line: "The client sends a change request through their portal. It becomes a task on the board for the designer." },
      { day: "Thursday", line: "The team discusses the next creative round in the project's channel, with the brief open in Docs beside it." },
      { day: "Friday", line: "Two people request leave for next week. You approve them and see on the calendar who is in before you plan the sprint." },
    ],
    features: ["client-portal", "crm-with-project-management", "lead-management"],
    faq: [
      { q: "Can I keep a separate pipeline for retainers and one-off projects?", a: "Yes. Set your own pipeline stages to match how you sell, and use saved views to see each kind of deal on its own." },
      { q: "Are there project templates?", a: "Not yet. Keep a kick-off checklist per service in Docs and add those tasks when you convert a deal." },
      { q: "Does the AI Agent know our services?", a: "It answers from your own website pages, files and help articles. When it does not know, it says so and your team can take over the chat." },
      { q: "Is there a free plan for a small agency?", a: "Yes. Everything except the AI Agent is free for up to 5 people, with 50 emails and 20 AI drafts a day." },
    ],
  },
  consultancies: {
    old: ["Each partner's client emails sit in their own inbox", "Every engagement starts from a blank project", "Methods and past deliverables are scattered across drives", "Warm contacts go cold between projects"],
    next: ["Every email with a lead sits on one shared timeline", "The agreed deal becomes the engagement project", "Methods and deliverables live in a Docs tree", "Outreach drafts a personal follow-up for you to approve"],
    hero: "crm",
    scenes: [
      { k: "crm", eyebrow: "Relationships", title: "Every partner's conversations with a client, on one timeline.", body: "Emails, notes and activity sit on the lead and deal, so whoever takes the next call knows what was said in the last one. Roles decide who sees which accounts." },
      { k: "pages", eyebrow: "Know-how", title: "Your methods live next to the engagements that use them.", body: "Keep frameworks, templates and past deliverables in a Docs tree, linked from the projects they belong to, instead of in someone's drive." },
    ],
    week: [
      { day: "Monday", line: "An introduction from a former client lands in the CRM. You log the call notes on the lead's timeline." },
      { day: "Tuesday", line: "Outreach drafts a follow-up to three warm contacts from last quarter. You approve two and rewrite one." },
      { day: "Wednesday", line: "A scoping conversation moves the deal to Proposal. The proposal itself is still written in your usual tool." },
      { day: "Thursday", line: "The engagement is agreed. Convert the deal and the engagement project starts with the client attached; add your standard phases as tasks." },
      { day: "Friday", line: "The client checks progress in their portal; your team writes up the week's findings in Docs." },
    ],
    features: ["crm-with-project-management", "client-portal", "sales-pipeline"],
    faq: [
      { q: "Can we write proposals in Rhinon Tech?", a: "Not yet. Track the proposal as a pipeline stage and keep the document in your current tool or in Docs." },
      { q: "Can each partner see only their own clients?", a: "Roles decide who can open the CRM and other products. Project visibility can be set to the whole workspace, a team or private." },
      { q: "Does the client see our internal notes?", a: "No. The client portal shows tasks and requests only; files, comments and team details stay internal." },
      { q: "Can we invite clients to calls?", a: "Yes. Team chat includes guest meeting links, so clients can join a call without an account." },
    ],
  },
  "it-services": {
    old: ["Scope notes get lost between sales and delivery", "Clients ask for a weekly status email", "Engineers chat in one app and plan in another", "Leave for the next sprint is tracked in a sheet"],
    next: ["The project keeps a link to the deal and its notes", "Clients follow the sprint board in a portal", "Channels, threads and calls sit next to the project", "Approved leave shows on the team calendar"],
    hero: "work",
    scenes: [
      { k: "work", eyebrow: "Delivery", title: "From signed deal to sprint board without retyping the scope.", body: "The project keeps a link to the deal it came from, so the scoping notes travel with it. Plan sprints on a board, track the timeline on a Gantt, and share a portal with the client." },
      { k: "chat", eyebrow: "Team", title: "Engineering talk next to the project, not in another app.", body: "Channels, threaded replies and group calls of up to 8 people, plus guest links when the client wants to join a review." },
    ],
    week: [
      { day: "Monday", line: "The AI Agent spent the weekend answering questions from your docs; two visitors left details and are now leads." },
      { day: "Tuesday", line: "A scoping call moves a deal to Estimate. Notes and emails sit on the deal for whoever writes the estimate." },
      { day: "Wednesday", line: "The deal is signed. Convert it, and the project opens linked to the deal; plan the first sprint on the board." },
      { day: "Thursday", line: "The client checks the board in their portal instead of asking for a status email." },
      { day: "Friday", line: "Runbooks for the new client go into Docs; the team's leave for next sprint is approved and on the calendar." },
    ],
    features: ["crm-with-project-management", "client-portal", "sales-pipeline"],
    faq: [
      { q: "Does Rhinon Tech connect to GitHub?", a: "Our integrations page lists Slack and GitHub for giving new teammates access on their first day. Code and issue tracking stay in your existing tools." },
      { q: "Can we run several client projects at once?", a: "Yes. Each project has its own tasks, views and portal, and team members can work across several." },
      { q: "Is there a Gantt view?", a: "Yes. Projects have list, board, calendar and Gantt views, plus sprints." },
      { q: "Does it track billable hours?", a: "Not yet. Keep your time tracker alongside Rhinon Tech for now." },
    ],
  },
  "professional-services": {
    old: ["Each client lives in five different tools", "Follow-up depends on who remembers", "Onboarding and leave run on spreadsheets", "Every service line shares one messy pipeline"],
    next: ["One record per client, from enquiry to delivery", "The AI Agent and approved drafts follow up for you", "Offer letters, leave and payroll are built in", "Each service line gets its own pipeline stages"],
    hero: "crm",
    scenes: [
      { k: "crm", eyebrow: "One record", title: "The client's enquiry, emails and work on one timeline.", body: "Leads, deals and every conversation sit together, and the won deal turns into the project that delivers it, so nobody pieces a client together from five tools." },
      { k: "hr", eyebrow: "The team", title: "Hiring, records and offer letters in the same place.", body: "Keep employee records, onboarding checklists and e-signed offer letters and NDAs next to the client work your people do." },
    ],
    week: [
      { day: "Monday", line: "A website visitor asks about your services; the AI Agent answers and saves them as a lead." },
      { day: "Tuesday", line: "You follow up with an Outreach draft you approved, and the reply lands on the lead's timeline." },
      { day: "Wednesday", line: "The client agrees. Convert the deal and the project starts with the client attached." },
      { day: "Thursday", line: "A new hire signs their offer letter online and their record is ready on day one." },
      { day: "Friday", line: "Leave requests are approved and the team calendar shows who is out next week." },
    ],
    features: ["lead-management", "crm-with-project-management", "client-portal"],
    faq: [
      { q: "Can different service lines have their own pipelines?", a: "Yes. Set up the pipeline stages for each way you sell, and use saved views to work each one." },
      { q: "Is payroll included?", a: "Salary runs, payslips and reimbursements are included, with PF and professional tax. It does not calculate ESI or file statutory returns, so export for your CA." },
      { q: "Can clients follow their work?", a: "Yes. Each project can have a portal where the client sees tasks and sends requests, without an account." },
      { q: "How long does setup take?", a: "Most teams set their pipeline stages, import their contacts and invite the team in an afternoon." },
    ],
  },
  startups: {
    old: ["Writing every cold email by hand", "Leads tracked in a spreadsheet", "Paying for five tools before the first client", "Losing the thread when the first sales hire joins"],
    next: ["AI drafts each email; you approve before it sends", "Import the sheet once and work a real pipeline", "CRM, outreach, projects, chat and HR free for up to 5", "Every reply is on the lead's timeline for the next hire"],
    hero: "outreach",
    scenes: [
      { k: "outreach", eyebrow: "Founder-led sales", title: "A personal first email for every lead, without writing each one.", body: "Outreach researches each lead and drafts a tailored email. Build a sequence with waits, if/then branches and A/B splits; nothing sends until you approve it." },
      { k: "crm", eyebrow: "Pipeline", title: "Out of the spreadsheet, into a pipeline.", body: "Import your lead sheet once. Replies land on each lead's timeline and deals move through stages you name, so the first sales hire inherits a real history." },
    ],
    week: [
      { day: "Monday", line: "Import last week's list of 200 prospects from a spreadsheet and map the columns." },
      { day: "Tuesday", line: "AI drafts the first email for each one. You approve 20 of them, inside the free plan's daily draft limit." },
      { day: "Wednesday", line: "Four replies land on their leads' timelines. Two become deals." },
      { day: "Thursday", line: "A visitor from the launch post asks the AI Agent about pricing and leaves an email." },
      { day: "Friday", line: "The first deal closes. Convert it into a project and invite your co-founder to run delivery." },
    ],
    features: ["lead-management", "sales-pipeline", "crm-with-project-management"],
    faq: [
      { q: "How many emails can we send on the free plan?", a: "50 emails and 20 AI drafts a day, for up to 5 people. Starter raises that to 500 emails and 200 AI drafts a day." },
      { q: "Can we send from our own domain?", a: "Sending from your own email domain is part of the Starter plan." },
      { q: "Is the AI Agent included for free?", a: "No. The AI Agent is on Starter. Everything else is free for up to 5 people." },
      { q: "What happens when we hire our sixth person?", a: "The Free plan stops at 5 people. Starter covers up to 25, priced with you before anything changes." },
    ],
  },
};
