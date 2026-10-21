import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/**
 * A website chatbot. One per brand (Site); how many brands in a workspace may run
 * one is a plan limit (config/plans.ts → chatbots).
 *
 * `publicId` is what the embed snippet carries (`app_id` in the widget). It is
 * public by design — it identifies a bot, it does not authorise anything — so
 * every public endpoint resolves the workspace from it and scopes to that alone.
 *
 * `config` is the widget's own appearance object (primaryColor, chatbotName,
 * greetings, logos …) stored as-is so the widget can read it unchanged.
 */
export type ChatbotTrainingStatus = "idle" | "training" | "failed";

export interface ChatbotForms {
  pre_chat_form: unknown[];
  post_chat_form: Record<string, unknown>;
  ticket_form: unknown[];
}

interface ChatbotAttributes {
  id: string;
  siteId?: string | null;
  publicId: string;
  isActive: boolean;
  config: Record<string, unknown>;
  forms: ChatbotForms;
  /** First time the widget loaded on a real page. */
  installedAt?: Date | null;
  trainingStatus: ChatbotTrainingStatus;
  trainingProgress: number;
  trainingMessage?: string | null;
  lastTrainedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ChatbotCreationAttributes
  extends Optional<
    ChatbotAttributes,
    "id" | "siteId" | "isActive" | "config" | "forms" | "installedAt"
    | "trainingStatus" | "trainingProgress" | "trainingMessage" | "lastTrainedAt"
  > {}

export class Chatbot extends Model<ChatbotAttributes, ChatbotCreationAttributes> implements ChatbotAttributes {
  declare id: string;
  declare siteId: string | null;
  declare publicId: string;
  declare isActive: boolean;
  declare config: Record<string, unknown>;
  declare forms: ChatbotForms;
  declare installedAt: Date | null;
  declare trainingStatus: ChatbotTrainingStatus;
  declare trainingProgress: number;
  declare trainingMessage: string | null;
  declare lastTrainedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Chatbot.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    siteId: { type: DataTypes.UUID, allowNull: true },
    // Globally unique: the widget resolves the workspace from it.
    publicId: { type: DataTypes.STRING(6), allowNull: false, unique: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    config: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    forms: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: { pre_chat_form: [], post_chat_form: {}, ticket_form: [] },
    },
    installedAt: { type: DataTypes.DATE, allowNull: true },
    trainingStatus: {
      type: DataTypes.ENUM("idle", "training", "failed"),
      allowNull: false,
      defaultValue: "idle",
    },
    trainingProgress: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    trainingMessage: { type: DataTypes.TEXT, allowNull: true },
    lastTrainedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: "chatbots", timestamps: true }
);
