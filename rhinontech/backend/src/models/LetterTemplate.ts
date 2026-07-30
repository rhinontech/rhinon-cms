import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import type { LetterBlock, LetterTemplateCategory, LetterTemplateKey } from "../types/letterBlocks";

interface LetterTemplateAttributes {
  id: string;
  key: LetterTemplateKey;
  category: LetterTemplateCategory;
  title: string;
  blocks: LetterBlock[];
  version: number;
  updatedById: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LetterTemplateCreationAttributes
  extends Optional<LetterTemplateAttributes, "id" | "version" | "updatedById"> {}

export class LetterTemplate
  extends Model<LetterTemplateAttributes, LetterTemplateCreationAttributes>
  implements LetterTemplateAttributes
{
  declare id: string;
  declare key: LetterTemplateKey;
  declare category: LetterTemplateCategory;
  declare title: string;
  declare blocks: LetterBlock[];
  declare version: number;
  declare updatedById: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

LetterTemplate.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    // Free-form unique slug (was a fixed 3-value enum) — admins can create
    // additional offer_letter-category templates beyond the seeded defaults.
    key: { type: DataTypes.STRING, allowNull: false, unique: true },
    category: { type: DataTypes.ENUM("offer_letter", "nda"), allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    blocks: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    updatedById: { type: DataTypes.UUID, allowNull: true },
  },
  {
    sequelize,
    tableName: "letter_templates",
    timestamps: true,
  }
);
