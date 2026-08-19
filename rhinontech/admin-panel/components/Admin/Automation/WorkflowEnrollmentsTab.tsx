"use client";

import React, { useState } from "react";
import { TbRefresh, TbBan, TbSearch } from "react-icons/tb";
import { WorkflowEnrollment, WorkflowNode } from "@/types/automation";

interface WorkflowEnrollmentsTabProps {
  enrollments: WorkflowEnrollment[];
  nodes?: WorkflowNode[];
  onRefresh: () => void;
  onCancelAll: () => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function formatEnrolledDate(dateStr?: string): string {
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

function getNodeDisplayName(currentNodeId?: string, nodes?: WorkflowNode[], status?: string): string {
  if (!currentNodeId) return "-";

  // Completed enrollments have finished and exited the workflow
  if (status === "completed") {
    return "Exit";
  }

  if (nodes && nodes.length > 0) {
    const foundNode = nodes.find((n) => n.id === currentNodeId);
    if (foundNode && foundNode.data?.label) {
      const label = foundNode.data.label;
      if (label !== "Trigger not set") {
        return label;
      }
    }
  }

  const lower = currentNodeId.toLowerCase();
  if (lower.includes("trigger")) return "Trigger";
  if (lower.includes("email") || lower.includes("mail")) return "Send email";
  if (lower.includes("wait") || lower.includes("delay")) return "Wait";
  if (lower.includes("if") || lower.includes("then") || lower.includes("condition")) return "If / Then";
  if (lower.includes("exit") || lower.includes("end")) return "Exit";

  const cleaned = currentNodeId
    .replace(/^node[-_]?/i, "")
    .replace(/[-_]?\d+$/g, "")
    .replace(/[-_]/g, " ");

  if (cleaned.trim()) {
    return cleaned
      .trim()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  return currentNodeId;
}

export function WorkflowEnrollmentsTab({
  enrollments,
  nodes,
  onRefresh,
  onCancelAll,
}: WorkflowEnrollmentsTabProps) {
  const [filter, setFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
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

  const filtered = enrollments.filter((e) => {
    // Filter status
    if (filter !== "All" && e.status !== filter.toLowerCase()) {
      return false;
    }
    // Search by lead name, lead email, or workflow name
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const name = (e.leadName || "").toLowerCase();
      const email = (e.leadEmail || "").toLowerCase();
      const wfName = (e.workflowName || e.source || "").toLowerCase();
      if (!name.includes(q) && !email.includes(q) && !wfName.includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Filter and Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm bg-white font-medium text-gray-700 outline-none focus:border-indigo-500 shadow-2xs"
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Failed">Failed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Search by Lead Name / Email */}
          <div className="relative w-full sm:w-64">
            <TbSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by lead name or email..."
              className="w-full rounded-xl border border-gray-300 pl-9 pr-4 py-2 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white font-medium text-gray-700 shadow-2xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* <button
            onClick={onCancelAll}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-2xs"
          >
            <TbBan size={16} /> Cancel all running ({enrollments.filter((e) => e.status === "active").length})
          </button> */}
          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all shadow-2xs disabled:opacity-60 cursor-pointer"
          >
            <TbRefresh size={16} className={isRefreshing ? "animate-spin text-indigo-600" : ""} /> Refresh
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
                <th className="px-6 py-3.5">Workflow</th>
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
                    <td className="px-6 py-4 text-xs font-semibold text-gray-800 font-sans">
                      {item.workflowName || item.source}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider ${item.status === "active"
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
                    <td className="px-6 py-4 text-xs font-medium text-gray-700">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100/80 border border-gray-200/60 font-medium text-gray-800">
                        {getNodeDisplayName(item.currentNodeId, nodes, item.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 font-medium font-sans">
                      {formatEnrolledDate(item.enrolledAt)}
                    </td>
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

