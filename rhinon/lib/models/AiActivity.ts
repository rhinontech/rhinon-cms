import mongoose, { Schema, Document } from "mongoose";

export interface IAiActivity extends Document {
  leadId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  generatedContent: string;
  status: "Pending Review" | "Sent" | "Rejected";
  generatedAt: Date;
  sentAt?: Date;
}

const AiActivitySchema = new Schema<IAiActivity>({
  leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
  campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
  generatedContent: { type: String, required: true },
  status: { type: String, enum: ["Pending Review", "Sent", "Rejected"], default: "Pending Review" },
  generatedAt: { type: Date, default: Date.now },
  sentAt: { type: Date },
});

export default mongoose.models.AiActivity || mongoose.model<IAiActivity>("AiActivity", AiActivitySchema);
