import type { MockKey } from "@/content/products";

/**
 * The deeper half of each comparison page: why teams switch, which team should pick which tool,
 * and which product screens to show. Same rules as content/compare.ts: claims about the competitor
 * must come from the facts recorded there (with their sources), and Rhinon claims must match the
 * claims register (docs/RHINONTECH_WEBSITE_REVAMP.md §2.6). Every page names at least one team
 * that should pick the competitor.
 */

export type Fit = { team: string; pick: "rhinon" | "them"; why: string };

export type CompareDepth = {
  /** Product screens to show: [hero, difference 1, difference 2]. */
  focus: [MockKey, MockKey, MockKey];
  reasons: { title: string; body: string }[];
  fit: Fit[];
};

/** What each product screen shows, when it appears as a "difference" on a comparison page. */
export const DIFFERENCE: Record<MockKey, { eyebrow: string; title: string; body: string }> = {
  crm: { eyebrow: "CRM", title: "The deal, the emails and the client on one timeline", body: "Every lead moves through your own stages, with every email, note and chat on its record. When the deal is won, one click turns it into a project with the client already attached." },
  chatbot: { eyebrow: "AI Agent", title: "Website visitors answered, and saved as leads", body: "The AI Agent answers from your own website, files and help articles, says so when it does not know, and hands the chat to your team live. Every visitor it talks to lands in the CRM." },
  outreach: { eyebrow: "Outreach", title: "Follow-ups drafted by AI, sent only when you approve", body: "Sequences with waits, if/then branches and A/B splits. AI writes a personal draft for each lead; nothing goes out until someone on your team approves it." },
  inbox: { eyebrow: "Inbox", title: "Your team's email next to the client record", body: "Team email and shared addresses in the same app as the CRM, so a reply from a client shows up on their timeline instead of in one person's mailbox." },
  work: { eyebrow: "Projects", title: "Won work becomes a project your client can follow", body: "List, board, calendar and Gantt views. Each project can have a client portal where the client sees its tasks and sends requests, without needing an account." },
  chat: { eyebrow: "Chat & Meetings", title: "Team chat and calls beside the work", body: "Channels, direct messages, threaded replies and group calls of up to 8 people, plus guest meeting links for clients. No separate chat subscription." },
  pages: { eyebrow: "Docs", title: "Briefs and processes next to the project", body: "Docs nest in a tree with rich text and embeds, so the brief, the process and the meeting notes sit next to the client and the project they belong to." },
  hr: { eyebrow: "HR", title: "Hiring and records in the same workspace", body: "Employee records, onboarding and offer letters and NDAs with e-signing, next to the projects your people work on." },
  attendance: { eyebrow: "Attendance & Leave", title: "Leave and clock-ins without another tool", body: "People clock in and request leave; managers approve in a tap and see who is out on the team calendar before they plan the week." },
  performance: { eyebrow: "Performance", title: "Review cycles that get finished", body: "Quarterly, annual and probation cycles, goals per person and a team view that shows who has not submitted yet." },
  payroll: { eyebrow: "Payroll", title: "Salary runs and payslips, included", body: "Salary runs, payslips and reimbursements with PF and professional tax. It does not calculate ESI or file statutory returns, so export for your CA." },
};

