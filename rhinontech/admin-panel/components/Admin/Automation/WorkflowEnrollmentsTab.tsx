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
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm bg-white font-medium text-gray-700 outline-none focus:border-indigo-500"
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
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-2xs"
          >
            <TbBan size={16} /> Cancel all running ({enrollments.filter((e) => e.status === "active").length})
          </button>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all shadow-2xs"
          >
            <TbRefresh size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Enrollments Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/70 border-b border-gray-200 text-xs font-bold text-gray-700 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Lead</th>
                <th className="px-6 py-3.5">Source</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Current node</th>
                <th className="px-6 py-3.5">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-normal text-gray-900">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No enrolled leads found for this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{item.leadName}</div>
                      <div className="text-xs text-gray-400">{item.leadEmail}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-500">{item.source}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider ${
                          item.status === "active"
                            ? "bg-blue-100 text-blue-700"
                            : item.status === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : item.status === "failed"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-600">{item.currentNodeId}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">{item.enrolledAt}</td>
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
