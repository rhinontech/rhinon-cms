import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/**
 * A queued idea for an AI-drafted blog post. Topics are added in bulk (from the
 * admin or straight from a script), and a person picks one and clicks Generate.
 * Generation only ever produces a Draft Blog — publishing stays a human step.
 */
export type BlogTopicStatus = "Queued" | "Generating" | "Drafted" | "Failed";

interface BlogTopicAttributes {
  id: string;
  /** Working title; the generator may sharpen it. */
  title: string;
  /** The search phrase the post should rank for, e.g. "mvp development cost india". */
  keyword?: string | null;
  /** Who it's for / what they want to know. Free text. */
  audience?: string | null;
  /** First-hand points, numbers, opinions, project examples to weave in. */
  notes?: string | null;
  /** Site path the post should link to, e.g. "/services/mvp-development". */
  targetPage?: string | null;
  /** Generate inline images while drafting (each costs a Gemini image call). */
  withImages: boolean;
  siteId?: string | null;
  status: BlogTopicStatus;
  blogId?: string | null;
  error?: string | null;
  generatedAt?: Date | null;
  createdById?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BlogTopicCreationAttributes
  extends Optional<
    BlogTopicAttributes,
    "id" | "keyword" | "audience" | "notes" | "targetPage" | "withImages" | "siteId"
    | "status" | "blogId" | "error" | "generatedAt" | "createdById"
  > {}

export class BlogTopic extends Model<BlogTopicAttributes, BlogTopicCreationAttributes> implements BlogTopicAttributes {
  declare id: string;
  declare title: string;
  declare keyword: string | null;
  declare audience: string | null;
  declare notes: string | null;
  declare targetPage: string | null;
  declare withImages: boolean;
  declare siteId: string | null;
  declare status: BlogTopicStatus;
  declare blogId: string | null;
  declare error: string | null;
  declare generatedAt: Date | null;
  declare createdById: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

BlogTopic.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING(300), allowNull: false },
    keyword: { type: DataTypes.STRING(200), allowNull: true },
    audience: { type: DataTypes.TEXT, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    targetPage: { type: DataTypes.STRING(300), allowNull: true },
    withImages: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    siteId: { type: DataTypes.UUID, allowNull: true },
    status: {
      type: DataTypes.ENUM("Queued", "Generating", "Drafted", "Failed"),
      allowNull: false,
      defaultValue: "Queued",
    },
    blogId: { type: DataTypes.UUID, allowNull: true },
    error: { type: DataTypes.TEXT, allowNull: true },
    generatedAt: { type: DataTypes.DATE, allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: true },
  },
  { sequelize, tableName: "blog_topics", timestamps: true }
);
