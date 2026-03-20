import mongoose, { Schema, Document } from "mongoose";

export interface IOutreachEmail extends Document {
  email: string;
  type: "primary" | "secondary";
  displayName: string;
  status: "Active" | "Pending";
  userId?: string;
  createdAt: Date;
}

const OutreachEmailSchema = new Schema<IOutreachEmail>({
  email: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ["primary", "secondary"], default: "secondary", index: true },
  displayName: { type: String, required: true },
  status: { type: String, enum: ["Active", "Pending"], default: "Active", index: true },
  userId: { type: String, index: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.OutreachEmail || mongoose.model<IOutreachEmail>("OutreachEmail", OutreachEmailSchema);
