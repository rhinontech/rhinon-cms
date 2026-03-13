import mongoose, { Schema, Document } from "mongoose";

export interface ICampaign extends Document {
  name: string;
  channel: "Email" | "LinkedIn DM" | "LinkedIn Connection";
  templateId: mongoose.Types.ObjectId | null;
  stage: "Draft" | "Active" | "Paused" | "Completed";
  leadsProcessed: number;
  leadsTotal: number;
  dailyLimit: number;
  startDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>({
  name: { type: String, required: true },
  channel: { type: String, required: true, enum: ["Email", "LinkedIn DM", "LinkedIn Connection"] },
  templateId: { type: Schema.Types.ObjectId, ref: "Template", default: null },
  stage: { type: String, required: true, enum: ["Draft", "Active", "Paused", "Completed"], default: "Draft" },
  leadsProcessed: { type: Number, default: 0 },
  leadsTotal: { type: Number, default: 0 },
  dailyLimit: { type: Number, default: 50 },
  startDate: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.Campaign || mongoose.model<ICampaign>("Campaign", CampaignSchema);
