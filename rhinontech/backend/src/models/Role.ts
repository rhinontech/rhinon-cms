import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface RoleAttributes {
  id: string;
  name: string;
  slug: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RoleCreationAttributes extends Optional<RoleAttributes, "id"> {}

export class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  declare id: string;
  declare name: string;
  declare slug: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Role.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "roles",
    timestamps: true,
    // Every org gets its own superadmin/hr/employee/collaborator roles, so the
    // slug can only be unique within a tenant — a global unique here meant the
    // SECOND organization to sign up could never be provisioned at all.
    indexes: [{ unique: true, fields: ["organizationId", "slug"] }],
  }
);
