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
import { transactionalBrand } from "../services/companyProfile";
import { sendVerificationEmail, readVerifyToken } from "../services/emailVerification";
import { emailFlowLimiter } from "../middleware/rateLimit";
import { trialEndDate, planState } from "../services/usage";
import { recordAudit, auditRequest, clientIp } from "../services/audit";
import { legal } from "../config/legal";
import { generateSecret, encryptSecret, decryptSecret, verifyCode, otpauthUrl, generateRecoveryCodes, consumeRecoveryCode, mfaLocked, mfaMiss, mfaClear } from "../services/totp";

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

  const acceptedTerms = req.body?.acceptTerms === true;
  if (legal.requireAcceptance && !acceptedTerms) {
    res.status(400).json({ message: "You must accept the Terms of Service and Privacy Policy to create a workspace." });
    return;
  }

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
          settings: {
            displayName: String(organizationName).trim(),
            pendingEmailVerification: true,
            trialEndsAt: trialEndDate().toISOString(),
            ...(acceptedTerms ? { termsVersion: legal.termsVersion, termsAcceptedAt: new Date().toISOString() } : {}),
          },
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

    // Also after the commit, for the same reason. Not awaited into the response:
    // a slow mailer must not hold up a signup that already succeeded.
    sendVerificationEmail(created, organization.id, organization.name).catch((err) =>
      console.error("[Signup] Verification email failed:", err.message)
    );

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
      emailVerificationPending: true,
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
    // The account is known here, so a failed attempt belongs in its workspace's trail.
    void recordAudit({ organizationId: organization.id, actorId: user.id, actorName: user.fullName, action: "auth.login_failed", ip: clientIp(req) });
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }
  void recordAudit({ organizationId: organization.id, actorId: user.id, actorName: user.fullName, action: "auth.login", ip: clientIp(req) });

  // Second factor: the password alone does not open a session for an account
  // that has 2FA on. Hand back a short-lived, single-purpose token instead; the
  // client exchanges it (plus a code) at /auth/login/mfa.
  if (user.totpEnabled) {
    const mfaToken = jwt.sign({ userId: user.id, purpose: "mfa" }, env.jwtSecret, { expiresIn: "5m" });
    res.json({ mfaRequired: true, mfaToken });
    return;
  }

  res.json(buildSession(user, organization));
});

/**
 * The response for a successful sign-in: the session token plus what the client
 * needs to route. Shared by password sign-in and the 2FA step so the two cannot
 * drift apart.
 */
function buildSession(user: User, organization: Organization) {
  const role = (user as any).role as Role & { Permissions: Permission[] };
  const permissions = (role.Permissions || []).map((p: any) => `${p.resource}:${p.action}`);

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
  return {
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
  };
}

// Second step of sign-in for accounts with 2FA: trade the mfaToken + a code (or a
// recovery code) for a real session.
router.post("/login/mfa", async (req: Request, res: Response) => {
  const { mfaToken, code, recoveryCode } = req.body ?? {};

  let userId: string;
  try {
    const payload = jwt.verify(String(mfaToken ?? ""), env.jwtSecret) as { userId?: string; purpose?: string };
    if (payload.purpose !== "mfa" || !payload.userId) throw new Error("wrong token");
    userId = payload.userId;
  } catch {
    res.status(401).json({ message: "This sign-in has expired. Start again." });
    return;
  }

  if (mfaLocked(userId)) {
    res.status(429).json({ message: "Too many incorrect codes. Try again in 15 minutes." });
    return;
  }

  const user = await runAsSystem("login:mfa-user", () =>
    User.unscoped().findByPk(userId, {
      include: [
        { model: Role, as: "role", include: [{ model: Permission }] },
        { model: Organization, as: "tenant" },
      ],
    })
  );
  const organization = (user as any)?.tenant as Organization | undefined;
  if (!user || !organization || user.status !== "active" || !user.totpEnabled || !user.totpSecret) {
    res.status(401).json({ message: "This sign-in has expired. Start again." });
    return;
  }
  if (organization.status === "suspended") {
    res.status(403).json({ message: "This workspace has been suspended." });
    return;
  }

  let ok = false;
  if (recoveryCode) {
    const remaining = consumeRecoveryCode(user.totpRecoveryCodes, String(recoveryCode));
    if (remaining) {
      await runForOrg(organization.id, () => user.update({ totpRecoveryCodes: remaining }));
      ok = true;
      void recordAudit({ organizationId: organization.id, actorId: user.id, actorName: user.fullName, action: "auth.recovery_code_used", ip: clientIp(req), metadata: { remaining: remaining.length } });
    }
  } else {
    const step = verifyCode(decryptSecret(user.totpSecret), String(code ?? ""), user.totpLastStep);
    if (step !== null) {
      await runForOrg(organization.id, () => user.update({ totpLastStep: step }));
      ok = true;
    }
  }

  if (!ok) {
    mfaMiss(userId);
    void recordAudit({ organizationId: organization.id, actorId: user.id, actorName: user.fullName, action: "auth.mfa_failed", ip: clientIp(req) });
    res.status(401).json({ message: "That code is not correct." });
    return;
  }

  mfaClear(userId);
  void recordAudit({ organizationId: organization.id, actorId: user.id, actorName: user.fullName, action: "auth.login", ip: clientIp(req), metadata: { mfa: true } });
  res.json(buildSession(user, organization));
});

