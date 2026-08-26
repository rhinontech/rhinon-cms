import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type SavedViewEntity = "lead" | "deal" | "account";

/**
 * A named filter set — "Qualified, unassigned, from Apollo".
 *
 * Filters are stored as the query shape the list endpoints already accept, so
 * applying a view is just spreading it into the request. That keeps views from
 * becoming a second query language that has to be kept in sync with the first.
 */
interface SavedViewAttributes {
  id: string;
  name: string;
  entity: SavedViewEntity;
  filters: Record<string, any>;
  isShared: boolean;
  createdById: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SavedViewCreationAttributes
  extends Optional<SavedViewAttributes, "id" | "filters" | "isShared"> {}

export class SavedView extends Model<SavedViewAttributes, SavedViewCreationAttributes> implements SavedViewAttributes {
  declare id: string;
  declare name: string;
  declare entity: SavedViewEntity;
  declare filters: Record<string, any>;
  declare isShared: boolean;
  declare createdById: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SavedView.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    entity: { type: DataTypes.ENUM("lead", "deal", "account"), allowNull: false, defaultValue: "lead" },
    filters: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    // Shared views are visible to the whole team; private ones only to the author.
    isShared: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdById: { type: DataTypes.UUID, allowNull: false },
  },
  { sequelize, tableName: "saved_views", timestamps: true }
);
