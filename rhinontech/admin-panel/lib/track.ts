"use client";

import { apiFetch } from "@/lib/api";

type ClientEvent = "upgrade_clicked" | "search_used" | "home_attention_clicked" | "home_quick_action";

/**
 * Records a product event (first-party, see backend services/productEvents.ts).
 * Fire-and-forget: a failed report must never get in the way of what the person did.
 */
export function track(event: ClientEvent, props?: Record<string, string | number>): void {
  apiFetch("/home/events", { method: "POST", body: JSON.stringify({ event, props }) }).catch(() => {});
}
