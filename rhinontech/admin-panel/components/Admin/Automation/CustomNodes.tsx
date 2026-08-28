"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { TbBolt, TbMail, TbClock, TbGitFork, TbLogout, TbTrash, TbPhone, TbBrandLinkedin, TbArrowsSplit2 } from "react-icons/tb";
import { WorkflowNodeData } from "@/types/automation";

interface CustomNodeProps {
  id: string;
  data: WorkflowNodeData;
  selected?: boolean;
}

export function TriggerNode({ data, selected }: CustomNodeProps) {
  const isNotSet = data.status === "NOT SET";

  return (
    <div
      className={`relative min-w-[260px] rounded-xl bg-card p-4 shadow-sm transition-all border-2 ${
        selected ? "border-indigo-600 shadow-md" : isNotSet ? "border-dashed border-amber-300 dark:border-amber-400/30" : "border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-400/10 text-amber-600 dark:text-amber-300 font-medium">
          <TbBolt size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Trigger</span>
            <span
              className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                isNotSet ? "bg-amber-100 dark:bg-amber-400/15 text-amber-700 dark:text-amber-300" : "bg-emerald-100 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300"
              }`}
            >
              {data.status || "NOT SET"}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-foreground truncate">{data.label || "Trigger not set"}</h4>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {data.subtitle || "Click to choose how leads enter this workflow"}
          </p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-600 !w-3 !h-3" />
    </div>
  );
}

