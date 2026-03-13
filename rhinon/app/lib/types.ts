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
  addedAt: string;
  lastActivityAt?: string;
}

export type Channel = "Email" | "LinkedIn DM" | "LinkedIn Connection";

export interface Template {
  id: string;
  name: string;
  channel: Channel;
  subject?: string;
  body: string;
  aiInstructions: string;
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
  startDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiActivity {
  id: string;
  leadId: string;
  campaignId: string;
  generatedContent: string;
  status: "Pending Review" | "Sent" | "Rejected";
  generatedAt: string;
  sentAt?: string;
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
