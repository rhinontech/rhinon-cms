import mongoose, { Schema, Document } from "mongoose";

export interface ILead extends Document {
  name: string;
  company: string;
  title: string;
  email: string;
  linkedinUrl?: string;
  status: "New" | "Enriched" | "Enrolled" | "Emailed" | "Replied" | "Bounced" | "Unsubscribed" | "Interested";
  campaignId: mongoose.Types.ObjectId | null;
  aiDraft?: string;
  source?: string;
  metadata?: any;
  addedAt: Date;
  lastActivityAt?: Date;
}

const LeadSchema = new Schema<ILead>({
  name: { type: String, required: true },
  company: { type: String, required: true },
  title: { type: String },
  email: { type: String, required: true },
  linkedinUrl: { type: String },
  status: { 
    type: String, 
    required: true, 
    enum: ["New", "Enriched", "Enrolled", "Emailed", "Replied", "Bounced", "Unsubscribed", "Interested"],
    default: "New"
  },
  campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", default: null },
  aiDraft: { type: String },
  source: { type: String, default: "Manual" },
  metadata: { type: Schema.Types.Mixed },
  addedAt: { type: Date, default: Date.now },
  lastActivityAt: { type: Date },
});

export default mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);
