import { API_URL } from "@/lib/api";

/**
 * Campaign building blocks, in the widget's own shapes
 * (bot-sdk/src/types/campaign.types.ts). The backend cleans them again
 * (services/chatbot/campaigns.ts) before they reach a customer's site.
 */

export type CampaignLayout = "image-heading-buttons" | "image-heading-subheading-button" | "heading-buttons" | "heading-subheading-button";
export type ButtonAction = "open-chat" | "open-url" | "phone-call" | "send-message" | "copy-coupon" | "dismiss";

export interface CampaignButton {
  id: string;
  text: string;
  style: "primary" | "secondary";
  actionType: ButtonAction;
  /** The action's value: link, phone number, SMS number or coupon code. */
  url: string;
}

export interface CampaignContent {
  templateId: string;
  layout: CampaignLayout;
  heading: string;
  subheading: string;
  hasImage: boolean;
  media: { src: string; alt: string; type: "image" } | null;
  buttons: CampaignButton[];
}

export interface CampaignCondition {
  field: "current-page-url" | "referrer-url" | "device-type";
  operator: "contains" | "equals" | "starts-with" | "ends-with" | "is";
  value: string;
}

export interface CampaignTargeting {
  visitorType: "all" | "first-time" | "returning";
  trigger: { type: "time-on-page" | "exit-intent"; value: number; unit: "seconds" | "minutes" };
  rules: { matchType: "match-all" | "match-any"; conditions: CampaignCondition[] };
}

export interface Campaign {
  id: string;
  name: string;
  type: "recurring" | "one-time";
  status: "draft" | "active" | "paused";
  content: CampaignContent;
  targeting: CampaignTargeting;
  startsAt: string | null;
  endsAt: string | null;
  impressions: number;
  clicks: number;
  closes: number;
  createdAt: string;
  updatedAt: string;
}

export const LAYOUTS: { value: CampaignLayout; label: string; hint: string }[] = [
  { value: "image-heading-buttons", label: "Image + buttons", hint: "Picture, heading, up to 3 buttons" },
  { value: "image-heading-subheading-button", label: "Image + text", hint: "Picture, heading, text, 1 button" },
  { value: "heading-buttons", label: "Buttons", hint: "Heading and up to 3 buttons" },
  { value: "heading-subheading-button", label: "Text", hint: "Heading, text and 1 button" },
];

export const ACTIONS: { value: ButtonAction; label: string; valueLabel?: string; placeholder?: string }[] = [
  { value: "open-chat", label: "Open the chat" },
  { value: "open-url", label: "Go to a link", valueLabel: "Link", placeholder: "https://yoursite.com/pricing or /pricing" },
  { value: "phone-call", label: "Call a number", valueLabel: "Phone number", placeholder: "+91 98765 43210" },
  { value: "send-message", label: "Send an SMS", valueLabel: "Phone number", placeholder: "+91 98765 43210" },
  { value: "copy-coupon", label: "Copy a coupon code", valueLabel: "Coupon code", placeholder: "WELCOME20" },
  { value: "dismiss", label: "Just close it" },
];

export const DEFAULT_TARGETING: CampaignTargeting = {
  visitorType: "all",
  trigger: { type: "time-on-page", value: 5, unit: "seconds" },
  rules: { matchType: "match-all", conditions: [] },
};

export type TemplateCategory = "Greet and inform" | "Promote and convert" | "Generate leads";

export interface CampaignTemplate {
  id: string;
  category: TemplateCategory;
  title: string;
  description: string;
  type: "recurring" | "one-time";
  content: Omit<CampaignContent, "templateId">;
  targeting?: Partial<CampaignTargeting>;
}

