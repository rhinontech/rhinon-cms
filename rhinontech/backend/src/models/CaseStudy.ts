import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type CaseStudyStatus = "Draft" | "Published";

// One headline stat shown on a case-study card, e.g. { value: "₹4L", suffix: "+", label: "project value" }
export interface CaseStudyStat {
  value: string;
  suffix?: string;
  label: string;
}

interface CaseStudyAttributes {
  id: string;
  title: string;
  description: string;
  content?: string | null;
  slug: string;
  client?: string | null;
  industry?: string | null;
  category?: string | null;
  timeline?: string | null;
  liveLink?: string | null;
  date?: string | null;
  result?: string | null;
  quote?: string | null;
  image?: string | null;
  images: string[];
  stats: CaseStudyStat[];
  displayOrder: number;
  status: CaseStudyStatus;
  createdById?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CaseStudyCreationAttributes
  extends Optional<
    CaseStudyAttributes,
    | "id" | "content" | "client" | "industry" | "category" | "timeline" | "liveLink" | "date"
    | "result" | "quote" | "image" | "images"
    | "stats" | "displayOrder" | "status" | "createdById"
  > {}

export class CaseStudy
  extends Model<CaseStudyAttributes, CaseStudyCreationAttributes>
  implements CaseStudyAttributes
{
  declare id: string;
  declare title: string;
  declare description: string;
  declare content: string | null;
  declare slug: string;
  declare client: string | null;
  declare industry: string | null;
  declare category: string | null;
  declare timeline: string | null;
  declare liveLink: string | null;
  declare date: string | null;
  declare result: string | null;
  declare quote: string | null;
  declare image: string | null;
  declare images: string[];
  declare stats: CaseStudyStat[];
  declare displayOrder: number;
  declare status: CaseStudyStatus;
  declare createdById: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CaseStudy.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: true },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    client: { type: DataTypes.STRING, allowNull: true },
    industry: { type: DataTypes.STRING, allowNull: true },
    category: { type: DataTypes.STRING, allowNull: true },
    timeline: { type: DataTypes.STRING, allowNull: true },
    liveLink: { type: DataTypes.TEXT, allowNull: true },
    date: { type: DataTypes.STRING, allowNull: true },
    result: { type: DataTypes.STRING, allowNull: true },
    quote: { type: DataTypes.TEXT, allowNull: true },
    image: { type: DataTypes.TEXT, allowNull: true },
    images: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: false, defaultValue: [] },
    stats: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    displayOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.ENUM("Draft", "Published"), allowNull: false, defaultValue: "Draft" },
    createdById: { type: DataTypes.UUID, allowNull: true },
  },
  { sequelize, tableName: "case_studies", timestamps: true }
);
