import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface UnsubscribeAttributes {
  id: string;
  email: string;
  reason: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UnsubscribeCreationAttributes
  extends Optional<UnsubscribeAttributes, "id" | "createdAt" | "updatedAt"> {}

export class Unsubscribe
  extends Model<UnsubscribeAttributes, UnsubscribeCreationAttributes>
  implements UnsubscribeAttributes
{
  declare id: string;
  declare email: string;
  declare reason: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Unsubscribe.init(
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
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "unsubscribes",
    timestamps: true,
    indexes: [
      { fields: ["email"] },
      { fields: ["createdAt"] },
    ],
  }
);
