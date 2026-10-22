import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/**
 * Who did what, in which workspace. Append-only by convention: nothing in the
 * API updates or deletes a row, and the only thing that ever removes them is
 * purging the whole workspace.
 *
 * `metadata` is for small, non-sensitive context (which plan, which role) —
 * never request bodies, which would put passwords and payroll figures in a table
 * whose whole purpose is to be shown to administrators.
 */
interface AuditLogAttributes {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  createdAt?: Date;
}

interface AuditLogCreationAttributes
  extends Optional<AuditLogAttributes, "id" | "actorId" | "actorName" | "entityType" | "entityId" | "metadata" | "ip"> {}

export class AuditLog
  extends Model<AuditLogAttributes, AuditLogCreationAttributes>
  implements AuditLogAttributes
{
  declare id: string;
  declare actorId: string | null;
  declare actorName: string | null;
  declare action: string;
  declare entityType: string | null;
  declare entityId: string | null;
  declare metadata: Record<string, unknown> | null;
  declare ip: string | null;
  declare readonly createdAt: Date;
}

AuditLog.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    // Deliberately NOT a foreign key: the trail must outlive the user it names.
    actorId: { type: DataTypes.UUID, allowNull: true },
    actorName: { type: DataTypes.STRING, allowNull: true },
    action: { type: DataTypes.STRING(120), allowNull: false },
    entityType: { type: DataTypes.STRING(60), allowNull: true },
    entityId: { type: DataTypes.STRING(64), allowNull: true },
    metadata: { type: DataTypes.JSONB, allowNull: true },
    ip: { type: DataTypes.STRING(64), allowNull: true },
  },
  {
    sequelize,
    tableName: "audit_logs",
    timestamps: true,
    updatedAt: false,
    indexes: [{ fields: ["organizationId", "createdAt"] }, { fields: ["organizationId", "action"] }],
  }
);
