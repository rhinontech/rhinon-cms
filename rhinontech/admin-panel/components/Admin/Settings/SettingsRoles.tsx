"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { TbPlus, TbTrash, TbShield, TbCheck } from "react-icons/tb";
import { cn } from "@/lib/utils";

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
  Permissions?: Permission[];
}

const PERMISSION_LABELS: Record<string, string> = {
  "dashboard:read":    "Dashboard — View",
  "employees:read":    "Employees — View",
  "employees:write":   "Employees — Manage",
  "payroll:read":      "Payroll — View",
  "payroll:write":     "Payroll — Manage",
  "payslips:read":     "Payslips — View own",
  "provisioning:read": "Provisioning — View",
  "provisioning:write":"Provisioning — Manage",
  "settings:read":     "Settings — View",
  "settings:write":    "Settings — Manage",
  "inbox:read":        "Inbox — View",
  "inbox:write":       "Inbox — Reply",
  "people:read":       "People Directory — View",
};

const PERMISSION_GROUPS = [
  { label: "Core", keys: ["dashboard:read"] },
  { label: "People", keys: ["employees:read", "employees:write", "people:read"] },
  { label: "Payroll", keys: ["payroll:read", "payroll:write", "payslips:read"] },
  { label: "Inbox", keys: ["inbox:read", "inbox:write"] },
  { label: "Provisioning", keys: ["provisioning:read", "provisioning:write"] },
  { label: "Settings", keys: ["settings:read", "settings:write"] },
];

// Cannot delete these — they're the 3 core roles
const PROTECTED_SLUGS = ["superadmin", "hr", "employee"];
// Cannot edit permissions on these — managed by the system
const LOCKED_SLUGS = ["superadmin", "employee"];

export function SettingsRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleSlug, setNewRoleSlug] = useState("");
  const [message, setMessage] = useState("");
  const [selectedPermIds, setSelectedPermIds] = useState<Set<string>>(new Set());

  const token = Cookies.get("authToken");
  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  const fetchRoles = async () => {
    const res = await fetch(`${apiBase}/roles`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    const list: Role[] = Array.isArray(data) ? data : [];
    setRoles(list);
    return list;
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${apiBase}/roles`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${apiBase}/permissions`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
      .then(([rolesData, permsData]) => {
        const list: Role[] = Array.isArray(rolesData) ? rolesData : [];
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
    const res = await fetch(`${apiBase}/roles/${selectedRole.id}/permissions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ permissionIds: Array.from(selectedPermIds) }),
    });
    if (res.ok) {
      setMessage("Permissions saved.");
      const list = await fetchRoles();
      const updated = list.find((r) => r.id === selectedRole.id);
      if (updated) selectRole(updated);
    } else {
      setMessage("Failed to save permissions.");
    }
    setSaving(false);
  };

  const createRole = async () => {
    if (!newRoleName.trim() || !newRoleSlug.trim()) return;
    setSaving(true);
    setMessage("");
    const res = await fetch(`${apiBase}/roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newRoleName.trim(), slug: newRoleSlug.trim().toLowerCase().replace(/\s+/g, "-") }),
    });
    if (res.ok) {
      setNewRoleName("");
      setNewRoleSlug("");
      setCreating(false);
      const list = await fetchRoles();
      const created = list[list.length - 1];
      if (created) selectRole(created);
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage(data.message || "Failed to create role.");
    }
    setSaving(false);
  };

  const deleteRole = async (role: Role) => {
    if (!confirm(`Delete role "${role.name}"? Users assigned to this role will lose access.`)) return;
    await fetch(`${apiBase}/roles/${role.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    const list = await fetchRoles();
    selectRole(list[0] ?? null as unknown as Role);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">Loading...</div>
    );
  }

  return (
    <div className="flex min-h-0 gap-2 w-full h-full overflow-hidden">
      {/* Roles list */}
      <aside className="flex flex-col bg-white rounded-xl w-64 shrink-0 h-full overflow-hidden">
        <div className="flex items-center justify-between h-14 px-4 border-b shrink-0">
          <span className="text-sm font-semibold text-gray-900">Roles</span>
          <button
            onClick={() => { setCreating(true); setMessage(""); }}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
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
              className="w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              placeholder="slug (e.g. hr-manager)"
              value={newRoleSlug}
              onChange={(e) => setNewRoleSlug(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        <nav className="flex-1 overflow-auto py-2 px-2 space-y-0.5">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => selectRole(role)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors",
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
                "text-xs shrink-0 ml-2",
                selectedRole?.id === role.id ? "text-stone-300" : "text-gray-400"
              )}>
                {(role.Permissions ?? []).length}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Permissions editor */}
      <main className="flex flex-col bg-white rounded-xl flex-1 h-full overflow-hidden min-w-0">
        {selectedRole ? (
          <>
            <div className="flex items-center justify-between h-14 px-5 border-b shrink-0">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{selectedRole.name}</h2>
                <p className="text-xs text-gray-400">/{selectedRole.slug} · {selectedPermIds.size} permissions</p>
              </div>
              <div className="flex items-center gap-3">
                {message && (
                  <span className={cn("text-xs", message.includes("Failed") ? "text-red-500" : "text-green-600")}>
                    {message}
                  </span>
                )}
                {!PROTECTED_SLUGS.includes(selectedRole.slug) && (
                  <button
                    onClick={() => deleteRole(selectedRole)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TbTrash size={15} />
                  </button>
                )}
                <button
                  onClick={savePermissions}
                  disabled={saving || LOCKED_SLUGS.includes(selectedRole.slug)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50"
                >
                  <TbCheck size={13} />
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-5 space-y-5">
              {LOCKED_SLUGS.includes(selectedRole.slug) && (
                <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  This is a system role. Permissions are managed automatically and cannot be changed.
                </div>
              )}

              {PERMISSION_GROUPS.map((group) => {
                const groupPerms = permissions.filter((p) => group.keys.includes(p.name));
                if (groupPerms.length === 0) return null;
                return (
                  <section key={group.label}>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{group.label}</h3>
                    <div className="space-y-1">
                      {groupPerms.map((perm) => {
                        const enabled = selectedPermIds.has(perm.id);
                        const locked = LOCKED_SLUGS.includes(selectedRole.slug);
                        return (
                          <label
                            key={perm.id}
                            className={cn(
                              "flex items-center justify-between px-4 py-3 rounded-lg border transition-colors",
                              locked ? "cursor-default" : "cursor-pointer",
                              enabled
                                ? "border-blue-200 bg-blue-50"
                                : "border-gray-100 bg-gray-50 hover:border-gray-200"
                            )}
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {PERMISSION_LABELS[perm.name] ?? perm.name}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">{perm.name}</p>
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
