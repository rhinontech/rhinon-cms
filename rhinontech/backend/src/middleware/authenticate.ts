import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User, Role, Permission } from "../models";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    userType: "internal" | "guest";
    roleSlug: string;
    permissions: string[];
    fullName: string;
    companyEmail: string;
  };
}

/**
 * Router mount paths an external collaborator may touch AT ALL. Everything else
 * is refused before the route runs.
 *
 * Deliberately an allowlist keyed on the mount path: a module added later is
 * closed to guests until someone opts it in, rather than open until someone
 * remembers to close it. This is the structural guard that stops a
 * misconfigured role from ever handing a client the HR module — /people alone
 * returns PAN, bank account and salary for every employee.
 */
// /workflow is read-only for guests — every write there is behind requireInternal.
const GUEST_ALLOWED_MOUNTS = new Set(["/auth", "/tasks", "/work", "/workflow"]);

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  let payload: { userId: string };
  try {
    payload = jwt.verify(token, env.jwtSecret) as { userId: string };
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }

  // JWTs live for days — re-derive identity from the DB on every request so
  // offboarding, role changes, and permission grants/revocations take effect
  // immediately instead of waiting for the token to expire or a re-login.
  try {
    // unscoped: the default scope hides guests, who must still be able to authenticate.
    const account = await User.unscoped().findByPk(payload.userId, {
      attributes: ["id", "status", "fullName", "companyEmail", "userType"],
      include: [{ model: Role, as: "role", include: [{ model: Permission }] }],
    });
    if (!account || account.status !== "active") {
      res.status(401).json({ message: "This account is no longer active." });
      return;
    }

    const role = (account as any).role as Role & { Permissions: Permission[] };
    const permissions = (role?.Permissions || []).map((p: any) => `${p.resource}:${p.action}`);

    req.user = {
      userId: account.id,
      userType: (account as any).userType === "guest" ? "guest" : "internal",
      roleSlug: role?.slug ?? "",
      permissions,
      fullName: account.fullName,
      companyEmail: account.companyEmail,
    };

    // req.baseUrl is the router's mount path ("/tasks", "/payroll", …).
    if (req.user.userType === "guest" && !GUEST_ALLOWED_MOUNTS.has(req.baseUrl)) {
      res.status(403).json({ message: "This area is not available to collaborator accounts." });
      return;
    }
  } catch (err: any) {
    console.error("Auth lookup failed:", err.message);
    res.status(500).json({ message: "Could not verify account" });
    return;
  }

  next();
}

/** Route guard for internal-only endpoints inside an otherwise guest-reachable router. */
export function requireInternal(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.userType === "guest") {
    res.status(403).json({ message: "Collaborators cannot perform this action." });
    return;
  }
  next();
}

// For imperative in-handler checks (as opposed to the authorize() route guard below).
export function hasPermission(req: AuthRequest, ...anyOf: string[]): boolean {
  if (req.user?.userType === "guest") {
    // A guest must never inherit a management bypass, whatever role it carries.
    return false;
  }
  if (req.user?.roleSlug === "superadmin") return true;
  const granted = req.user?.permissions || [];
  return anyOf.some((p) => granted.includes(p));
}

export function authorize(...requiredPermissions: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Superadmin — the CEO panel — always has full authority, even if the
    // permission catalog drifts or a role's grants are misconfigured.
    if (req.user?.roleSlug === "superadmin") {
      next();
      return;
    }

    const userPermissions = req.user?.permissions || [];
    const hasAll = requiredPermissions.every((p) => userPermissions.includes(p));

    if (!hasAll) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }

    next();
  };
}

// Like authorize(), but grants access if the user has ANY of the listed permissions
// instead of all of them — for routes shared by two modules (e.g. leads, readable
// from both CRM and Outreach) during a transition period.
export function authorizeAny(...anyOfPermissions: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.roleSlug === "superadmin") {
      next();
      return;
    }

    const userPermissions = req.user?.permissions || [];
    const hasAny = anyOfPermissions.some((p) => userPermissions.includes(p));

    if (!hasAny) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }

    next();
  };
}
