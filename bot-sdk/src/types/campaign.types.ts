// Campaign type definitions

export interface ButtonElement {
  id: string;
  text: string;
  url: string;
  style: 'primary' | 'secondary' | 'danger';
  actionType?: 'open-url' | 'open-chat' | 'dismiss' | 'phone-call' | 'send-message' | 'copy-coupon' | 'open-moment';
}

export interface TemplateMedia {
  src: string;
  alt: string;
  type: string;
}

export interface CampaignContent {
  media: TemplateMedia | null;
  layout: string;
  buttons: ButtonElement[];
  heading: string;
  hasImage: boolean;
  subheading: string;
  templateId: string;
}

export interface CampaignCondition {
  field: string;
  operator: string;
  value: string;
}

export interface CampaignRules {
  matchType: 'match-all' | 'match-any';
  conditions: CampaignCondition[];
}

export interface CampaignTrigger {
  /** exit-intent: the mouse heads for the tab bar (desktop) or the visitor scrolls 70% down (mobile). */
  type: 'time-on-page' | 'exit-intent';
  value: number;
  unit: 'seconds' | 'minutes';
}

export interface CampaignTargeting {
  visitorType: 'all' | 'first-time' | 'returning';
  trigger: CampaignTrigger;
  rules: CampaignRules;
}

export interface Campaign {
  id: number | string;
  organization_id: number;
  type: 'recurring' | 'one-time';
  status: string;
  content: CampaignContent;
  targeting: CampaignTargeting;
  created_at: string;
  updated_at: string;
}

export interface VisitorData {
  isReturning: boolean;
  timeOnPage: number;
  currentUrl: string;
  referrerUrl: string;
  /** Exit intent has fired on this page. */
  exitIntent?: boolean;
  isMobile?: boolean;
}

export interface CampaignView {
  count: number;
  lastView: number;
  views: number[];
}

export interface CampaignViews {
  [campaignId: string]: CampaignView;
}
