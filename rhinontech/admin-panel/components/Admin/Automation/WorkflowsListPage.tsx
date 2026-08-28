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
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <TbGitBranch className="text-foreground/85" /> Workflows
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Multi-step automations that run on lead activity.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl border border-border bg-card text-foreground/70 hover:bg-muted/40 hover:text-foreground transition-all shadow-2xs"
            title="Refresh"
          >
            <TbRefresh size={18} />
          </button>

          <Link
            href={`/${roleSlug}/automation/settings`}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-foreground/85 bg-card border border-border rounded-xl hover:bg-muted/40 transition-all shadow-2xs"
          >
            <TbSettings size={18} /> Settings
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-2xs"
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
                    ? "bg-muted text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <TbSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name..."
            className="w-full rounded-xl border border-border pl-9 pr-4 py-2 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-card"
          />
        </div>
      </div>

      {/* Workflows Data Table */}
      <div className="bg-card rounded-2xl border border-border shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border text-xs font-bold text-foreground/85 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Trigger</th>
                <th className="px-6 py-4">Active</th>
                <th className="px-6 py-4">Updated</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-normal">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground text-sm">
                    No workflows found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/40 transition-colors group">
                    <td className="px-6 py-4">
                      <Link
                        href={`/${roleSlug}/automation/workflows/${item.id}`}
                        className="font-bold text-foreground hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                      >
                        {item.name}
                      </Link>
                      {item.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">{item.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-md uppercase tracking-wider ${
                          item.status === "active"
                            ? "bg-emerald-100 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300"
                            : item.status === "paused"
                            ? "bg-amber-100 dark:bg-amber-400/15 text-amber-700 dark:text-amber-300"
                            : "bg-muted text-foreground/70"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-emerald-50 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-300 rounded-md">
                        <TbBolt size={13} /> Realtime
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-foreground">{item.stats.active}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{item.updatedAt}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/${roleSlug}/automation/workflows/${item.id}`)}
                          className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                          title="Edit workflow"
                        >
                          <TbPencil size={18} />
                        </button>
                        <button
                          onClick={() => onDuplicateWorkflow(item.id)}
                          className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                          title="Duplicate workflow"
                        >
                          <TbCopy size={18} />
                        </button>
                        <button
                          onClick={() => onDeleteWorkflow(item.id)}
                          className="p-1.5 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-300 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-400/10 transition-colors"
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
          <div className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-foreground">Create New Workflow</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/85 mb-1">Workflow Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  placeholder="e.g. Lead Onboarding Sequence"
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-foreground/85 bg-muted rounded-xl hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-2xs"
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
