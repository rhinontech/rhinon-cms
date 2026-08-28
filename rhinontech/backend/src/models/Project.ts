import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type ProjectStatus = "Active" | "Paused" | "Completed" | "Pipeline";

/**
 * Who can see this project — and, by inheritance, every task and client request
 * hanging off it. "workspace" is the historical behaviour (everyone in the
 * company) and stays the default so existing projects are unaffected.
 */
export type ProjectVisibility = "workspace" | "team" | "private";

interface ProjectAttributes {
  id: string;
  name: string;
  status: ProjectStatus;
  pointOfContact?: string;
  notes?: string;
  createdById?: string;
  // The person accountable for the project. Backfilled from createdById; the
  // owner is the one identity that can always reach a "private" project.
  ownerId?: string | null;
  visibility: ProjectVisibility;
  // Only meaningful when visibility === "team".
  teamId?: string | null;
  // Where this work came from. Set when a won deal is handed to delivery, so
  // revenue can be traced back to the deal that produced it.
  dealId?: string | null;
  accountId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProjectCreationAttributes
  extends Optional<ProjectAttributes, "id" | "status" | "pointOfContact" | "notes" | "createdById" | "ownerId" | "visibility" | "teamId" | "dealId" | "accountId"> {}

export class Project
  extends Model<ProjectAttributes, ProjectCreationAttributes>
  implements ProjectAttributes
{
  declare id: string;
  declare name: string;
  declare status: ProjectStatus;
  declare pointOfContact?: string;
  declare notes?: string;
  declare createdById?: string;
  declare ownerId: string | null;
  declare visibility: ProjectVisibility;
  declare teamId: string | null;
  declare dealId: string | null;
  declare accountId: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Project.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    status: {
      type: DataTypes.ENUM("Active", "Paused", "Completed", "Pipeline"),
      allowNull: false,
      defaultValue: "Active",
    },
    pointOfContact: { type: DataTypes.STRING, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: true },
    ownerId: { type: DataTypes.UUID, allowNull: true },
    visibility: {
      type: DataTypes.ENUM("workspace", "team", "private"),
      allowNull: false,
      defaultValue: "workspace",
    },
    teamId: { type: DataTypes.UUID, allowNull: true },
    dealId: { type: DataTypes.UUID, allowNull: true },
    accountId: { type: DataTypes.UUID, allowNull: true },
  },
  { sequelize, tableName: "projects", timestamps: true }
);
