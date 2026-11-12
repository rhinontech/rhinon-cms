import { Router, Response } from "express";
import { Op } from "sequelize";
import { authenticate, AuthRequest } from "../middleware/authenticate";
import { Notification, User } from "../models";
import { NOTIFICATION_CATEGORIES } from "../services/notifications";

/** The signed-in user's own notifications; every query is pinned to their id. */
const router = Router();
router.use(authenticate);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const before = req.query.before ? new Date(String(req.query.before)) : null;
    const [items, unread] = await Promise.all([
      Notification.findAll({
        where: { userId, ...(before && !isNaN(+before) ? { updatedAt: { [Op.lt]: before } } : {}) },
        order: [["updatedAt", "DESC"]],
        limit,
      }),
      Notification.count({ where: { userId, readAt: null } }),
    ]);
    res.json({ items, unread });
  } catch {
    res.status(500).json({ message: "Failed to load notifications" });
  }
});

const categoriesFor = (req: AuthRequest) =>
  NOTIFICATION_CATEGORIES.filter((c) => !c.platformOnly || req.user!.isPlatformOrg).map(({ key, label }) => ({ key, label }));

router.get("/settings", async (req: AuthRequest, res: Response) => {
  try {
    const me = await User.findByPk(req.user!.userId, { attributes: ["notificationMutes"] });
    res.json({ categories: categoriesFor(req), muted: me?.notificationMutes ?? [] });
  } catch {
    res.status(500).json({ message: "Failed to load settings" });
  }
});

router.put("/settings", async (req: AuthRequest, res: Response) => {
  try {
    const valid = new Set(categoriesFor(req).map((c) => c.key));
    const muted = Array.isArray(req.body?.muted) ? req.body.muted.filter((k: unknown) => valid.has(String(k))) : [];
    await User.update({ notificationMutes: muted }, { where: { id: req.user!.userId } });
    res.json({ muted });
  } catch {
    res.status(500).json({ message: "Failed to save settings" });
  }
});

router.post("/read-all", async (req: AuthRequest, res: Response) => {
  try {
    await Notification.update({ readAt: new Date() }, { where: { userId: req.user!.userId, readAt: null } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ message: "Failed to update notifications" });
  }
});

router.post("/:id/read", async (req: AuthRequest, res: Response) => {
  try {
    await Notification.update({ readAt: new Date() }, { where: { id: req.params.id, userId: req.user!.userId, readAt: null } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ message: "Failed to update notification" });
  }
});

export default router;
