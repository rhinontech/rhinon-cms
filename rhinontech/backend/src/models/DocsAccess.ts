import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/**
 * DocsAccess — allowlist of emails permitted to read the Rhinon Help developer
 * documentation. Managed from the admin panel (Docs Access). The public docs
 * site checks an email against this table at login time.
 */
interface DocsAccessAttributes {
  id: string;
  email: string;
  /** Admin user who granted access (informational). */
  grantedById: string | null;
  grantedByName: string | null;
  /** Optional label/reason, e.g. "Acme partner dev". */
  note: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DocsAccessCreationAttributes
  extends Optional<
    DocsAccessAttributes,
    "id" | "grantedById" | "grantedByName" | "note"
  > {}

export class DocsAccess
  extends Model<DocsAccessAttributes, DocsAccessCreationAttributes>
  implements DocsAccessAttributes
{
  declare id: string;
  declare email: string;
  declare grantedById: string | null;
  declare grantedByName: string | null;
  declare note: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

DocsAccess.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    grantedById: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    grantedByName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    note: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "docs_access",
    timestamps: true,
  }
);
