import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface ReviewCycleAttributes {
  id: string;
  name: string;
  type: "quarterly" | "annual" | "probation";
  startDate: string;
  endDate: string;
  status: "draft" | "active" | "closed";
  createdById: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ReviewCycleCreationAttributes
  extends Optional<ReviewCycleAttributes, "id" | "status"> {}

export class ReviewCycle
  extends Model<ReviewCycleAttributes, ReviewCycleCreationAttributes>
  implements ReviewCycleAttributes
{
  declare id: string;
  declare name: string;
  declare type: "quarterly" | "annual" | "probation";
  declare startDate: string;
  declare endDate: string;
  declare status: "draft" | "active" | "closed";
  declare createdById: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

ReviewCycle.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.ENUM("quarterly", "annual", "probation"), allowNull: false },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.ENUM("draft", "active", "closed"), defaultValue: "draft" },
    createdById: { type: DataTypes.UUID, allowNull: false },
  },
  { sequelize, tableName: "review_cycles", timestamps: true }
);
