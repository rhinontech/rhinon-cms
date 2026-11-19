import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface DeviceTokenAttributes {
  id: string;
  userId: string;
  token: string;
  platform: "ios" | "android" | "web";
  organizationId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class DeviceToken
  extends Model<DeviceTokenAttributes, Optional<DeviceTokenAttributes, "id" | "platform" | "organizationId">>
  implements DeviceTokenAttributes
{
  declare id: string;
  declare userId: string;
  declare token: string;
  declare platform: "ios" | "android" | "web";
  declare organizationId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

DeviceToken.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    token: { type: DataTypes.STRING(500), allowNull: false },
    platform: { type: DataTypes.STRING(10), allowNull: false, defaultValue: "ios" },
    organizationId: { type: DataTypes.UUID, allowNull: true },
  },
  {
    sequelize,
    tableName: "device_tokens",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["userId", "token"] },
      { fields: ["userId"] },
    ],
  }
);
