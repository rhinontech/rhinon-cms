"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { TbBolt, TbMail, TbClock, TbGitFork, TbLogout, TbTrash } from "react-icons/tb";
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
      className={`relative min-w-[260px] rounded-xl bg-white p-4 shadow-sm transition-all border-2 ${
        selected ? "border-indigo-600 shadow-md" : isNotSet ? "border-dashed border-amber-300" : "border-gray-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 font-medium">
          <TbBolt size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Trigger</span>
            <span
              className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                isNotSet ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {data.status || "NOT SET"}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-gray-900 truncate">{data.label || "Trigger not set"}</h4>
          <p className="text-xs text-gray-500 truncate mt-0.5">
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
      className={`relative min-w-[260px] rounded-xl bg-white p-4 shadow-sm transition-all border-2 ${
        selected ? "border-indigo-600 shadow-md" : "border-blue-100 hover:border-indigo-300"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-600 !w-3 !h-3" />
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <TbMail size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-sm font-semibold text-gray-900 truncate">{data.label || "Send email"}</span>
            {isIncomplete && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded">
                INCOMPLETE
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">
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
      className={`relative min-w-[240px] rounded-xl bg-white p-3.5 shadow-sm transition-all border-2 ${
        selected ? "border-indigo-600 shadow-md" : "border-amber-100 hover:border-amber-300"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-600 !w-3 !h-3" />
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <TbClock size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate">{data.label || "Wait"}</h4>
          <p className="text-xs text-gray-500 truncate">
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
      className={`relative min-w-[260px] rounded-xl bg-white p-4 shadow-sm transition-all border-2 ${
        selected ? "border-indigo-600 shadow-md" : "border-purple-100 hover:border-purple-300"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-600 !w-3 !h-3" />
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
          <TbGitFork size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate">{data.label || "If / then"}</h4>
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {config?.conditionType ? `${ruleText} (${delayStr})` : data.subtitle || "Check condition"}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100 text-[11px] font-bold text-gray-400">
        <span className="text-emerald-600 font-bold">YES</span>
        <span className="text-rose-600 font-bold">NO</span>
      </div>

      <Handle type="source" position={Position.Bottom} id="yes" className="!bg-emerald-500 !w-3 !h-3 !left-[30%]" />
      <Handle type="source" position={Position.Bottom} id="no" className="!bg-rose-500 !w-3 !h-3 !left-[70%]" />
    </div>
  );
}

export function ExitNode({ data, selected }: CustomNodeProps) {
  return (
    <div
      className={`relative min-w-[220px] rounded-xl bg-emerald-50/60 p-3.5 shadow-sm transition-all border-2 ${
        selected ? "border-emerald-600 shadow-md" : "border-emerald-200"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-emerald-600 !w-3 !h-3" />
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
          <TbLogout size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-emerald-900 truncate">{data.label || "Exit"}</h4>
          <p className="text-xs text-emerald-600 truncate">{data.subtitle || "End of workflow"}</p>
        </div>
      </div>
    </div>
  );
}
