import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/**
 * GitHub integration for Work — platform-only for now (see routes/github.ts).
 *
 * A ProjectRepo ties one repository to one project. Commits arrive by the
 * GitHub App's push webhook and land in RepoCommit; the project's deploy key and
 * any server credentials live alongside, encrypted at rest.
 */

interface ProjectRepoAttributes {
  id: string;
  projectId: string;
  /** "owner/name" — what the push webhook identifies the repo by. */
  repoFullName: string;
  repoId: number;
  /** The GitHub App installation that can see this repo; needed to mint API tokens. */
  installationId: number;
  defaultBranch: string;
  /** Tag color for this repo's cards (a STATUS_CHIP palette key), so repos don't blur together. */
  color: string;
  /**
   * Opt-in: each night, commits that reference no task are grouped by AI into
   * feature-level Done cards (services/github/grouping.ts).
   */
  autoCreateTasks: boolean;
  deployKeyId: number | null;
  deployKeyPublic: string | null;
  /** AES-GCM via services/totp.ts — never returned by the API. */
  deployKeyPrivateEnc: string | null;
  deployKeyReadOnly: boolean;
  lastPushAt: Date | null;
  createdById: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProjectRepoCreationAttributes
  extends Optional<
    ProjectRepoAttributes,
    | "id" | "color" | "autoCreateTasks" | "deployKeyId" | "deployKeyPublic" | "deployKeyPrivateEnc"
    | "deployKeyReadOnly" | "lastPushAt" | "createdById"
  > {}

export class ProjectRepo
  extends Model<ProjectRepoAttributes, ProjectRepoCreationAttributes>
  implements ProjectRepoAttributes
{
  declare id: string;
  declare projectId: string;
  declare repoFullName: string;
  declare repoId: number;
  declare installationId: number;
  declare defaultBranch: string;
  declare color: string;
  declare autoCreateTasks: boolean;
  declare deployKeyId: number | null;
  declare deployKeyPublic: string | null;
  declare deployKeyPrivateEnc: string | null;
  declare deployKeyReadOnly: boolean;
  declare lastPushAt: Date | null;
  declare createdById: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ProjectRepo.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    projectId: { type: DataTypes.UUID, allowNull: false },
    repoFullName: { type: DataTypes.STRING(200), allowNull: false },
    repoId: { type: DataTypes.BIGINT, allowNull: false },
    installationId: { type: DataTypes.BIGINT, allowNull: false },
    defaultBranch: { type: DataTypes.STRING(200), allowNull: false, defaultValue: "main" },
    color: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "blue" },
    autoCreateTasks: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    deployKeyId: { type: DataTypes.BIGINT, allowNull: true },
    deployKeyPublic: { type: DataTypes.TEXT, allowNull: true },
    deployKeyPrivateEnc: { type: DataTypes.TEXT, allowNull: true },
    deployKeyReadOnly: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    lastPushAt: { type: DataTypes.DATE, allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: true },
  },
  {
    sequelize,
    tableName: "project_repos",
    timestamps: true,
    // One repo may feed several projects, but not the same project twice.
    indexes: [{ unique: true, fields: ["projectId", "repoId"] }, { fields: ["repoId"] }],
  }
);

interface RepoCommitAttributes {
  id: string;
  projectRepoId: string;
  projectId: string;
  repoFullName: string;
  sha: string;
  message: string;
  branch: string | null;
  url: string | null;
  authorName: string | null;
  authorEmail: string | null;
  authorLogin: string | null;
  /** The employee this commit was matched to by email; null when unmatched. */
  userId: string | null;
  committedAt: Date;
  /** Tasks referenced (T-xxxxxxxx) or the AI-grouped card this commit landed in. */
  taskIds: string[];
  /** Changed file paths — what the AI groups by. Null until fetched. */
  files: string[] | null;
  /** When AI grouping considered this commit; null = still pending. */
  groupedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RepoCommitCreationAttributes
  extends Optional<
    RepoCommitAttributes,
    "id" | "branch" | "url" | "authorName" | "authorEmail" | "authorLogin" | "userId" | "taskIds" | "files" | "groupedAt"
  > {}

export class RepoCommit
  extends Model<RepoCommitAttributes, RepoCommitCreationAttributes>
  implements RepoCommitAttributes
{
  declare id: string;
  declare projectRepoId: string;
  declare projectId: string;
  declare repoFullName: string;
  declare sha: string;
  declare message: string;
  declare branch: string | null;
  declare url: string | null;
  declare authorName: string | null;
  declare authorEmail: string | null;
  declare authorLogin: string | null;
  declare userId: string | null;
  declare committedAt: Date;
  declare taskIds: string[];
  declare files: string[] | null;
  declare groupedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

RepoCommit.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    projectRepoId: { type: DataTypes.UUID, allowNull: false },
    projectId: { type: DataTypes.UUID, allowNull: false },
    repoFullName: { type: DataTypes.STRING(200), allowNull: false },
    sha: { type: DataTypes.STRING(40), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    branch: { type: DataTypes.STRING(200), allowNull: true },
    url: { type: DataTypes.STRING(500), allowNull: true },
    authorName: { type: DataTypes.STRING(200), allowNull: true },
    authorEmail: { type: DataTypes.STRING(200), allowNull: true },
    authorLogin: { type: DataTypes.STRING(100), allowNull: true },
    userId: { type: DataTypes.UUID, allowNull: true },
    committedAt: { type: DataTypes.DATE, allowNull: false },
    taskIds: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    files: { type: DataTypes.JSONB, allowNull: true },
    groupedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: "repo_commits",
    timestamps: true,
    // A sha pushed to several branches is still one commit.
    indexes: [
      { unique: true, fields: ["projectRepoId", "sha"] },
      { fields: ["projectId", "committedAt"] },
      { fields: ["committedAt"] },
    ],
  }
);

export type ProjectSecretKind = "ssh_key" | "env" | "token" | "note";

interface ProjectSecretAttributes {
  id: string;
  projectId: string;
  name: string;
  kind: ProjectSecretKind;
  host: string | null;
  username: string | null;
  port: number | null;
  /** AES-GCM via services/totp.ts. Only ever decrypted by the audited reveal route. */
  valueEnc: string;
  /** For ssh_key: safe to show, so it is stored in the clear. */
  publicKey: string | null;
  createdById: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProjectSecretCreationAttributes
  extends Optional<ProjectSecretAttributes, "id" | "host" | "username" | "port" | "publicKey" | "createdById"> {}

export class ProjectSecret
  extends Model<ProjectSecretAttributes, ProjectSecretCreationAttributes>
  implements ProjectSecretAttributes
{
  declare id: string;
  declare projectId: string;
  declare name: string;
  declare kind: ProjectSecretKind;
  declare host: string | null;
  declare username: string | null;
  declare port: number | null;
  declare valueEnc: string;
  declare publicKey: string | null;
  declare createdById: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ProjectSecret.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    projectId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING(120), allowNull: false },
    kind: { type: DataTypes.STRING(16), allowNull: false },
    host: { type: DataTypes.STRING(255), allowNull: true },
    username: { type: DataTypes.STRING(100), allowNull: true },
    port: { type: DataTypes.INTEGER, allowNull: true },
    valueEnc: { type: DataTypes.TEXT, allowNull: false },
    publicKey: { type: DataTypes.TEXT, allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: true },
  },
  { sequelize, tableName: "project_secrets", timestamps: true, indexes: [{ fields: ["projectId"] }] }
);
