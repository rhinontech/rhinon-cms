"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_URL } from "@/lib/api";
import { TbBug, TbExchange, TbLoader2 } from "react-icons/tb";

interface PublicProject {
  id: string;
  name: string;
  status: string;
}

interface PublicRequest {
  id: string;
  title: string;
  description: string;
  type: "Bug" | "Change request";
  status: "Open" | "In review" | "In progress" | "Done";
  priority: "Low" | "Medium" | "High";
  reportedBy?: string;
  createdAt: string;
  updatedAt: string;
}

const statusStyles: Record<PublicRequest["status"], string> = {
  Open: "border-blue-100 bg-blue-50 text-blue-700",
  "In review": "border-violet-100 bg-violet-50 text-violet-700",
  "In progress": "border-amber-100 bg-amber-50 text-amber-700",
  Done: "border-green-100 bg-green-50 text-green-700",
};

const priorityStyles: Record<PublicRequest["priority"], string> = {
  Low: "border-gray-100 bg-gray-50 text-gray-600",
  Medium: "border-amber-100 bg-amber-50 text-amber-700",
  High: "border-red-100 bg-red-50 text-red-700",
};

export default function PublicProjectPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState<PublicProject | null>(null);
  const [requests, setRequests] = useState<PublicRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"All" | "Bug" | "Change request">("All");

  useEffect(() => {
    async function fetchData() {
      try {
        // We use a regular fetch instead of apiFetch because we don't need or want auth headers
        // And we don't want to rely on the token logic for a public page.
        const res = await fetch(`${API_URL}/public/projects/${projectId}/requests`);
        if (!res.ok) throw new Error("Failed to load project details");
        const data = await res.json();
        setProject(data.project);
        setRequests(data.requests);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    if (projectId) fetchData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <TbLoader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 p-6">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">Project Not Found</h1>
          <p className="mt-2 text-sm text-gray-500">
            The project you are looking for does not exist or you do not have the correct link.
          </p>
        </div>
      </div>
    );
  }

  const visibleRequests = requests.filter((r) => filter === "All" || r.type === filter);

  const bugsCount = requests.filter(r => r.type === "Bug" && r.status !== "Done").length;
  const changesCount = requests.filter(r => r.type === "Change request" && r.status !== "Done").length;

  return (
    <div className="min-h-screen bg-stone-50 text-gray-900">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-6 py-8 md:py-12">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold tracking-wide text-blue-800">
                  Public Portal
                </span>
                <span className="text-sm font-medium text-gray-500">Status: {project.status}</span>
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{project.name}</h1>
              <p className="mt-2 text-gray-500">Track open issues and requested changes for this project.</p>
            </div>
            
            <div className="flex gap-4">
              <div className="rounded-xl border border-gray-100 bg-stone-50 p-4 min-w-[120px]">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <TbBug className="text-red-500" />
                  Open Bugs
                </div>
                <p className="mt-1 text-2xl font-bold text-gray-900">{bugsCount}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-stone-50 p-4 min-w-[120px]">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <TbExchange className="text-blue-500" />
                  Open Changes
                </div>
                <p className="mt-1 text-2xl font-bold text-gray-900">{changesCount}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center gap-2 border-b border-gray-200 pb-4">
          <button
            onClick={() => setFilter("All")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filter === "All" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}
          >
            All Items
          </button>
          <button
            onClick={() => setFilter("Bug")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filter === "Bug" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}
          >
            Bugs
          </button>
          <button
            onClick={() => setFilter("Change request")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filter === "Change request" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}
          >
            Changes
          </button>
        </div>

        {visibleRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">No items found</h3>
            <p className="mt-1 text-gray-500">There are currently no active {filter !== "All" ? filter.toLowerCase() + "s" : "items"} for this project.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleRequests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${request.type === 'Bug' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                        {request.type === 'Bug' ? <TbBug size={14} /> : <TbExchange size={14} />}
                        {request.type}
                      </span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyles[request.status]}`}>
                        {request.status}
                      </span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${priorityStyles[request.priority]}`}>
                        {request.priority} Priority
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-gray-900">{request.title}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{request.description}</p>
                  </div>
                  <div className="flex flex-col gap-2 text-right text-xs text-gray-500 sm:min-w-[140px]">
                    {request.reportedBy && (
                      <p>Reported by: <span className="font-medium text-gray-900">{request.reportedBy}</span></p>
                    )}
                    <p>Updated: {new Date(request.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
