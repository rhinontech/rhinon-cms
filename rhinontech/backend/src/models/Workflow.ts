import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface WorkflowAttributes {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  version: number;
  triggerType: string;
  triggerConfig?: Record<string, any> | null;
  nodes: any[];
  edges: any[];
  stats: {
    active: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
  createdById?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WorkflowCreationAttributes
  extends Optional<
    WorkflowAttributes,
    "id" | "description" | "status" | "version" | "triggerType" | "triggerConfig" | "nodes" | "edges" | "stats" | "createdById"
  > {}

export class Workflow
  extends Model<WorkflowAttributes, WorkflowCreationAttributes>
  implements WorkflowAttributes
{
  declare id: string;
  declare name: string;
  declare description: string | null;
  declare status: string;
  declare version: number;
  declare triggerType: string;
  declare triggerConfig: Record<string, any> | null;
  declare nodes: any[];
  declare edges: any[];
  declare stats: {
    active: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
  declare createdById: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Workflow.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "draft",
      allowNull: false,
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
    },
    triggerType: {
      type: DataTypes.STRING,
      defaultValue: "realtime_lead",
      allowNull: false,
    },
    triggerConfig: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    nodes: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    edges: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    stats: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: { active: 0, completed: 0, failed: 0, cancelled: 0 },
    },
    createdById: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "workflows",
    timestamps: true,
  }
);
