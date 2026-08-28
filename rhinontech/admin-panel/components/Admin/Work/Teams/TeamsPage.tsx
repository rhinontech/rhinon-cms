"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import {
  TbCrown,
  TbLayoutSidebarFilled,
  TbLayoutSidebarRightFilled,
  TbLock,
  TbPlus,
  TbSearch,
  TbTrash,
  TbUsers,
  TbX,
} from "react-icons/tb";

export interface TeamMember {
  id: string;
  userId: string;
  role: "owner" | "member";
  user?: { id: string; fullName: string; companyEmail: string; department: string | null } | null;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  createdById: string;
  members: TeamMember[];
  projectCount?: number;
}

interface PersonOption {
  id: string;
  fullName: string;
  companyEmail: string;
  department: string | null;
}

type PanelMode = "view" | "create";

export function TeamsPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [teams, setTeams] = useState<Team[]>([]);
  const [people, setPeople] = useState<PersonOption[]>([]);
  const [selected, setSelected] = useState<Team | null>(null);
  const [search, setSearch] = useState("");
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(true);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [mode, setMode] = useState<PanelMode>("view");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", description: "", memberIds: [] as string[] });
  const [addingMember, setAddingMember] = useState("");

  const fetchTeams = async () => {
    try {
      const data = await apiFetch<Team[]>("/teams");
      setTeams(data);
      setSelected((current) => {
        if (!data.length) return null;
        if (current) return data.find((t) => t.id === current.id) ?? data[0];
        return data[0];
      });
    } catch {
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
    apiFetch<PersonOption[]>("/people")
      .then((data) => setPeople(data.map((p) => ({
        id: p.id,
        fullName: p.fullName,
        companyEmail: p.companyEmail,
        department: p.department ?? null,
      }))))
      // Most likely a 403 — the roster is optional here, the picker just empties.
      .catch(() => setPeople([]));
  }, []);

  const visibleTeams = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return teams;
    return teams.filter((team) =>
      team.name.toLowerCase().includes(query) ||
      (team.description ?? "").toLowerCase().includes(query) ||
      team.members.some((m) => (m.user?.fullName ?? "").toLowerCase().includes(query))
    );
  }, [teams, search]);

  const startCreate = () => {
    setForm({ name: "", description: "", memberIds: [] });
    setMode("create");
    setIsPreviewExpanded(true);
    setMobileDetail(true);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const created = await apiFetch<Team>("/teams", {
        method: "POST",
        body: JSON.stringify(form),
      });
      await fetchTeams();
      setSelected(created);
      setMode("view");
      toast.success(`Team "${created.name}" created`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create team");
    } finally {
      setSaving(false);
    }
  };

  const addMember = async (userId: string) => {
    if (!selected || !userId) return;
    try {
      const updated = await apiFetch<Team>(`/teams/${selected.id}/members`, {
        method: "POST",
        body: JSON.stringify({ userIds: [userId] }),
      });
      setSelected(updated);
      setAddingMember("");
      await fetchTeams();
    } catch (err: any) {
      toast.error(err.message || "Failed to add member");
    }
  };

  const removeMember = async (userId: string) => {
    if (!selected) return;
    try {
      await apiFetch(`/teams/${selected.id}/members/${userId}`, { method: "DELETE" });
      const refreshed = await apiFetch<Team>(`/teams/${selected.id}`).catch(() => null);
      // Removing yourself drops the team off your list entirely.
      if (refreshed) setSelected(refreshed);
      await fetchTeams();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove member");
    }
  };

  const setMemberRole = async (userId: string, role: "owner" | "member") => {
    if (!selected) return;
    try {
      const updated = await apiFetch<Team>(`/teams/${selected.id}/members/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      });
      setSelected(updated);
      await fetchTeams();
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    }
  };

  const deleteTeam = async () => {
    if (!selected) return;
    if (!window.confirm(`Delete the team "${selected.name}"? Its members lose access to any work scoped to it.`)) return;
    try {
      await apiFetch(`/teams/${selected.id}`, { method: "DELETE" });
      setSelected(null);
      await fetchTeams();
      toast.success("Team deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete team");
    }
  };

  const memberIdsInSelected = new Set((selected?.members ?? []).map((m) => m.userId));
  const addablePeople = people.filter((p) => !memberIdsInSelected.has(p.id));

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <main className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden glass-panel", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            <SubNavToggle />
            <div>
              <h1 className="text-base font-semibold tracking-tight text-foreground">Teams</h1>
              <p className="text-xs text-muted-foreground">Private groups that can own projects only their members can see.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={startCreate} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
              New team
              <TbPlus size={14} />
            </button>
            {!isPreviewExpanded && (
              <button onClick={() => (setIsPreviewExpanded(true), setMobileDetail(true))} className="rounded-lg p-2 text-foreground/70 hover:bg-muted">
                <TbLayoutSidebarFilled size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="relative w-full max-w-[460px]">
            <TbSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search teams or members"
              className="w-full rounded-lg border border-border py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-8 overflow-hidden rounded-xl glass-card">
            <div className="min-w-[620px] grid grid-cols-[1.6fr_2fr_0.7fr_0.7fr] border-b bg-muted px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Team</span>
              <span>Members</span>
              <span>People</span>
              <span>Projects</span>
            </div>
            {visibleTeams.map((team) => (
              <button
                key={team.id}
                onClick={() => {
                  setSelected(team);
                  setMode("view");
                  setIsPreviewExpanded(true);
                  setMobileDetail(true);
                }}
                className={cn(
                  "grid w-full grid-cols-[1.6fr_2fr_0.7fr_0.7fr] items-center border-b px-4 py-3 text-left text-sm hover:bg-muted/40",
                  selected?.id === team.id && "bg-blue-50 dark:bg-blue-400/10 hover:bg-blue-50 dark:hover:bg-blue-400/10"
                )}
              >
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <TbUsers size={16} className="shrink-0 text-muted-foreground" />
                  <span className="truncate">{team.name}</span>
                </span>
                <span className="truncate text-foreground/70">
                  {team.members.map((m) => m.user?.fullName).filter(Boolean).join(", ") || "—"}
                </span>
                <span className="text-foreground/70">{team.members.length}</span>
                <span className="text-foreground/70">{team.projectCount ?? 0}</span>
              </button>
            ))}
            {!loading && !visibleTeams.length && (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                {teams.length === 0
                  ? "You're not in any team yet. Create one to keep a project between just a few people."
                  : "No teams match that search."}
              </div>
            )}
            {loading && <div className="px-4 py-10 text-center text-sm text-muted-foreground">Loading teams…</div>}
          </div>
        </div>
      </main>

      <aside className={`min-h-0 flex-col bg-card overflow-hidden transition-all duration-200 ease-in-out ${mobileDetail ? "fixed inset-0 z-50 flex" : "hidden"} lg:static lg:z-auto lg:flex lg:h-full lg:rounded-xl ${isPreviewExpanded && (visibleTeams.length > 0 || mode === "create") ? "lg:w-[42%] lg:ml-2" : "lg:w-0"}`}>
        {isPreviewExpanded && (visibleTeams.length > 0 || mode === "create") && (
          <div className="flex h-full flex-1 flex-col overflow-hidden">
            <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-5">
              <p className="-mb-px flex self-stretch items-center border-b-2 border-blue-600 text-md font-medium tracking-tight text-foreground">
                {mode === "create" ? "New team" : "Team details"}
              </p>
              <div className="flex items-center gap-2">
                {mode === "view" && selected && (
                  <button onClick={deleteTeam} className="rounded-lg px-2 py-1.5 text-sm font-medium text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-400/10">
                    <TbTrash size={16} />
                  </button>
                )}
                <button onClick={() => (setIsPreviewExpanded(false), setMobileDetail(false))} className="text-foreground/70 hover:text-foreground">
                  <TbLayoutSidebarRightFilled size={20} />
                </button>
              </div>
            </div>

            {mode === "create" ? (
              <form onSubmit={handleCreate} className="flex-1 space-y-4 overflow-auto p-5">
                <label className="flex flex-col gap-1 text-sm font-medium text-foreground/85">
                  Team name
                  <input
                    value={form.name}
                    onChange={(event) => setForm((c) => ({ ...c, name: event.target.value }))}
                    required
                    placeholder="e.g. Internal R&D"
                    className="rounded-lg border border-border px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-foreground/85">
                  Description
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((c) => ({ ...c, description: event.target.value }))}
                    className="min-h-24 rounded-lg border border-border px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <div className="flex flex-col gap-2 text-sm font-medium text-foreground/85">
                  Members
                  <p className="text-xs font-normal text-muted-foreground">
                    You&apos;re the owner. Everyone you add here can see the team&apos;s projects and tasks.
                  </p>
                  <div className="max-h-64 overflow-auto rounded-lg border border-border">
                    {people.map((person) => {
                      const checked = form.memberIds.includes(person.id);
                      return (
                        <label key={person.id} className="flex cursor-pointer items-center gap-3 border-b px-3 py-2 text-sm font-normal last:border-b-0 hover:bg-muted/40">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => setForm((c) => ({
                              ...c,
                              memberIds: checked
                                ? c.memberIds.filter((id) => id !== person.id)
                                : [...c.memberIds, person.id],
                            }))}
                            className="h-4 w-4"
                          />
                          <span className="flex-1 truncate text-foreground">{person.fullName}</span>
                          <span className="truncate text-xs text-muted-foreground">{person.department || ""}</span>
                        </label>
                      );
                    })}
                    {!people.length && (
                      <div className="px-3 py-6 text-center text-xs font-normal text-muted-foreground">
                        No roster available — you can add members after creating the team.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t pt-4">
                  <button type="button" onClick={() => setMode("view")} className="rounded-lg px-4 py-2 text-sm font-medium text-foreground/85 hover:bg-muted">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                    {saving ? "Creating…" : "Create team"}
                  </button>
                </div>
              </form>
            ) : selected ? (
              <div className="flex-1 space-y-5 overflow-auto p-5">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{selected.name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{selected.description || "No description."}</p>
                </div>

                <div className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-400/25 bg-amber-50 dark:bg-amber-400/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">
                  <TbLock size={14} className="mt-0.5 shrink-0" />
                  <span>
                    Projects scoped to this team are hidden from everyone else in the company — except the
                    superadmin (CEO) panel, which retains full visibility.
                  </span>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Members ({selected.members.length})
                  </p>
                  <div className="overflow-hidden rounded-lg border border-border">
                    {selected.members.map((member) => (
                      <div key={member.id} className="flex items-center gap-2 border-b px-3 py-2.5 text-sm last:border-b-0">
                        <span className="flex-1 truncate text-foreground">
                          {member.user?.fullName ?? "Unknown"}
                          {member.role === "owner" && (
                            <TbCrown size={13} className="ml-1.5 inline text-amber-500 dark:text-amber-400" title="Team owner" />
                          )}
                        </span>
                        <select
                          value={member.role}
                          onChange={(event) => setMemberRole(member.userId, event.target.value as "owner" | "member")}
                          className="rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="member">Member</option>
                          <option value="owner">Owner</option>
                        </select>
                        <button
                          onClick={() => removeMember(member.userId)}
                          className="rounded-md p-1 text-muted-foreground hover:bg-red-50 dark:hover:bg-red-400/10 hover:text-red-600 dark:hover:text-red-300"
                          title="Remove from team"
                        >
                          <TbX size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <label className="flex flex-col gap-1 text-sm font-medium text-foreground/85">
                  Add someone
                  <select
                    value={addingMember}
                    onChange={(event) => addMember(event.target.value)}
                    className="rounded-lg border border-border bg-card px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a person…</option>
                    {addablePeople.map((person) => (
                      <option key={person.id} value={person.id}>{person.fullName}</option>
                    ))}
                  </select>
                </label>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Select a team.</div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
