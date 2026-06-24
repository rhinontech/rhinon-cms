import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import { User, Role, Permission } from "../models";
import { env } from "../config/env";
import { authenticate, AuthRequest } from "../middleware/authenticate";

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  const user = await User.findOne({
    where: { [Op.or]: [{ companyEmail: email }, { personalEmail: email }], status: "active" },
    include: [{ model: Role, as: "role", include: [{ model: Permission }] }],
  });

  if (!user) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const role = (user as any).role as Role & { Permissions: Permission[] };
  const permissions = (role.Permissions || []).map(
    (p: any) => `${p.resource}:${p.action}`
  );

  const token = jwt.sign(
    {
      userId: user.id,
      roleSlug: role.slug,
      permissions,
      fullName: user.fullName,
      companyEmail: user.companyEmail,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] }
  );

  res.json({ token, roleSlug: role.slug, permissions, fullName: user.fullName });
});

router.post("/logout", (_req: Request, res: Response) => {
  res.json({ message: "Logged out" });
});

router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  const user = await User.findByPk(req.user!.userId, {
    include: [{ model: Role, as: "role" }],
    attributes: { exclude: ["passwordHash"] },
  });
  if (!user) { res.status(404).json({ message: "User not found" }); return; }
  res.json(user);
});

// Update own profile (editable fields only — companyEmail, role, status not changeable by self)
router.put("/me", authenticate, async (req: AuthRequest, res: Response) => {
  const allowed = [
    "fullName", "personalEmail",
    "pan", "employmentType", "compensationType",
    "workSchedule", "remotePosition", "workLocation", "paymentFrequency",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }
  if (Object.keys(update).length === 0) {
    res.status(400).json({ message: "No valid fields to update" });
    return;
  }
  const user = await User.findByPk(req.user!.userId);
  if (!user) { res.status(404).json({ message: "User not found" }); return; }
  await user.update(update);
  const fresh = await User.findByPk(req.user!.userId, {
    include: [{ model: Role, as: "role" }],
    attributes: { exclude: ["passwordHash"] },
  });
  res.json(fresh);
});

// Change own password
router.put("/me/password", authenticate, async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ message: "currentPassword and newPassword are required" });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ message: "New password must be at least 8 characters" });
    return;
  }
  const user = await User.findByPk(req.user!.userId);
  if (!user) { res.status(404).json({ message: "User not found" }); return; }
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) { res.status(401).json({ message: "Current password is incorrect" }); return; }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await user.update({ passwordHash });
  res.json({ message: "Password changed successfully" });
});

// Validate onboarding token — returns name + company email (public, no auth)
router.get("/onboard/:token", async (req: Request, res: Response) => {
  const user = await User.findOne({
    where: {
      onboardingToken: req.params.token,
      onboardingTokenExpiry: { [Op.gt]: new Date() },
    },
    attributes: ["fullName", "companyEmail"],
  });
  if (!user) {
    res.status(404).json({ message: "This onboarding link has expired or is invalid." });
    return;
  }
  res.json({ fullName: user.fullName, companyEmail: user.companyEmail });
});

// Complete onboarding — set password, clear token
router.post("/onboard", async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    res.status(400).json({ message: "token and newPassword are required" });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ message: "Password must be at least 8 characters" });
    return;
  }
  if (!/[A-Z]/.test(newPassword)) {
    res.status(400).json({ message: "Password must contain at least one uppercase letter" });
    return;
  }
  if (!/[0-9]/.test(newPassword)) {
    res.status(400).json({ message: "Password must contain at least one number" });
    return;
  }
  const user = await User.findOne({
    where: {
      onboardingToken: token,
      onboardingTokenExpiry: { [Op.gt]: new Date() },
    },
  });
  if (!user) {
    res.status(404).json({ message: "This onboarding link has expired or is invalid." });
    return;
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await user.update({
    passwordHash,
    onboarded: true,
    onboardingToken: null,
    onboardingTokenExpiry: null,
  });
  res.json({ companyEmail: user.companyEmail });
});

export default router;
