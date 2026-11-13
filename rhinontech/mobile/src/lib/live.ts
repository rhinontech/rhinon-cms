/**
 * The bridge between the app's store and the Rhinon API.
 *
 * Each domain file (live-work, live-time, …) registers a module with `defineLive`: how to fetch it,
 * how to blank its sample data and which store actions should call the API. This file runs them all.
 */
import { getSession } from "./api";
import { liveModules, write } from "./live-core";
import { actions, resetState } from "./store";

import "./live-people";
import "./live-work";
import "./live-time";
import "./live-chat";
import "./live-brand";
import "./live-inbox";
import "./live-approvals";
import "./live-money";
import "./live-crm";
import "./live-ops";
import "./live-pages";
import "./live-platform";
import "./live-outreach";
import "./live-analytics";
import "./live-chatbot";
import "./live-content";

export { loadChatMessages } from "./live-chat";
export { loadTaskComments } from "./live-work";
export { ago } from "./live-core";
export { loadActivities } from "./live-crm";
export { loadThread } from "./live-inbox";
export { loadPage, createPageRemote } from "./live-pages";
export { loadTicket } from "./live-chatbot";
export { signDocument } from "./live-ops";
export { submitClaim } from "./live-money";
export { startDmRemote } from "./live-chat";
export { createMeetingRemote } from "./live-people";
export { loadEventGuests } from "./live-content";
export { useLoad } from "./use-load";

/** Blank every connected module so sample data never shows next to a real account. */
export function blankLive() {
  liveModules().forEach((m) => m.blank?.());
}

export async function syncAll(): Promise<void> {
  if (!getSession()) return;
  const all = liveModules();
  // the brand (site) must be known before the brand-scoped modules ask for their data
  await all.find((m) => m.name === "brands")?.sync().catch(() => {});
  await Promise.allSettled(all.filter((m) => m.name !== "brands").map((m) => m.sync()));
}

let installed = false;
export function installLive() {
  if (installed) return;
  installed = true;
  const orig = { ...actions };
  liveModules().forEach((m) => m.install?.({ orig, write }));
}

/** Called when someone signs out: drop everything fetched for them. */
export { resetState as clearLive };
