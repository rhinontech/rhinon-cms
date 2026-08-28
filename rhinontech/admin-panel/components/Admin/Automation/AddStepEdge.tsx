"use client";

import React, { useState } from "react";
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath } from "@xyflow/react";
import { TbPlus, TbMail, TbClock, TbGitFork, TbLogout, TbPhone, TbBrandLinkedin, TbArrowsSplit2 } from "react-icons/tb";
import { NodeType } from "@/types/automation";

import { useWorkflowCanvasContext } from "./WorkflowCanvasContext";

interface AddStepEdgeProps extends EdgeProps {
  data?: {
    onAddNode?: (edgeId: string, nodeType: NodeType) => void;
  };
}

export function AddStepEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: AddStepEdgeProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const context = useWorkflowCanvasContext();

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleSelectType = (type: NodeType) => {
    setMenuOpen(false);
    const cb = data?.onAddNode || context.onAddNode;
    if (cb) {
      cb(id, type);
    }
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ strokeWidth: 2, stroke: "#a5b4fc", ...style }} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan flex flex-col items-center z-20"
        >
          {/* Circular + Add Step Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:scale-110 transition-all border-2 border-white"
            title="Add a step"
          >
            <TbPlus size={16} />
          </button>

          {/* Action Types Popover Menu */}
          {menuOpen && (
            <div className="absolute top-9 left-1/2 -translate-x-1/2 w-48 rounded-xl bg-card p-1.5 shadow-xl border border-border ring-1 ring-border z-50 animate-in fade-in zoom-in-95">
              <button
                onClick={() => handleSelectType("send_email")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/85 hover:bg-indigo-50 dark:hover:bg-indigo-400/10 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
              >
                <TbMail size={18} className="text-blue-500 dark:text-blue-400" />
                <span className="font-medium">Send email</span>
              </button>
              <button
                onClick={() => handleSelectType("wait")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/85 hover:bg-indigo-50 dark:hover:bg-indigo-400/10 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
              >
                <TbClock size={18} className="text-amber-500 dark:text-amber-400" />
                <span className="font-medium">Wait</span>
              </button>
              <button
                onClick={() => handleSelectType("if_then")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/85 hover:bg-indigo-50 dark:hover:bg-indigo-400/10 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
              >
                <TbGitFork size={18} className="text-purple-500 dark:text-purple-400" />
                <span className="font-medium">If / then</span>
              </button>
              <button
                onClick={() => handleSelectType("call_task")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/85 hover:bg-indigo-50 dark:hover:bg-indigo-400/10 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
              >
                <TbPhone size={18} className="text-emerald-500 dark:text-emerald-400" />
                <span className="font-medium">Call task</span>
              </button>
              <button
                onClick={() => handleSelectType("linkedin_step")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/85 hover:bg-indigo-50 dark:hover:bg-indigo-400/10 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
              >
                <TbBrandLinkedin size={18} className="text-sky-500 dark:text-sky-400" />
                <span className="font-medium">LinkedIn touch</span>
              </button>
              <button
                onClick={() => handleSelectType("ab_split")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/85 hover:bg-indigo-50 dark:hover:bg-indigo-400/10 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
              >
                <TbArrowsSplit2 size={18} className="text-fuchsia-500 dark:text-fuchsia-400" />
                <span className="font-medium">A/B split</span>
              </button>
              {/* <button
                onClick={() => handleSelectType("exit")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/85 hover:bg-indigo-50 dark:hover:bg-indigo-400/10 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
              >
                <TbLogout size={18} className="text-emerald-500 dark:text-emerald-400" />
                <span className="font-medium">Exit</span>
              </button> */}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
