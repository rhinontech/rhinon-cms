import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/database";

export class AttendancePolicy extends Model {
  public id!: string;
  public title!: string;
  public category!: "Attendance" | "Leave" | "Conduct" | "Welfare";
  public content!: string;
  public version!: string;
  public lastUpdatedById!: string;
}

AttendancePolicy.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM("Attendance", "Leave", "Conduct", "Welfare"),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    version: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "v1.0",
    },
    lastUpdatedById: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "attendance_policies",
  }
);
