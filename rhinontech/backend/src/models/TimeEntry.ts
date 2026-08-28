import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface TimeEntryAttributes {
  id: string;
  taskId: string;
  userId: string;
  minutes: number;
  note: string | null;
  /** The working day this effort counts against, not when it was logged. */
  spentOn: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TimeEntryCreationAttributes extends Optional<TimeEntryAttributes, "id" | "note"> {}

/** Backs the task timer and the "Progress" tile on the Analytics tab. */
export class TimeEntry
  extends Model<TimeEntryAttributes, TimeEntryCreationAttributes>
  implements TimeEntryAttributes
{
  declare id: string;
  declare taskId: string;
  declare userId: string;
  declare minutes: number;
  declare note: string | null;
  declare spentOn: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TimeEntry.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    taskId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    minutes: { type: DataTypes.INTEGER, allowNull: false },
    note: { type: DataTypes.STRING, allowNull: true },
    spentOn: { type: DataTypes.DATEONLY, allowNull: false },
  },
  { sequelize, tableName: "time_entries", timestamps: true, indexes: [{ fields: ["taskId"] }, { fields: ["userId"] }] }
);
