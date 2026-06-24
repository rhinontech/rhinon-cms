import { decodeJwt } from "jose";

export interface JWTPayload {
  userId: string;
  roleSlug: string;
  permissions: string[];
  fullName: string;
  companyEmail: string;
  exp?: number;
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    const payload = decodeJwt(token) as unknown as JWTPayload;

    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    if (!payload.roleSlug) return null;

    return payload;
  } catch {
    return null;
  }
}
