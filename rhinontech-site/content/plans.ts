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
  "Team chat, calls and Pages",
  "HR, attendance, leave and payroll",
];

export const CHATBOT_FEATURES = [
  "AI chatbot trained on your site and docs",
  "Live chat and handover to your team",
  "Voice calls from the website",
  "Tickets and a help center",
  "Leads saved straight to your CRM",
];
