/**
 * Rhinon Labs' own usage of Rhinon Tech: the only proof the site may show until real customers
 * give written permission (claims register, docs/RHINONTECH_WEBSITE_REVAMP.md §2.6).
 * Aggregate counts read from the production database on 26 November 2026 (read-only), for
 * Rhinon's own workspace. Re-pull them before changing any number; there were 0 deals and no
 * deal → project conversions, so never cite those.
 */

export const PROOF_AS_OF = "26 November 2026";

export const PROOF_FIGURES = [
  { big: "5,503", label: "leads in the CRM", note: "Mostly imported prospect lists" },
  { big: "10,268", label: "outreach emails sent", note: "To 5,496 leads, 19 May to 16 November" },
  { big: "9,261", label: "AI drafts written", note: "From research on each lead" },
  { big: "643", label: "tasks across 9 projects", note: "Client and internal work since May" },
  { big: "127", label: "requests logged against projects", note: "Turned into tasks where needed" },
  { big: "11", label: "people in the workspace", note: "One login for all of it" },
];
