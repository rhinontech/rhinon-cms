import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type PageVisibility = "private" | "workspace";

interface PageAttributes {
  id: string;
  title: string;
  icon?: string | null;
  coverImage?: string | null;
  content?: Record<string, any> | null;
  parentId?: string | null;
  position: number;
  ownerId: string;
  visibility: PageVisibility;
  isArchived: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PageCreationAttributes
  extends Optional<PageAttributes, "id" | "icon" | "coverImage" | "content" | "parentId" | "position" | "visibility" | "isArchived"> {}

export class Page extends Model<PageAttributes, PageCreationAttributes> implements PageAttributes {
  declare id: string;
  declare title: string;
  declare icon: string | null;
  declare coverImage: string | null;
  declare content: Record<string, any> | null;
  declare parentId: string | null;
  declare position: number;
  declare ownerId: string;
  declare visibility: PageVisibility;
  declare isArchived: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Page.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false, defaultValue: "Untitled" },
    icon: { type: DataTypes.STRING, allowNull: true },
    coverImage: { type: DataTypes.TEXT, allowNull: true },
    content: { type: DataTypes.JSONB, allowNull: true },
    parentId: { type: DataTypes.UUID, allowNull: true },
    position: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0 },
    ownerId: { type: DataTypes.UUID, allowNull: false },
    visibility: { type: DataTypes.ENUM("private", "workspace"), allowNull: false, defaultValue: "private" },
    isArchived: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { sequelize, tableName: "pages", timestamps: true }
);
