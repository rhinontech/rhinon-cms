import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface ReviewGoalAttributes {
  id: string;
  userId: string;
  cycleId: string | null;
  title: string;
  description: string | null;
  status: "not_started" | "in_progress" | "completed";
  progress: number;
  targetDate: string | null;
  createdById: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ReviewGoalCreationAttributes
  extends Optional<ReviewGoalAttributes, "id" | "status" | "progress" | "cycleId" | "description" | "targetDate"> {}

export class ReviewGoal
  extends Model<ReviewGoalAttributes, ReviewGoalCreationAttributes>
  implements ReviewGoalAttributes
{
  declare id: string;
  declare userId: string;
  declare cycleId: string | null;
  declare title: string;
  declare description: string | null;
  declare status: "not_started" | "in_progress" | "completed";
  declare progress: number;
  declare targetDate: string | null;
  declare createdById: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

ReviewGoal.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    cycleId: { type: DataTypes.UUID, allowNull: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM("not_started", "in_progress", "completed"),
      defaultValue: "not_started",
    },
    progress: { type: DataTypes.INTEGER, defaultValue: 0 },
    targetDate: { type: DataTypes.DATEONLY, allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: false },
  },
  { sequelize, tableName: "review_goals", timestamps: true }
);
