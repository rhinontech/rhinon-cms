export type CampaignStage = "Draft" | "Active" | "Paused" | "Completed";
export type CampaignChannel =
  | "Email"
  | "Cold Email"
  | "LinkedIn DM"
  | "LinkedIn Connection"
  | "LinkedIn Post"
  | "LinkedIn Video"
  | "LinkedIn Article";

export interface Campaign {
  id: string;
  name: string;
  channel: CampaignChannel;
  stage: CampaignStage;
  leadsProcessed: number;
  leadsTotal: number;
  autoSend: boolean;
  startDate: string;
  runTime: string;
  objective?: string;
  notes?: string;
  // Email content, authored directly on the campaign (Email/Cold Email channels).
  subject?: string | null;
  body?: string | null;
  senderEmail?: string | null;
  senderName?: string | null;
  // Still used by LinkedIn Publishing / Manual Send, which keep a shared template library.
  templateId?: string | null;
  template?: { name: string } | null;
  // Social fields
  aiDraft?: string | null;
  mediaUrl?: string | null;
  visibility?: "PUBLIC" | "CONNECTIONS";
  mediaTitle?: string | null;
  mediaDescription?: string | null;
  articleUrl?: string | null;
  platformPostId?: string | null;
  organizationId?: string | null;
  socialStats?: { likes: number; comments: number; shares: number; impressions: number; lastUpdated?: string } | null;
  createdAt?: string;
}

export interface CampaignLead {
  id: string;
  name: string;
  company: string;
  email: string;
  title?: string | null;
  status: string;
  source?: string;
  aiDraft?: string | null;
  draftSubject?: string | null;
  draftApproved?: boolean;
  emailOpened?: boolean;
  openedAt?: string | null;
}

export interface Template {
  id: string;
  name: string;
  channel?: string;
  subject?: string;
  body?: string;
  imageUrl?: string | null;
}

export interface CampaignFunnel {
  enrolled: number;
  drafted: number;
  approved: number;
  sent: number;
  opened: number;
  replied: number;
  bounced: number;
}

export interface CampaignStats {
  funnel: CampaignFunnel;
  series: { date: string; drafted: number; sent: number; replied: number }[];
}

export interface LinkedInStatus {
  connected: boolean;
  isExpired?: boolean;
  profile?: { name?: string } | null;
}
