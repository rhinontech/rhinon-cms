import mongoose, { Schema, Document } from "mongoose";

export interface IAiActivity extends Document {
  leadId: mongoose.Types.ObjectId;
  campaignId?: mongoose.Types.ObjectId;
  type: "Enrichment" | "DraftGenerated" | "OutreachSent" | "Other";
  content: string;
  timestamp: Date;
}

const AiActivitySchema = new Schema<IAiActivity>({
  leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
  campaignId: { type: Schema.Types.ObjectId, ref: "Campaign" },
  type: { 
    type: String, 
    enum: ["Enrichment", "DraftGenerated", "OutreachSent", "Other"],
    required: true,
    default: "Other"
  },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

if (mongoose.models.AiActivity) {
  delete mongoose.models.AiActivity;
}

export default mongoose.model<IAiActivity>("AiActivity", AiActivitySchema);
