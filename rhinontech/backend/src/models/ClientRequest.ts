import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type ClientRequestType = "Bug" | "Change request";
export type ClientRequestStatus = "Open" | "In review" | "In progress" | "Done";
export type ClientRequestPriority = "Low" | "Medium" | "High";

interface ClientRequestAttributes {
  id: string;
  title: string;
  description: string;
  type: ClientRequestType;
  status: ClientRequestStatus;
  priority: ClientRequestPriority;
  projectId?: string;
  reportedBy?: string;
  createdById: string;
  convertedTaskId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ClientRequestCreationAttributes
  extends Optional<ClientRequestAttributes, "id" | "type" | "status" | "priority" | "projectId" | "reportedBy" | "convertedTaskId"> {}

export class ClientRequest
  extends Model<ClientRequestAttributes, ClientRequestCreationAttributes>
  implements ClientRequestAttributes
{
  declare id: string;
  declare title: string;
  declare description: string;
  declare type: ClientRequestType;
  declare status: ClientRequestStatus;
  declare priority: ClientRequestPriority;
  declare projectId?: string;
  declare reportedBy?: string;
  declare createdById: string;
  declare convertedTaskId?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

ClientRequest.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    type: {
      type: DataTypes.ENUM("Bug", "Change request"),
      allowNull: false,
      defaultValue: "Bug",
    },
    status: {
      type: DataTypes.ENUM("Open", "In review", "In progress", "Done"),
      allowNull: false,
      defaultValue: "Open",
    },
    priority: {
      type: DataTypes.ENUM("Low", "Medium", "High"),
      allowNull: false,
      defaultValue: "Medium",
    },
    projectId: { type: DataTypes.UUID, allowNull: true },
    reportedBy: { type: DataTypes.STRING, allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: false },
    convertedTaskId: { type: DataTypes.UUID, allowNull: true },
  },
  { sequelize, tableName: "client_requests", timestamps: true }
);
