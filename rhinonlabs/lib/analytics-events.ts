// lib/analytics-events.ts
// GA4 Conversion & Event Tracking Helpers for Rhinon Labs (Audit H-08)

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Send an event to GA4 via gtag. Safely falls back if gtag isn't loaded yet.
 */
export function trackGAEvent(eventName: string, params: Record<string, any> = {}) {
  if (typeof window === "undefined") return;

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  } else if (window.dataLayer && Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: eventName, ...params });
  }
}

/**
 * Fires when a discovery call is booked or contact form submitted (Primary Conversion Key Event)
 */
export function trackGenerateLead(params: {
  lead_type: "call_booked" | "contact_submitted" | "idea_submitted" | "tool_lead";
  source?: string;
  category?: string;
  value?: number;
}) {
  trackGAEvent("generate_lead", {
    event_category: "Leads",
    event_label: params.lead_type,
    lead_source: params.source || "website",
    ...params,
  });
}

/**
 * Fires when a visitor opens the booking form or modal (KPI: Open vs Completed conversion rate)
 */
export function trackBookCallOpen(location?: string) {
  trackGAEvent("book_call_open", {
    event_category: "Engagement",
    event_label: location || "modal",
  });
}

/**
 * Fires on WhatsApp link clicks
 */
export function trackClickWhatsApp(location?: string) {
  trackGAEvent("click_whatsapp", {
    event_category: "Contact",
    event_label: location || "whatsapp_button",
    destination: "https://wa.me/918249291789",
  });
}

/**
 * Fires on Phone (tel:) link clicks
 */
export function trackClickPhone(location?: string) {
  trackGAEvent("click_phone", {
    event_category: "Contact",
    event_label: location || "phone_link",
    destination: "+918249291789",
  });
}

/**
 * Fires when a user completes a free interactive tool
 */
export function trackToolComplete(toolName: string, extra?: Record<string, any>) {
  trackGAEvent("tool_complete", {
    event_category: "Tools",
    event_label: toolName,
    ...extra,
  });
}

/**
 * Helper to get current UTM parameters from URL search params or referrer
 */
export function getUtmParams(): Record<string, string | undefined> {
  if (typeof window === "undefined") return {};
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get("utm_source") || undefined,
      utmMedium: params.get("utm_medium") || undefined,
      utmCampaign: params.get("utm_campaign") || undefined,
      utmTerm: params.get("utm_term") || undefined,
      utmContent: params.get("utm_content") || undefined,
      referrer: document.referrer || undefined,
      landingPath: window.location.pathname,
    };
  } catch {
    return {};
  }
}
