"use client";

import { useEffect, useState } from "react";
import { Search, Mail, Key, Users, CheckCircle2, Shield, Pencil, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { dummyRoles } from "@/lib/dummy-data";
import { User } from "@/lib/types";
import { InviteUserModal } from "./InviteUserModal";
import { CreateRoleModal } from "./CreateRoleModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const userStatusStyle: Record<string, string> = {
  Active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  Invited: "bg-amber-500/10  text-amber-600  dark:text-amber-400  border-amber-500/25",
  Suspended: "bg-rose-500/10   text-rose-600   dark:text-rose-400   border-rose-500/25",
};

export function TeamTabs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load users");
      }
      setUsers(data.users || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleEmailChange = async (user: User) => {
    if (user.isPrimaryAdmin) return;
    const nextEmail = window.prompt("Enter the new work email", user.email);
    if (!nextEmail || nextEmail.trim().toLowerCase() === user.email.toLowerCase()) return;

    setBusyUserId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nextEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update email");
      }

      toast.success("User email updated");
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to update email");
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDelete = async (user: User) => {
    if (user.isPrimaryAdmin) return;
    if (!window.confirm(`Delete ${user.name} (${user.email})?`)) return;

    setBusyUserId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      toast.success("User deleted");
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <Tabs defaultValue="users" className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20 shadow-glow-sm shrink-0">
          <Shield size={28} className="text-violet-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team & Access</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage users, roles, and security permissions.</p>
        </div>
      </header>

      <div className="space-y-6 w-full">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <TabsList className="bg-secondary border border-border p-1 h-auto gap-1">
            <TabsTrigger
              value="users"
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-border data-[state=active]:shadow-sm"
            >
              <Users size={15} className="mr-2" /> Users & Invites
            </TabsTrigger>
            <TabsTrigger
              value="roles"
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400 data-[state=active]:border data-[state=active]:border-border data-[state=active]:shadow-sm"
            >
              <Key size={15} className="mr-2" /> Roles & Permissions
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Users Tab ─────────────────────────── */}
        <TabsContent value="users" className="space-y-5 m-0 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <InviteUserModal onInvited={fetchUsers} />
          </div>

          <div className="card overflow-x-auto border-border custom-scrollbar">
            <table className="w-full text-sm text-left min-w-[700px]">
              <thead className="border-b border-border bg-secondary/60">
                <tr>
                  {["User", "Status", "Role", "Joined", "Actions"].map((h) => (
                    <th key={h} className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading users...
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const role = dummyRoles.find((r) => r.id === user.roleId);
                    return (
                      <tr key={user.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-border">
                              <AvatarFallback className="bg-secondary text-cyan-600 dark:text-cyan-400 font-bold text-xs">
                                {user.name.split(" ").map((n) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-foreground">{user.name}</div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant="outline"
                            className={cn("font-medium text-xs", userStatusStyle[user.status] ?? "")}
                          >
                            {user.status === "Active" && <CheckCircle2 size={11} className="mr-1" />}
                            {user.status === "Invited" && <Mail size={11} className="mr-1" />}
                            {user.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-secondary text-foreground px-2.5 py-1 rounded-lg text-xs font-medium border border-border">
                            {role?.name || "Unknown"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground text-xs">
                          {format(new Date(user.joinedAt), "MMM d, yyyy")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 border-border"
                              onClick={() => handleEmailChange(user)}
                              disabled={user.isPrimaryAdmin || busyUserId === user.id}
                            >
                              <Pencil size={13} className="mr-1.5" />
                              Change Email
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
                              onClick={() => handleDelete(user)}
                              disabled={user.isPrimaryAdmin || busyUserId === user.id}
                            >
                              <Trash2 size={13} className="mr-1.5" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No users found matching &quot;{searchQuery}&quot;
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── Roles Tab ─────────────────────────── */}
        <TabsContent value="roles" className="space-y-6 m-0 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center bg-violet-500/8 border border-violet-500/20 p-4 rounded-xl">
            <div>
              <h3 className="font-semibold text-violet-700 dark:text-violet-400">Role-Based Access Control (RBAC)</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Manage capabilities by assigning permissions to role matrices.
              </p>
            </div>
            <CreateRoleModal />
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {dummyRoles.map((role) => (
              <div
                key={role.id}
                className="card p-6 hover:border-violet-500/30 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-foreground">{role.name}</h3>
                  {role.id === "role_admin" && (
                    <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px]">
                      System Default
                    </Badge>
                  )}
                </div>

                <div className="text-sm text-muted-foreground mb-5 flex items-center gap-1.5">
                  <Users size={13} />
                  {users.filter((u) => u.roleId === role.id).length} Active Users
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Permissions
                  </div>
                  {role.permissions.map((permId) => (
                    <div key={permId} className="flex items-center text-xs text-foreground gap-2">
                      <CheckCircle2 size={13} className="text-violet-500 shrink-0" />
                      <span className="truncate">{permId.replace("perm_", "").replace(/_/g, " ")} enabled</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
