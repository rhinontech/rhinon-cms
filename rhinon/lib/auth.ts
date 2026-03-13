import { dummyUsers, dummyRoles } from "./dummy-data";
import { SessionUser } from "./types";

export const SESSION_COOKIE = "rhinon_session";

export function getRoleSlug(roleId: string): string {
  switch (roleId) {
    case "role_admin":
      return "admin";
    case "role_manager":
      return "manager";
    case "role_sdr":
      return "sdr";
    default:
      return "guest";
  }
}

export function loginUser(email: string, password?: string): SessionUser | null {
  // Demo mode: password always "password"
  if (password && password !== "password") return null;

  const user = dummyUsers.find((u) => u.email === email);
  if (!user) return null;

  const role = dummyRoles.find((r) => r.id === user.roleId);
  if (!role) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roleId: user.roleId,
    roleName: role.name,
    roleSlug: getRoleSlug(user.roleId),
  };
}

export function decodeSession(cookieValue: string): SessionUser | null {
  try {
    return JSON.parse(decodeURIComponent(cookieValue));
  } catch (e) {
    return null;
  }
}

export function encodeSession(user: SessionUser): string {
  return encodeURIComponent(JSON.stringify(user));
}
