import type { Permission, Role, User } from "@/lib/types";

export const dummyPermissions: Permission[] = [
  { id: "perm_1", name: "manage_leads", description: "Can import, edit, and delete leads." },
  { id: "perm_2", name: "create_campaigns", description: "Can create and launch new outbound campaigns." },
  { id: "perm_3", name: "edit_templates", description: "Can create and modify messaging templates." },
  { id: "perm_4", name: "view_analytics", description: "Can view system-wide analytics and charts." },
  { id: "perm_5", name: "manage_team", description: "Can invite users and manage RBAC roles." },
];

export const dummyRoles: Role[] = [
  { id: "role_admin", name: "Administrator", permissions: ["perm_1", "perm_2", "perm_3", "perm_4", "perm_5"] },
  { id: "role_manager", name: "Campaign Manager", permissions: ["perm_1", "perm_2", "perm_3", "perm_4"] },
  { id: "role_sdr", name: "SDR Representative", permissions: ["perm_1", "perm_4"] },
];

export const dummyUsers: User[] = [
  { id: "user_1", name: "Alex Mercer", email: "alex@rhinon.tech", roleId: "role_admin", status: "Active", joinedAt: "2023-11-01T10:00:00Z" },
  { id: "user_2", name: "Sarah Chen", email: "sarah@rhinon.tech", roleId: "role_manager", status: "Active", joinedAt: "2024-01-15T09:30:00Z" },
  { id: "user_3", name: "James Holden", email: "james@rhinon.tech", roleId: "role_sdr", status: "Invited", joinedAt: "2024-03-10T14:20:00Z" },
];