// ── Two-factor management (signed-in user, their own account) ───────────────

router.get("/2fa/status", authenticate, async (req: AuthRequest, res: Response) => {
  const user = await User.unscoped().findByPk(req.user!.userId, { attributes: ["id", "totpEnabled", "totpRecoveryCodes"] });
  res.json({ enabled: !!user?.totpEnabled, recoveryCodesLeft: user?.totpRecoveryCodes?.length ?? 0 });
});

// Step 1: mint a secret and show it (as text and as an otpauth:// link for a QR).
// Nothing is switched on until a code from the authenticator app proves it works.
router.post("/2fa/setup", authenticate, async (req: AuthRequest, res: Response) => {
  const user = await User.unscoped().findByPk(req.user!.userId, { attributes: ["id", "companyEmail", "totpEnabled"] });
  if (!user) { res.status(404).json({ message: "User not found" }); return; }
  if (user.totpEnabled) { res.status(409).json({ message: "Two-factor authentication is already on." }); return; }

  const secret = generateSecret();
  await user.update({ totpSecret: encryptSecret(secret), totpLastStep: null });
  const org = await Organization.findByPk(req.user!.organizationId, { attributes: ["name"] });
  res.json({ secret, otpauthUrl: otpauthUrl(secret, user.companyEmail, org?.name || "Workspace") });
});

// Step 2: confirm with a code, switch it on, and show the recovery codes once.
router.post("/2fa/enable", authenticate, async (req: AuthRequest, res: Response) => {
  const user = await User.unscoped().findByPk(req.user!.userId, { attributes: ["id", "totpSecret", "totpEnabled", "totpLastStep"] });
  if (!user?.totpSecret) { res.status(400).json({ message: "Start setup first." }); return; }
  if (user.totpEnabled) { res.status(409).json({ message: "Two-factor authentication is already on." }); return; }
  if (mfaLocked(user.id)) { res.status(429).json({ message: "Too many incorrect codes. Try again in 15 minutes." }); return; }

  const step = verifyCode(decryptSecret(user.totpSecret), String(req.body?.code ?? ""), user.totpLastStep);
  if (step === null) { mfaMiss(user.id); res.status(400).json({ message: "That code is not correct." }); return; }

  mfaClear(user.id);
  const { codes, hashes } = generateRecoveryCodes();
  await user.update({ totpEnabled: true, totpRecoveryCodes: hashes, totpLastStep: step });
  void auditRequest(req, "auth.mfa_enabled", { entityType: "user", entityId: user.id });
  res.json({ enabled: true, recoveryCodes: codes, message: "Save these recovery codes somewhere safe. They are shown only once." });
});

// Turning it off needs the password AND a current code (or recovery code): a
// stolen session alone must not be able to strip the second factor.
router.post("/2fa/disable", authenticate, async (req: AuthRequest, res: Response) => {
  const user = await User.unscoped().findByPk(req.user!.userId);
  if (!user?.totpEnabled || !user.totpSecret) { res.status(400).json({ message: "Two-factor authentication is not on." }); return; }
  if (mfaLocked(user.id)) { res.status(429).json({ message: "Too many incorrect codes. Try again in 15 minutes." }); return; }
  if (!(await bcrypt.compare(String(req.body?.password ?? ""), user.passwordHash))) {
    res.status(401).json({ message: "Password is incorrect." });
    return;
  }

  const byCode = req.body?.code ? verifyCode(decryptSecret(user.totpSecret), String(req.body.code), user.totpLastStep) !== null : false;
  const byRecovery = !byCode && req.body?.recoveryCode ? consumeRecoveryCode(user.totpRecoveryCodes, String(req.body.recoveryCode)) !== null : false;
  if (!byCode && !byRecovery) { mfaMiss(user.id); res.status(401).json({ message: "That code is not correct." }); return; }

  mfaClear(user.id);
  await user.update({ totpEnabled: false, totpSecret: null, totpRecoveryCodes: null, totpLastStep: null });
  void auditRequest(req, "auth.mfa_disabled", { entityType: "user", entityId: user.id });
  res.json({ enabled: false });
});

