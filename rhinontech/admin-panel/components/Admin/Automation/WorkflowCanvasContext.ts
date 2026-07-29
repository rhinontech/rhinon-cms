"use client";

import React from "react";
import { NodeType } from "@/types/automation";

export interface WorkflowCanvasContextType {
  onAddNode?: (edgeId: string, nodeType: NodeType) => void;
}

export const WorkflowCanvasContext = React.createContext<WorkflowCanvasContextType>({});

export function useWorkflowCanvasContext() {
  return React.useContext(WorkflowCanvasContext);
}
