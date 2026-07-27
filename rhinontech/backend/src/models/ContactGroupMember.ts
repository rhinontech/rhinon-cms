import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface ContactGroupMemberAttributes {
  id: string;
  contactGroupId: string;
  leadId: string;
  addedById?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ContactGroupMemberCreationAttributes
  extends Optional<ContactGroupMemberAttributes, "id" | "addedById"> {}

export class ContactGroupMember
  extends Model<ContactGroupMemberAttributes, ContactGroupMemberCreationAttributes>
  implements ContactGroupMemberAttributes
{
  declare id: string;
  declare contactGroupId: string;
  declare leadId: string;
  declare addedById: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ContactGroupMember.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    contactGroupId: { type: DataTypes.UUID, allowNull: false },
    leadId: { type: DataTypes.UUID, allowNull: false },
    addedById: { type: DataTypes.UUID, allowNull: true },
  },
  {
    sequelize,
    tableName: "contact_group_members",
    timestamps: true,
    indexes: [{ unique: true, fields: ["contactGroupId", "leadId"] }],
  }
);
