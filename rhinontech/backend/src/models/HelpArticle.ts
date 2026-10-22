import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/**
 * A help-center article. `content` is sanitised HTML (the widget renders it
 * as HTML); only published articles reach the widget.
 */
export type HelpArticleStatus = "draft" | "published";

interface HelpArticleAttributes {
  id: string;
  chatbotId: string;
  folderId: string;
  title: string;
  content: string;
  status: HelpArticleStatus;
  position: number;
  views: number;
  likes: number;
  dislikes: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface HelpArticleCreationAttributes
  extends Optional<HelpArticleAttributes, "id" | "content" | "status" | "position" | "views" | "likes" | "dislikes"> {}

export class HelpArticle extends Model<HelpArticleAttributes, HelpArticleCreationAttributes> implements HelpArticleAttributes {
  declare id: string;
  declare chatbotId: string;
  declare folderId: string;
  declare title: string;
  declare content: string;
  declare status: HelpArticleStatus;
  declare position: number;
  declare views: number;
  declare likes: number;
  declare dislikes: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

HelpArticle.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    chatbotId: { type: DataTypes.UUID, allowNull: false },
    folderId: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
    status: { type: DataTypes.ENUM("draft", "published"), allowNull: false, defaultValue: "draft" },
    position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    views: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    likes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    dislikes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { sequelize, tableName: "help_articles", timestamps: true, indexes: [{ fields: ["chatbotId", "folderId", "position"] }] }
);