/** Our own default image (served next to the widget), until they upload one. */
const IMAGE = () => ({ src: `${API_URL}/widget/assets/background.jpg`, alt: "", type: "image" as const });
const btn = (id: string, text: string, actionType: ButtonAction, style: "primary" | "secondary" = "secondary", url = ""): CampaignButton => ({ id, text, actionType, style, url });

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: "offer-instant-help",
    category: "Greet and inform",
    title: "Offer instant help",
    description: "Invite visitors who linger to ask a question.",
    type: "recurring",
    content: {
      layout: "image-heading-buttons",
      heading: "Questions? We reply in minutes.",
      subheading: "",
      hasImage: true,
      media: IMAGE(),
      buttons: [btn("1", "Chat with us", "open-chat", "primary"), btn("2", "See pricing", "open-url", "secondary", "/pricing")],
    },
    targeting: { trigger: { type: "time-on-page", value: 20, unit: "seconds" } },
  },
  {
    id: "welcome-visitors",
    category: "Greet and inform",
    title: "Welcome first-time visitors",
    description: "A friendly hello for people new to your site.",
    type: "one-time",
    content: {
      layout: "heading-buttons",
      heading: "👋 Welcome! What brings you here today?",
      subheading: "",
      hasImage: false,
      media: null,
      buttons: [btn("1", "I have a project in mind", "open-chat", "primary"), btn("2", "Just browsing", "dismiss")],
    },
    targeting: { visitorType: "first-time", trigger: { type: "time-on-page", value: 8, unit: "seconds" } },
  },
  {
    id: "share-update",
    category: "Greet and inform",
    title: "Share an update",
    description: "Announce news, a launch or a change visitors should know about.",
    type: "recurring",
    content: {
      layout: "image-heading-subheading-button",
      heading: "We've just launched something new",
      subheading: "Take a look at what's changed and how it helps you.",
      hasImage: true,
      media: IMAGE(),
      buttons: [btn("1", "Read more", "open-url", "primary", "/blogs")],
    },
  },
  {
    id: "hook-leaving-visitors",
    category: "Promote and convert",
    title: "Catch leaving visitors",
    description: "One last offer when someone is about to leave.",
    type: "one-time",
    content: {
      layout: "image-heading-buttons",
      heading: "Before you go — get a free project estimate",
      subheading: "",
      hasImage: true,
      media: IMAGE(),
      buttons: [btn("1", "Get my estimate", "open-chat", "primary"), btn("2", "No thanks", "dismiss")],
    },
    targeting: { trigger: { type: "exit-intent", value: 0, unit: "seconds" } },
  },
  {
    id: "promote-offer",
    category: "Promote and convert",
    title: "Promote an offer",
    description: "Give visitors a coupon code they can copy in one click.",
    type: "recurring",
    content: {
      layout: "heading-subheading-button",
      heading: "20% off your first project",
      subheading: "Use the code below when you get in touch. Valid this month only.",
      hasImage: false,
      media: null,
      buttons: [btn("1", "Copy code WELCOME20", "copy-coupon", "primary", "WELCOME20")],
    },
  },
  {
    id: "pricing-page-nudge",
    category: "Promote and convert",
    title: "Nudge on the pricing page",
    description: "Help visitors comparing prices decide.",
    type: "recurring",
    content: {
      layout: "heading-buttons",
      heading: "Not sure which plan fits? Ask us.",
      subheading: "",
      hasImage: false,
      media: null,
      buttons: [btn("1", "Talk to us", "open-chat", "primary"), btn("2", "Book a call", "open-url", "secondary", "/contact")],
    },
    targeting: {
      trigger: { type: "time-on-page", value: 15, unit: "seconds" },
      rules: { matchType: "match-all", conditions: [{ field: "current-page-url", operator: "contains", value: "/pricing" }] },
    },
  },
  {
    id: "grow-audience",
    category: "Generate leads",
    title: "Grow your audience",
    description: "Invite readers to get your updates.",
    type: "one-time",
    content: {
      layout: "heading-buttons",
      heading: "Get our best ideas in your inbox",
      subheading: "",
      hasImage: false,
      media: null,
      buttons: [btn("1", "Subscribe", "open-chat", "primary"), btn("2", "Maybe later", "dismiss")],
    },
    targeting: { trigger: { type: "time-on-page", value: 45, unit: "seconds" } },
  },
  {
    id: "free-resource",
    category: "Generate leads",
    title: "Offer a free resource",
    description: "Trade a guide, checklist or template for a lead.",
    type: "recurring",
    content: {
      layout: "image-heading-subheading-button",
      heading: "Free guide: Planning your MVP",
      subheading: "A practical checklist to scope, budget and launch your first version.",
      hasImage: true,
      media: IMAGE(),
      buttons: [btn("1", "Get the guide", "open-chat", "primary")],
    },
  },
  {
    id: "book-a-call",
    category: "Generate leads",
    title: "Book a call",
    description: "Turn interested visitors into meetings.",
    type: "recurring",
    content: {
      layout: "image-heading-subheading-button",
      heading: "Have a project in mind?",
      subheading: "Book a free 20-minute call with our team — no obligation.",
      hasImage: true,
      media: IMAGE(),
      buttons: [btn("1", "Book a call", "open-url", "primary", "/contact")],
    },
    targeting: { visitorType: "returning" },
  },
];

export const BLANK_CONTENT: Omit<CampaignContent, "templateId"> = {
  layout: "heading-buttons",
  heading: "",
  subheading: "",
  hasImage: false,
  media: null,
  buttons: [btn("1", "Chat with us", "open-chat", "primary")],
};

export function fromTemplate(t: CampaignTemplate | null): { name: string; type: Campaign["type"]; content: CampaignContent; targeting: CampaignTargeting } {
  const base = t?.content ?? BLANK_CONTENT;
  return {
    name: t?.title ?? "Untitled campaign",
    type: t?.type ?? "recurring",
    content: { ...base, templateId: t?.id ?? "blank", buttons: base.buttons.map((b) => ({ ...b })) },
    targeting: {
      ...DEFAULT_TARGETING,
      ...(t?.targeting ?? {}),
      trigger: { ...DEFAULT_TARGETING.trigger, ...(t?.targeting?.trigger ?? {}) },
      rules: { ...DEFAULT_TARGETING.rules, ...(t?.targeting?.rules ?? {}), conditions: [...(t?.targeting?.rules?.conditions ?? [])] },
    },
  };
}

/** One-line description of who sees it and when, for the list and the editor. */
export function describeTargeting(t: CampaignTargeting): string {
  const who = t.visitorType === "first-time" ? "First-time visitors" : t.visitorType === "returning" ? "Returning visitors" : "All visitors";
  const when =
    t.trigger.type === "exit-intent"
      ? "when they're about to leave"
      : t.trigger.value
        ? `after ${t.trigger.value} ${t.trigger.value === 1 ? t.trigger.unit.replace(/s$/, "") : t.trigger.unit} on a page`
        : "as soon as a page loads";
  const where = t.rules.conditions.length
    ? ` · ${t.rules.conditions.length} page rule${t.rules.conditions.length === 1 ? "" : "s"}`
    : "";
  return `${who}, ${when}${where}`;
}
