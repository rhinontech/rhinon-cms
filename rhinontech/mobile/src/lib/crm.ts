import type { LeadStatus } from "./types";
import type { Tone } from "@/components/ui/Badge";

export const LEAD_STATUS_TONE: Record<LeadStatus, Tone> = {
  New: "brand",
  Enriched: "brand",
  Enrolled: "brand",
  Emailed: "brand",
  Replied: "success",
  Interested: "success",
  Bounced: "danger",
  Unsubscribed: "warning",
};
