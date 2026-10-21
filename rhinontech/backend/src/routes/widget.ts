import express, { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import fs from "node:fs";
import nodePath from "node:path";
import { Op } from "sequelize";
import { Lead } from "../models/Lead";
import { ChatConversation } from "../models/ChatConversation";
import { ChatMessage } from "../models/ChatMessage";
import { User } from "../models/User";
import { rateLimit } from "../middleware/rateLimit";
import { findOrMergeLead } from "../services/leadCapture";
import { getPresignedReadUrl, uploadBuffer } from "../services/storage";
import { planState } from "../services/usage";
import { Organization } from "../models/Organization";
import { runAsSystem } from "../services/tenantContext";
import { answer } from "../services/chatbot/answer";
import {
  findOrCreateConversation,
  realEmail,
  resolveBot,
  serializeConversation,
  withBot,
  type ResolvedBot,
} from "../services/chatbot/chatStore";
import { emitToOrg } from "../services/chatbot/realtime";

/**
 * The website widget's API (the old Saleszium bot-sdk), at the same paths it
 * always called, under /widget. Both of the widget's base URLs
 * (REACT_APP_NEW_SERVER_API_URL and REACT_APP_API_URL_AI) point here.
 *
 * Public by nature: every handler resolves the bot from its public id and then
 * runs inside that bot's workspace and brand, nothing else. Saleszium's versions
 * of several of these took no id at all and searched every tenant.
 */
const router = Router();

/**
 * The widget itself. Built on a dev machine from /bot-sdk (`npm run release`)
 * and committed under backend/public, because running webpack on the t2.micro
 * would compete with the API for its 1 GB. Same path from src/ and dist/.
 */
const WIDGET_FILE = nodePath.resolve(__dirname, "../../public/widget/rhinonbot.js");
router.get("/rhinonbot.js", (req, res) => {
  if (!fs.existsSync(WIDGET_FILE)) return void res.status(404).type("text/plain").send("// widget not built");
  res.type("application/javascript; charset=utf-8");
  // Short cache: a release reaches customers' sites within ten minutes.
  res.set("Cache-Control", "public, max-age=600");
  res.set("Cross-Origin-Resource-Policy", "cross-origin");
  res.set("Vary", "Accept-Encoding");
  // The release also writes a gzipped copy (~830 KB → ~250 KB); nothing on the
  // way compresses it for us, so serve that whenever the browser accepts it.
  const gz = `${WIDGET_FILE}.gz`;
  if (/\bgzip\b/.test(String(req.headers["accept-encoding"] || "")) && fs.existsSync(gz)) {
    res.set("Content-Encoding", "gzip");
    return void res.sendFile(gz, { headers: { "Content-Type": "application/javascript; charset=utf-8" } });
  }
  res.sendFile(WIDGET_FILE);
});

// Logos, avatars and the notification sound the widget shows. Self-hosted so
// the product does not depend on the old saleszium.com domain staying up.
router.use(
  "/assets",
  express.static(nodePath.resolve(__dirname, "../../public/widget/assets"), {
    maxAge: "7d",
    fallthrough: false,
    setHeaders: (res) => res.set("Cross-Origin-Resource-Policy", "cross-origin"),
  })
);

router.use(rateLimit({ name: "widget-ip", windowMs: 60_000, max: 240 }));

type BotRequest = Request & { bot?: ResolvedBot };

const botParam = (req: Request) =>
  (req.query.chatbot_id ?? req.query.app_id ?? (req.body as Record<string, unknown> | undefined)?.chatbot_id) as unknown;

/** Resolves `chatbot_id` (query or body) and enters its workspace + brand. */
function withResolvedBot(req: BotRequest, res: Response, next: NextFunction) {
  resolveBot(botParam(req))
    .then((resolved) => {
      if (!resolved) return void res.status(404).json({ message: "Chatbot not found" });
      req.bot = resolved;
      withBot(resolved, next, "widget");
    })
    .catch(next);
}

const asyncRoute =
  (fn: (req: BotRequest, res: Response) => Promise<unknown>) => (req: BotRequest, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// ── Config ──────────────────────────────────────────────────────────────────

router.get("/chatbot/chatbot", withResolvedBot, asyncRoute(async (req, res) => {
  const { bot, organizationId } = req.bot!;
  const org = await runAsSystem("widget:plan", () => Organization.findByPk(organizationId));
  const plan = org ? planState(org) : null;
  const label = plan?.limits.label ?? "Free";
  res.json({
    chatbot_id: bot.publicId,
    plan: label,
    chatbot_base_url: null,
    // Saleszium hid the widget for free plans without their own OpenAI key.
    // Plans gate usage here (botRepliesPerDay), so the widget always shows.
    isApiKeyProvided: true,
    chatbot_installed: !!bot.installedAt,
    chatbot_config: { ...bot.config, isFreePlan: !!plan && !plan.isPlatform && plan.plan === "free", currentPlan: label },
  });
}));

router.post("/chatbot/set-installed", withResolvedBot, asyncRoute(async (req, res) => {
  const { bot, organizationId } = req.bot!;
  if (!bot.installedAt) {
    await bot.update({ installedAt: new Date() });
    emitToOrg(organizationId, "chatbot:installed", { chatbotId: bot.id });
  }
  res.json({ success: true });
}));

// WhatsApp hand-off arrives with the integrations phase; until then the widget hides it.
router.get("/chatbot/whatsapp-config", (_req, res) => void res.json(null));

router.get("/chatbot/customer-phone", withResolvedBot, asyncRoute(async (req, res) => {
  const email = realEmail(req.query.email);
  const lead = email ? await Lead.findOne({ where: { email }, attributes: ["phone"] }) : null;
  res.json(lead?.phone ? { hasPhone: true, phoneNumber: lead.phone } : { hasPhone: false });
}));

router.post("/chatbot/customer-phone", withResolvedBot, asyncRoute(async (req, res) => {
  const email = realEmail(req.body?.email);
  const phone = str(req.body?.phoneNumber, 50);
  if (!email || !phone) return void res.status(400).json({ message: "email and phoneNumber are required" });
  await findOrMergeLead({ name: email.split("@")[0], email, phone, source: "Website chatbot", summary: "Shared a phone number in the website chat." });
  res.json({ success: true });
}));

// ── Forms ───────────────────────────────────────────────────────────────────

router.get("/forms/chatbot-forms", withResolvedBot, asyncRoute(async (req, res) => {
  const forms = req.bot!.bot.forms ?? {};
  res.json({
    pre_chat_form: forms.pre_chat_form ?? [],
    post_chat_form: forms.post_chat_form ?? {},
    ticket_form: forms.ticket_form ?? [],
  });
}));

router.post("/forms/save-prechat-forms-values", withResolvedBot, asyncRoute(async (req, res) => {
  const email = realEmail(req.body?.email);
  if (!email) return void res.status(400).json({ message: "A valid email is required" });
  const custom = (req.body?.custom_data ?? {}) as Record<string, unknown>;
  const pick = (...keys: string[]) => keys.map((k) => str(custom[k], 200)).find(Boolean) || null;
  const name = pick("name", "full_name", "your_name");
  const phone = pick("phone", "phone_number", "mobile", "contact_number");
  const lead = await findOrMergeLead({
    name: name || email.split("@")[0],
    email,
    phone,
    company: pick("company", "company_name", "organization"),
    source: "Website chatbot",
    summary: "Filled the chat's pre-chat form.",
    raw: Object.fromEntries(Object.entries(custom).map(([k, v]) => [k.slice(0, 60), str(v, 500)])),
  });
  res.json({ success: true, leadId: lead.id });
}));

// ── AI chat (SSE) ──────────────────────────────────────────────────────────

router.post(
  "/gcs/standard/chat",
  rateLimit({ name: "widget-chat", windowMs: 60_000, max: 20 }),
  withResolvedBot,
  asyncRoute(async (req, res) => {
    const visitorId = str(req.body?.user_id, 128);
    const prompt = str(req.body?.prompt, 4000);
    if (!visitorId || !prompt) return void res.status(400).json({ message: "user_id and prompt are required" });

    const requested = str(req.body?.conversation_id, 64) || "NEW_CHAT";
    const conv = await findOrCreateConversation(req.bot!, visitorId, requested, {
      email: req.body?.user_email,
      meta: { ip: req.ip, userAgent: req.headers["user-agent"] ?? null, pageUrl: req.headers.referer ?? null },
    });
    if (!conv) return void res.status(403).json({ message: "This conversation belongs to someone else." });
    const email = realEmail(req.body?.user_email);
    if (email && !conv.visitorEmail) await conv.update({ visitorEmail: email });

    res.status(200).set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // nginx must not buffer the stream
    });
    res.flushHeaders();
    let closed = false;
    req.on("close", () => (closed = true));
    for await (const event of answer(req.bot!, conv, prompt, requested === "NEW_CHAT" || requested !== conv.publicKey)) {
      if (closed) continue; // keep consuming so the answer is still saved
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
    res.end();
  })
);

// Saleszium's "re-train now" hook. Training is triggered from the admin here.
router.post("/standard/set_user_assistant", (_req, res) => void res.json({ message: "ok" }));

// ── History ───────────────────────────────────────────────────────────────

async function ownConversation(req: BotRequest, publicKey: unknown, visitorId: unknown) {
  if (typeof publicKey !== "string" || typeof visitorId !== "string") return null;
  const conv = await ChatConversation.findOne({ where: { publicKey } });
  return conv && conv.chatbotId === req.bot!.bot.id && conv.visitorId === visitorId ? conv : null;
}

const toWidgetLine = (m: ChatMessage) => ({ role: m.role, text: m.text, timestamp: m.createdAt.toISOString() });

router.post("/chat_history", withResolvedBot, asyncRoute(async (req, res) => {
  const conv = await ownConversation(req, req.body?.conversation_id, req.body?.user_id);
  // A new visitor asks for "NEW_CHAT" on every page load; an empty history is
  // the honest answer and keeps errors out of the customer's console.
  if (!conv) return void res.json({ chat_history: [], post_chat_review: null });
  const lines = await ChatMessage.findAll({ where: { conversationId: conv.id, phase: "bot" }, order: [["createdAt", "ASC"]] });
  res.json({ chat_history: lines.map(toWidgetLine), post_chat_review: conv.review });
}));

router.post("/conversation_by_user_id", withResolvedBot, asyncRoute(async (req, res) => {
  const visitorId = str(req.body?.user_id, 128);
  if (!visitorId) return void res.status(400).json({ message: "user_id is required" });
  const convs = await ChatConversation.findAll({
    where: { chatbotId: req.bot!.bot.id, visitorId },
    order: [["lastMessageAt", "DESC"]],
    limit: 50,
  });
  const agents = await agentCards(convs.map((c) => c.assignedUserId));
  res.json({
    conversation: convs.map((c) => {
      const agent = c.assignedUserId ? agents.get(c.assignedUserId) : null;
      const title = c.mode === "human" ? agent?.name || "Support Chat" : c.title;
      return {
        conversation_id: c.publicKey,
        title,
        name: title,
        avatar: agent?.image ?? null,
        last_chat_time: c.lastMessageAt.toISOString(),
        lastMessage: c.lastMessagePreview ?? "",
        type: c.mode === "human" ? "support" : "bot",
      };
    }),
  });
}));

async function agentCards(ids: (string | null)[]) {
  const unique = Array.from(new Set(ids.filter((id): id is string => !!id)));
  const out = new Map<string, { name: string; image: string | null }>();
  if (!unique.length) return out;
  const users = await User.findAll({ where: { id: { [Op.in]: unique } }, attributes: ["id", "fullName", "avatarKey"] });
  for (const u of users) {
    out.set(u.id, { name: u.fullName, image: u.avatarKey ? await getPresignedReadUrl(u.avatarKey, 3600).catch(() => null) : null });
  }
  return out;
}

// ── Live (human) chat ─────────────────────────────────────────────────────

router.get("/conversations/socketConversation", withResolvedBot, asyncRoute(async (req, res) => {
  const conv = await ownConversation(req, req.query.chatbot_history, req.query.user_id);
  if (!conv || conv.mode !== "human") return void res.json(null);
  const lines = await ChatMessage.findAll({ where: { conversationId: conv.id, phase: "human" }, order: [["createdAt", "ASC"]] });
  const agent = conv.assignedUserId ? (await agentCards([conv.assignedUserId])).get(conv.assignedUserId) : null;
  res.json({
    id: conv.publicKey,
    is_closed: conv.status === "closed",
    assigned_agent: agent ? { name: agent.name, image: agent.image } : null,
    messages: lines.map(toWidgetLine),
  });
}));

// The widget sends only the conversation key here. It is an unguessable secret
// the visitor holds, so it is enough to close their own chat — and nothing else.
router.post("/conversations/socketConversation/close", asyncRoute(async (req, res) => {
  const key = str(req.body?.conversation_id, 64);
  const conv = key ? await runAsSystem("widget:close-lookup", () => ChatConversation.unscoped().findOne({ where: { publicKey: key } })) : null;
  if (!conv) return void res.json({ success: true });
  const resolved = await resolveBotById(conv.chatbotId);
  if (!resolved) return void res.json({ success: true });
  await withBot(resolved, async () => {
    const scoped = await ChatConversation.findByPk(conv.id);
    if (scoped && scoped.status !== "closed") {
      await scoped.update({ status: "closed", closedAt: new Date() });
      emitToOrg(resolved.organizationId, "chat:conversation", serializeConversation(scoped));
    }
  });
  res.json({ success: true });
}));

router.post("/conversations/submit-review", asyncRoute(async (req, res) => {
  const key = str(req.body?.conversation_id, 64);
  const review = req.body?.review_data;
  if (!key || !review || typeof review !== "object") return void res.status(400).json({ message: "conversation_id and review_data are required" });
  const conv = await runAsSystem("widget:review-lookup", () => ChatConversation.unscoped().findOne({ where: { publicKey: key } }));
  if (!conv) return void res.status(404).json({ message: "Conversation not found" });
  const resolved = await resolveBotById(conv.chatbotId);
  if (!resolved) return void res.status(404).json({ message: "Conversation not found" });
  const clean = Object.fromEntries(Object.entries(review as Record<string, unknown>).slice(0, 20).map(([k, v]) => [k.slice(0, 60), str(String(v ?? ""), 2000)]));
  await withBot(resolved, async () => {
    const scoped = await ChatConversation.findByPk(conv.id);
    if (scoped) {
      await scoped.update({ review: { ...clean, submittedAt: new Date().toISOString() } });
      emitToOrg(resolved.organizationId, "chat:conversation", serializeConversation(scoped));
    }
  });
  res.json({ success: true });
}));

async function resolveBotById(chatbotId: string) {
  const { Chatbot } = await import("../models/Chatbot");
  const bot = await runAsSystem("widget:bot-by-id", () => Chatbot.unscoped().findByPk(chatbotId, { attributes: ["publicId"] }));
  return bot ? resolveBot(bot.publicId) : null;
}

// ── Attachments ───────────────────────────────────────────────────────────

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const ALLOWED_UPLOAD = /^(image\/(png|jpe?g|gif|webp)|application\/pdf|text\/plain|application\/vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|spreadsheetml\.sheet))$/;

