import { Router, type Response } from "express";
import multer from "multer";
import path from "node:path";
import { Op, type WhereOptions } from "sequelize";
import { authenticate, authorize, type AuthRequest } from "../middleware/authenticate";
import { resolveSiteContext } from "../middleware/siteContext";
import { Chatbot } from "../models/Chatbot";
import { ChatbotSource } from "../models/ChatbotSource";
import { ChatConversation } from "../models/ChatConversation";
import { ChatMessage } from "../models/ChatMessage";
import { User } from "../models/User";
import { chatbotSlotBlockedReason } from "../services/usage";
import { currentSiteFilter, runAcrossSites } from "../services/siteContext";
import { deleteObject, getPresignedReadUrl, publicUrl, uploadBuffer } from "../services/storage";
import { analyzeUrl, TRAINABLE_EXTENSIONS } from "../services/chatbot/extract";
import { isTraining, startTraining } from "../services/chatbot/training";
import { deleteChatbotChunks, deleteSourceChunks } from "../services/chatbot/vectorStore";
import { liveVisitors, onlineVisitors, emitToConversation, emitToOrg } from "../services/chatbot/realtime";
import { apiBase } from "../services/analyticsSetup";
import { appendMessage, serializeConversation, serializeMessage, type ResolvedBot } from "../services/chatbot/chatStore";

/**
 * Admin side of the website chatbot. Brand-split like Inbox and CRM: the
 * [domain] the admin is on decides which brand's bot every call below sees.
 */
const router = Router();
router.use(authenticate);
router.use(resolveSiteContext);

const canRead = authorize("chatbot:read");
const canWrite = authorize("chatbot:write");

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** The widget's own defaults, so a new bot's ticket form is never empty. */
const DEFAULT_FORMS = {
  pre_chat_form: [
    { id: "email-default", type: "email", label: "Email address", required: true, placeholder: "you@company.com" },
    { id: "name-default", type: "name", label: "Full name", required: false, placeholder: "Your name" },
    { id: "phone-default", type: "phone", label: "Phone number", required: false, placeholder: "Your phone number" },
  ],
  post_chat_form: {
    enabled: true,
    elements: [{ id: "rating-default", type: "rating", label: "How was your chat?", required: true }],
  },
  ticket_form: [
    { id: "email-ticket-default", type: "email", label: "Email address", required: true, placeholder: "you@company.com" },
    { id: "subject-ticket-default", type: "subject", label: "Subject", required: true, placeholder: "What is it about?" },
    { id: "description-ticket-default", type: "description", label: "Details", required: true, placeholder: "Tell us more" },
  ],
};

function newPublicId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I lookalikes
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

/** The current brand's bot (site-scoped by the hooks). */
async function currentBot(res: Response): Promise<Chatbot | null> {
  if (!currentSiteFilter()) {
    res.status(400).json({ message: "Pick a brand first." });
    return null;
  }
  const bot = await Chatbot.findOne();
  if (!bot) res.status(404).json({ message: "This brand has no chatbot yet." });
  return bot;
}

/** One tag: the widget starts itself from data-app-id. */
export function installSnippet(publicId: string) {
  return `<script async src="${apiBase()}/widget/rhinon-chat.js" data-app-id="${publicId}"></script>`;
}

function resolvedFor(req: AuthRequest, bot: Chatbot): ResolvedBot {
  return { bot, organizationId: req.user!.organizationId, site: bot.siteId ? { id: bot.siteId, slug: "" } : null };
}

async function usage(organizationId: string) {
  const used = await runAcrossSites(() => Chatbot.count());
  return { used, blockedReason: await chatbotSlotBlockedReason(used, organizationId) };
}

// ── Bot ─────────────────────────────────────────────────────────────────

router.get("/", canRead, async (req: AuthRequest, res) => {
  const bot = currentSiteFilter() ? await Chatbot.findOne() : null;
  res.json({
    chatbot: bot,
    snippet: bot ? installSnippet(bot.publicId) : null,
    widgetUrl: `${apiBase()}/widget/rhinon-chat.js`,
    apiUrl: `${apiBase()}/widget`,
    training: bot ? { running: isTraining(bot.id) } : null,
    plan: await usage(req.user!.organizationId),
  });
});