export const COMPARE_DEPTH: Record<string, CompareDepth> = {
  "zoho-alternative": {
    focus: ["crm", "work", "chatbot"],
    reasons: [
      { title: "One app instead of a suite", body: "Zoho One bundles 45+ separate apps. A service business usually needs five of them talking to each other; in Rhinon those five are one product with one record per client." },
      { title: "No licence for every employee", body: "Zoho One's page says every employee needs a licence. Rhinon Tech is free for up to 5 people, and Starter is priced around the team that actually uses it." },
      { title: "The handoff is built in", body: "In Zoho, CRM and Projects are separate apps. In Rhinon, a won deal becomes a project in one click and the client's contacts come with it." },
      { title: "Running in an afternoon", body: "There is no suite to configure. Set your pipeline stages, invite your team and point the AI Agent at your website." },
    ],
    fit: [
      { team: "A 5-person agency starting out", pick: "rhinon", why: "Free with no trial clock, and the lead-to-project flow works on day one." },
      { team: "A 20-person consultancy that delivers projects", pick: "rhinon", why: "CRM, projects, client portal and team chat in one app, without licensing every employee." },
      { team: "A company that needs accounting or inventory", pick: "them", why: "Rhinon has no finance or inventory apps. Zoho One does." },
      { team: "A team that needs statutory Indian payroll filings", pick: "them", why: "Zoho Payroll covers PF, ESI, PT and TDS. Rhinon payroll does not calculate ESI or file returns." },
    ],
  },
  "hubspot-alternative": {
    focus: ["work", "crm", "chat"],
    reasons: [
      { title: "It keeps going after the deal is won", body: "HubSpot's pages name tasks, not project management. In Rhinon, the won deal becomes a project with boards, a Gantt and a client portal." },
      { title: "One plan instead of several hubs", body: "The AI chatbot, sequences and shared inbox sit in different HubSpot hubs. In Rhinon they are part of one workspace." },
      { title: "Your team works here too", body: "HubSpot has no team chat, internal docs or HR. Rhinon includes channels and calls, a docs tree, leave and reviews." },
      { title: "Clients can see their work", body: "HubSpot's customer portal is for support tickets. Rhinon's portal shows clients their project's tasks and takes their requests." },
    ],
    fit: [
      { team: "An agency that wins clients, then delivers projects", pick: "rhinon", why: "The pipeline, the project and the client portal are one record." },
      { team: "A small team that wants chat and HR included", pick: "rhinon", why: "Team chat, docs, leave and reviews come with the CRM, free for up to 5 people." },
      { team: "A marketing team running large campaigns", pick: "them", why: "HubSpot's marketing automation, CMS and attribution go far deeper." },
      { team: "A sales team that depends on many integrations", pick: "them", why: "HubSpot's ecosystem has hundreds of ready-made integrations; Rhinon has few." },
    ],
  },
  "odoo-alternative": {
    focus: ["crm", "chatbot", "work"],
    reasons: [
      { title: "No ERP to configure", body: "Odoo is built to run a whole business, which usually means a partner or a configuration project. Rhinon is ready for a service business in an afternoon." },
      { title: "AI where a service business needs it", body: "Odoo's pages name live chat but not an AI chatbot. Rhinon's AI Agent answers visitors from your own content and saves them as leads." },
      { title: "Outreach that writes itself, with your approval", body: "Odoo names email marketing, not sales sequences. Rhinon drafts each follow-up with AI and sends only what you approve." },
      { title: "Free for a small team, hosted for you", body: "Rhinon Tech is free for up to 5 people with nothing to host or upgrade." },
    ],
    fit: [
      { team: "A 10-person IT services firm", pick: "rhinon", why: "Lead to project to client portal, with no ERP modules to switch off." },
      { team: "A founder-led agency with no IT team", pick: "rhinon", why: "Hosted and ready to use; nothing to install or configure." },
      { team: "A business that sells stock or manufactures", pick: "them", why: "Odoo has inventory, manufacturing and e-commerce. Rhinon does not." },
      { team: "A team that wants to self-host and modify the code", pick: "them", why: "Odoo has an open-source edition. Rhinon is hosted only." },
    ],
  },
  "clickup-alternative": {
    focus: ["crm", "work", "chatbot"],
    reasons: [
      { title: "The CRM is part of it", body: "Leads, deals and pipelines sit in the same app as your projects, so the client record and the work are one thing, not two tools linked together." },
      { title: "Clients get a portal", body: "Each project can have a portal where the client follows tasks and sends requests, so status updates stop being a weekly email." },
      { title: "AI that brings work in", body: "The AI Agent answers website visitors and Outreach drafts follow-ups, so the start of the client journey lives here too." },
      { title: "Simpler on purpose", body: "ClickUp offers more views, custom fields and automations. Rhinon keeps the views a service team uses: list, board, calendar and Gantt." },
    ],
    fit: [
      { team: "An agency that wants leads and projects together", pick: "rhinon", why: "The won deal becomes the project; no integration to maintain." },
      { team: "A consultancy that reports progress to clients", pick: "rhinon", why: "The client portal replaces the status email." },
      { team: "An internal team running complex work", pick: "them", why: "ClickUp's custom fields, automations and views go further." },
      { team: "A team with a CRM it is happy with", pick: "them", why: "If the sales side already lives elsewhere, ClickUp's depth in projects may matter more." },
    ],
  },
  "monday-alternative": {
    focus: ["crm", "chatbot", "chat"],
    reasons: [
      { title: "CRM and projects are one product", body: "monday.com sells CRM and work management as separate products. In Rhinon, a won deal turns into a project in the same app." },
      { title: "An AI agent on your website", body: "The AI Agent answers visitors from your own content, hands over to your team live and saves every lead to the pipeline." },
      { title: "Chat, docs and HR included", body: "Channels, calls, a docs tree, leave and reviews come with the same workspace instead of another tool." },
      { title: "Built for 5 to 50 people", body: "Rhinon is made for small service businesses: free for up to 5 people and quick to set up." },
    ],
    fit: [
      { team: "A 15-person agency", pick: "rhinon", why: "CRM, projects, AI Agent, chat and HR in one app built for its size." },
      { team: "A team that wants to start free", pick: "rhinon", why: "Free for up to 5 people, with every product except the AI Agent." },
      { team: "A large company standardising work across departments", pick: "them", why: "monday's work OS, marketplace and enterprise controls suit that better." },
      { team: "A team that lives in highly customised boards", pick: "them", why: "monday.com offers far more board customisation than Rhinon." },
    ],
  },
  "honeybook-alternative": {
    focus: ["chatbot", "work", "chat"],
    reasons: [
      { title: "Works where you are, including India", body: "HoneyBook's sign-up was limited to the US, Canada, the UK and Australia when we checked. Rhinon works anywhere." },
      { title: "Leads come to you", body: "The AI Agent answers website visitors at any hour and saves each one to the CRM; Outreach drafts the follow-up." },
      { title: "Room for a team", body: "Team chat, docs, leave and reviews sit next to your clients, so the tool keeps up as you hire." },
      { title: "Clients follow the project", body: "Each project can have a portal where the client sees tasks and sends requests." },
    ],
    fit: [
      { team: "A studio or agency in India", pick: "rhinon", why: "HoneyBook's sign-up did not include India when we checked." },
      { team: "A growing team of 5 or more", pick: "rhinon", why: "Chat, docs, leave and reviews come with the client side." },
      { team: "A solo business that lives on proposals and invoices", pick: "them", why: "HoneyBook does proposals, contracts, invoices and payments. Rhinon does not yet." },
      { team: "A US business that wants payments built in", pick: "them", why: "Online payments are one of HoneyBook's strengths; Rhinon has no billing yet." },
    ],
  },
  "chatbase-alternative": {
    focus: ["chatbot", "crm", "outreach"],
    reasons: [
      { title: "No integration between the bot and the CRM", body: "Every visitor the AI Agent talks to is saved in Rhinon's own CRM, with the conversation on their record." },
      { title: "A person can take over", body: "Your team sees live chats and can step in, open a ticket or call the visitor from the dashboard." },
      { title: "The follow-up is ready too", body: "Outreach drafts a personal follow-up for each new lead with AI, and sends it once you approve." },
      { title: "The rest of the client journey", body: "Won deals become projects with a client portal, so the lead the bot caught is the same client you deliver for." },
    ],
    fit: [
      { team: "A service business that wants website leads in a pipeline", pick: "rhinon", why: "The AI Agent and the CRM are one product." },
      { team: "A small team without a CRM yet", pick: "rhinon", why: "The CRM, outreach and projects are free for up to 5 people; the AI Agent is on Starter." },
      { team: "A support team that only needs an AI agent", pick: "them", why: "Chatbase is a specialist with more channels and integrations." },
      { team: "A business that wants an AI voice or email agent", pick: "them", why: "Rhinon's AI Agent works in chat only; Chatbase lists voice and email." },
    ],
  },
  "teamwork-alternative": {
    focus: ["chatbot", "crm", "outreach"],
    reasons: [
      { title: "It starts before the project", body: "Teamwork.com is built for delivery. Rhinon also covers the AI Agent on your website, outreach and the pipeline that wins the work." },
      { title: "The won deal is the project", body: "Convert a deal and the project starts with the client and their contacts attached." },
      { title: "AI-drafted follow-ups", body: "Outreach sequences with waits, branches and A/B splits, with AI drafts you approve before they send." },
      { title: "Chat and HR in the same place", body: "Team chat, calls, leave and reviews sit next to the projects your people work on." },
    ],
    fit: [
      { team: "An agency whose bottleneck is winning work", pick: "rhinon", why: "Website agent, outreach and CRM feed the projects directly." },
      { team: "A small team that wants one tool", pick: "rhinon", why: "Sales, delivery, chat and HR in one workspace, free for up to 5 people." },
      { team: "An agency that bills by the hour", pick: "them", why: "Teamwork has time tracking, budgets and invoicing. Rhinon does not yet." },
      { team: "A team running multi-phase projects with resource planning", pick: "them", why: "Teamwork's dependencies and resource planning go deeper." },
    ],
  },
  "freshsales-alternative": {
    focus: ["work", "chatbot", "chat"],
    reasons: [
      { title: "Projects after the sale", body: "Freshsales is a sales CRM. Rhinon turns a won deal into a project with boards, a Gantt and a client portal." },
      { title: "An AI agent on your website", body: "The AI Agent answers from your own content and drops every lead into the pipeline." },
      { title: "Your team's tools included", body: "Chat, docs, attendance, leave and reviews come with the CRM instead of another Freshworks product." },
      { title: "Free to start, not a trial", body: "Freshsales listed a 14-day trial and no free plan when we rechecked on 27 November 2026. Rhinon is free for up to 5 people, with no time limit." },
    ],
    fit: [
      { team: "An IT services firm that delivers projects", pick: "rhinon", why: "Pipeline, project and client portal in one app." },
      { team: "A 5-person team starting out", pick: "rhinon", why: "Free for all 5, with every product except the AI Agent." },
      { team: "A sales team that needs phone and AI scoring", pick: "them", why: "Freshsales has built-in phone and AI lead scoring; Rhinon has neither." },
      { team: "A business already on other Freshworks apps", pick: "them", why: "Staying in one ecosystem may matter more than the extra modules." },
    ],
  },
  "pipedrive-alternative": {
    focus: ["work", "chatbot", "outreach"],
    reasons: [
      { title: "There is a free plan", body: "Pipedrive had no free plan when we checked. Rhinon Tech is free for up to 5 people with no time limit." },
      { title: "Delivery after the deal", body: "A won deal becomes a project with tasks, boards and a portal your client can follow." },
      { title: "Leads arrive on their own", body: "The AI Agent answers website visitors and saves them to the pipeline; Outreach drafts the follow-up." },
      { title: "One app for the team", body: "Chat, docs and HR sit in the same workspace as the pipeline." },
    ],
    fit: [
      { team: "A small agency that wants to start free", pick: "rhinon", why: "Free for up to 5 people; Pipedrive starts paid after the trial." },
      { team: "A service business that delivers what it sells", pick: "rhinon", why: "Pipeline and project delivery in one app." },
      { team: "A large sales team that forecasts every week", pick: "them", why: "Pipedrive's reporting and forecasting go further." },
      { team: "A team that depends on marketplace integrations", pick: "them", why: "Pipedrive's marketplace is much larger." },
    ],
  },
  "notion-alternative": {
    focus: ["crm", "pages", "chatbot"],
    reasons: [
      { title: "A real CRM, no template needed", body: "Pipelines, deal timelines and lead capture are built in, instead of a database you have to design and maintain." },
      { title: "Docs that know which client they belong to", body: "Rhinon Docs nest in a tree next to the client and the project, so the brief is one click from the work." },
      { title: "Leads from your website", body: "The AI Agent answers visitors and saves each one to the CRM." },
      { title: "Chat and HR in the same workspace", body: "Channels, calls, leave and reviews live next to the docs and the projects." },
    ],
    fit: [
      { team: "An agency running its CRM in a Notion database", pick: "rhinon", why: "A native pipeline and deal timeline replace the template." },
      { team: "A service team that wants docs next to client work", pick: "rhinon", why: "Docs, CRM and projects share one workspace." },
      { team: "A team that mainly needs a flexible wiki", pick: "them", why: "Notion's databases and templates are far more flexible." },
      { team: "A team that relies on Notion's integrations", pick: "them", why: "Notion's marketplace is much larger." },
    ],
  },
  "slack-alternative": {
    focus: ["chat", "crm", "work"],
    reasons: [
      { title: "The chat sits next to the work", body: "Channels and calls live in the same app as the client record, the project and the docs, so context is never pasted from another tool." },
      { title: "No 90-day history limit on Free", body: "Slack's free plan had a 90-day message limit when we checked. Rhinon's team chat is part of the free plan for up to 5 people." },
      { title: "Calls and guest links included", body: "Group calls of up to 8 people and guest meeting links for clients come with the chat." },
      { title: "The rest of the business is here too", body: "CRM, projects, docs and HR, so the chat replaces a stack of tools, not only Slack." },
    ],
    fit: [
      { team: "A small service team that wants one app", pick: "rhinon", why: "Chat, CRM, projects and HR, free for up to 5 people." },
      { team: "An agency that chats with clients about projects", pick: "rhinon", why: "Guest meeting links and a client portal sit next to the chat." },
      { team: "A large company built around Slack workflows", pick: "them", why: "Slack's bots, integrations and enterprise controls go much further." },
      { team: "A team that only wants messaging", pick: "them", why: "If chat is all you need, a specialist is the simpler choice." },
    ],
  },
  "bitrix24-alternative": {
    focus: ["crm", "chatbot", "work"],
    reasons: [
      { title: "Focused instead of everything", body: "Bitrix24 covers telephony, a website builder and much more. Rhinon covers what a service business uses: leads, follow-ups, projects and the team." },
      { title: "An AI agent trained on your content", body: "The AI Agent answers from your website, files and help articles, and hands over to your team live." },
      { title: "AI-drafted outreach", body: "Sequences with branches and A/B splits, with a personal AI draft for each lead that you approve." },
      { title: "Set up in an afternoon", body: "Set your pipeline stages, invite your team and you are running." },
    ],
    fit: [
      { team: "A 10-person agency that wants something simple", pick: "rhinon", why: "Fewer modules to configure, built around the client lifecycle." },
      { team: "A team that wants AI on the website and in outreach", pick: "rhinon", why: "The AI Agent and AI drafts are part of the product." },
      { team: "A business that needs telephony or a website builder", pick: "them", why: "Bitrix24 includes both. Rhinon does not." },
      { team: "A company that needs on-premise hosting", pick: "them", why: "Bitrix24 offers it; Rhinon is hosted only." },
    ],
  },
};
