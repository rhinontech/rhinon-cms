"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TbPlus,
  TbRefresh,
  TbSettings,
  TbPencil,
  TbCopy,
  TbTrash,
  TbSearch,
  TbBolt,
  TbGitBranch,
} from "react-icons/tb";
import { WorkflowItem, WorkflowStatus } from "@/types/automation";

interface WorkflowsListPageProps {
  workflows: WorkflowItem[];
  roleSlug: string;
  onRefresh: () => void;
  onCreateWorkflow: (name: string) => void;
  onDeleteWorkflow: (id: string) => void;
  onDuplicateWorkflow: (id: string) => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function formatWorkflowDate(dateStr?: string): string {
  if (!dateStr) return "-";

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return dateStr;
  }

  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const formattedHours = hours.toString().padStart(2, "0");

  return `${day} ${month} ${year}, ${formattedHours}:${minutes} ${ampm}`;
}

export function WorkflowsListPage({
  workflows,
  roleSlug,
  onRefresh,
  onCreateWorkflow,
  onDeleteWorkflow,
  onDuplicateWorkflow,
}: WorkflowsListPageProps) {
  const router = useRouter();
  const [filterTab, setFilterTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState("");

  const filterTabs = ["All", "Drafts", "Active", "Paused", "Archived"];

  const filtered = workflows.filter((item) => {
    // Filter tab check
    if (filterTab === "Drafts" && item.status !== "draft") return false;
    if (filterTab === "Active" && item.status !== "active") return false;
    if (filterTab === "Paused" && item.status !== "paused") return false;
    if (filterTab === "Archived" && item.status !== "archived") return false;

    // Search check
    if (searchQuery.trim()) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    try {
      await Promise.resolve(onRefresh());
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkflowName.trim()) return;
    onCreateWorkflow(newWorkflowName.trim());
    setNewWorkflowName("");
    setIsModalOpen(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Title & Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <TbGitBranch className="text-gray-700" /> Workflows
          </h1>
          <p className="text-sm text-gray-500 mt-1">Multi-step automations that run on lead activity.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-2xs disabled:opacity-60 cursor-pointer"
            title="Refresh"
          >
            <TbRefresh size={18} className={isRefreshing ? "animate-spin text-indigo-600" : ""} />
          </button>

          <Link
            href={`/${roleSlug}/automation/settings`}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all shadow-2xs"
          >
            <TbSettings size={18} /> Settings
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-all shadow-2xs"
          >
            <TbPlus size={18} /> Create workflow
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {filterTabs.map((tab) => {
            const isActive = filterTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? "bg-gray-100 text-gray-900 shadow-2xs"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <TbSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name..."
            className="w-full rounded-xl border border-gray-300 pl-9 pr-4 py-2 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
          />
        </div>
      </div>

      {/* Workflows Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/70 border-b border-gray-200 text-xs font-bold text-gray-700 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Trigger</th>
                <th className="px-6 py-4">Active</th>
                <th className="px-6 py-4">Updated</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-normal">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No workflows found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition-colors group">
                    <td className="px-6 py-4">
                      <Link
                        href={`/${roleSlug}/automation/workflows/${item.id}`}
                        className="font-bold text-gray-900 hover:text-indigo-600 transition-colors"
                      >
                        {item.name}
                      </Link>
                      {item.description && (
                        <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{item.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-md uppercase tracking-wider ${
                          item.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : item.status === "paused"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-600 rounded-md">
                        <TbBolt size={13} /> Realtime
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-gray-900">{item.stats.active}</td>
                    <td className="px-6 py-4 text-xs text-gray-600 font-medium font-sans">
                      {formatWorkflowDate(item.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/${roleSlug}/automation/workflows/${item.id}`)}
                          className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Edit workflow"
                        >
                          <TbPencil size={18} />
                        </button>
                        <button
                          onClick={() => onDuplicateWorkflow(item.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Duplicate workflow"
                        >
                          <TbCopy size={18} />
                        </button>
                        <button
                          onClick={() => onDeleteWorkflow(item.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete workflow"
                        >
                          <TbTrash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Workflow Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-900">Create New Workflow</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Workflow Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  placeholder="e.g. Lead Onboarding Sequence"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors shadow-2xs"
                >
                  Create Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
