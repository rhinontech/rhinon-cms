import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    roleSlug: string;
    permissions: string[];
    fullName: string;
    companyEmail: string;
  };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  let payload: AuthRequest["user"];
  try {
    payload = jwt.verify(token, env.jwtSecret) as AuthRequest["user"];
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }

  // JWTs live for days — re-check the account so offboarded/deleted users
  // lose access immediately, not when their token expires.
  try {
    const account = await User.findByPk(payload!.userId, { attributes: ["id", "status"] });
    if (!account || account.status !== "active") {
      res.status(401).json({ message: "This account is no longer active." });
      return;
    }
  } catch (err: any) {
    console.error("Auth status check failed:", err.message);
    res.status(500).json({ message: "Could not verify account status" });
    return;
  }

  req.user = payload;
  next();
}

export function authorize(...requiredPermissions: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userPermissions = req.user?.permissions || [];
    const hasAll = requiredPermissions.every((p) => userPermissions.includes(p));

    if (!hasAll) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }

    next();
  };
}
