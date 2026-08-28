import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/** Mirrors the column types Wrike's "Fields" menu offers. */
export type FieldType =
  | "text"
  | "number"
  | "currency"
  | "percent"
  | "date"
  | "checkbox"
  | "dropdown"
  | "user";

interface FieldDefinitionAttributes {
  id: string;
  /** null = available on every project; set = that project only. */
  projectId: string | null;
  name: string;
  type: FieldType;
  /** Choices for "dropdown"; ignored otherwise. */
  options: string[] | null;
  order: number;
  createdById: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FieldDefinitionCreationAttributes
  extends Optional<FieldDefinitionAttributes, "id" | "projectId" | "options" | "order" | "createdById"> {}

/**
 * Defines a custom column ("Budget", "Impact"). The VALUES live in
 * Task.customFields as JSONB keyed by this id — one row per task instead of one
 * row per task-per-field, which keeps the table view a single query.
 */
export class FieldDefinition
  extends Model<FieldDefinitionAttributes, FieldDefinitionCreationAttributes>
  implements FieldDefinitionAttributes
{
  declare id: string;
  declare projectId: string | null;
  declare name: string;
  declare type: FieldType;
  declare options: string[] | null;
  declare order: number;
  declare createdById: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

FieldDefinition.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    projectId: { type: DataTypes.UUID, allowNull: true },
    name: { type: DataTypes.STRING, allowNull: false },
    type: {
      type: DataTypes.ENUM("text", "number", "currency", "percent", "date", "checkbox", "dropdown", "user"),
      allowNull: false,
      defaultValue: "text",
    },
    options: { type: DataTypes.JSONB, allowNull: true },
    order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    createdById: { type: DataTypes.UUID, allowNull: true },
  },
  { sequelize, tableName: "field_definitions", timestamps: true, indexes: [{ fields: ["projectId"] }] }
);