router.post("/", canWrite, async (req: AuthRequest, res) => {
  if (!currentSiteFilter()) return void res.status(400).json({ message: "Pick a brand first." });
  if (await Chatbot.findOne()) return void res.status(409).json({ message: "This brand already has a chatbot." });
  const { blockedReason } = await usage(req.user!.organizationId);
  if (blockedReason) return void res.status(402).json({ message: blockedReason, code: "PLAN_LIMIT" });

  let publicId = newPublicId();
  for (let i = 0; i < 5 && (await runAcrossSites(() => Chatbot.unscoped().count({ where: { publicId } }))); i++) publicId = newPublicId();

  const config = (req.body?.config && typeof req.body.config === "object" ? req.body.config : {}) as Record<string, unknown>;
  const bot = await Chatbot.create({
    publicId,
    forms: DEFAULT_FORMS,
    config: {
      chatbotName: "Assistant",
      primaryColor: "#1c1917",
      secondaryColor: "#ffffff",
      greetings: ["Hi there 👋", "How can we help?"],
      isBgFade: true,
      ...config,
    },
  });
  res.status(201).json({ chatbot: bot });
});

router.patch("/", canWrite, async (req: AuthRequest, res) => {
  const bot = await currentBot(res);
  if (!bot) return;
  const updates: Partial<Pick<Chatbot, "config" | "forms" | "isActive">> = {};
  if (req.body?.config && typeof req.body.config === "object") updates.config = { ...bot.config, ...req.body.config };
  if (req.body?.forms && typeof req.body.forms === "object") updates.forms = { ...bot.forms, ...req.body.forms };
  if (typeof req.body?.isActive === "boolean") updates.isActive = req.body.isActive;
  await bot.update(updates);
  res.json({ chatbot: bot });
});

router.delete("/", canWrite, async (req: AuthRequest, res) => {
  const bot = await currentBot(res);
  if (!bot) return;
  const org = req.user!.organizationId;
  const sources = await ChatbotSource.findAll({ where: { chatbotId: bot.id } });
  for (const s of sources) if (s.fileKey) await deleteObject(s.fileKey).catch(() => undefined);
  await deleteChatbotChunks(org, bot.id);
  await ChatbotSource.destroy({ where: { chatbotId: bot.id } });
  const convIds = (await ChatConversation.findAll({ where: { chatbotId: bot.id }, attributes: ["id"] })).map((c) => c.id);
  if (convIds.length) await ChatMessage.destroy({ where: { conversationId: { [Op.in]: convIds } } });
  await ChatConversation.destroy({ where: { chatbotId: bot.id } });
  await bot.destroy();
  res.json({ success: true });
});

// ── Appearance images (logos, background) ──────────────────────────────

const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const IMAGE_TYPES = /^image\/(png|jpe?g|gif|webp|svg\+xml)$/;

/**
 * Stored under the public content/ prefix: the widget shows these to every
 * visitor on the customer's site, so they need a plain, permanent URL.
 */
router.post("/upload-image", canWrite, imageUpload.single("image"), async (req, res) => {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) return void res.status(400).json({ message: "No image uploaded" });
  if (!IMAGE_TYPES.test(file.mimetype)) return void res.status(415).json({ message: "Use a PNG, JPG, GIF, WebP or SVG image." });
  const key = await uploadBuffer(file.buffer, file.originalname, "content", file.mimetype);
  res.status(201).json({ url: publicUrl(key) });
});

// ── Training ────────────────────────────────────────────────────────────

router.get("/sources", canRead, async (_req, res) => {
  const bot = await currentBot(res);
  if (!bot) return;
  res.json({
    sources: await ChatbotSource.findAll({ where: { chatbotId: bot.id }, order: [["createdAt", "DESC"]] }),
    training: { running: isTraining(bot.id), status: bot.trainingStatus, progress: bot.trainingProgress, message: bot.trainingMessage, lastTrainedAt: bot.lastTrainedAt },
  });
});

router.post("/analyze-url", canWrite, async (req, res) => {
  try {
    res.json(await analyzeUrl(str(req.body?.url, 2000)));
  } catch (err: any) {
    res.status(400).json({ message: err.message || "That website could not be reached." });
  }
});

