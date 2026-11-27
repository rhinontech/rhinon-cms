/**
 * The Free plan's limits. Mirrors `free` in rhinontech/backend/src/config/plans.ts:
 * change both together, or the site promises something the product won't do.
 */
export const FREE_PLAN = { seats: 5, emailsPerDay: 50, aiDraftsPerDay: 20 } as const;

/** One line every page can use to state what Free includes. */
export const FREE_LIMITS_LINE = `Free for up to ${FREE_PLAN.seats} people`;

/** What each plan includes, shared by the home page and the pricing page. */
export const FREE_FEATURES = [
  `Up to ${FREE_PLAN.seats} people, ${FREE_PLAN.emailsPerDay} emails and ${FREE_PLAN.aiDraftsPerDay} AI drafts a day`,
  "CRM, deals and pipeline",
  "AI email outreach",
  "Team inbox",
  "Projects and client portal",
  "Team chat, calls and Docs",
  "HR, attendance, leave and payroll",
];

/** Mirrors `starter` in rhinontech/backend/src/config/plans.ts. Sold by talking to us until checkout exists. */
export const STARTER_PLAN = { seats: 25, emailsPerDay: 500, aiDraftsPerDay: 200, aiAgentRepliesPerDay: 1000 } as const;

export const STARTER_FEATURES = [
  `Up to ${STARTER_PLAN.seats} people, ${STARTER_PLAN.emailsPerDay} emails and ${STARTER_PLAN.aiDraftsPerDay} AI drafts a day`,
  "Everything in Free",
  "The AI Agent on your website",
  `${STARTER_PLAN.aiAgentRepliesPerDay.toLocaleString("en-IN")} AI Agent replies a day`,
  "Send from your own email domain",
];

/** Mirrors `enterprise` in config/plans.ts: no seat, email or AI caps; up to 3 AI Agents. */
export const ENTERPRISE_PLAN = { aiAgents: 3 } as const;

/** One row per plan limit, for the pricing comparison table. */
export const PLAN_LIMITS: { label: string; free: string; starter: string; enterprise: string }[] = [
  { label: "People", free: String(FREE_PLAN.seats), starter: String(STARTER_PLAN.seats), enterprise: "Unlimited" },
  { label: "Emails sent a day", free: String(FREE_PLAN.emailsPerDay), starter: String(STARTER_PLAN.emailsPerDay), enterprise: "Unlimited" },
  { label: "AI drafts a day", free: String(FREE_PLAN.aiDraftsPerDay), starter: String(STARTER_PLAN.aiDraftsPerDay), enterprise: "Unlimited" },
  { label: "AI Agent on your website", free: "—", starter: "1", enterprise: `Up to ${ENTERPRISE_PLAN.aiAgents}` },
  { label: "AI Agent replies a day", free: "—", starter: STARTER_PLAN.aiAgentRepliesPerDay.toLocaleString("en-IN"), enterprise: "Unlimited" },
  { label: "Send from your own email domain", free: "—", starter: "Yes", enterprise: "Yes" },
  { label: "CRM, outreach, inbox, projects, chat, docs, HR and payroll", free: "Yes", starter: "Yes", enterprise: "Yes" },
];

export const CHATBOT_FEATURES = [
  "AI chatbot trained on your site and docs",
  "Live chat and handover to your team",
  "Voice calls from the website",
  "Tickets and a help center",
  "Leads saved straight to your CRM",
];
