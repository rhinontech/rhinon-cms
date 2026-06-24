import { Router, Response } from "express";
import { User, Role } from "../models";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";

const router = Router();
router.use(authenticate, authorize("people:read"));

router.get("/", async (_req: AuthRequest, res: Response) => {
  const employees = await User.findAll({
    include: [{ model: Role, as: "role", attributes: ["name", "slug"] }],
    attributes: { exclude: ["passwordHash"] },
    order: [["fullName", "ASC"]],
  });
  res.json(employees);
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  const employee = await User.findByPk(req.params.id, {
    include: [{ model: Role, as: "role", attributes: ["name", "slug"] }],
    attributes: { exclude: ["passwordHash"] },
  });
  if (!employee) { res.status(404).json({ message: "Employee not found" }); return; }
  res.json(employee);
});

export default router;
