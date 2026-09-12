import { Router, Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import { User, Role, Permission, Organization } from "../models";
import { env } from "../config/env";
import { sendEmail } from "../services/mailer";
import { resetPasswordEmail } from "../services/emailTemplates";
import { authenticate, AuthRequest } from "../middleware/authenticate";
import { sequelize } from "../config/database";
import { runAsSystem, runForOrg } from "../services/tenantContext";
import {
  validateSlug,
  emailDomainFor,
  generateApiKey,
  provisionOrganizationDefaults,
} from "../services/orgProvisioning";
import { provisionOrgEmailDomain } from "../services/sesProvisioning";

const router = Router();


/** Shared with the reset/onboard handlers below. */
function passwordProblem(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  return null;
}

/** rahul.founder@gmail.com + "Rahul Sharma" -> "rahul" */
function derivePrefix(fullName: string, personalEmail: string): string {
  const fromName = fullName.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  const candidate = fromName || personalEmail.split("@")[0];
  return candidate.replace(/[^a-z0-9._-]/gi, "").toLowerCase() || "admin";
}

/**
 * Self-serve signup: creates the organization, its subdomain and its first
 * superadmin in one transaction.
 *
 * Everything the org needs to function (roles, permission grants, deal stages,
 * board columns) is provisioned inside that transaction too — a half-built
 * workspace with a slug already taken is worse than no workspace.
 */

/** Live availability check for the signup form. */
router.get("/signup/slug/:slug", async (req: Request, res: Response) => {
  const slug = String(req.params.slug || "").trim().toLowerCase();
  const check = validateSlug(slug);
  if (!check.ok) {
    res.json({ available: false, reason: check.reason, emailDomain: null });
    return;
  }
  const taken = await runAsSystem("signup:slug-check", () =>
    Organization.findOne({ where: { slug }, attributes: ["id"] })
  );
  res.json({
    available: !taken,
    reason: taken ? "That workspace name is already taken." : null,
    emailDomain: emailDomainFor(slug),
  });
});

router.post("/signup", async (req: Request, res: Response) => {
  const { fullName, personalEmail, password, organizationName } = req.body ?? {};
  const slug = String(req.body?.organizationSlug ?? "").trim().toLowerCase();

  if (!fullName || !personalEmail || !password || !organizationName || !slug) {
    res.status(400).json({
      message: "fullName, personalEmail, password, organizationName and organizationSlug are required",
    });
    return;
  }

  const pwProblem = passwordProblem(String(password));
  if (pwProblem) { res.status(400).json({ message: pwProblem }); return; }

  const slugCheck = validateSlug(slug);
  if (!slugCheck.ok) { res.status(400).json({ message: slugCheck.reason }); return; }

  const emailDomain = emailDomainFor(slug);
  const prefix = derivePrefix(String(fullName), String(personalEmail));
  const companyEmail = `${prefix}@${emailDomain}`;

  // Signup resolves a tenant rather than running inside one.
  const taken = await runAsSystem("signup:slug-check", () =>
    Organization.findOne({ where: { slug } })
  );
  if (taken) { res.status(409).json({ message: "That workspace name is already taken." }); return; }

  const apiKey = generateApiKey();
  const transaction = await sequelize.transaction();
  let organization: Organization;

  try {
    organization = await runAsSystem("signup:create-org", () =>
      Organization.create(
        {
          name: String(organizationName).trim(),
          slug,
          emailDomain,
          status: "trial",
          plan: "free",
          apiKeyHash: apiKey.hash,
          apiKeyPrefix: apiKey.prefix,
          apiKeyRotatedAt: new Date(),
          settings: { displayName: String(organizationName).trim() },
        },
        { transaction }
      )
    );

    await provisionOrganizationDefaults(organization.id, transaction);

    const created = await runForOrg(organization.id, async () => {
      const superadminRole = await Role.findOne({
        where: { slug: "superadmin" },
        transaction,
      });
      if (!superadminRole) throw new Error("Superadmin role was not provisioned");

      return User.create(
        {
          fullName: String(fullName).trim(),
          personalEmail: String(personalEmail).trim().toLowerCase(),
          companyEmail,
          passwordHash: await bcrypt.hash(String(password), 10),
          roleId: superadminRole.id,
          department: "Leadership",
          status: "active",
          joiningDate: new Date(),
          onboarded: true,
        } as never,
        { transaction }
      );
    });

    await transaction.commit();

    // After the commit on purpose: a workspace that exists but cannot send yet
    // is recoverable, a signup that 500s on an AWS hiccup is not.
    const email = await provisionOrgEmailDomain(organization).catch((err) => {
      console.error("[Signup] Email provisioning failed:", err.message);
      return null;
    });

    const token = jwt.sign(
      {
        userId: created.id,
        organizationId: organization.id,
        orgSlug: organization.slug,
        roleSlug: "superadmin",
        userType: "internal",
        fullName: created.fullName,
        companyEmail: created.companyEmail,
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] }
    );

    res.status(201).json({
      token,
      roleSlug: "superadmin",
      userType: "internal",
      fullName: created.fullName,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        emailDomain: organization.emailDomain,
        status: organization.status,
        plan: organization.plan,
      },
      companyEmail: created.companyEmail,
      // Shown once. Only the hash is stored.
      apiKey: apiKey.key,
      email: email
        ? { status: email.status, message: email.message, records: email.records }
        : null,
    });
  } catch (err: any) {
    await transaction.rollback().catch(() => {});
    if (err?.name === "SequelizeUniqueConstraintError") {
      res.status(409).json({ message: "That workspace name or email is already in use." });
      return;
    }
    console.error("[Signup] Failed:", err.message);
    res.status(500).json({ message: "Could not create the workspace." });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  // findAll, not findOne: personalEmail is only unique WITHIN an org now, so one
  // person can legitimately hold accounts at two workspaces. companyEmail stays
  // globally unique (it lives on the org's own subdomain), so signing in with a
  // company address always resolves to exactly one tenant.
  const matches = await runAsSystem("login:resolve-tenant", () =>
    User.unscoped().findAll({
      where: { [Op.or]: [{ companyEmail: email }, { personalEmail: email }], status: "active" },
      include: [
        { model: Role, as: "role", include: [{ model: Permission }] },
        { model: Organization, as: "tenant" },
      ],
    })
  );

  const candidates = matches.filter((m) => (m as any).tenant);

  if (candidates.length === 0) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  let user = candidates[0];

  if (candidates.length > 1) {
    const wanted = String(req.body?.organizationSlug ?? "").trim().toLowerCase();
    const picked = wanted
      ? candidates.find((c) => ((c as any).tenant as Organization).slug === wanted)
      : undefined;

    if (!picked) {
      // Don't leak which workspaces exist until the password has been checked.
      const verified = await Promise.all(
        candidates.map(async (c) => ((await bcrypt.compare(password, c.passwordHash)) ? c : null))
      );
      const allowed = verified.filter(Boolean) as typeof candidates;
      if (allowed.length === 0) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }
      if (allowed.length > 1) {
        res.status(300).json({
          message: "This email belongs to more than one workspace. Choose one to continue.",
          needsOrganization: true,
          organizations: allowed.map((c) => {
            const org = (c as any).tenant as Organization;
            return { slug: org.slug, name: org.name, emailDomain: org.emailDomain };
          }),
        });
        return;
      }
      user = allowed[0];
    } else {
      user = picked;
    }
  }

  const organization = (user as any).tenant as Organization;
  if (organization.status === "suspended") {
    res.status(403).json({ message: "This workspace has been suspended." });
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
      // Claims are for the client (the proxy reads roleSlug to route). The
      // backend never trusts them — authenticate.ts re-derives identity and
      // organization from the database on every single request.
      organizationId: organization.id,
      orgSlug: organization.slug,
      roleSlug: role.slug,
      userType: user.userType,
      permissions,
      fullName: user.fullName,
      companyEmail: user.companyEmail,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] }
  );

  // userType lets the client route external collaborators to the portal rather
  // than the internal admin shell, which the API would refuse anyway.
  res.json({
    token,
    roleSlug: role.slug,
    userType: user.userType,
    permissions,
    fullName: user.fullName,
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      emailDomain: organization.emailDomain,
      status: organization.status,
      plan: organization.plan,
      isPlatform: organization.isPlatform,
    },
  });
});