router.post(
  "/aws/fileUploadForConversation",
  rateLimit({ name: "widget-upload", windowMs: 10 * 60_000, max: 10 }),
  upload.single("file"),
  (req: BotRequest, res, next) => {
    // multer has parsed the form by now, so chatbot_id can come from the body.
    withResolvedBot(req, res, next);
  },
  asyncRoute(async (req, res) => {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) return void res.status(400).json({ message: "No file uploaded" });
    if (!ALLOWED_UPLOAD.test(file.mimetype)) return void res.status(415).json({ message: "That file type can't be sent here." });
    const key = await uploadBuffer(file.buffer, file.originalname, "chatbot", file.mimetype);
    res.json({ key, url: key, fileName: file.originalname.slice(0, 200) });
  })
);

router.get("/aws/presigned-url", withResolvedBot, asyncRoute(async (req, res) => {
  const key = str(req.query.key, 500);
  // Only chat uploads of this bot's own workspace. Saleszium signed any key at all.
  if (!key.startsWith(`chatbot/${req.bot!.organizationId}/`) || key.includes("..")) {
    return void res.status(403).json({ message: "Not allowed" });
  }
  res.json({ downloadUrl: await getPresignedReadUrl(key, 900) });
}));

// ── Later phases ──────────────────────────────────────────────────────────
// Answered empty so the widget renders those tabs as "nothing yet" instead of
// erroring. Tickets and help center are phase 2, campaigns phase 3.
router.get("/folders/chatbot-structure", (_req, res) => void res.json([]));
router.get("/campaigns/chatbot/all", (_req, res) => void res.json([]));

