"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { TbLayoutSidebarFilled, TbLayoutSidebarRightFilled, TbPlus, TbCheck, TbExternalLink, TbCheckbox, TbAlertTriangle } from "react-icons/tb";

type RequestType = "Bug" | "Change request";
type RequestStatus = "Open" | "In review" | "In progress" | "Done";
type RequestPriority = "Low" | "Medium" | "High";
type PanelMode = "view" | "create" | "edit";

interface ProjectOption {
  id: string;
  name: string;
}

interface EmployeeOption {
  id: string;
  fullName: string;
  companyEmail: string;
}

interface WorkRequest {
  id: string;
  title: string;
  description: string;
  type: RequestType;
  status: RequestStatus;
  priority: RequestPriority;
  reportedBy: string | null;
  projectId: string;
  convertedTaskId: string | null;
  createdAt?: string;
  project: {
    id: string;
    name: string;
    status: string;
  } | null;
}

const emptyForm = {
  title: "",
  description: "",
  type: "Bug" as RequestType,
  status: "Open" as RequestStatus,
  priority: "Medium" as RequestPriority,
  projectId: "",
  reportedBy: "",
};

const statusOptions: RequestStatus[] = ["Open", "In review", "In progress", "Done"];
const priorityOptions: RequestPriority[] = ["Low", "Medium", "High"];

const statusStyles: Record<RequestStatus, string> = {
  Open: "border-blue-100 bg-blue-50 text-blue-700",
  "In review": "border-violet-100 bg-violet-50 text-violet-700",
  "In progress": "border-amber-100 bg-amber-50 text-amber-700",
  Done: "border-green-100 bg-green-50 text-green-700",
};

const priorityStyles: Record<RequestPriority, string> = {
  Low: "border-gray-100 bg-gray-50 text-gray-600",
  Medium: "border-amber-100 bg-amber-50 text-amber-700",
  High: "border-red-100 bg-red-50 text-red-700",
};

const SLA_THRESHOLDS: Record<RequestPriority, number> = { High: 1, Medium: 3, Low: 7 };

function daysOpen(createdAt?: string): number {
  if (!createdAt) return 0;
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000);
}

