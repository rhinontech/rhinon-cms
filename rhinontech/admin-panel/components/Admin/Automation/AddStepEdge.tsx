"use client";

import React, { useState } from "react";
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath } from "@xyflow/react";
import { TbPlus, TbMail, TbClock, TbGitFork, TbLogout } from "react-icons/tb";
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
            <div className="absolute top-9 left-1/2 -translate-x-1/2 w-48 rounded-xl bg-white p-1.5 shadow-xl border border-gray-100 ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95">
              <button
                onClick={() => handleSelectType("send_email")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                <TbMail size={18} className="text-blue-500" />
                <span className="font-medium">Send email</span>
              </button>
              <button
                onClick={() => handleSelectType("wait")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                <TbClock size={18} className="text-amber-500" />
                <span className="font-medium">Wait</span>
              </button>
              <button
                onClick={() => handleSelectType("if_then")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                <TbGitFork size={18} className="text-purple-500" />
                <span className="font-medium">If / then</span>
              </button>
              <button
                onClick={() => handleSelectType("exit")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                <TbLogout size={18} className="text-emerald-500" />
                <span className="font-medium">Exit</span>
              </button>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
