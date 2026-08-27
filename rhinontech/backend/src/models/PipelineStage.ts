import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type StageType = "Open" | "Won" | "Lost";

/**
 * Deal stages are rows, not an enum, so sales can rename/reorder/add stages from
 * the UI without a schema change. `type` is what reporting keys off — only one
 * Won and one Lost stage are expected, but nothing enforces that.
 */
interface PipelineStageAttributes {
  id: string;
  name: string;
  position: number;
  probability: number;
  type: StageType;
  color?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PipelineStageCreationAttributes
  extends Optional<PipelineStageAttributes, "id" | "probability" | "type" | "color"> {}

export class PipelineStage
  extends Model<PipelineStageAttributes, PipelineStageCreationAttributes>
  implements PipelineStageAttributes
{
  declare id: string;
  declare name: string;
  declare position: number;
  declare probability: number;
  declare type: StageType;
  declare color: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

PipelineStage.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    probability: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    type: { type: DataTypes.ENUM("Open", "Won", "Lost"), allowNull: false, defaultValue: "Open" },
    color: { type: DataTypes.STRING, allowNull: true },
  },
  { sequelize, tableName: "pipeline_stages", timestamps: true }
);

/** Created once on boot if the table is empty; never overwrites edits. */
export const DEFAULT_STAGES: PipelineStageCreationAttributes[] = [
  { name: "Qualification", position: 0, probability: 10, type: "Open", color: "#3b82f6" },
  { name: "Discovery",     position: 1, probability: 25, type: "Open", color: "#8b5cf6" },
  { name: "Proposal",      position: 2, probability: 50, type: "Open", color: "#eab308" },
  { name: "Negotiation",   position: 3, probability: 75, type: "Open", color: "#f97316" },
  { name: "Closed Won",    position: 4, probability: 100, type: "Won", color: "#22c55e" },
  { name: "Closed Lost",   position: 5, probability: 0,  type: "Lost", color: "#ef4444" },
];