export function SendEmailNode({ id, data, selected }: CustomNodeProps) {
  const isIncomplete = data.status === "INCOMPLETE" || !data.config?.subject;

  return (
    <div
      className={`relative min-w-[260px] rounded-xl bg-card p-4 shadow-sm transition-all border-2 ${
        selected ? "border-indigo-600 shadow-md" : "border-blue-100 dark:border-blue-400/20 hover:border-indigo-300 dark:hover:border-indigo-400/30"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-600 !w-3 !h-3" />
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-400/10 text-blue-600 dark:text-blue-300">
          <TbMail size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-sm font-semibold text-foreground truncate">{data.label || "Send email"}</span>
            {isIncomplete && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 dark:bg-amber-400/15 text-amber-700 dark:text-amber-300 rounded">
                INCOMPLETE
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {data.config?.subject ? `Subject: ${data.config.subject}` : "(no subject)"}
          </p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-600 !w-3 !h-3" />
    </div>
  );
}

export function WaitNode({ data, selected }: CustomNodeProps) {
  return (
    <div
      className={`relative min-w-[240px] rounded-xl bg-card p-3.5 shadow-sm transition-all border-2 ${
        selected ? "border-indigo-600 shadow-md" : "border-amber-100 dark:border-amber-400/20 hover:border-amber-300 dark:hover:border-amber-400/30"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-600 !w-3 !h-3" />
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-400/10 text-amber-600 dark:text-amber-300">
          <TbClock size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate">{data.label || "Wait"}</h4>
          <p className="text-xs text-muted-foreground truncate">
            {data.config?.delayMinutes || data.config?.delayUnit === "minutes"
              ? `${data.config.delayMinutes || data.config.delayValue} minute${(data.config.delayMinutes || data.config.delayValue) === 1 ? "" : "s"}`
              : data.config?.delayHours || data.config?.delayUnit === "hours"
              ? `${data.config.delayHours || data.config.delayValue} hour${(data.config.delayHours || data.config.delayValue) === 1 ? "" : "s"}`
              : data.config?.delayDays || data.config?.delayUnit === "days"
              ? `${data.config.delayDays || data.config.delayValue} day${(data.config.delayDays || data.config.delayValue) === 1 ? "" : "s"}`
              : data.subtitle || "Set delay"}
          </p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-600 !w-3 !h-3" />
    </div>
  );
}

export function IfThenNode({ data, selected }: CustomNodeProps) {
  const config = data.config;
  const isLink = config?.conditionType === "link_clicked";
  const ruleText = isLink ? "Link inside email clicked" : "Previous email opened";
  const delayStr =
    config?.checkDelayMinutes || config?.checkDelayUnit === "minutes"
      ? `${config.checkDelayMinutes || config.checkDelayValue || 30} min`
      : config?.checkDelayDays || config?.checkDelayUnit === "days"
      ? `${config.checkDelayDays || config.checkDelayValue || 1} day${(config.checkDelayDays || config.checkDelayValue || 1) === 1 ? "" : "s"}`
      : `${config?.checkDelayHours || config?.checkDelayValue || 24} hr${(config?.checkDelayHours || config?.checkDelayValue || 24) === 1 ? "" : "s"}`;

  return (
    <div
      className={`relative min-w-[260px] rounded-xl bg-card p-4 shadow-sm transition-all border-2 ${
        selected ? "border-indigo-600 shadow-md" : "border-purple-100 dark:border-purple-400/20 hover:border-purple-300 dark:hover:border-purple-400/30"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-600 !w-3 !h-3" />
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-400/10 text-purple-600 dark:text-purple-300">
          <TbGitFork size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate">{data.label || "If / then"}</h4>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {config?.conditionType ? `${ruleText} (${delayStr})` : data.subtitle || "Check condition"}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mt-3 pt-2 border-t border-border text-[11px] font-bold text-muted-foreground">
        <span className="text-emerald-600 dark:text-emerald-300 font-bold">YES</span>
        <span className="text-rose-600 dark:text-rose-300 font-bold">NO</span>
      </div>

      <Handle type="source" position={Position.Bottom} id="yes" className="!bg-emerald-500 !w-3 !h-3 !left-[30%]" />
      <Handle type="source" position={Position.Bottom} id="no" className="!bg-rose-500 !w-3 !h-3 !left-[70%]" />
    </div>
  );
}

/**
 * Manual touch steps. Both create a real task for a person and then advance
 * immediately — the sequence keeps its cadence while a human does the work.
 */
function ManualTouchNode({
  data,
  selected,
  icon,
  tint,
  border,
  fallbackLabel,
  fallbackSubtitle,
}: CustomNodeProps & {
  icon: React.ReactNode;
  tint: string;
  border: string;
  fallbackLabel: string;
  fallbackSubtitle: string;
}) {
  const due = Number(data.config?.dueInDays ?? 1);
  return (
    <div
      className={`relative min-w-[240px] rounded-xl bg-card p-3.5 shadow-sm transition-all border-2 ${
        selected ? "border-indigo-600 shadow-md" : border
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-600 !w-3 !h-3" />
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tint}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate">{data.label || fallbackLabel}</h4>
          <p className="text-xs text-muted-foreground truncate">
            {data.config?.title
              ? `${data.config.title} · due in ${due}d`
              : data.subtitle || fallbackSubtitle}
          </p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-600 !w-3 !h-3" />
    </div>
  );
}

export function CallTaskNode(props: CustomNodeProps) {
  return (
    <ManualTouchNode
      {...props}
      icon={<TbPhone size={20} />}
      tint="bg-emerald-50 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-300"
      border="border-emerald-100 dark:border-emerald-400/20 hover:border-emerald-300 dark:hover:border-emerald-400/30"
      fallbackLabel="Call"
      fallbackSubtitle="Create a call task"
    />
  );
}

export function LinkedInStepNode(props: CustomNodeProps) {
  return (
    <ManualTouchNode
      {...props}
      icon={<TbBrandLinkedin size={20} />}
      tint="bg-sky-50 dark:bg-sky-400/10 text-sky-600 dark:text-sky-300"
      border="border-sky-100 dark:border-sky-400/20 hover:border-sky-300 dark:hover:border-sky-400/30"
      fallbackLabel="LinkedIn touch"
      fallbackSubtitle="Create a LinkedIn task"
    />
  );
}

export function AbSplitNode({ data, selected }: CustomNodeProps) {
  const split = Number(data.config?.splitPercent ?? 50);
  return (
    <div
      className={`relative min-w-[260px] rounded-xl bg-card p-4 shadow-sm transition-all border-2 ${
        selected ? "border-indigo-600 shadow-md" : "border-fuchsia-100 dark:border-fuchsia-400/20 hover:border-fuchsia-300 dark:hover:border-fuchsia-400/30"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-600 !w-3 !h-3" />
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fuchsia-50 dark:bg-fuchsia-400/10 text-fuchsia-600 dark:text-fuchsia-300">
          <TbArrowsSplit2 size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate">{data.label || "A/B split"}</h4>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {data.subtitle || `${split}% take variant A`}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mt-3 pt-2 border-t border-border text-[11px] font-bold">
        <span className="text-fuchsia-600 dark:text-fuchsia-300">A · {split}%</span>
        <span className="text-indigo-600 dark:text-indigo-300">B · {100 - split}%</span>
      </div>

      <Handle type="source" position={Position.Bottom} id="a" className="!bg-fuchsia-500 !w-3 !h-3 !left-[30%]" />
      <Handle type="source" position={Position.Bottom} id="b" className="!bg-indigo-500 !w-3 !h-3 !left-[70%]" />
    </div>
  );
}

export function ExitNode({ data, selected }: CustomNodeProps) {
  return (
    <div
      className={`relative min-w-[220px] rounded-xl bg-emerald-50/60 dark:bg-emerald-400/10 p-3.5 shadow-sm transition-all border-2 ${
        selected ? "border-emerald-600 shadow-md" : "border-emerald-200 dark:border-emerald-400/25"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-emerald-600 !w-3 !h-3" />
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300">
          <TbLogout size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 truncate">{data.label || "Exit"}</h4>
          <p className="text-xs text-emerald-600 dark:text-emerald-300 truncate">{data.subtitle || "End of workflow"}</p>
        </div>
      </div>
    </div>
  );
}
