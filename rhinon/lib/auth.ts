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

import User from "./models/User";
import dbConnect from "./mongodb";

export async function loginUser(email: string, password?: string): Promise<SessionUser | null> {
  // 1. Check Dummy Users first (for demo convenience)
  const dummy = dummyUsers.find((u) => u.email === email);
  if (dummy) {
    if (password && password !== "password") return null;
    const role = dummyRoles.find((r) => r.id === dummy.roleId);
    if (!role) return null;
    return {
      id: dummy.id,
      name: dummy.name,
      email: dummy.email,
      linkedinUrl: dummy.linkedinUrl,
      linkedinConnected: dummy.linkedinConnected,
      roleId: dummy.roleId,
      roleName: role.name,
      roleSlug: getRoleSlug(dummy.roleId),
    };
  }

  // 2. Check Database for real invited/setup users
  await dbConnect();
  const dbUser = await User.findOne({ email });
  if (!dbUser) return null;

  // In a real app, use bcrypt.compare(password, dbUser.password)
  // For this implementation, we use simple string check as per requirement
  if (password && dbUser.password && password !== dbUser.password) {
    return null;
  }

  const role = dummyRoles.find((r) => r.id === dbUser.roleId);
  const roleName = role ? role.name : "Team Member";

  return {
    id: dbUser._id.toString(),
    name: dbUser.name,
    email: dbUser.email,
    linkedinUrl: dbUser.linkedinUrl,
    linkedinConnected: dbUser.linkedinConnected,
    roleId: dbUser.roleId,
    roleName: roleName,
    roleSlug: getRoleSlug(dbUser.roleId),
    mustChangePassword: dbUser.mustChangePassword,
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
