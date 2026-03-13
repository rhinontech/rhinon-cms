"use client";

import { useState } from "react";
import { Search, Mail, Building, Key, Users, Copy, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { dummyUsers, dummyRoles } from "@/app/lib/dummy-data";
import { InviteUserModal } from "./InviteUserModal";
import { CreateRoleModal } from "./CreateRoleModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function TeamTabs() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = dummyUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Tabs defaultValue="users" className="w-full">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
            <TabsList className="bg-slate-900 border border-slate-800">
              <TabsTrigger value="users" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400">
                <Users size={16} className="mr-2" /> Users & Invites
              </TabsTrigger>
              <TabsTrigger value="roles" className="data-[state=active]:bg-slate-800 data-[state=active]:text-violet-400">
                <Key size={16} className="mr-2" /> Roles & Permissions
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="users" className="space-y-6 m-0 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-900 border-slate-800 text-slate-200"
                />
              </div>
              <InviteUserModal />
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-medium">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => {
                      const role = dummyRoles.find(r => r.id === user.roleId);
                      return (
                        <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border border-slate-800">
                                <AvatarFallback className="bg-slate-800 text-cyan-400 font-medium">
                                  {user.name.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-slate-200">{user.name}</div>
                                <div className="text-xs text-slate-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className={`font-medium
                              ${user.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : ""}
                              ${user.status === "Invited" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : ""}
                              ${user.status === "Suspended" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : ""}
                            `}>
                              {user.status === "Active" && <CheckCircle2 size={12} className="mr-1" />}
                              {user.status === "Invited" && <Mail size={12} className="mr-1" />}
                              {user.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded text-xs font-medium border border-slate-700">
                              {role?.name || "Unknown"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {format(new Date(user.joinedAt), "MMM d, yyyy")}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        No users found matching "{searchQuery}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="roles" className="space-y-6 m-0 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center bg-violet-500/10 border border-violet-500/20 p-4 rounded-xl">
              <div>
                <h3 className="font-medium text-violet-400">Role-Based Access Control (RBAC)</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Manage capabilities across the platform by assigning permissions to roles matrices.
                </p>
              </div>
              <CreateRoleModal />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {dummyRoles.map(role => (
                <div key={role.id} className="card p-6 border border-slate-800 hover:border-violet-500/30 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-slate-200 text-lg">{role.name}</h3>
                    {role.id === "role_admin" && (
                      <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20">System Default</Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-slate-500 mb-6 flex items-center gap-2">
                    <Users size={14} /> 
                    {dummyUsers.filter(u => u.roleId === role.id).length} Active Users
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Permissions</div>
                    {role.permissions.map(permId => {
                      // Lookup a human readable name based on ID
                      const pName = dummyRoles.flatMap(r => r.permissions).find(p => p === permId)?.replace("perm_", "Permission ") || permId;
                      return (
                         <div key={permId} className="flex items-center text-sm text-slate-300 gap-2">
                           <CheckCircle2 size={14} className="text-violet-400" />
                           <span className="truncate">{permId.replace("perm_", "P0").replace("_", " ")} Enabled</span>
                         </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