/**
 * Interim tickets (until phase 2 brings real ones): a ticket from the widget
 * becomes a human conversation flagged `meta.ticket`, so it lands in Live
 * chats with the visitor's email, and the visitor becomes a CRM lead. Nothing
 * a visitor sends is dropped while the proper module is built.
 */
router.post("/tickets/create-from-ticket", rateLimit({ name: "widget-ticket", windowMs: 60 * 60_000, max: 10 }), withResolvedBot, asyncRoute(async (req, res) => {
  const email = realEmail(req.body?.customer_email);
  const subject = str(req.body?.subject, 200);
  if (!email || !subject) return void res.status(400).json({ message: "A valid email and a subject are required" });
  const custom = (req.body?.custom_data ?? {}) as Record<string, unknown>;
  const details = Object.entries(custom).map(([k, v]) => `${k.replace(/[_-]+/g, " ")}: ${str(v, 2000)}`).filter((l) => !l.endsWith(": ")).join("\n");
  const lines = Array.isArray(req.body?.conversations)
    ? (req.body.conversations as Array<Record<string, unknown>>).slice(-30).map((m) => `${m.role === "user" ? "Visitor" : "Bot"}: ${str(m.text, 1000)}`).join("\n")
    : "";

  const conv = await findOrCreateConversation(req.bot!, `ticket:${email}`.slice(0, 128), null, { email, meta: { ticket: true, subject } });
  if (!conv) return void res.status(400).json({ message: "Could not open the ticket" });
  await conv.update({ mode: "human", title: subject, visitorEmail: email });
  const { appendMessage } = await import("../services/chatbot/chatStore");
  await appendMessage(req.bot!, conv, {
    role: "user",
    phase: "human",
    text: [`Ticket: ${subject}`, details, lines && `Chat before the ticket:\n${lines}`].filter(Boolean).join("\n\n"),
  });
  const lead = await findOrMergeLead({ name: email.split("@")[0], email, source: "Website chatbot", summary: `Raised a ticket: ${subject}` });
  await conv.update({ leadId: lead.id });
  res.status(201).json({ ticket_id: conv.publicKey, status: "open" });
}));

router.post("/tickets/get-tickets", withResolvedBot, asyncRoute(async (req, res) => {
  const email = realEmail(req.body?.user_email);
  if (!email) return void res.json([]);
  const convs = await ChatConversation.findAll({
    where: { chatbotId: req.bot!.bot.id, visitorId: `ticket:${email}` },
    order: [["createdAt", "DESC"]],
    limit: 20,
  });
  res.json(convs.map((c) => ({ ticket_id: c.publicKey, status: c.status === "closed" ? "closed" : "open", subject: c.title, created_at: c.createdAt, rating: null, assigned_user_id: null })));
}));

// SEO tracking is out of scope; swallow the beacons quietly.
router.use("/seo", express.Router().all("*path", (_req, res) => void res.status(204).end()));

router.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Widget]", err?.message || err);
  if (!res.headersSent) res.status(500).json({ message: "Something went wrong" });
  else res.end();
});

export default router;
