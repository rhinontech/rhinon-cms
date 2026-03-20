import mongoose, { Document, Schema } from "mongoose";

export interface IAuditLog extends Document {
  actorId?: string;
  actorEmail?: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: String, index: true },
    actorEmail: { type: String, index: true },
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true, index: true },
    targetId: { type: String, index: true },
    metadata: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
