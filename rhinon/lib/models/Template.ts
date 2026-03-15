import mongoose, { Schema, Document } from "mongoose";

export interface ITemplate extends Document {
  name: string;
  channel: "Cold Email" | "LinkedIn Post" | "LinkedIn Video" | "LinkedIn Article";
  subject?: string;
  body: string;
  aiInstructions: string;
  mediaUrl?: string;
  visibility?: "PUBLIC" | "CONNECTIONS";
  mediaTitle?: string;
  mediaDescription?: string;
  articleUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema = new Schema<ITemplate>({
  name: { type: String, required: true },
  channel: { type: String, required: true, enum: ["Cold Email", "LinkedIn Post", "LinkedIn Video", "LinkedIn Article"] },
  subject: { type: String },
  body: { type: String, required: true },
  aiInstructions: { type: String },
  mediaUrl: { type: String },
  visibility: { type: String, enum: ["PUBLIC", "CONNECTIONS"], default: "PUBLIC" },
  mediaTitle: { type: String },
  mediaDescription: { type: String },
  articleUrl: { type: String },
}, { timestamps: true });

// In development, the model might already be registered with an old schema.
// This block ensures the Template model is updated when the file changes.
if (process.env.NODE_ENV === "development" && mongoose.models.Template) {
  delete mongoose.models.Template;
}

export default mongoose.models.Template || mongoose.model<ITemplate>("Template", TemplateSchema);
