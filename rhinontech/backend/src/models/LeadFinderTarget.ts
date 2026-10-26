import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/**
 * A company queued for the daily Lead Finder run (services/leadFinderQueue.ts):
 * the cron finds its founders, verifies their emails and adds them to the CRM.
 *
 *   queued   → waiting for the next run
 *   running  → being processed now
 *   done     → processed; leadsAdded says how many went into the CRM
 *   failed   → couldn't be processed (error says why); can be retried
 */
export type LeadFinderTargetStatus = "queued" | "running" | "done" | "failed";

interface LeadFinderTargetAttributes {
  id: string;
  company: string | null;
  website: string | null;
  /** Normalised domain, used to skip companies already queued. */
  domain: string | null;
  status: LeadFinderTargetStatus;
  attempts: number;
  peopleFound: number;
  leadsAdded: number;
  /** Short summary of the run: who was found, which emails worked. */
  result: Record<string, unknown> | null;
  error: string | null;
  createdById: string | null;
  processedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LeadFinderTargetCreationAttributes
  extends Optional<
    LeadFinderTargetAttributes,
    "id" | "company" | "website" | "domain" | "status" | "attempts" | "peopleFound" | "leadsAdded" | "result" | "error" | "createdById" | "processedAt"
  > {}

export class LeadFinderTarget
  extends Model<LeadFinderTargetAttributes, LeadFinderTargetCreationAttributes>
  implements LeadFinderTargetAttributes
{
  declare id: string;
  declare company: string | null;
  declare website: string | null;
  declare domain: string | null;
  declare status: LeadFinderTargetStatus;
  declare attempts: number;
  declare peopleFound: number;
  declare leadsAdded: number;
  declare result: Record<string, unknown> | null;
  declare error: string | null;
  declare createdById: string | null;
  declare processedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

LeadFinderTarget.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    company: { type: DataTypes.STRING, allowNull: true },
    website: { type: DataTypes.STRING, allowNull: true },
    domain: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: "queued" },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    peopleFound: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    leadsAdded: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    result: { type: DataTypes.JSONB, allowNull: true },
    error: { type: DataTypes.TEXT, allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: true },
    processedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: "lead_finder_targets", timestamps: true }
);
