import { dummyUsers, dummyRoles } from "./dummy-data";
import { SessionUser } from "./types";
import { ROLE_CAPABILITIES, type RoleSlug } from "./authorization";

export const SESSION_COOKIE = "rhinon_session";

export function getRoleSlug(roleId: string): string {
  switch (roleId) {
    case "role_super_admin":
      return "super_admin";
    case "role_admin":
      return "admin";
    case "role_manager":
      return "manager";
    case "role_sdr":
    case "role_sales":
      return "sales";
    case "role_marketer":
      return "marketer";
    case "role_support":
      return "support";
    default:
      return "support";
  }
}

import User from "./models/User";
import dbConnect from "./mongodb";
import OutreachEmail from "./models/OutreachEmail";

export async function loginUser(email: string, password?: string): Promise<SessionUser | null> {
  // 1. Check Dummy Users first (for demo convenience)
  const dummy = dummyUsers.find((u) => u.email === email);
  if (dummy) {
    if (password && password !== "password") return null;
    const role = dummyRoles.find((r) => r.id === dummy.roleId);
    if (!role) return null;
    const roleSlug = getRoleSlug(dummy.roleId) as RoleSlug;
    return {
      id: dummy.id,
      name: dummy.name,
      email: dummy.email,
      linkedinUrl: dummy.linkedinUrl,
      linkedinConnected: dummy.linkedinConnected,
      roleId: dummy.roleId,
      roleName: role.name,
      roleSlug,
      activeIdentityEmail: dummy.email,
      primaryIdentityEmail: dummy.email,
      capabilities: ROLE_CAPABILITIES[roleSlug] || [],
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
  const primaryIdentity = await OutreachEmail.findOne({ email: dbUser.email, status: "Active" }).lean();

  const roleSlug = getRoleSlug(dbUser.roleId) as RoleSlug;
  return {
    id: dbUser._id.toString(),
    name: dbUser.name,
    email: dbUser.email,
    linkedinUrl: dbUser.linkedinUrl,
    linkedinConnected: dbUser.linkedinConnected,
    roleId: dbUser.roleId,
    roleName: roleName,
    roleSlug,
    activeIdentityEmail: primaryIdentity?.email || dbUser.email,
    primaryIdentityEmail: primaryIdentity?.email || dbUser.email,
    capabilities: ROLE_CAPABILITIES[roleSlug] || [],
    mustChangePassword: dbUser.mustChangePassword,
  };
}

export function decodeSession(cookieValue: string): SessionUser | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(cookieValue)) as Partial<SessionUser>;
    const roleSlug = (parsed.roleSlug || "support") as RoleSlug;
    return {
      id: parsed.id || "",
      name: parsed.name || "",
      email: parsed.email || "",
      linkedinUrl: parsed.linkedinUrl,
      linkedinConnected: parsed.linkedinConnected,
      isPrimaryAdmin: parsed.isPrimaryAdmin,
      roleId: parsed.roleId || "",
      roleName: parsed.roleName || "Team Member",
      roleSlug,
      activeIdentityEmail: parsed.activeIdentityEmail || parsed.email || "",
      primaryIdentityEmail: parsed.primaryIdentityEmail || parsed.email || "",
      capabilities: parsed.capabilities || ROLE_CAPABILITIES[roleSlug] || [],
      mustChangePassword: parsed.mustChangePassword,
    };
  } catch (e) {
    return null;
  }
}

export function encodeSession(user: SessionUser): string {
  return encodeURIComponent(JSON.stringify(user));
}
