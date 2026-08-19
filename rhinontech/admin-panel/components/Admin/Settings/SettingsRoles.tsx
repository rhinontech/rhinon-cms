"use client";

import { useEffect, useState } from "react";
import { TbPlus, TbTrash, TbShield, TbCheck, TbX, TbChevronLeft } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { useSideNav } from "@/context/SideNavContext";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { apiFetch } from "@/lib/api";

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

interface Role {
  id: string;
  name: string;
  slug: string;
  usersCount?: number;
  Permissions?: Permission[];
}

// Human labels for known permissions — anything not listed here falls back to
// a prettified "resource — action" string, so new permissions just work.
const PERMISSION_LABELS: Record<string, string> = {
  "dashboard:read": "View dashboard",
  "employees:read": "View team directory (admin)",
  "employees:write": "Add, edit & offboard team members",
  "payroll:read": "View payroll data",
  "payroll:write": "Run payroll & manage salaries",
  "payslips:read": "View own payslips",
  "people:read": "View people directory",
  "provisioning:read": "View provisioning",
  "provisioning:write": "Manage provisioning",
  "settings:read": "View settings",
  "settings:write": "Manage roles, permissions & branding",
  "inbox:read": "View inbox",
  "inbox:write": "Reply in inbox",
  "outreach:read": "View outreach & leads",
  "outreach:write": "Manage campaigns & outreach",
  "content:read": "View content (blogs, case studies)",
  "content:write": "Publish content",
  "analytics:read": "View website analytics",
  "docsAccess:read": "View docs access list",
  "docsAccess:write": "Grant/revoke docs access",
  "leave:read": "View leave (own team)",
  "leave:write": "Manage leave types & approve requests",
  "performance:read": "View performance (own)",
  "performance:write": "Manage review cycles & team performance",
  "documents:read": "View own documents",
  "documents:write": "Manage all employee documents",
  "attendance:read": "View own attendance",
  "attendance:write": "View team attendance & manage governance",
  "work:read": "View own tasks",
  "work:write": "View & manage team's tasks",
};

// Display order + label for each resource group. Any resource not listed here
// still renders, using a capitalized fallback — the matrix is fully data-driven.
const RESOURCE_META: { key: string; label: string; order: number }[] = [
  { key: "dashboard", label: "Dashboard", order: 0 },
  { key: "people", label: "People Directory", order: 1 },
  { key: "employees", label: "Team Management", order: 2 },
  { key: "payroll", label: "Payroll", order: 3 },
  { key: "payslips", label: "Payslips", order: 4 },
  { key: "leave", label: "Leave", order: 5 },
  { key: "performance", label: "Performance", order: 6 },
  { key: "attendance", label: "Attendance", order: 7 },
  { key: "documents", label: "Documents", order: 8 },
  { key: "work", label: "Work & Tasks", order: 9 },
  { key: "inbox", label: "Inbox", order: 10 },
  { key: "outreach", label: "Outreach", order: 11 },
  { key: "content", label: "Content (CMS)", order: 12 },
  { key: "analytics", label: "Analytics", order: 13 },
  { key: "docsAccess", label: "Docs Access", order: 14 },
  { key: "provisioning", label: "Provisioning", order: 15 },
  { key: "settings", label: "Settings", order: 16 },
];

function resourceLabel(resource: string) {
  const known = RESOURCE_META.find((r) => r.key === resource);
  if (known) return known.label;
  return resource.charAt(0).toUpperCase() + resource.slice(1);
}

function resourceOrder(resource: string) {
  const known = RESOURCE_META.find((r) => r.key === resource);
  return known ? known.order : 99;
}

// Cannot delete — the 3 core roles that ship with the app
const PROTECTED_SLUGS = ["superadmin", "hr", "employee"];
// Cannot edit permissions — the CEO's authority is unconditional, enforced
// server-side too (see backend routes/roles.ts)
const LOCKED_SLUGS = ["superadmin"];