router.post("/logout", (_req: Request, res: Response) => {
  res.json({ message: "Logged out" });
});

router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  const user = await User.unscoped().findByPk(req.user!.userId, {
    include: [{ model: Role, as: "role" }],
    attributes: { exclude: ["passwordHash"] },
  });
  if (!user) { res.status(404).json({ message: "User not found" }); return; }
  // permissions/roleSlug come from the middleware's live DB lookup (not the
  // frozen JWT claim) — this is what the client polls to stay in sync without
  // requiring a re-login after a permission or role change.
  const organization = await Organization.findByPk(req.user!.organizationId, {
    attributes: ["id", "name", "slug", "emailDomain", "status", "plan", "isPlatform", "sesStatus"],
  });
  res.json({
    ...user.toJSON(),
    permissions: req.user!.permissions,
    roleSlug: req.user!.roleSlug,
    organization,
  });
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
  const user = await User.unscoped().findByPk(req.user!.userId);
  if (!user) { res.status(404).json({ message: "User not found" }); return; }
  await user.update(update);
  const fresh = await User.unscoped().findByPk(req.user!.userId, {
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
  const user = await User.unscoped().findByPk(req.user!.userId);
  if (!user) { res.status(404).json({ message: "User not found" }); return; }
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) { res.status(401).json({ message: "Current password is incorrect" }); return; }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await user.update({ passwordHash });
  res.json({ message: "Password changed successfully" });
});

