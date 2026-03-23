import mongoose, { Schema, Document } from "mongoose";

export interface ICampaign extends Document {
  name: string;
  channel: "Email" | "Cold Email" | "LinkedIn DM" | "LinkedIn Connection" | "LinkedIn Post" | "LinkedIn Video" | "LinkedIn Article";
  templateId: mongoose.Types.ObjectId | null;
  stage: "Draft" | "Active" | "Paused" | "Completed";
  leadsProcessed: number;
  leadsTotal: number;
  dailyLimit: number;
  audienceGroupName?: string;
  objective?: string;
  notes?: string;
  targetCompanies?: string[];
  sourceFilters?: string[];
  statusFilters?: string[];
  leadIds?: mongoose.Types.ObjectId[];
  autoEnrollMatchingLeads?: boolean;
  mediaUrl?: string;
  aiDraft?: string;
  visibility?: "PUBLIC" | "CONNECTIONS";
  mediaTitle?: string;
  mediaDescription?: string;
  articleUrl?: string;
  slug?: string;
  platformPostId?: string;
  socialStats?: {
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
    lastUpdated?: Date;
  };
  startDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>({
  name: { type: String, required: true },
  channel: { 
    type: String, 
    required: true, 
    enum: ["Email", "Cold Email", "LinkedIn DM", "LinkedIn Connection", "LinkedIn Post", "LinkedIn Video", "LinkedIn Article"] 
  },
  templateId: { type: Schema.Types.ObjectId, ref: "Template", default: null },
  stage: { type: String, required: true, enum: ["Draft", "Active", "Paused", "Completed"], default: "Draft" },
  leadsProcessed: { type: Number, default: 0 },
  leadsTotal: { type: Number, default: 0 },
  dailyLimit: { type: Number, default: 50 },
  audienceGroupName: { type: String },
  objective: { type: String },
  notes: { type: String },
  targetCompanies: [{ type: String }],
  sourceFilters: [{ type: String }],
  statusFilters: [{ type: String }],
  leadIds: [{ type: Schema.Types.ObjectId, ref: "Lead" }],
  autoEnrollMatchingLeads: { type: Boolean, default: false },
  mediaUrl: { type: String },
  aiDraft: { type: String },
  visibility: { type: String, enum: ["PUBLIC", "CONNECTIONS"], default: "PUBLIC" },
  mediaTitle: { type: String },
  mediaDescription: { type: String },
  articleUrl: { type: String },
  slug: { type: String, unique: true, sparse: true },
  platformPostId: { type: String },
  socialStats: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    lastUpdated: { type: Date }
  },
  startDate: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.Campaign || mongoose.model<ICampaign>("Campaign", CampaignSchema);
