import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface LeaveTypeAttributes {
  id: string;
  name: string;
  daysPerYear: number;
  color: string;
  isPaid: boolean;
  description?: string;
}

interface LeaveTypeCreationAttributes
  extends Optional<LeaveTypeAttributes, "id" | "color" | "isPaid" | "description"> {}

export class LeaveType
  extends Model<LeaveTypeAttributes, LeaveTypeCreationAttributes>
  implements LeaveTypeAttributes
{
  declare id: string;
  declare name: string;
  declare daysPerYear: number;
  declare color: string;
  declare isPaid: boolean;
  declare description?: string;
}

LeaveType.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    daysPerYear: { type: DataTypes.INTEGER, allowNull: false },
    color: { type: DataTypes.STRING, defaultValue: "#3B82F6" },
    isPaid: { type: DataTypes.BOOLEAN, defaultValue: true },
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: "leave_types",
    timestamps: false,
  }
);