router.post("/sources", canWrite, async (req, res) => {
  const bot = await currentBot(res);
  if (!bot) return;
  const kind = req.body?.kind;
  if (kind === "url" || kind === "sitemap") {
    const url = str(req.body?.url, 2000);
    try {
      const parsed = new URL(url);
      if (!/^https?:$/.test(parsed.protocol)) throw new Error();
    } catch {
      return void res.status(400).json({ message: "Enter a full link, starting with https://" });
    }
    const dupe = await ChatbotSource.findOne({ where: { chatbotId: bot.id, url } });
    if (dupe) return void res.status(409).json({ message: "That link is already a source." });
    const source = await ChatbotSource.create({ chatbotId: bot.id, kind, url, title: str(req.body?.title, 500) || url });
    return void res.status(201).json({ source });
  }
  if (kind === "text") {
    const content = str(req.body?.content, 200_000);
    if (content.length < 20) return void res.status(400).json({ message: "Add a bit more text to train on." });
    const source = await ChatbotSource.create({ chatbotId: bot.id, kind, content, title: str(req.body?.title, 500) || "Note" });
    return void res.status(201).json({ source });
  }
  res.status(400).json({ message: "kind must be url, sitemap or text" });
});

router.patch("/sources/:sourceId", canWrite, async (req, res) => {
  const bot = await currentBot(res);
  if (!bot) return;
  const source = await ChatbotSource.findOne({ where: { id: req.params.sourceId as string, chatbotId: bot.id } });
  if (!source) return void res.status(404).json({ message: "Source not found" });
  if (source.kind !== "text") return void res.status(400).json({ message: "Only text sources can be edited." });
  await source.update({
    title: str(req.body?.title, 500) || source.title,
    content: typeof req.body?.content === "string" ? str(req.body.content, 200_000) : source.content,
    status: "pending", // edited text must be trained again
  });
  res.json({ source });
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.post("/sources/upload", canWrite, upload.array("files", 10), async (req, res) => {
  const bot = await currentBot(res);
  if (!bot) return;
  const files = ((req as any).files ?? []) as Express.Multer.File[];
  if (!files.length) return void res.status(400).json({ message: "No files uploaded" });
  const bad = files.find((f) => !TRAINABLE_EXTENSIONS.includes(path.extname(f.originalname).toLowerCase()));
  if (bad) return void res.status(415).json({ message: `${bad.originalname} can't be trained. Use ${TRAINABLE_EXTENSIONS.join(", ")}.` });
  const created = [];
  for (const file of files) {
    const fileKey = await uploadBuffer(file.buffer, file.originalname, "chatbot", file.mimetype || "application/octet-stream");
    created.push(await ChatbotSource.create({ chatbotId: bot.id, kind: "file", fileKey, fileName: file.originalname.slice(0, 300), title: file.originalname.slice(0, 500) }));
  }
  res.status(201).json({ sources: created });
});

router.delete("/sources/:sourceId", canWrite, async (req: AuthRequest, res) => {
  const bot = await currentBot(res);
  if (!bot) return;
  const source = await ChatbotSource.findOne({ where: { id: req.params.sourceId as string, chatbotId: bot.id } });
  if (!source) return void res.status(404).json({ message: "Source not found" });
  if (source.status === "training") return void res.status(409).json({ message: "Wait for training to finish." });
  await deleteSourceChunks(req.user!.organizationId, source.id);
  if (source.fileKey) await deleteObject(source.fileKey).catch(() => undefined);
  await source.destroy();
  res.json({ success: true });
});

router.post("/sources/:sourceId/retrain", canWrite, async (req: AuthRequest, res) => {
  const bot = await currentBot(res);
  if (!bot) return;
  const source = await ChatbotSource.findOne({ where: { id: req.params.sourceId as string, chatbotId: bot.id } });
  if (!source) return void res.status(404).json({ message: "Source not found" });
  await source.update({ status: "pending", error: null });
  startTraining(req.user!.organizationId, bot.id);
  res.json({ source });
});

router.post("/train", canWrite, async (req: AuthRequest, res) => {
  const bot = await currentBot(res);
  if (!bot) return;
  const started = startTraining(req.user!.organizationId, bot.id);
  res.json({ started, message: started ? "Training started" : "Training is already running" });
});

router.get("/sources/:sourceId/file", canRead, async (req, res) => {
  const bot = await currentBot(res);
  if (!bot) return;
  const source = await ChatbotSource.findOne({ where: { id: req.params.sourceId as string, chatbotId: bot.id } });
  if (!source?.fileKey) return void res.status(404).json({ message: "File not found" });
  res.json({ url: await getPresignedReadUrl(source.fileKey, 600) });
});

// ── Overview numbers ────────────────────────────────────────────────────

router.get("/stats", canRead, async (_req, res) => {
  const bot = await currentBot(res);
  if (!bot) return;
  const notTest = { [Op.notLike]: "admin-test-%" };
  // Days start at midnight IST, like every other "today" in the product.
  const todayIst = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date()); // YYYY-MM-DD
  const startOfToday = new Date(`${todayIst}T00:00:00+05:30`);
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600_000);

  const base = { chatbotId: bot.id, visitorId: notTest };
  const [chatsToday, chatsWeek, leadsWeek, waiting, convIdsToday] = await Promise.all([
    ChatConversation.count({ where: { ...base, createdAt: { [Op.gte]: startOfToday } } }),
    ChatConversation.count({ where: { ...base, createdAt: { [Op.gte]: weekAgo } } }),
    ChatConversation.count({ where: { ...base, leadId: { [Op.ne]: null }, createdAt: { [Op.gte]: weekAgo } } }),
    ChatConversation.count({ where: { ...base, status: "open", unreadCount: { [Op.gt]: 0 }, mode: "human" } }),
    ChatConversation.findAll({ where: { ...base, lastMessageAt: { [Op.gte]: startOfToday } }, attributes: ["id"] }),
  ]);
  const answersToday = convIdsToday.length
    ? await ChatMessage.count({ where: { conversationId: { [Op.in]: convIdsToday.map((c) => c.id) }, role: "bot", createdAt: { [Op.gte]: startOfToday } } })
    : 0;
  res.json({ chatsToday, chatsWeek, leadsWeek, waiting, answersToday, onlineNow: onlineVisitors(bot.id).length });
});

