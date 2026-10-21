import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

// A dated change to someone's title and/or pay. `before` is snapshotted when the
// revision is applied (not when it's created), so a scheduled revision always
// diffs against what the employee actually had the day before it took effect.
export type RevisionKind = "increment" | "promotion";
export type RevisionStatus = "scheduled" | "applied" | "cancelled";

export interface CompensationSnapshot {
  roleTitle: string | null;
  department: string | null;
  basicSalary: number;
  hra: number;
  ta: number;
  medicalAllowance: number;
  otherAllowances: number;
  annualCompensation: number;
}

interface CompensationRevisionAttributes {
  id: string;
  userId: string;
  kind: RevisionKind;
  effectiveDate: string;
  before: CompensationSnapshot;
  after: CompensationSnapshot;
  reason?: string | null;
  status: RevisionStatus;
  appliedAt?: Date | null;
  createdById: string;
  // Increment / promotion letter sent for e-signing (Document, category "appraisal")
  documentId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CompensationRevision
  extends Model<CompensationRevisionAttributes, Optional<CompensationRevisionAttributes, "id" | "reason" | "status" | "appliedAt" | "documentId">>
  implements CompensationRevisionAttributes
{
  declare id: string;
  declare userId: string;
  declare kind: RevisionKind;
  declare effectiveDate: string;
  declare before: CompensationSnapshot;
  declare after: CompensationSnapshot;
  declare reason: string | null;
  declare status: RevisionStatus;
  declare appliedAt: Date | null;
  declare createdById: string;
  declare documentId: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

CompensationRevision.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    kind: { type: DataTypes.ENUM("increment", "promotion"), allowNull: false },
    effectiveDate: { type: DataTypes.DATEONLY, allowNull: false },
    before: { type: DataTypes.JSONB, allowNull: false },
    after: { type: DataTypes.JSONB, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM("scheduled", "applied", "cancelled"), allowNull: false, defaultValue: "scheduled" },
    appliedAt: { type: DataTypes.DATE, allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: false },
    documentId: { type: DataTypes.UUID, allowNull: true },
  },
  { sequelize, tableName: "compensation_revisions", timestamps: true }
);
