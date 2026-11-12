import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

// Internal team chat (Teams-style). Prefixed "TeamChat" because ChatConversation /
// ChatMessage already belong to the website chatbot.

export type TeamChatKind = "direct" | "group" | "channel";

interface ConversationAttributes {
  id: string;
  kind: TeamChatKind;
  name: string | null;
  description: string | null;
  /** Channels only: private channels are invisible to non-members. */
  isPrivate: boolean;
  /** Directs only: the two user ids sorted and joined, so a pair has one chat. */
  directKey: string | null;
  /** Optional link to a Work project — its channel. */
  projectId: string | null;
  createdById: string;
  lastMessageAt: Date | null;
  archivedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TeamChatConversation
  extends Model<ConversationAttributes, Optional<ConversationAttributes, "id" | "name" | "description" | "isPrivate" | "directKey" | "projectId" | "lastMessageAt" | "archivedAt">>
  implements ConversationAttributes
{
  declare id: string;
  declare kind: TeamChatKind;
  declare name: string | null;
  declare description: string | null;
  declare isPrivate: boolean;
  declare directKey: string | null;
  declare projectId: string | null;
  declare createdById: string;
  declare lastMessageAt: Date | null;
  declare archivedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TeamChatConversation.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    kind: { type: DataTypes.STRING(16), allowNull: false },
    name: { type: DataTypes.STRING(120), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    isPrivate: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    directKey: { type: DataTypes.STRING(80), allowNull: true },
    projectId: { type: DataTypes.UUID, allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: false },
    lastMessageAt: { type: DataTypes.DATE, allowNull: true },
    archivedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: "team_chat_conversations",
    timestamps: true,
    indexes: [{ fields: ["directKey"] }, { fields: ["projectId"] }],
  }
);

interface MemberAttributes {
  id: string;
  conversationId: string;
  userId: string;
  role: "owner" | "member";
  lastReadAt: Date | null;
  muted: boolean;
  pinned: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TeamChatMember
  extends Model<MemberAttributes, Optional<MemberAttributes, "id" | "role" | "lastReadAt" | "muted" | "pinned">>
  implements MemberAttributes
{
  declare id: string;
  declare conversationId: string;
  declare userId: string;
  declare role: "owner" | "member";
  declare lastReadAt: Date | null;
  declare muted: boolean;
  declare pinned: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TeamChatMember.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    conversationId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    role: { type: DataTypes.STRING(16), allowNull: false, defaultValue: "member" },
    lastReadAt: { type: DataTypes.DATE, allowNull: true },
    muted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    pinned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    sequelize,
    tableName: "team_chat_members",
    timestamps: true,
    indexes: [{ unique: true, fields: ["conversationId", "userId"] }, { fields: ["userId"] }],
  }
);

export interface TeamChatAttachment {
  key: string;
  name: string;
  size: number;
  mimeType: string;
}

interface MessageAttributes {
  id: string;
  conversationId: string;
  authorId: string;
  /** Set on thread replies; points at the root message. */
  parentId: string | null;
  body: string;
  attachments: TeamChatAttachment[];
  mentions: string[];
  isSystem: boolean;
  replyCount: number;
  lastReplyAt: Date | null;
  editedAt: Date | null;
  deletedAt: Date | null;
  pinnedAt: Date | null;
  pinnedById: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TeamChatMessage
  extends Model<
    MessageAttributes,
    Optional<MessageAttributes, "id" | "parentId" | "attachments" | "mentions" | "isSystem" | "replyCount" | "lastReplyAt" | "editedAt" | "deletedAt" | "pinnedAt" | "pinnedById">
  >
  implements MessageAttributes
{
  declare id: string;
  declare conversationId: string;
  declare authorId: string;
  declare parentId: string | null;
  declare body: string;
  declare attachments: TeamChatAttachment[];
  declare mentions: string[];
  declare isSystem: boolean;
  declare replyCount: number;
  declare lastReplyAt: Date | null;
  declare editedAt: Date | null;
  declare deletedAt: Date | null;
  declare pinnedAt: Date | null;
  declare pinnedById: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TeamChatMessage.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    conversationId: { type: DataTypes.UUID, allowNull: false },
    authorId: { type: DataTypes.UUID, allowNull: false },
    parentId: { type: DataTypes.UUID, allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
    attachments: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    mentions: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    isSystem: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    replyCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lastReplyAt: { type: DataTypes.DATE, allowNull: true },
    editedAt: { type: DataTypes.DATE, allowNull: true },
    deletedAt: { type: DataTypes.DATE, allowNull: true },
    pinnedAt: { type: DataTypes.DATE, allowNull: true },
    pinnedById: { type: DataTypes.UUID, allowNull: true },
  },
  {
    sequelize,
    tableName: "team_chat_messages",
    timestamps: true,
    indexes: [{ fields: ["conversationId", "createdAt"] }, { fields: ["parentId"] }],
  }
);

interface ReactionAttributes {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TeamChatReaction extends Model<ReactionAttributes, Optional<ReactionAttributes, "id">> implements ReactionAttributes {
  declare id: string;
  declare messageId: string;
  declare userId: string;
  declare emoji: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TeamChatReaction.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    messageId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    emoji: { type: DataTypes.STRING(32), allowNull: false },
  },
  {
    sequelize,
    tableName: "team_chat_reactions",
    timestamps: true,
    indexes: [{ unique: true, fields: ["messageId", "userId", "emoji"] }],
  }
);

interface CallLinkAttributes {
  id: string;
  conversationId: string;
  /** Unguessable, URL-safe; the public join URL is /meet/<token>. */
  token: string;
  createdById: string;
  /** Guests wait in a lobby until someone in the call admits them. */
  requireApproval: boolean;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/** A shareable link that lets people without an account join a chat's call as guests. */
export class TeamCallLink
  extends Model<CallLinkAttributes, Optional<CallLinkAttributes, "id" | "requireApproval" | "expiresAt" | "revokedAt">>
  implements CallLinkAttributes
{
  declare id: string;
  declare conversationId: string;
  declare token: string;
  declare createdById: string;
  declare requireApproval: boolean;
  declare expiresAt: Date | null;
  declare revokedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TeamCallLink.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    conversationId: { type: DataTypes.UUID, allowNull: false },
    token: { type: DataTypes.STRING(64), allowNull: false },
    createdById: { type: DataTypes.UUID, allowNull: false },
    requireApproval: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    revokedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: "team_call_links",
    timestamps: true,
    indexes: [{ unique: true, fields: ["token"] }, { fields: ["conversationId"] }],
  }
);
