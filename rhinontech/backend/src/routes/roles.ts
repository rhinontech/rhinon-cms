import { Router, Response } from "express";
import { Role, Permission, User } from "../models";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";

const router = Router();

router.use(authenticate);

router.get("/", async (_req: AuthRequest, res: Response) => {
  const roles = await Role.findAll({ include: [Permission] });
  const counts = (await User.count({ group: ["roleId"] })) as unknown as { roleId: string; count: number }[];
  const countMap = new Map(counts.map((c) => [c.roleId, Number(c.count)]));
  const withCounts = roles.map((role) => ({ ...role.toJSON(), usersCount: countMap.get(role.id) ?? 0 }));
  res.json(withCounts);
});

router.post("/", authorize("settings:write"), async (req: AuthRequest, res: Response) => {
  const { name, slug } = req.body;
  if (!name || !slug) {
    res.status(400).json({ message: "name and slug are required" });
    return;
  }
  const role = await Role.create({ name, slug });
  res.status(201).json(role);
});

router.delete("/:id", authorize("settings:write"), async (req: AuthRequest, res: Response) => {
  const role = await Role.findByPk(req.params.id);
  if (!role) {
    res.status(404).json({ message: "Role not found" });
    return;
  }
  if (role.slug === "superadmin") {
    res.status(400).json({ message: "The Super Admin role cannot be deleted." });
    return;
  }
  const memberCount = await User.count({ where: { roleId: role.id } });
  if (memberCount > 0) {
    res.status(400).json({ message: `${memberCount} member(s) still have this role. Reassign them first.` });
    return;
  }
  await role.destroy();
  res.json({ message: "Role deleted" });
});

// Assign permissions to a role
router.put("/:id/permissions", authorize("settings:write"), async (req: AuthRequest, res: Response) => {
  const role = await Role.findByPk(req.params.id);
  if (!role) {
    res.status(404).json({ message: "Role not found" });
    return;
  }
  if (role.slug === "superadmin") {
    res.status(400).json({ message: "Super Admin always has every permission and cannot be edited." });
    return;
  }
  const { permissionIds } = req.body as { permissionIds: string[] };
  await (role as any).setPermissions(permissionIds);
  const updated = await Role.findByPk(req.params.id, { include: [Permission] });
  res.json(updated);
});

export default router;
