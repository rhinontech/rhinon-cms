import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface VisitorAttributes {
  id: string;
  email: string;
  ip: string;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  path?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
  visitedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VisitorCreationAttributes
  extends Optional<
    VisitorAttributes,
    | "id"
    | "city"
    | "region"
    | "country"
    | "location"
    | "latitude"
    | "longitude"
    | "path"
    | "referrer"
    | "userAgent"
    | "visitedAt"
  > {}

export class Visitor
  extends Model<VisitorAttributes, VisitorCreationAttributes>
  implements VisitorAttributes
{
  declare id: string;
  declare email: string;
  declare ip: string;
  declare city: string | null;
  declare region: string | null;
  declare country: string | null;
  declare location: string | null;
  declare latitude: number | null;
  declare longitude: number | null;
  declare path: string | null;
  declare referrer: string | null;
  declare userAgent: string | null;
  declare visitedAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Visitor.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ip: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    region: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    path: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    referrer: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    visitedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "visitors",
    timestamps: true,
    indexes: [
      { fields: ["email"] },
      { fields: ["ip"] },
      { fields: ["visitedAt"] },
      { fields: ["createdAt"] },
    ],
  }
);
