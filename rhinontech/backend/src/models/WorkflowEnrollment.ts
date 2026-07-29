import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface WorkflowEnrollmentAttributes {
  id: string;
  workflowId: string;
  leadId?: string | null;
  leadName: string;
  leadEmail: string;
  source: string;
  status: string; // 'active' | 'completed' | 'failed' | 'cancelled'
  currentNodeId: string;
  nextStepAt?: Date | null;
  executionLogs?: any[] | null;
  trackingState?: Record<string, any> | null;
  enrolledAt: Date;
  completedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WorkflowEnrollmentCreationAttributes
  extends Optional<WorkflowEnrollmentAttributes, "id" | "leadId" | "status" | "nextStepAt" | "executionLogs" | "trackingState" | "enrolledAt" | "completedAt"> {}

export class WorkflowEnrollment
  extends Model<WorkflowEnrollmentAttributes, WorkflowEnrollmentCreationAttributes>
  implements WorkflowEnrollmentAttributes
{
  declare id: string;
  declare workflowId: string;
  declare leadId: string | null;
  declare leadName: string;
  declare leadEmail: string;
  declare source: string;
  declare status: string;
  declare currentNodeId: string;
  declare nextStepAt: Date | null;
  declare executionLogs: any[] | null;
  declare trackingState: Record<string, any> | null;
  declare enrolledAt: Date;
  declare completedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

WorkflowEnrollment.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    workflowId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    leadId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    leadName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    leadEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    source: {
      type: DataTypes.STRING,
      defaultValue: "Direct",
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "active",
      allowNull: false,
    },
    currentNodeId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nextStepAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    executionLogs: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    trackingState: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    enrolledAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "workflow_enrollments",
    timestamps: true,
  }
);