// Request a password reset link (public). Always responds 200 to avoid leaking which emails exist.
router.post("/forgot-password", async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ message: "Email is required" });
    return;
  }

  // Reset links are resolved by token, so every matching account across every
  // workspace gets its own link rather than one of them silently winning.
  const users = await runAsSystem("forgot-password:resolve", () =>
    User.unscoped().findAll({
      where: { [Op.or]: [{ companyEmail: email }, { personalEmail: email }], status: "active" },
    })
  );

  for (const user of users) {
    const resetToken = crypto.randomUUID();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.update({ resetToken, resetTokenExpiry });
    try {
      const resetUrl = `${env.frontendUrl}/auth/reset-password?token=${resetToken}`;
      const { subject, html, text } = resetPasswordEmail({ fullName: user.fullName, resetUrl });
      await sendEmail({ to: user.personalEmail, subject, html, text });
    } catch (err) {
      console.error("Failed to send reset email:", err);
    }
  }

  res.json({ message: "If an account exists for that email, a reset link has been sent." });
});

// Reset password using a valid reset token (public).
router.post("/reset-password", async (req: Request, res: Response) => {
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

  const user = await runAsSystem("reset-password:resolve", () =>
    User.unscoped().findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: { [Op.gt]: new Date() },
      },
    })
  );
  if (!user) {
    res.status(404).json({ message: "This reset link has expired or is invalid." });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await user.update({ passwordHash, resetToken: null, resetTokenExpiry: null });
  res.json({ message: "Password reset successfully" });
});

// Validate onboarding token — returns name + company email (public, no auth)
router.get("/onboard/:token", async (req: Request, res: Response) => {
  const user = await runAsSystem("onboard:validate-token", () =>
    User.unscoped().findOne({
      where: {
        onboardingToken: req.params.token,
        onboardingTokenExpiry: { [Op.gt]: new Date() },
      },
      attributes: ["fullName", "companyEmail"],
    })
  );
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
  const user = await runAsSystem("onboard:complete", () =>
    User.unscoped().findOne({
      where: {
        onboardingToken: token,
        onboardingTokenExpiry: { [Op.gt]: new Date() },
      },
    })
  );
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
