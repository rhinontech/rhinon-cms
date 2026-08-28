import { Router, Response } from "express";
import { User, Role } from "../models";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";

const router = Router();
router.use(authenticate, authorize("people:read"));

// Active members by default (assignee pickers etc.); ?include=all adds relieved
// members for the Team directory's Alumni view.
router.get("/", async (req: AuthRequest, res: Response) => {
  const includeAll = req.query.include === "all";
  // userType is filtered here rather than by a model defaultScope — see the note
  // in models/User.ts about scopes turning every include into an INNER JOIN.
  const employees = await User.findAll({
    where: includeAll ? { userType: "internal" } : { status: "active", userType: "internal" },
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
