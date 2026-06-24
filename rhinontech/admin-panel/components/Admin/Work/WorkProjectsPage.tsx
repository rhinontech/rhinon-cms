"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { TbLayoutSidebarFilled, TbLayoutSidebarRightFilled, TbPlus, TbSearch, TbExternalLink } from "react-icons/tb";

type ProjectStatus = "Active" | "Paused" | "Completed" | "Pipeline";
type PanelMode = "view" | "create" | "edit";

interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  pointOfContact: string | null;
  notes: string | null;
  taskCount: number;
  requestCount: number;
}

interface EmployeeOption {
  id: string;
  fullName: string;
  companyEmail: string;
}

const emptyForm = {
  name: "",
  status: "Active" as ProjectStatus,
  pointOfContact: "",
  notes: "",
};

export function WorkProjectsPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "All">("All");
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(true);
  const [mode, setMode] = useState<PanelMode>("view");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchProjects = async () => {
    try {
      const data = await apiFetch<Project[]>("/work/projects");
      setProjects(data);
      setSelectedProject((current) => {
        if (!data.length) return null;
        if (current) return data.find((project) => project.id === current.id) ?? data[0];
        return data[0];
      });
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    fetchProjects();
    apiFetch<EmployeeOption[]>("/people")
      .then((data) => setEmployees(data.map((employee) => ({
        id: employee.id,
        fullName: employee.fullName,
        companyEmail: employee.companyEmail,
      }))))
      .catch(() => { });
  }, []);

  const visibleProjects = useMemo(() => {
    const query = search.toLowerCase();
    return projects.filter((project) => {
      const matchesStatus = statusFilter === "All" || project.status === statusFilter;
      const matchesSearch =
        project.name.toLowerCase().includes(query) ||
        (project.pointOfContact ?? "").toLowerCase().includes(query) ||
        (project.notes ?? "").toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [projects, search, statusFilter]);

  const startCreate = () => {
    setForm(emptyForm);
    setMode("create");
    setIsPreviewExpanded(true);
  };

  const startEdit = () => {
    if (!selectedProject) return;
    setForm({
      name: selectedProject.name,
      status: selectedProject.status,
      pointOfContact: selectedProject.pointOfContact ?? "",
      notes: selectedProject.notes ?? "",
    });
    setMode("edit");
    setIsPreviewExpanded(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (mode === "create") {
        await apiFetch("/work/projects", {
          method: "POST",
          body: JSON.stringify(form),
        });
      } else if (mode === "edit" && selectedProject) {
        await apiFetch(`/work/projects/${selectedProject.id}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
      }
      await fetchProjects();
      setMode("view");
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <main className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden bg-stone-50", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            <SubNavToggle />
            <div>
              <h1 className="text-base font-semibold tracking-tight text-gray-900">Clients / Projects</h1>
              <p className="text-xs text-gray-500">Single master list for all running and historical projects.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={startCreate} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-stone-100">
              Add project
              <TbPlus size={14} />
            </button>
            {(!isPreviewExpanded || (visibleProjects.length === 0 && mode !== "create")) && (
              <button onClick={() => setIsPreviewExpanded(true)} className="rounded-lg p-2 text-gray-600 hover:bg-stone-100">
                <TbLayoutSidebarFilled size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-[460px]">
              <TbSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, point of contact, or notes"
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ProjectStatus | "All")}
              className="w-[180px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>All</option>
              <option>Active</option>
              <option>Paused</option>
              <option>Completed</option>
              <option>Pipeline</option>
            </select>
          </div>

          <div className="mt-8 overflow-hidden rounded-xl border border-gray-100 bg-white">
            <div className="grid grid-cols-[1.7fr_0.9fr_1fr_0.7fr_0.8fr] border-b bg-stone-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <span>Name</span>
              <span>Status</span>
              <span>Point of contact</span>
              <span>Tasks</span>
              <span>Changes</span>
            </div>
            {visibleProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  setSelectedProject(project);
                  setMode("view");
                  setIsPreviewExpanded(true);
                }}
                className={cn(
                  "grid w-full grid-cols-[1.7fr_0.9fr_1fr_0.7fr_0.8fr] items-center border-b px-4 py-3 text-left text-sm hover:bg-stone-50",
                  selectedProject?.id === project.id && "bg-blue-50 hover:bg-blue-50"
                )}
              >
                <span className="font-medium text-gray-900">{project.name}</span>
                <span className="text-gray-600">{project.status}</span>
                <span className="truncate text-gray-600">{project.pointOfContact || "—"}</span>
                <span className="text-gray-600">{project.taskCount}</span>
                <span className="text-gray-600">{project.requestCount}</span>
              </button>
            ))}
            {!visibleProjects.length && (
              <div className="px-4 py-10 text-center text-sm text-gray-400">No projects found.</div>
            )}
          </div>
        </div>
      </main>

      <aside className={`flex min-h-0 h-full flex-col bg-white rounded-xl overflow-hidden transition-all duration-200 ease-in-out ${isPreviewExpanded && (visibleProjects.length > 0 || mode === "create") ? "w-[42%] ml-2" : "w-0"}`}>
        {isPreviewExpanded && (visibleProjects.length > 0 || mode === "create") && (
          <div className="flex h-full flex-1 flex-col overflow-hidden">
            <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-5">
              <p className="-mb-px flex self-stretch items-center border-b-2 border-blue-600 text-md font-medium tracking-tight text-black">
                {mode === "create" ? "Add project" : mode === "edit" ? "Edit project" : "Project Details"}
              </p>
              <div className="flex items-center gap-2">
                {mode === "view" && selectedProject && (
                  <button onClick={startEdit} className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100">
                    Edit
                  </button>
                )}
                <button onClick={() => setIsPreviewExpanded(false)} className="text-gray-600 hover:text-gray-900">
                  <TbLayoutSidebarRightFilled size={20} />
                </button>
              </div>
            </div>

            {mode === "view" ? (
              <div className="flex-1 overflow-auto p-5">
                {selectedProject ? (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedProject.name}</h2>
                      <p className="mt-2 text-sm text-gray-500">{selectedProject.notes || "No notes added yet."}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <Detail label="Status" value={selectedProject.status} />
                      <Detail label="Point of contact" value={selectedProject.pointOfContact || "—"} />
                      <Detail label="Total tasks" value={String(selectedProject.taskCount)} />
                      <Detail label="Changes / bugs" value={String(selectedProject.requestCount)} />
                    </div>
                    <a
                      href={`/p/${selectedProject.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                    >
                      <TbExternalLink size={16} />
                      Open Public Portal
                    </a>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">Select a project.</div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-auto p-5">
                <FormInput label="Name" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  Status
                  <select
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ProjectStatus }))}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Active</option>
                    <option>Paused</option>
                    <option>Completed</option>
                    <option>Pipeline</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  Point of contact
                  <select
                    value={form.pointOfContact}
                    onChange={(event) => setForm((current) => ({ ...current, pointOfContact: event.target.value }))}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select employee</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.fullName}>
                        {employee.fullName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  Notes
                  <textarea
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    className="min-h-32 rounded-lg border border-gray-200 px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <div className="flex items-center justify-end gap-3 border-t pt-4">
                  <button type="button" onClick={() => setMode("view")} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60">
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 font-medium text-gray-800">{value}</p>
    </div>
  );
}

function FormInput({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="rounded-lg border border-gray-200 px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  );
}
