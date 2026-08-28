import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type ProjectAccess = "view" | "collaborate";

interface ProjectMemberAttributes {
  id: string;
  projectId: string;
  userId: string;
  /** "view" reads; "collaborate" may also be assigned tasks and comment. */
  access: ProjectAccess;
  invitedById: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProjectMemberCreationAttributes
  extends Optional<ProjectMemberAttributes, "id" | "access" | "invitedById"> {}

/**
 * An explicit grant of one project to one person — the mechanism behind external
 * collaborators. Mirrors PageShare in Docs.
 *
 * For a guest this is the ONLY way to reach a project; for an internal user it is
 * additive on top of the workspace/team rules.
 */
export class ProjectMember
  extends Model<ProjectMemberAttributes, ProjectMemberCreationAttributes>
  implements ProjectMemberAttributes
{
  declare id: string;
  declare projectId: string;
  declare userId: string;
  declare access: ProjectAccess;
  declare invitedById: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ProjectMember.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    projectId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    access: { type: DataTypes.ENUM("view", "collaborate"), allowNull: false, defaultValue: "collaborate" },
    invitedById: { type: DataTypes.UUID, allowNull: true },
  },
  {
    sequelize,
    tableName: "project_members",
    timestamps: true,
    indexes: [{ unique: true, fields: ["projectId", "userId"] }],
  }
);
