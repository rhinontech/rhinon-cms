import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface LinkedInTokenAttributes {
  id: string;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt: Date;
  linkedinUserId: string;
  linkedinProfileData?: object | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LinkedInTokenCreationAttributes extends Optional<LinkedInTokenAttributes, "id" | "refreshToken" | "linkedinProfileData" | "isActive"> {}

export class LinkedInToken extends Model<LinkedInTokenAttributes, LinkedInTokenCreationAttributes> implements LinkedInTokenAttributes {
  declare id: string;
  declare accessToken: string;
  declare refreshToken: string | null;
  declare expiresAt: Date;
  declare linkedinUserId: string;
  declare linkedinProfileData: object | null;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

LinkedInToken.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    accessToken: { type: DataTypes.TEXT, allowNull: false },
    refreshToken: { type: DataTypes.TEXT, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    linkedinUserId: { type: DataTypes.STRING, allowNull: false },
    linkedinProfileData: { type: DataTypes.JSONB, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
  },
  { sequelize, tableName: "linkedin_tokens", timestamps: true }
);
