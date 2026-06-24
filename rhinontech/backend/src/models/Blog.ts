import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type BlogStatus = "Draft" | "Published";

interface BlogAttributes {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string | null;
  coverImage?: string | null;
  tags: string[];
  readTime: string;
  publishedAt: Date;
  status: BlogStatus;
  createdById?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BlogCreationAttributes
  extends Optional<
    BlogAttributes,
    | "id" | "authorName" | "authorRole" | "authorAvatar" | "coverImage"
    | "tags" | "readTime" | "publishedAt" | "status" | "createdById"
  > {}

export class Blog extends Model<BlogAttributes, BlogCreationAttributes> implements BlogAttributes {
  declare id: string;
  declare title: string;
  declare excerpt: string;
  declare content: string;
  declare slug: string;
  declare authorName: string;
  declare authorRole: string;
  declare authorAvatar: string | null;
  declare coverImage: string | null;
  declare tags: string[];
  declare readTime: string;
  declare publishedAt: Date;
  declare status: BlogStatus;
  declare createdById: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Blog.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    excerpt: { type: DataTypes.TEXT, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    authorName: { type: DataTypes.STRING, allowNull: false, defaultValue: "Prabhat Patra" },
    authorRole: { type: DataTypes.STRING, allowNull: false, defaultValue: "Founder @ Rhinon Tech" },
    authorAvatar: { type: DataTypes.TEXT, allowNull: true },
    coverImage: { type: DataTypes.TEXT, allowNull: true },
    tags: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
    readTime: { type: DataTypes.STRING, allowNull: false, defaultValue: "5 min read" },
    publishedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    status: { type: DataTypes.ENUM("Draft", "Published"), allowNull: false, defaultValue: "Draft" },
    createdById: { type: DataTypes.UUID, allowNull: true },
  },
  { sequelize, tableName: "blogs", timestamps: true }
);
