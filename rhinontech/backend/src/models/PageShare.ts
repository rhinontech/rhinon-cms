import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type PageAccess = "view" | "edit";

interface PageShareAttributes {
  id: string;
  pageId: string;
  userId: string;
  access: PageAccess;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PageShareCreationAttributes extends Optional<PageShareAttributes, "id" | "access"> {}

export class PageShare extends Model<PageShareAttributes, PageShareCreationAttributes> implements PageShareAttributes {
  declare id: string;
  declare pageId: string;
  declare userId: string;
  declare access: PageAccess;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

PageShare.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    pageId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    access: { type: DataTypes.ENUM("view", "edit"), allowNull: false, defaultValue: "view" },
  },
  {
    sequelize,
    tableName: "page_shares",
    timestamps: true,
    indexes: [{ unique: true, fields: ["pageId", "userId"] }],
  }
);
