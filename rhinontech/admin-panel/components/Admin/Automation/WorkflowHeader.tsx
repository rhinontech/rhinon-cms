"use client";

import React from "react";
import Link from "next/link";
import { TbArrowLeft, TbPlayerPause, TbPlayerPlay, TbCopy, TbArchive, TbExclamationMark, TbRocket } from "react-icons/tb";
import { WorkflowItem } from "@/types/automation";

interface WorkflowHeaderProps {
  workflow: WorkflowItem;
  activeTab: "Editor" | "Trigger" | "Settings" | "Enrollments";
  setActiveTab: (tab: "Editor" | "Trigger" | "Settings" | "Enrollments") => void;
  onStatusChange: (newStatus: "draft" | "active" | "paused" | "archived") => void;
  onEnrollTest: () => void;
  onRunWorkflow?: () => void;
  roleSlug: string;
}

export function WorkflowHeader({
  workflow,
  activeTab,
  setActiveTab,
  onStatusChange,
  onEnrollTest,
  onRunWorkflow,
  roleSlug,
}: WorkflowHeaderProps) {
  const tabs = [
    { name: "Editor", count: null },
    { name: "Trigger", count: null },
    { name: "Settings", count: null },
    { name: "Enrollments", count: workflow.stats?.active || 0 },
  ] as const;

  return (
    <div className="bg-card border-b border-border px-6 pt-5 pb-0 shadow-2xs">
      {/* Top Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        {/* Left Title & Status */}
        <div className="flex items-center gap-3">
          <Link
            href={`/${roleSlug}/automation/workflows`}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground/85 hover:bg-muted transition-colors"
          >
            <TbArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground tracking-tight">{workflow.name}</h1>
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded-md uppercase tracking-wider ${
                workflow.status === "active"
                  ? "bg-emerald-100 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300"
                  : workflow.status === "paused"
                  ? "bg-amber-100 dark:bg-amber-400/15 text-amber-700 dark:text-amber-300"
                  : "bg-muted text-foreground/70"
              }`}
            >
              {workflow.status}
            </span>
            <span className="text-xs text-muted-foreground font-mono">v{workflow.version}</span>
          </div>
        </div>

        {/* Right Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {workflow.triggerType === "static_list" && onRunWorkflow && (
            <button
              onClick={onRunWorkflow}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-2xs transition-all"
            >
              <TbRocket size={15} />
              Run workflow
            </button>
          )}

          <button
            onClick={onEnrollTest}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-foreground/85 bg-card border border-border rounded-lg hover:bg-muted/40 shadow-2xs transition-all"
          >
            <TbExclamationMark size={14} className="text-amber-500 dark:text-amber-400 font-bold" />
            Enroll one (test)
          </button>

          {workflow.status === "active" ? (
            <button
              onClick={() => onStatusChange("paused")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-foreground/85 bg-card border border-border rounded-lg hover:bg-muted/40 shadow-2xs transition-all"
            >
              <TbPlayerPause size={14} />
              Pause
            </button>
          ) : (
            <button
              onClick={() => onStatusChange("active")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 shadow-2xs transition-all"
            >
              <TbPlayerPlay size={14} />
              Publish
            </button>
          )}

          <button
            onClick={() => onStatusChange("archived")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-foreground/85 bg-card border border-border rounded-lg hover:bg-muted/40 shadow-2xs transition-all"
          >
            <TbArchive size={14} />
            Archive
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground mb-4 pl-11">
        <div>
          <span className="font-bold text-foreground mr-1">{workflow.stats?.active || 0}</span> active
        </div>
        <div>
          <span className="font-bold text-emerald-600 dark:text-emerald-300 mr-1">{workflow.stats?.completed || 0}</span> completed
        </div>
        <div>
          <span className="font-bold text-rose-600 dark:text-rose-300 mr-1">{workflow.stats?.failed || 0}</span> failed
        </div>
        <div>
          <span className="font-bold text-muted-foreground mr-1">{workflow.stats?.cancelled || 0}</span> cancelled
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-t border-border pt-1">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === tab.name
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground/85 hover:border-border"
            }`}
          >
            {tab.name}
            {tab.count !== null && tab.count > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-muted text-foreground/70">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