/**
 * Email-verification link target. A plain GET that redirects to the login page:
 * the token is signed, expires, and clearing the flag is idempotent, so a link
 * scanner fetching it early does no harm.
 */
router.get("/verify-email", async (req: Request, res: Response) => {
  const parsed = readVerifyToken(String(req.query.token ?? ""));
  const target = (status: string) => res.redirect(`${env.frontendUrl}/auth/login?verified=${status}`);
  if (!parsed) { target("invalid"); return; }

  try {
    const user = await runAsSystem("verify-email:resolve", () =>
      User.unscoped().findByPk(parsed.userId, { attributes: ["id", "organizationId"] })
    );
    const organizationId = (user as any)?.organizationId as string | undefined;
    if (!organizationId) { target("invalid"); return; }

    const org = await runAsSystem("verify-email:org", () => Organization.findByPk(organizationId));
    if (org?.settings?.pendingEmailVerification) {
      const settings = { ...org.settings };
      delete settings.pendingEmailVerification;
      await org.update({ settings });
    }
    target("1");
  } catch (err: any) {
    console.error("[Auth] Email verification failed:", err.message);
    target("error");
  }
});

// Re-send the verification link to the signed-in owner.
router.post("/resend-verification", authenticate, emailFlowLimiter, async (req: AuthRequest, res: Response) => {
  const org = await Organization.findByPk(req.user!.organizationId);
  if (!org?.settings?.pendingEmailVerification) {
    res.json({ message: "Your email is already confirmed." });
    return;
  }
  const user = await User.unscoped().findByPk(req.user!.userId, { attributes: ["id", "fullName", "personalEmail"] });
  if (!user) { res.status(404).json({ message: "User not found" }); return; }
  try {
    await sendVerificationEmail(user, org.id, org.name);
    res.json({ message: "Verification email sent." });
  } catch (err: any) {
    console.error("[Auth] Resend verification failed:", err.message);
    res.status(500).json({ message: "Could not send the verification email." });
  }
});

// The owner accepts the current terms (for workspaces created before they were
// recorded, or after the terms change).
router.post("/accept-terms", authenticate, async (req: AuthRequest, res: Response) => {
  if (req.user!.roleSlug !== "superadmin") {
    res.status(403).json({ message: "Only the workspace owner can accept the terms for the workspace." });
    return;
  }
  if (req.body?.version !== legal.termsVersion) {
    res.status(400).json({ message: "These terms have been updated. Reload to read the current version.", termsVersion: legal.termsVersion });
    return;
  }
  const org = await Organization.findByPk(req.user!.organizationId);
  if (!org) { res.status(404).json({ message: "Workspace not found" }); return; }
  await org.update({
    settings: { ...org.settings, termsVersion: legal.termsVersion, termsAcceptedAt: new Date().toISOString(), termsAcceptedBy: req.user!.userId },
  });
  void auditRequest(req, "legal.terms_accepted", { entityType: "organization", entityId: org.id, metadata: { version: legal.termsVersion } });
  res.json({ termsVersion: legal.termsVersion, termsAccepted: true });
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
    attributes: ["id", "name", "slug", "emailDomain", "status", "plan", "isPlatform", "sesStatus", "settings"],
  });
  const { settings, ...orgFields } = (organization?.toJSON() ?? {}) as Record<string, any>;
  res.json({
    ...user.toJSON(),
    permissions: req.user!.permissions,
    roleSlug: req.user!.roleSlug,
    organization: organization ? orgFields : organization,
    emailVerificationPending: !!settings?.pendingEmailVerification,
    termsVersion: legal.termsVersion,
    termsAccepted: settings?.termsVersion === legal.termsVersion,
    trialEndsAt: settings?.trialEndsAt ?? null,
    trialExpired: organization ? planState(organization).trialExpired : false,
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
  void auditRequest(req, "auth.password_changed", { entityType: "user", entityId: req.user!.userId });
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
      const { subject, html, text } = resetPasswordEmail({ brand: await transactionalBrand((user as any).organizationId), fullName: user.fullName, resetUrl });
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
