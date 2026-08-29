import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

// One row per deploy triggered from the admin panel — the Jenkins-style build history.
// The live log lives on disk (see config/deployTargets.ts); it is copied into `log`
// when the run finishes so history survives log-dir cleanup and instance replacement.
export type DeploymentStatus = "running" | "success" | "failed";

interface DeploymentAttributes {
  id: string;
  /** Key from DEPLOY_TARGETS — "prod" | "beta". Never a client-supplied path. */
  target: string;
  status: DeploymentStatus;
  triggeredById: string | null;
  /** Denormalised so history still reads correctly after an employee is offboarded. */
  triggeredByName: string;
  /** HEAD before `git pull`, so a bad deploy can be rolled back by SHA. */
  commitBefore: string | null;
  commitAfter: string | null;
  commitMessage: string | null;
  exitCode: number | null;
  /** Final log text, ingested once the run finishes. Null while running. */
  log: string | null;
  startedAt: Date;
  finishedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DeploymentCreationAttributes
  extends Optional<
    DeploymentAttributes,
    | "id" | "status" | "triggeredById" | "commitBefore" | "commitAfter" | "commitMessage"
    | "exitCode" | "log" | "startedAt" | "finishedAt" | "createdAt" | "updatedAt"
  > {}

export class Deployment
  extends Model<DeploymentAttributes, DeploymentCreationAttributes>
  implements DeploymentAttributes
{
  declare id: string;
  declare target: string;
  declare status: DeploymentStatus;
  declare triggeredById: string | null;
  declare triggeredByName: string;
  declare commitBefore: string | null;
  declare commitAfter: string | null;
  declare commitMessage: string | null;
  declare exitCode: number | null;
  declare log: string | null;
  declare startedAt: Date;
  declare finishedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Deployment.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    target: { type: DataTypes.STRING, allowNull: false },
    status: {
      type: DataTypes.ENUM("running", "success", "failed"),
      allowNull: false,
      defaultValue: "running",
    },
    triggeredById: { type: DataTypes.UUID, allowNull: true },
    triggeredByName: { type: DataTypes.STRING, allowNull: false, defaultValue: "Unknown" },
    commitBefore: { type: DataTypes.STRING, allowNull: true },
    commitAfter: { type: DataTypes.STRING, allowNull: true },
    commitMessage: { type: DataTypes.TEXT, allowNull: true },
    exitCode: { type: DataTypes.INTEGER, allowNull: true },
    log: { type: DataTypes.TEXT, allowNull: true },
    startedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    finishedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: "deployments",
    timestamps: true,
    indexes: [{ fields: ["target"] }, { fields: ["status"] }, { fields: ["createdAt"] }],
  }
);
