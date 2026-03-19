import mongoose, { Schema, Document } from "mongoose";

export interface IOutreachEmail extends Document {
  email: string;
  type: "primary" | "secondary";
  displayName: string;
  status: "Active" | "Pending";
  createdAt: Date;
}

const OutreachEmailSchema = new Schema<IOutreachEmail>({
  email: { type: String, required: true, unique: true },
  type: { type: String, enum: ["primary", "secondary"], default: "secondary" },
  displayName: { type: String, required: true },
  status: { type: String, enum: ["Active", "Pending"], default: "Active" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.OutreachEmail || mongoose.model<IOutreachEmail>("OutreachEmail", OutreachEmailSchema);
