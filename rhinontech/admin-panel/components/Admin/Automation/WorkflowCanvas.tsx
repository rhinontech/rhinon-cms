"use client";

import React, { useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  TriggerNode,
  SendEmailNode,
  WaitNode,
  IfThenNode,
  ExitNode,
} from "./CustomNodes";
import { AddStepEdge } from "./AddStepEdge";
import { NodeType, WorkflowNode, WorkflowEdge } from "@/types/automation";

import { addNodeInEdge, removeNodeAndBridge } from "@/lib/workflowUtils";
import { WorkflowCanvasContext } from "./WorkflowCanvasContext";

// Define NODE_TYPES and EDGE_TYPES statically outside the component
// to prevent React Flow error #002 during component re-renders
const NODE_TYPES = {
  trigger: TriggerNode,
  send_email: SendEmailNode,
  wait: WaitNode,
  if_then: IfThenNode,
  exit: ExitNode,
};

const EDGE_TYPES = {
  addStepEdge: AddStepEdge,
};

interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  setNodes: React.Dispatch<React.SetStateAction<WorkflowNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<WorkflowEdge[]>>;
  onSelectNode: (node: WorkflowNode | null) => void;
  readOnly?: boolean;
}

export function WorkflowCanvas({
  nodes,
  edges,
  setNodes,
  setEdges,
  onSelectNode,
  readOnly = false,
}: WorkflowCanvasProps) {
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef(edges);
  edgesRef.current = edges;

  // Handle adding new node in between an edge
  const handleAddNodeInEdge = useCallback(
    (edgeId: string, nodeType: NodeType) => {
      if (readOnly) return;

      const result = addNodeInEdge(edgeId, nodeType, nodesRef.current, edgesRef.current);
      if (result.newNode) {
        setNodes(result.nodes);
        setEdges(result.edges);
        onSelectNode(result.newNode);
      }
    },
    [readOnly, onSelectNode, setNodes, setEdges]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      if (readOnly) return;

      const removeChanges = changes.filter((c) => c.type === "remove");
      if (removeChanges.length > 0) {
        let currentNodes = [...nodesRef.current];
        let currentEdges = [...edgesRef.current];

        for (const change of removeChanges) {
          if ("id" in change) {
            const res = removeNodeAndBridge(change.id, currentNodes, currentEdges);
            currentNodes = res.nodes;
            currentEdges = res.edges;
          }
        }

        setNodes(currentNodes);
        setEdges(currentEdges);
        return;
      }

      setNodes((nds) => applyNodeChanges(changes, nds as any[]) as unknown as WorkflowNode[]);
    },
    [setNodes, setEdges, readOnly]
  );

  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      if (readOnly) return;
      let currentNodes = [...nodesRef.current];
      let currentEdges = [...edgesRef.current];

      for (const n of deletedNodes) {
        const res = removeNodeAndBridge(n.id, currentNodes, currentEdges);
        currentNodes = res.nodes;
        currentEdges = res.edges;
      }

      setNodes(currentNodes);
      setEdges(currentEdges);
    },
    [setNodes, setEdges, readOnly]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      if (readOnly) return;
      setEdges((eds) => applyEdgeChanges(changes, eds as any[]) as unknown as WorkflowEdge[]);
    },
    [setEdges, readOnly]
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      onSelectNode(node as unknown as WorkflowNode);
    },
    [onSelectNode]
  );

  return (
    <WorkflowCanvasContext.Provider value={{ onAddNode: handleAddNodeInEdge }}>
      <div className="h-full w-full relative bg-gray-50/50">
        <ReactFlow
          nodes={nodes as any[]}
          edges={edges as any[]}
          onNodesChange={onNodesChange}
          onNodesDelete={onNodesDelete}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={NODE_TYPES as any}
          edgeTypes={EDGE_TYPES as any}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.2}
          maxZoom={1.5}
          nodesDraggable={!readOnly}
          nodesConnectable={false}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
          <Controls position="bottom-left" showInteractive={false} />
        </ReactFlow>
      </div>
    </WorkflowCanvasContext.Provider>
  );
}
