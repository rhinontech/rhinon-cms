import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type TeamRole = "owner" | "member";

interface TeamMemberAttributes {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TeamMemberCreationAttributes extends Optional<TeamMemberAttributes, "id" | "role"> {}

export class TeamMember
  extends Model<TeamMemberAttributes, TeamMemberCreationAttributes>
  implements TeamMemberAttributes
{
  declare id: string;
  declare teamId: string;
  declare userId: string;
  declare role: TeamRole;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TeamMember.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    teamId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    // "owner" may rename the team and manage its roster; "member" only sees its work.
    role: { type: DataTypes.ENUM("owner", "member"), allowNull: false, defaultValue: "member" },
  },
  {
    sequelize,
    tableName: "team_members",
    timestamps: true,
    indexes: [{ unique: true, fields: ["teamId", "userId"] }],
  }
);
