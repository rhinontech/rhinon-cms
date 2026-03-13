import mongoose, { Schema, Document } from "mongoose";

export interface ITemplate extends Document {
  name: string;
  channel: "Email" | "LinkedIn DM" | "LinkedIn Connection";
  subject?: string;
  body: string;
  aiInstructions: string;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema = new Schema<ITemplate>({
  name: { type: String, required: true },
  channel: { type: String, required: true, enum: ["Email", "LinkedIn DM", "LinkedIn Connection"] },
  subject: { type: String },
  body: { type: String, required: true },
  aiInstructions: { type: String },
}, { timestamps: true });

export default mongoose.models.Template || mongoose.model<ITemplate>("Template", TemplateSchema);
