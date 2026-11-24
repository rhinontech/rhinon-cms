import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type SprintStatus = "planning" | "active" | "completed";

interface SprintAttributes {
  id: string;
  name: string;
  goal: string | null;
  /** null = a company-wide sprint; set = scoped to one project's backlog. */
  projectId: string | null;
  /** null = open to anyone with work:read; set = restricted like a team project. */
  teamId: string | null;
  startDate: Date;
  endDate: Date;
  status: SprintStatus;
  createdById: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SprintCreationAttributes
  extends Optional<SprintAttributes, "id" | "goal" | "projectId" | "teamId" | "status"> {}

/**
 * A dated iteration (Linear-style "cycle"). Tasks opt in via `Task.sprintId`;
 * nothing is forced onto one, so teams that don't plan in sprints are unaffected.
 */
export class Sprint extends Model<SprintAttributes, SprintCreationAttributes> implements SprintAttributes {
  declare id: string;
  declare name: string;
  declare goal: string | null;
  declare projectId: string | null;
  declare teamId: string | null;
  declare startDate: Date;
  declare endDate: Date;
  declare status: SprintStatus;
  declare createdById: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Sprint.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    goal: { type: DataTypes.TEXT, allowNull: true },
    projectId: { type: DataTypes.UUID, allowNull: true },
    teamId: { type: DataTypes.UUID, allowNull: true },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY, allowNull: false },
    status: {
      type: DataTypes.ENUM("planning", "active", "completed"),
      allowNull: false,
      defaultValue: "planning",
    },
    createdById: { type: DataTypes.UUID, allowNull: false },
  },
  { sequelize, tableName: "sprints", timestamps: true, indexes: [{ fields: ["projectId"] }, { fields: ["status"] }] }
);
