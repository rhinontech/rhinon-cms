import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type ProjectStatus = "Active" | "Paused" | "Completed" | "Pipeline";

interface ProjectAttributes {
  id: string;
  name: string;
  status: ProjectStatus;
  pointOfContact?: string;
  notes?: string;
  createdById?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProjectCreationAttributes
  extends Optional<ProjectAttributes, "id" | "status" | "pointOfContact" | "notes" | "createdById"> {}

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
  },
  { sequelize, tableName: "projects", timestamps: true }
);
