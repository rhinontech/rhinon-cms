"use client";

import React, { useState } from "react";
import { TbRefresh, TbBan } from "react-icons/tb";
import { WorkflowEnrollment } from "@/types/automation";
import { SequenceStats } from "./SequenceStats";

interface WorkflowEnrollmentsTabProps {
  enrollments: WorkflowEnrollment[];
  onRefresh: () => void;
  onCancelAll: () => void;
  workflowId?: string;
}

export function WorkflowEnrollmentsTab({
  enrollments,
  onRefresh,
  onCancelAll,
  workflowId,
}: WorkflowEnrollmentsTabProps) {
  const [filter, setFilter] = useState<string>("All");

  const filtered = enrollments.filter((e) => {
    if (filter === "All") return true;
    return e.status === filter.toLowerCase();
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {workflowId && <SequenceStats workflowId={workflowId} />}

      {/* Top Filter and Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-border px-4 py-2 text-sm bg-card font-medium text-foreground/85 outline-none focus:border-indigo-500"
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Failed">Failed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancelAll}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-foreground/85 bg-card border border-border rounded-xl hover:bg-rose-50 dark:hover:bg-rose-400/10 hover:text-rose-600 dark:hover:text-rose-300 hover:border-rose-200 dark:hover:border-rose-400/25 transition-all shadow-2xs"
          >
            <TbBan size={16} /> Cancel all running ({enrollments.filter((e) => e.status === "active").length})
          </button>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-foreground/85 bg-card border border-border rounded-xl hover:bg-muted/40 transition-all shadow-2xs"
          >
            <TbRefresh size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Enrollments Data Table */}
      <div className="bg-card rounded-2xl border border-border shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border text-xs font-bold text-foreground/85 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Lead</th>
                <th className="px-6 py-3.5">Source</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Current node</th>
                <th className="px-6 py-3.5">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-normal text-foreground">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-sm">
                    No enrolled leads found for this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{item.leadName}</div>
                      <div className="text-xs text-muted-foreground">{item.leadEmail}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-muted-foreground">{item.source}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider ${
                          item.status === "active"
                            ? "bg-blue-100 dark:bg-blue-400/15 text-blue-700 dark:text-blue-300"
                            : item.status === "completed"
                            ? "bg-emerald-100 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300"
                            : item.status === "failed"
                            ? "bg-rose-100 dark:bg-rose-400/15 text-rose-700 dark:text-rose-300"
                            : "bg-muted text-foreground/70"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-foreground/70">{item.currentNodeId}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{item.enrolledAt}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
