import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface TeamAttributes {
  id: string;
  name: string;
  description?: string | null;
  createdById: string;
  isArchived: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TeamCreationAttributes
  extends Optional<TeamAttributes, "id" | "description" | "isArchived"> {}

export class Team extends Model<TeamAttributes, TeamCreationAttributes> implements TeamAttributes {
  declare id: string;
  declare name: string;
  declare description: string | null;
  declare createdById: string;
  declare isArchived: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Team.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: false },
    isArchived: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { sequelize, tableName: "teams", timestamps: true }
);
