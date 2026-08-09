import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type EventStatus = "Draft" | "Published";

export type EventBlock =
  | { id: string; type: "paragraph"; html: string }
  | { id: string; type: "image"; url: string; alt?: string; credit?: string }
  | { id: string; type: "video"; url: string; caption?: string }
  | { id: string; type: "youtube"; url: string; caption?: string };

export interface EventFaq {
  question: string;
  answer: string;
}

interface EventAttributes {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  contentBlocks: EventBlock[];
  faqs: EventFaq[];
  category?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  slug: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string | null;
  coverImage?: string | null;
  tags: string[];
  readTime: string;
  publishedAt: Date;
  status: EventStatus;
  createdById?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EventCreationAttributes
  extends Optional<
    EventAttributes,
    | "id" | "contentBlocks" | "faqs" | "category" | "metaTitle" | "metaDescription"
    | "authorName" | "authorRole" | "authorAvatar" | "coverImage"
    | "tags" | "readTime" | "publishedAt" | "status" | "createdById"
  > {}

// Uppercurve's public-site events — same shape as Blog, but scoped to the
// uppercurve domain implicitly (no `domain` column, unlike Blog which is shared
// between rhinonlabs and uppercurve).
export class Event extends Model<EventAttributes, EventCreationAttributes> implements EventAttributes {
  declare id: string;
  declare title: string;
  declare excerpt: string;
  declare content: string;
  declare contentBlocks: EventBlock[];
  declare faqs: EventFaq[];
  declare category: string | null;
  declare metaTitle: string | null;
  declare metaDescription: string | null;
  declare slug: string;
  declare authorName: string;
  declare authorRole: string;
  declare authorAvatar: string | null;
  declare coverImage: string | null;
  declare tags: string[];
  declare readTime: string;
  declare publishedAt: Date;
  declare status: EventStatus;
  declare createdById: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Event.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    excerpt: { type: DataTypes.TEXT, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    contentBlocks: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    faqs: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    category: { type: DataTypes.STRING, allowNull: true },
    metaTitle: { type: DataTypes.STRING, allowNull: true },
    metaDescription: { type: DataTypes.TEXT, allowNull: true },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    authorName: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
    authorRole: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
    authorAvatar: { type: DataTypes.TEXT, allowNull: true },
    coverImage: { type: DataTypes.TEXT, allowNull: true },
    tags: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
    readTime: { type: DataTypes.STRING, allowNull: false, defaultValue: "5 min read" },
    publishedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    status: { type: DataTypes.ENUM("Draft", "Published"), allowNull: false, defaultValue: "Draft" },
    createdById: { type: DataTypes.UUID, allowNull: true },
  },
  { sequelize, tableName: "events", timestamps: true }
);
