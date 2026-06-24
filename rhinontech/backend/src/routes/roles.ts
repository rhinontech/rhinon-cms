import { Router, Response } from "express";
import { Role, Permission } from "../models";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";

const router = Router();

router.use(authenticate);

router.get("/", async (_req: AuthRequest, res: Response) => {
  const roles = await Role.findAll({ include: [Permission] });
  res.json(roles);
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
  const { permissionIds } = req.body as { permissionIds: string[] };
  await (role as any).setPermissions(permissionIds);
  const updated = await Role.findByPk(req.params.id, { include: [Permission] });
  res.json(updated);
});

export default router;
