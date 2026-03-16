export type LeadStatus = "New" | "Emailed" | "Replied" | "Bounced" | "Unsubscribed" | "Interested";

export interface Lead {
  id: string;
  name: string;
  company: string;
  title: string;
  email: string;
  linkedinUrl?: string;
  status: LeadStatus;
  campaignId: string | null;
  aiDraft?: string;
  source?: string;
  metadata?: any;
  addedAt: string;
  lastActivityAt?: string;
}

export type Channel = "Email" | "LinkedIn DM" | "LinkedIn Connection" | "LinkedIn Post" | "LinkedIn Video" | "LinkedIn Article" | "Cold Email";

export interface Template {
  id: string;
  name: string;
  channel: Channel;
  subject?: string;
  body: string;
  aiInstructions: string;
  mediaUrl?: string;
  visibility?: "PUBLIC" | "CONNECTIONS";
  mediaTitle?: string;
  mediaDescription?: string;
  articleUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type CampaignStage = "Draft" | "Active" | "Paused" | "Completed";

export interface Campaign {
  id: string;
  name: string;
  channel: Channel;
  templateId: string | null;
  stage: CampaignStage;
  leadsProcessed: number;
  leadsTotal: number;
  dailyLimit: number;
  mediaUrl?: string;
  aiDraft?: string;
  visibility?: "PUBLIC" | "CONNECTIONS";
  mediaTitle?: string;
  mediaDescription?: string;
  articleUrl?: string;
  platformPostId?: string;
  socialStats?: {
    likes?: number;
    comments?: number;
    shares?: number;
    impressions?: number;
    lastUpdated?: string;
  };
  startDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialPost {
  id: string;
  name?: string;
  title: string;
  content: string;
  channel: "LinkedIn Post" | "LinkedIn Video" | "LinkedIn Article";
  status: "Draft" | "Scheduled" | "Published" | "Failed";
  scheduledDate?: string;
  mediaUrl?: string;
  mediaTitle?: string;
  mediaDescription?: string;
  articleUrl?: string;
  slug?: string;
  visibility: "PUBLIC" | "CONNECTIONS";
  aiInstructions?: string;
  platformPostId?: string;
  socialStats?: {
    likes?: number;
    comments?: number;
    shares?: number;
    impressions?: number;
    lastUpdated?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AiActivity {
  id: string;
  leadId: string;
  campaignId?: string;
  type: "Enrichment" | "DraftGenerated" | "OutreachSent" | "Discovery" | "Outreach" | "Other";
  content: string;
  generatedContent?: string;
  timestamp: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[]; // array of Permission IDs
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  avatarUrl?: string;
  status: "Active" | "Invited" | "Suspended";
  joinedAt: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  roleSlug: string;
}

export interface MetricCard {
  label: string;
  value: string;
  delta: string;
}

export interface MetricsResponse {
  metrics: MetricCard[];
  queueCount: number;
}

export type HealthNodeState = "unknown" | "healthy" | "missing" | "error";

export interface HealthNode {
  status: HealthNodeState;
  message: string;
}

export interface SystemHealthResponse {
  apollo: HealthNode;
  gemini: HealthNode;
  smtp: HealthNode;
  linkedin: HealthNode;
}