export function SettingsRoles() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleSlug, setNewRoleSlug] = useState("");
  const [message, setMessage] = useState("");
  const [selectedPermIds, setSelectedPermIds] = useState<Set<string>>(new Set());

  const fetchRoles = async () => {
    const list = await apiFetch<Role[]>("/roles");
    setRoles(Array.isArray(list) ? list : []);
    return Array.isArray(list) ? list : [];
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([apiFetch<Role[]>("/roles"), apiFetch<Permission[]>("/permissions")])
      .then(([rolesData, permsData]) => {
        const list = Array.isArray(rolesData) ? rolesData : [];
        setRoles(list);
        setPermissions(Array.isArray(permsData) ? permsData : []);
        if (list.length > 0) selectRole(list[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectRole = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermIds(new Set((role.Permissions ?? []).map((p) => p.id)));
    setMessage("");
  };

  const handleRoleClick = (role: Role) => {
    selectRole(role);
    setMobileDetail(true);
  };

  const togglePermission = (permId: string) => {
    setSelectedPermIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  const savePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    setMessage("");
    try {
      await apiFetch(`/roles/${selectedRole.id}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ permissionIds: Array.from(selectedPermIds) }),
      });
      setMessage("Permissions saved.");
      const list = await fetchRoles();
      const updated = list.find((r) => r.id === selectedRole.id);
      if (updated) selectRole(updated);
    } catch (err: any) {
      setMessage(err.message || "Failed to save permissions.");
    } finally {
      setSaving(false);
    }
  };

  const createRole = async () => {
    if (!newRoleName.trim() || !newRoleSlug.trim()) return;
    setSaving(true);
    setMessage("");
    try {
      await apiFetch("/roles", {
        method: "POST",
        body: JSON.stringify({ name: newRoleName.trim(), slug: newRoleSlug.trim().toLowerCase().replace(/\s+/g, "-") }),
      });
      setNewRoleName("");
      setNewRoleSlug("");
      setCreating(false);
      const list = await fetchRoles();
      const created = list[list.length - 1];
      if (created) {
        selectRole(created);
        setMobileDetail(true);
      }
    } catch (err: any) {
      setMessage(err.message || "Failed to create role.");
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async (role: Role) => {
    if ((role.usersCount ?? 0) > 0) {
      alert(`${role.usersCount} member(s) still have this role. Reassign them first.`);
      return;
    }
    if (!confirm(`Delete role "${role.name}"?`)) return;
    try {
      await apiFetch(`/roles/${role.id}`, { method: "DELETE" });
      const list = await fetchRoles();
      if (list[0]) selectRole(list[0]);
      else {
        setSelectedRole(null);
        setMobileDetail(false);
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete role.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">Loading...</div>
    );
  }

  const resourceGroups = [...new Set(permissions.map((p) => p.resource))]
    .sort((a, b) => resourceOrder(a) - resourceOrder(b));

  return (
    <div className="flex min-h-0 min-w-0 gap-2 w-full h-full overflow-hidden">
      {/* Roles list */}
      <aside
        className={cn(
          "flex flex-col bg-white shrink-0 h-full overflow-hidden w-full lg:w-64",
          isSubNavExpanded ? "rounded-r-xl max-sm:rounded-xl lg:rounded-l-none" : "rounded-xl"
        )}
      >
        <div className="flex items-center justify-between min-h-16 px-4 py-2 sm:py-0 border-b shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <SubNavToggle />
            <span className="text-sm font-semibold text-gray-900 truncate">Roles</span>
          </div>
          <button
            onClick={() => { setCreating(true); setMessage(""); }}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 shrink-0"
          >
            <TbPlus size={14} /> New
          </button>
        </div>

        {creating && (
          <div className="px-4 py-3 border-b space-y-2 bg-blue-50">
            <input
              autoFocus
              placeholder="Role name"
              value={newRoleName}
              onChange={(e) => {
                setNewRoleName(e.target.value);
                setNewRoleSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
              }}
              className="w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <input
              placeholder="slug (e.g. hr-manager)"
              value={newRoleSlug}
              onChange={(e) => setNewRoleSlug(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <div className="flex gap-2">
              <button
                onClick={createRole}
                disabled={saving || !newRoleName.trim()}
                className="flex-1 text-xs bg-stone-900 text-white rounded-md py-1.5 hover:bg-stone-800 disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create"}
              </button>
              <button
                onClick={() => { setCreating(false); setNewRoleName(""); setNewRoleSlug(""); }}
                className="flex-1 text-xs border border-gray-200 rounded-md py-1.5 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <nav className="flex-1 min-h-0 overflow-y-auto py-2 px-2 space-y-0.5">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => handleRoleClick(role)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-left transition-colors",
                selectedRole?.id === role.id
                  ? "bg-stone-900 text-white"
                  : "text-gray-700 hover:bg-stone-100"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <TbShield size={14} className="shrink-0" />
                <span className="truncate">{role.name}</span>
              </div>
              <span className={cn(
                "flex shrink-0 items-center gap-1.5 text-xs ml-2",
                selectedRole?.id === role.id ? "text-stone-300" : "text-gray-400"
              )}>
                {typeof role.usersCount === "number" && <span>{role.usersCount} member{role.usersCount !== 1 ? "s" : ""}</span>}
                <span>·</span>
                <span>{(role.Permissions ?? []).length}</span>
              </span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Permissions editor */}
      <main
        className={cn(
          "min-h-0 flex-col bg-white overflow-hidden transition-all duration-200 ease-in-out",
          mobileDetail ? "fixed inset-0 z-50 flex w-full max-w-full" : "hidden",
          "lg:static lg:z-auto lg:flex lg:h-full lg:flex-1 lg:rounded-xl min-w-0"
        )}
      >
        {selectedRole ? (
          <>
            <div className="flex items-center justify-between min-h-16 px-4 sm:px-5 py-2 sm:py-0 border-b shrink-0 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => setMobileDetail(false)}
                  className="lg:hidden p-1.5 -ml-1 rounded-lg text-gray-600 hover:bg-stone-100 transition-colors shrink-0"
                  aria-label="Back to roles"
                >
                  <TbChevronLeft size={20} />
                </button>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{selectedRole.name}</h2>
                  <p className="text-xs text-gray-400 truncate">
                    /{selectedRole.slug} · {selectedPermIds.size} permissions
                    {typeof selectedRole.usersCount === "number" && ` · ${selectedRole.usersCount} member${selectedRole.usersCount !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {message && (
                  <span className={cn("text-xs hidden sm:inline", message.toLowerCase().includes("fail") ? "text-red-500" : "text-green-600")}>
                    {message}
                  </span>
                )}
                {!PROTECTED_SLUGS.includes(selectedRole.slug) && (
                  <button
                    onClick={() => deleteRole(selectedRole)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title={(selectedRole.usersCount ?? 0) > 0 ? "Reassign members before deleting" : "Delete role"}
                  >
                    <TbTrash size={15} />
                  </button>
                )}
                <button
                  onClick={savePermissions}
                  disabled={saving || LOCKED_SLUGS.includes(selectedRole.slug)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50"
                >
                  <TbCheck size={13} />
                  <span>{saving ? "Saving..." : "Save"}</span>
                </button>
                <button
                  onClick={() => setMobileDetail(false)}
                  className="lg:hidden p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <TbX size={18} />
                </button>
              </div>
            </div>

            {message && (
              <div className={cn("sm:hidden px-4 py-1.5 text-xs border-b", message.toLowerCase().includes("fail") ? "bg-red-50 text-red-600 border-red-100" : "bg-green-50 text-green-700 border-green-100")}>
                {message}
              </div>
            )}

            <div className="flex-1 min-h-0 min-w-0 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5">
              {LOCKED_SLUGS.includes(selectedRole.slug) && (
                <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3.5 sm:px-4 py-2.5 sm:py-3">
                  Super Admin — the CEO panel — always has every permission and cannot be edited.
                </div>
              )}

              {resourceGroups.map((resource) => {
                const groupPerms = permissions.filter((p) => p.resource === resource);
                if (groupPerms.length === 0) return null;
                return (
                  <section key={resource}>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{resourceLabel(resource)}</h3>
                    <div className="space-y-1">
                      {groupPerms.map((perm) => {
                        const enabled = selectedPermIds.has(perm.id);
                        const locked = LOCKED_SLUGS.includes(selectedRole.slug);
                        return (
                          <label
                            key={perm.id}
                            className={cn(
                              "flex items-center justify-between px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-lg border transition-colors gap-2",
                              locked ? "cursor-default" : "cursor-pointer",
                              enabled
                                ? "border-blue-200 bg-blue-50"
                                : "border-gray-100 bg-gray-50 hover:border-gray-200"
                            )}
                          >
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">
                                {PERMISSION_LABELS[perm.name] ?? perm.name}
                              </p>
                              <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 truncate">{perm.name}</p>
                            </div>
                            <div
                              className={cn(
                                "w-9 h-5 rounded-full transition-colors flex items-center px-0.5 shrink-0",
                                enabled ? "bg-stone-900" : "bg-gray-200"
                              )}
                              onClick={() => !locked && togglePermission(perm.id)}
                            >
                              <div className={cn(
                                "w-4 h-4 bg-white rounded-full shadow-sm transition-transform",
                                enabled ? "translate-x-4" : "translate-x-0"
                              )} />
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center flex-1 text-sm text-gray-400">
            Select a role to manage permissions.
          </div>
        )}
      </main>
    </div>
  );
}
