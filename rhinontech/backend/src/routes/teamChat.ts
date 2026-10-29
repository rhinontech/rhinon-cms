import { Router, Response } from "express";
import multer from "multer";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import { keepTenantContext } from "../services/tenantContext";
import { uploadBuffer } from "../services/storage";
import { iceServersFor } from "../services/turnCredentials";
import * as chat from "../services/teamChat/service";

const router = Router();
router.use(authenticate);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

type Handler = (req: AuthRequest, res: Response) => Promise<unknown>;

// Thin handlers: the service enforces membership; ChatError carries the status.
const handle = (fn: Handler) => async (req: AuthRequest, res: Response) => {
  try {
    const out = await fn(req, res);
    if (!res.headersSent) res.json(out ?? { ok: true });
  } catch (err) {
    if (err instanceof chat.ChatError) {
      res.status(err.status).json({ message: err.message });
      return;
    }
    console.error("[TeamChat]", err);
    res.status(500).json({ message: "Something went wrong in chat" });
  }
};

const me = (req: AuthRequest) => req.user!.userId;
const read = authorize("chat:read");
const write = authorize("chat:write");

router.get("/directory", read, handle(async () => chat.listDirectory()));
router.get("/unread", read, handle(async (req) => ({ total: await chat.unreadTotal(me(req)) })));
router.get("/search", read, handle(async (req) => chat.search(me(req), req.query.q)));
router.get("/ice-servers", read, handle(async (req) => ({ iceServers: iceServersFor(`team-${me(req).slice(0, 8)}`) })));

router.get("/conversations", read, handle(async (req) => chat.listConversations(me(req))));
router.get("/channels/browse", read, handle(async (req) => chat.browseChannels(me(req))));
router.post("/conversations/direct", write, handle(async (req) => chat.openDirect(me(req), req.body?.userId)));
router.post("/conversations", write, handle(async (req, res) => {
  res.status(201);
  return chat.createGroupOrChannel(me(req), req.body ?? {});
}));
router.get("/conversations/:id", read, handle(async (req) => chat.getConversation(req.params.id, me(req))));
router.patch("/conversations/:id", write, handle(async (req) => chat.updateConversation(req.params.id, me(req), req.body ?? {})));
router.post("/conversations/:id/members", write, handle(async (req) => chat.addMembers(req.params.id, me(req), req.body?.userIds)));
router.delete("/conversations/:id/members/:userId", write, handle(async (req) => chat.removeMember(req.params.id, me(req), req.params.userId)));
router.post("/conversations/:id/join", write, handle(async (req) => chat.joinChannel(req.params.id, me(req))));
router.patch("/conversations/:id/preferences", read, handle(async (req) => chat.updatePreferences(req.params.id, me(req), req.body ?? {})));
router.post("/conversations/:id/read", read, handle(async (req) => chat.markRead(req.params.id, me(req))));
router.get("/conversations/:id/read-states", read, handle(async (req) => chat.readStates(req.params.id, me(req))));

router.get("/conversations/:id/messages", read, handle(async (req) =>
  chat.listMessages(req.params.id, me(req), typeof req.query.before === "string" ? req.query.before : undefined)
));
router.post("/conversations/:id/messages", write, handle(async (req, res) => {
  res.status(201);
  return chat.sendMessage(req.params.id, me(req), req.body ?? {});
}));
router.get("/conversations/:id/threads/:messageId", read, handle(async (req) => chat.listThread(req.params.id, me(req), req.params.messageId)));
router.get("/conversations/:id/pinned", read, handle(async (req) => chat.listPinned(req.params.id, me(req))));
router.get("/conversations/:id/files", read, handle(async (req) => chat.listFiles(req.params.id, me(req))));

router.get("/conversations/:id/call-links", read, handle(async (req) => chat.listCallLinks(req.params.id, me(req))));
router.post("/conversations/:id/call-links", write, handle(async (req, res) => {
  res.status(201);
  return chat.createCallLink(req.params.id, me(req), req.body ?? {});
}));
router.delete("/conversations/:id/call-links/:linkId", write, handle(async (req) => chat.revokeCallLink(req.params.id, me(req), req.params.linkId)));

router.patch("/messages/:id", write, handle(async (req) => chat.editMessage(req.params.id, me(req), req.body?.body)));
router.delete("/messages/:id", write, handle(async (req) => chat.deleteMessage(req.params.id, me(req))));
router.post("/messages/:id/reactions", write, handle(async (req) => chat.toggleReaction(req.params.id, me(req), req.body?.emoji)));
router.post("/messages/:id/pin", write, handle(async (req) => chat.togglePin(req.params.id, me(req))));

// Upload first, then send the returned descriptor with the message.
router.post("/uploads", write, keepTenantContext(upload.single("file")), handle(async (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: "No file provided" });
    return;
  }
  const key = await uploadBuffer(req.file.buffer, req.file.originalname, "chat", req.file.mimetype);
  res.status(201);
  return { key, name: req.file.originalname, size: req.file.size, mimeType: req.file.mimetype };
}));

export default router;
