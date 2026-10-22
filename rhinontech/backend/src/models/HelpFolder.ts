import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/** A help-center collection shown on the widget's Help tab, per bot. */
interface HelpFolderAttributes {
  id: string;
  chatbotId: string;
  name: string;
  description: string;
  position: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface HelpFolderCreationAttributes extends Optional<HelpFolderAttributes, "id" | "description" | "position"> {}

export class HelpFolder extends Model<HelpFolderAttributes, HelpFolderCreationAttributes> implements HelpFolderAttributes {
  declare id: string;
  declare chatbotId: string;
  declare name: string;
  declare description: string;
  declare position: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

HelpFolder.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    chatbotId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.STRING(400), allowNull: false, defaultValue: "" },
    position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { sequelize, tableName: "help_folders", timestamps: true, indexes: [{ fields: ["chatbotId", "position"] }] }
);