// ── Live chats ──────────────────────────────────────────────────────────

router.get("/visitors", canRead, async (_req, res) => {
  const bot = await currentBot(res);
  if (!bot) return;
  const visitors = liveVisitors(bot.id).map(({ sockets, ...v }) => v);
  // Each visitor's latest chat, so the list can say "chatting" / "ready" / none.
  const ids = visitors.map((v) => v.visitorId);
  const convs = ids.length
    ? await ChatConversation.findAll({
        where: { chatbotId: bot.id, visitorId: { [Op.in]: ids } },
        order: [["lastMessageAt", "DESC"]],
        attributes: ["id", "visitorId", "mode", "status", "visitorName", "visitorEmail", "lastMessageAt", "unreadCount"],
      })
    : [];
  const latest = new Map<string, ChatConversation>();
  for (const c of convs) if (!latest.has(c.visitorId)) latest.set(c.visitorId, c);
  res.json({
    visitors: visitors.map((v) => {
      const c = latest.get(v.visitorId);
      return {
        ...v,
        name: c?.visitorName ?? null,
        email: v.email ?? c?.visitorEmail ?? null,
        conversation: c ? { id: c.id, mode: c.mode, status: c.status, lastMessageAt: c.lastMessageAt, unreadCount: c.unreadCount } : null,
      };
    }),
  });
});

router.get("/conversations", canRead, async (req: AuthRequest, res) => {
  const bot = await currentBot(res);
  if (!bot) return;
  const where: WhereOptions = { chatbotId: bot.id, visitorId: { [Op.notLike]: "admin-test-%" } };
  const status = str(req.query.status, 10);
  if (status === "open" || status === "closed") Object.assign(where, { status });
  const mode = str(req.query.mode, 10);
  if (mode === "bot" || mode === "human") Object.assign(where, { mode });
  if (req.query.mine === "1") Object.assign(where, { assignedUserId: req.user!.userId });
  const q = str(req.query.q, 100);
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    Object.assign(where, {
      [Op.or]: [{ visitorEmail: { [Op.iLike]: like } }, { visitorName: { [Op.iLike]: like } }, { title: { [Op.iLike]: like } }],
    });
  }
  const conversations = await ChatConversation.findAll({
    where,
    order: [["isPinned", "DESC"], ["lastMessageAt", "DESC"]],
    limit: Math.min(Number(req.query.limit) || 100, 200),
  });
  res.json({ conversations: conversations.map(serializeConversation) });
});

