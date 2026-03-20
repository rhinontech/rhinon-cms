import dbConnect from "@/lib/mongodb";
import AuditLog from "@/lib/models/AuditLog";
import type { SessionUser } from "@/lib/types";

type AuditEntry = {
  actor?: SessionUser | null;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await dbConnect();
    await AuditLog.create({
      actorId: entry.actor?.id,
      actorEmail: entry.actor?.email,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      metadata: entry.metadata,
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
