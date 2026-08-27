import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/**
 * Human + system timeline entries against a lead / account / deal.
 *
 * Deliberately separate from CampaignActivity: that table is owned by the
 * outreach engine (Enrichment / DraftGenerated / OutreachSent / ...) and is
 * load-bearing for campaign dispatch. This one records what *people* did —
 * calls, notes, meetings — plus CRM-side system events like stage changes.
 * GET /activities/timeline merges both so the lead view reads as one story.
 */
export type ActivityType =
  | "Note" | "Call" | "Meeting" | "Email" | "Task"
  | "StageChange" | "LifecycleChange" | "OwnerChange" | "System";

export type ActivityDirection = "Inbound" | "Outbound";

interface ActivityAttributes {
  id: string;
  leadId?: string | null;
  accountId?: string | null;
  dealId?: string | null;
  userId?: string | null;
  type: ActivityType;
  subject?: string | null;
  body?: string | null;
  direction?: ActivityDirection | null;
  durationMinutes?: number | null;
  occurredAt: Date;
  metadata?: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ActivityCreationAttributes
  extends Optional<
    ActivityAttributes,
    | "id" | "leadId" | "accountId" | "dealId" | "userId" | "subject" | "body"
    | "direction" | "durationMinutes" | "occurredAt" | "metadata"
  > {}

export class Activity extends Model<ActivityAttributes, ActivityCreationAttributes> implements ActivityAttributes {
  declare id: string;
  declare leadId: string | null;
  declare accountId: string | null;
  declare dealId: string | null;
  declare userId: string | null;
  declare type: ActivityType;
  declare subject: string | null;
  declare body: string | null;
  declare direction: ActivityDirection | null;
  declare durationMinutes: number | null;
  declare occurredAt: Date;
  declare metadata: Record<string, any> | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Activity.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    leadId: { type: DataTypes.UUID, allowNull: true },
    accountId: { type: DataTypes.UUID, allowNull: true },
    dealId: { type: DataTypes.UUID, allowNull: true },
    userId: { type: DataTypes.UUID, allowNull: true },
    type: {
      type: DataTypes.ENUM(
        "Note", "Call", "Meeting", "Email", "Task",
        "StageChange", "LifecycleChange", "OwnerChange", "System"
      ),
      allowNull: false,
      defaultValue: "Note",
    },
    subject: { type: DataTypes.STRING, allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: true },
    direction: { type: DataTypes.ENUM("Inbound", "Outbound"), allowNull: true },
    durationMinutes: { type: DataTypes.INTEGER, allowNull: true },
    occurredAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    metadata: { type: DataTypes.JSONB, allowNull: true },
  },
  {
    sequelize,
    tableName: "activities",
    timestamps: true,
    indexes: [
      { fields: ["leadId", "occurredAt"] },
      { fields: ["dealId", "occurredAt"] },
      { fields: ["accountId", "occurredAt"] },
    ],
  }
);
