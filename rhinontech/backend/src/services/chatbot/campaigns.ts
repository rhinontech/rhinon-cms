/**
 * Campaign content and targeting, cleaned to the exact shapes the widget reads
 * (bot-sdk/src/types/campaign.types.ts). Content is shown on customers' public
 * sites, so nothing free-form is stored: strings are trimmed and capped, enums
 * are whitelisted, and button links may only be http(s), mailto: or tel:.
 */

const LAYOUTS = ["image-heading-buttons", "image-heading-subheading-button", "heading-buttons", "heading-subheading-button"] as const;
const BUTTON_STYLES = ["primary", "secondary"] as const;
const ACTIONS = ["open-chat", "open-url", "phone-call", "send-message", "copy-coupon", "dismiss"] as const;
const VISITOR_TYPES = ["all", "first-time", "returning"] as const;
const TRIGGERS = ["time-on-page", "exit-intent"] as const;
const FIELDS = ["current-page-url", "referrer-url", "device-type"] as const;
const OPERATORS = ["contains", "equals", "starts-with", "ends-with", "is"] as const;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const pick = <T extends readonly string[]>(v: unknown, allowed: T, fallback: T[number]): T[number] =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T[number]) : fallback;

function safeUrl(v: unknown): string {
  const url = str(v, 1000);
  if (!url) return "";
  if (/^(https?:\/\/|mailto:|tel:)/i.test(url)) return url;
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(url)) return `https://${url}`; // "example.com/x"
  if (url.startsWith("/")) return url; // a path on their own site
  return "";
}

export function cleanContent(raw: unknown) {
  const c = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  const layout = pick(c.layout, LAYOUTS, "heading-buttons");
  const hasImage = layout.startsWith("image");
  const single = layout.endsWith("-button");
  const mediaSrc = safeUrl(c.media?.src);
  const buttons = (Array.isArray(c.buttons) ? c.buttons : [])
    .slice(0, single ? 1 : 3)
    .map((b: Record<string, any>, i: number) => {
      const actionType = pick(b?.actionType, ACTIONS, "open-chat");
      return {
        id: str(b?.id, 40) || String(i + 1),
        text: str(b?.text, 40) || "Learn more",
        style: pick(b?.style, BUTTON_STYLES, i === 0 ? "primary" : "secondary"),
        actionType,
        // The widget reads the action's value from `url` for every action type.
        url:
          actionType === "open-url" ? safeUrl(b?.url)
          : actionType === "phone-call" ? str(b?.url, 30).replace(/[^\d+\s()-]/g, "")
          : actionType === "send-message" || actionType === "copy-coupon" ? str(b?.url, 300)
          : "",
      };
    });
  return {
    templateId: str(c.templateId, 60),
    layout,
    heading: str(c.heading, 120),
    subheading: layout.includes("subheading") ? str(c.subheading, 300) : "",
    hasImage: hasImage && !!mediaSrc,
    media: hasImage && mediaSrc ? { src: mediaSrc, alt: str(c.media?.alt, 120), type: "image" } : null,
    buttons: buttons.length ? buttons : [{ id: "1", text: "Chat with us", style: "primary", actionType: "open-chat", url: "" }],
  };
}

export function cleanTargeting(raw: unknown) {
  const t = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  const triggerType = pick(t.trigger?.type, TRIGGERS, "time-on-page");
  const unit = t.trigger?.unit === "minutes" ? "minutes" : "seconds";
  const value = Math.max(0, Math.min(unit === "minutes" ? 60 : 3600, Math.round(Number(t.trigger?.value) || 0)));
  const conditions = (Array.isArray(t.rules?.conditions) ? t.rules.conditions : [])
    .slice(0, 10)
    .map((c: Record<string, any>) => {
      const field = pick(c?.field, FIELDS, "current-page-url");
      return {
        field,
        operator: field === "device-type" ? "is" : pick(c?.operator, OPERATORS, "contains"),
        value: field === "device-type" ? (c?.value === "mobile" ? "mobile" : "desktop") : str(c?.value, 300),
      };
    })
    .filter((c: { field: string; value: string }) => c.field === "device-type" || c.value);
  return {
    visitorType: pick(t.visitorType, VISITOR_TYPES, "all"),
    trigger: { type: triggerType, value: triggerType === "exit-intent" ? 0 : value, unit },
    rules: { matchType: t.rules?.matchType === "match-any" ? "match-any" : "match-all", conditions },
  };
}
