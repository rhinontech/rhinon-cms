import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface ContactGroupAttributes {
  id: string;
  name: string;
  description?: string | null;
  createdById?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ContactGroupCreationAttributes
  extends Optional<ContactGroupAttributes, "id" | "description" | "createdById"> {}

export class ContactGroup
  extends Model<ContactGroupAttributes, ContactGroupCreationAttributes>
  implements ContactGroupAttributes
{
  declare id: string;
  declare name: string;
  declare description: string | null;
  declare createdById: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ContactGroup.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: true },
  },
  { sequelize, tableName: "contact_groups", timestamps: true }
);
