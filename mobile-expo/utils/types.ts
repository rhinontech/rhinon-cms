export type LeadStatus = "New" | "Emailed" | "Replied" | "Bounced" | "Unsubscribed" | "Interested";

export interface Lead {
  id: string;
  _id?: string; // MongoDB ID if used
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

export interface Campaign {
  id: string;
  name: string;
  channel: Channel;
  templateId: string | null;
  stage: "Draft" | "Active" | "Paused" | "Completed";
  leadsProcessed: number;
  leadsTotal: number;
  dailyLimit: number;
  startDate: string;
  createdAt: string;
  updatedAt: string;
}