async function conversationOfBot(res: Response, id: string) {
  const bot = await currentBot(res);
  if (!bot) return null;
  const conv = await ChatConversation.findOne({ where: { id, chatbotId: bot.id } });
  if (!conv) {
    res.status(404).json({ message: "Conversation not found" });
    return null;
  }
  return { bot, conv };
}

router.get("/conversations/:id", canRead, async (req, res) => {
  const found = await conversationOfBot(res, req.params.id as string);
  if (!found) return;
  const messages = await ChatMessage.findAll({ where: { conversationId: found.conv.id }, order: [["createdAt", "ASC"]], limit: 1000 });
  const assignee = found.conv.assignedUserId ? await User.findByPk(found.conv.assignedUserId, { attributes: ["id", "fullName"] }) : null;
  res.json({
    conversation: serializeConversation(found.conv),
    assignee,
    messages: messages.map(serializeMessage),
    online: onlineVisitors(found.bot.id).some((v) => v.visitorId === found.conv.visitorId),
  });
});

router.post("/conversations/:id/read", canRead, async (req: AuthRequest, res) => {
  const found = await conversationOfBot(res, req.params.id as string);
  if (!found) return;
  if (found.conv.unreadCount) {
    await found.conv.update({ unreadCount: 0 });
    emitToOrg(req.user!.organizationId, "chat:conversation", serializeConversation(found.conv));
  }
  res.json({ success: true });
});

/** An agent reply. Replying takes the chat over from the bot. */
router.post("/conversations/:id/messages", canWrite, async (req: AuthRequest, res) => {
  const found = await conversationOfBot(res, req.params.id as string);
  if (!found) return;
  const text = str(req.body?.text, 10_000);
  if (!text) return void res.status(400).json({ message: "Write a message first." });
  const { conv, bot } = found;
  const me = await User.findByPk(req.user!.userId, { attributes: ["id", "fullName", "avatarKey"] });
  await conv.update({
    mode: "human",
    status: "open",
    closedAt: null,
    assignedUserId: conv.assignedUserId ?? req.user!.userId,
    unreadCount: 0,
  });
  const image = me?.avatarKey ? await getPresignedReadUrl(me.avatarKey, 3600).catch(() => null) : null;
  const message = await appendMessage(resolvedFor(req, bot), conv, {
    role: "support",
    phase: "human",
    text,
    agent: { id: req.user!.userId, name: me?.fullName || req.user!.fullName, image },
  });
  res.status(201).json({ message: serializeMessage(message), conversation: serializeConversation(conv) });
});

router.patch("/conversations/:id", canWrite, async (req: AuthRequest, res) => {
  const found = await conversationOfBot(res, req.params.id as string);
  if (!found) return;
  const { conv } = found;
  const updates: Partial<Pick<ChatConversation, "status" | "isPinned" | "assignedUserId" | "mode" | "closedAt">> = {};
  if (req.body?.status === "open" || req.body?.status === "closed") {
    updates.status = req.body.status;
    updates.closedAt = req.body.status === "closed" ? new Date() : null;
  }
  if (typeof req.body?.isPinned === "boolean") updates.isPinned = req.body.isPinned;
  if (req.body?.mode === "bot" || req.body?.mode === "human") updates.mode = req.body.mode;
  if ("assignedUserId" in (req.body ?? {})) {
    const id = req.body.assignedUserId;
    if (id !== null && !(await User.findByPk(String(id), { attributes: ["id"] }))) {
      return void res.status(400).json({ message: "That person is not in this workspace." });
    }
    updates.assignedUserId = id;
  }
  await conv.update(updates);
  if (updates.status === "closed") emitToConversation(conv.id, "conversation:closed", { chatbot_history: conv.publicKey });
  emitToOrg(req.user!.organizationId, "chat:conversation", serializeConversation(conv));
  res.json({ conversation: serializeConversation(conv) });
});

router.delete("/conversations/:id", canWrite, async (req: AuthRequest, res) => {
  const found = await conversationOfBot(res, req.params.id as string);
  if (!found) return;
  await ChatMessage.destroy({ where: { conversationId: found.conv.id } });
  await found.conv.destroy();
  emitToOrg(req.user!.organizationId, "chat:conversation:deleted", { id: found.conv.id });
  res.json({ success: true });
});

export default router;
