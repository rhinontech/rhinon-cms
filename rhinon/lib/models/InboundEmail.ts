import mongoose, { Schema, Document } from "mongoose";

export interface IInboundEmail extends Document {
  messageId: string;
  from: string;
  to: string;
  subject: string;
  snippet?: string;
  s3Key: string;
  isRead: boolean;
  receivedAt: Date;
}

const InboundEmailSchema = new Schema<IInboundEmail>({
  messageId: { type: String, required: true, unique: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  subject: { type: String },
  snippet: { type: String },
  s3Key: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  receivedAt: { type: Date, default: Date.now },
});

export default mongoose.models.InboundEmail || mongoose.model<IInboundEmail>("InboundEmail", InboundEmailSchema);