function ls<T>(key: string, fallback: T): T {
  try { if (typeof window === "undefined") return fallback; const v = localStorage.getItem(key); return v !== null ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}

export function WorkChangesPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const pathname = usePathname();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [requests, setRequests] = useState<WorkRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<WorkRequest | null>(null);
  const [projectFilter, setProjectFilter] = useState<string>(() => ls("changes_projectFilter", "all"));
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "All">(() => ls("changes_statusFilter", "All" as RequestStatus | "All"));
  const [typeFilter, setTypeFilter] = useState<RequestType | "All">(() => ls("changes_typeFilter", "All" as RequestType | "All"));
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(true);
  const [mode, setMode] = useState<PanelMode>("view");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [converting, setConverting] = useState(false);

  useEffect(() => { try { localStorage.setItem("changes_projectFilter", JSON.stringify(projectFilter)); } catch {} }, [projectFilter]);
  useEffect(() => { try { localStorage.setItem("changes_statusFilter", JSON.stringify(statusFilter)); } catch {} }, [statusFilter]);
  useEffect(() => { try { localStorage.setItem("changes_typeFilter", JSON.stringify(typeFilter)); } catch {} }, [typeFilter]);

  const fetchData = async () => {
    try {
      const [projectsData, requestsData, employeesData] = await Promise.all([
        apiFetch<ProjectOption[]>("/work/projects"),
        apiFetch<WorkRequest[]>("/work/requests"),
        apiFetch<EmployeeOption[]>("/people"),
      ]);
      setProjects(projectsData);
      setEmployees(employeesData.map((employee) => ({
        id: employee.id,
        fullName: employee.fullName,
        companyEmail: employee.companyEmail,
      })));
      setRequests(requestsData.map((item) => ({ ...item, projectId: item.project?.id ?? "", convertedTaskId: item.convertedTaskId ?? null })));
      setSelectedRequest((current) => {
        if (!requestsData.length) return null;
        if (current) return requestsData.find((item) => item.id === current.id) ?? requestsData[0];
        return requestsData[0];
      });
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    fetchData();
  }, [pathname]);

  const PRIORITY_ORDER: Record<RequestPriority, number> = { High: 0, Medium: 1, Low: 2 };
  const visibleRequests = useMemo(() => (
    requests
      .filter((request) => {
        const matchesProject = projectFilter === "all" || request.project?.id === projectFilter;
        const matchesStatus = statusFilter === "All" || request.status === statusFilter;
        const matchesType = typeFilter === "All" || request.type === typeFilter;
        return matchesProject && matchesStatus && matchesType;
      })
      .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
  ), [projectFilter, requests, statusFilter, typeFilter]);

  const startCreate = () => {
    setForm({ ...emptyForm, projectId: projectFilter === "all" ? "" : projectFilter });
    setMode("create");
    setIsPreviewExpanded(true);
  };

  const startEdit = () => {
    if (!selectedRequest) return;
    setForm({
      title: selectedRequest.title,
      description: selectedRequest.description,
      type: selectedRequest.type,
      status: selectedRequest.status,
      priority: selectedRequest.priority,
      projectId: selectedRequest.project?.id ?? "",
      reportedBy: selectedRequest.reportedBy ?? "",
    });
    setMode("edit");
    setIsPreviewExpanded(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        projectId: form.projectId || undefined,
        reportedBy: form.reportedBy || undefined,
      };
      if (mode === "create") {
        await apiFetch("/work/requests", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else if (mode === "edit" && selectedRequest) {
        await apiFetch(`/work/requests/${selectedRequest.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }
      await fetchData();
      setMode("view");
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const updateRequestField = async <K extends "status" | "priority">(
    request: WorkRequest,
    field: K,
    value: WorkRequest[K]
  ) => {
    const previousRequests = requests;
    const previousSelected = selectedRequest;
    const updated = { ...request, [field]: value };
    setRequests((current) => current.map((item) => (item.id === request.id ? updated : item)));
    setSelectedRequest((current) => (current?.id === request.id ? updated : current));

    try {
      await apiFetch(`/work/requests/${request.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: request.title,
          description: request.description,
          type: request.type,
          status: field === "status" ? value : request.status,
          priority: field === "priority" ? value : request.priority,
          projectId: request.project?.id || undefined,
          reportedBy: request.reportedBy || undefined,
        }),
      });
      await fetchData();
    } catch {
      setRequests(previousRequests);
      setSelectedRequest(previousSelected);
    }
  };

  const convertToTasks = async (requestIds: string[]) => {
    setConverting(true);
    try {
      await apiFetch("/work/requests/convert-to-tasks", {
        method: "POST",
        body: JSON.stringify({ requestIds }),
      });
      setSelectedIds(new Set());
      setMode("view");
      await fetchData();
    } catch {
      // silently fail
    } finally {
      setConverting(false);
    }
  };

  const handleConvertSelected = () => {
    if (selectedIds.size > 0) {
      convertToTasks(Array.from(selectedIds));
    }
  };

  const handleConvertSingle = () => {
    if (selectedRequest) {
      convertToTasks([selectedRequest.id]);
    }
  };

  const toggleSelectRequest = (requestId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(requestId)) {
      newSelected.delete(requestId);
    } else {
      newSelected.add(requestId);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === visibleRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleRequests.map((r) => r.id)));
    }
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <main className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden bg-stone-50", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            <SubNavToggle />
            <div>
              <h1 className="text-base font-semibold tracking-tight text-gray-900">Changes & Bugs</h1>
              <p className="text-xs text-gray-500">Project-wise grid for client-reported issues and requested changes.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={startCreate} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-stone-100">
              Add item
              <TbPlus size={14} />
            </button>
            {(!isPreviewExpanded || (visibleRequests.length === 0 && mode !== "create")) && (
              <button onClick={() => setIsPreviewExpanded(true)} className="rounded-lg p-2 text-gray-600 hover:bg-stone-100">
                <TbLayoutSidebarFilled size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <select
                value={projectFilter}
                onChange={(event) => setProjectFilter(event.target.value)}
                className="w-[220px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {projectFilter !== "all" && (
                <a
                  href={`/p/${projectFilter}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  title="View Public Portal"
                >
                  <TbExternalLink size={16} />
                  <span>Public View</span>
                </a>
              )}
            </div>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as RequestType | "All")}
              className="w-[180px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>All</option>
              <option>Bug</option>
              <option>Change request</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as RequestStatus | "All")}
              className="w-[180px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>All</option>
              <option>Open</option>
              <option>In review</option>
              <option>In progress</option>
              <option>Done</option>
            </select>
          </div>

          {selectedIds.size > 0 && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <span className="text-sm font-medium text-blue-900">{selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected</span>
              <button
                onClick={handleConvertSelected}
                disabled={converting}
                className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-800 disabled:opacity-60"
              >
                <TbCheck size={14} />
                {converting ? "Creating..." : "Create Tasks"}
              </button>
            </div>
          )}

          <div className="mt-8 overflow-auto rounded-xl border border-gray-100 bg-white">
            <div className="grid min-w-[1160px] w-full grid-cols-[40px_minmax(300px,1.55fr)_minmax(190px,0.95fr)_minmax(150px,0.75fr)_minmax(130px,0.65fr)_minmax(130px,0.65fr)_minmax(210px,1fr)] border-b bg-stone-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <span className="flex items-center justify-center px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.size === visibleRequests.length && visibleRequests.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300"
                  aria-label="Select all"
                />
              </span>
              <span className="px-4 py-3">Title</span>
              <span className="px-4 py-3">Project</span>
              <span className="px-4 py-3">Type</span>
              <span className="px-4 py-3">Status</span>
              <span className="px-4 py-3">Priority</span>
              <span className="px-4 py-3">Reported by</span>
            </div>
            {visibleRequests.map((request) => (
              <div
                key={request.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedRequest(request);
                  setMode("view");
                  setIsPreviewExpanded(true);
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  setSelectedRequest(request);
                  setMode("view");
                  setIsPreviewExpanded(true);
                }}
                className={cn(
                  "grid min-w-[1160px] w-full cursor-pointer grid-cols-[40px_minmax(300px,1.55fr)_minmax(190px,0.95fr)_minmax(150px,0.75fr)_minmax(130px,0.65fr)_minmax(130px,0.65fr)_minmax(210px,1fr)] items-stretch border-b text-left text-sm hover:bg-stone-50",
                  request.convertedTaskId && "bg-emerald-50/60 hover:bg-emerald-50",
                  selectedRequest?.id === request.id && "bg-blue-50 hover:bg-blue-50"
                )}
              >
                <span
                  className="flex items-center justify-center px-4 py-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelectRequest(request.id);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(request.id)}
                    onChange={() => toggleSelectRequest(request.id)}
                    className="rounded border-gray-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                </span>
                <span className="flex min-w-0 flex-col justify-center gap-1 px-4 py-3">
                  <span className="whitespace-normal break-words font-medium leading-6 text-gray-900">{request.title}</span>
                  <span className="flex flex-wrap gap-1">
                    {request.convertedTaskId && (
                      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <TbCheckbox size={10} />
                        Task created
                      </span>
                    )}
                    {request.status !== "Done" && (() => {
                      const days = daysOpen(request.createdAt);
                      const threshold = SLA_THRESHOLDS[request.priority];
                      if (days >= threshold) return (
                        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                          <TbAlertTriangle size={10} />
                          {days}d open
                        </span>
                      );
                      return null;
                    })()}
                  </span>
                </span>
                <span className="min-w-0 truncate px-4 py-3 text-gray-600">{request.project?.name || "—"}</span>
                <span className="min-w-0 px-4 py-3 text-gray-600">{request.type}</span>
                <span className="flex min-w-0 items-center px-4 py-3">
                  <InlineBadgeSelect
                    value={request.status}
                    options={statusOptions}
                    className={statusStyles[request.status]}
                    onChange={(value) => updateRequestField(request, "status", value as RequestStatus)}
                  />
                </span>
                <span className="flex min-w-0 items-center px-4 py-3">
                  <InlineBadgeSelect
                    value={request.priority}
                    options={priorityOptions}
                    className={priorityStyles[request.priority]}
                    onChange={(value) => updateRequestField(request, "priority", value as RequestPriority)}
                  />
                </span>
                <span className="min-w-0 truncate px-4 py-3 text-gray-600">{request.reportedBy || "—"}</span>
              </div>
            ))}
            {!visibleRequests.length && (
              <div className="px-4 py-10 text-center text-sm text-gray-400">No change or bug items found.</div>
            )}
          </div>
        </div>
      </main>

      <aside className={`flex min-h-0 h-full flex-col bg-white rounded-xl overflow-hidden transition-all duration-200 ease-in-out ${isPreviewExpanded && (visibleRequests.length > 0 || mode === "create") ? "w-[42%] ml-2" : "w-0"}`}>
        {isPreviewExpanded && (visibleRequests.length > 0 || mode === "create") && (
          <div className="flex h-full flex-1 flex-col overflow-hidden">
            <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-5">
              <p className="-mb-px flex self-stretch items-center border-b-2 border-blue-600 text-md font-medium tracking-tight text-black">
                {mode === "create" ? "Add item" : mode === "edit" ? "Edit item" : "Details"}
              </p>
              <div className="flex items-center gap-2">
                {mode === "view" && selectedRequest && (
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
                {selectedRequest ? (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedRequest.title}</h2>
                      <p className="mt-2 text-sm text-gray-500">{selectedRequest.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <Detail label="Project" value={selectedRequest.project?.name || "—"} />
                      <Detail label="Reported by" value={selectedRequest.reportedBy || "—"} />
                      <Detail label="Type" value={selectedRequest.type} />
                      <Detail label="Status" value={selectedRequest.status} />
                      <Detail label="Priority" value={selectedRequest.priority} />
                      <Detail label="Project status" value={selectedRequest.project?.status || "—"} />
                    </div>
                    <button
                      onClick={handleConvertSingle}
                      disabled={converting}
                      className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {converting ? "Creating..." : "Create Task"}
                    </button>
                    {selectedRequest.convertedTaskId && (
                      <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                        <TbCheckbox size={16} />
                        Converted to task
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">Select an item.</div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-auto p-5">
                <FormInput label="Title" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} required />
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  Description
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    className="min-h-32 rounded-lg border border-gray-200 px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Project
                    <select
                      value={form.projectId}
                      onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value }))}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Not linked</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Reported by
                    <select
                      value={form.reportedBy}
                      onChange={(event) => setForm((current) => ({ ...current, reportedBy: event.target.value }))}
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
                  <SelectField label="Type" value={form.type} onChange={(value) => setForm((current) => ({ ...current, type: value as RequestType }))} options={["Bug", "Change request"]} />
                  <SelectField label="Status" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value as RequestStatus }))} options={["Open", "In review", "In progress", "Done"]} />
                  <SelectField label="Priority" value={form.priority} onChange={(value) => setForm((current) => ({ ...current, priority: value as RequestPriority }))} options={["Low", "Medium", "High"]} />
                </div>
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

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function InlineBadgeSelect({
  value,
  options,
  className,
  onChange,
}: {
  value: string;
  options: string[];
  className: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => {
        event.stopPropagation();
        onChange(event.target.value);
      }}
      className={cn(
        "h-7 w-[108px] cursor-pointer appearance-none rounded-full border px-3 text-xs font-semibold outline-none transition-colors focus:ring-2 focus:ring-blue-500",
        className
      )}
      aria-label={`Change ${value}`}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
