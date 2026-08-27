"use client";

import React, { useCallback, useEffect, useRef } from "react";
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
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  TriggerNode,
  SendEmailNode,
  WaitNode,
  IfThenNode,
  CallTaskNode,
  LinkedInStepNode,
  AbSplitNode,
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
  call_task: CallTaskNode,
  linkedin_step: LinkedInStepNode,
  ab_split: AbSplitNode,
  exit: ExitNode,
};

const EDGE_TYPES = {
  addStepEdge: AddStepEdge,
};

interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  onChangeCanvas: (nodes: WorkflowNode[], edges: WorkflowEdge[], persistToApi?: boolean) => void;
  onSelectNode: (node: WorkflowNode | null) => void;
  readOnly?: boolean;
}

export function WorkflowCanvas({
  nodes: initialNodes,
  edges: initialEdges,
  onChangeCanvas,
  onSelectNode,
  readOnly = false,
}: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes as any[]);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges as any[]);

  const nodesRef = useRef(nodes as unknown as WorkflowNode[]);
  nodesRef.current = nodes as unknown as WorkflowNode[];
  const edgesRef = useRef(edges as unknown as WorkflowEdge[]);
  edgesRef.current = edges as unknown as WorkflowEdge[];

  // Sync external props when changed by parent (e.g. on workflow load)
  useEffect(() => {
    if (initialNodes && initialNodes.length > 0) {
      setNodes(initialNodes as any[]);
    }
  }, [initialNodes, setNodes]);

  useEffect(() => {
    if (initialEdges) {
      setEdges(initialEdges as any[]);
    }
  }, [initialEdges, setEdges]);

  // Handle adding new node in between an edge
  const handleAddNodeInEdge = useCallback(
    (edgeId: string, nodeType: NodeType) => {
      if (readOnly) return;

      const result = addNodeInEdge(edgeId, nodeType, nodesRef.current, edgesRef.current);
      if (result.newNode) {
        setNodes(result.nodes as any[]);
        setEdges(result.edges as any[]);
        nodesRef.current = result.nodes;
        edgesRef.current = result.edges;
        onChangeCanvas(result.nodes, result.edges, true);
        onSelectNode(result.newNode);
      }
    },
    [readOnly, onSelectNode, onChangeCanvas, setNodes, setEdges]
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

        setNodes(currentNodes as any[]);
        setEdges(currentEdges as any[]);
        nodesRef.current = currentNodes;
        edgesRef.current = currentEdges;
        onChangeCanvas(currentNodes, currentEdges, true);
        return;
      }

      // Delegate internal drag movements to React Flow's optimized hook
      onNodesChangeInternal(changes);
    },
    [onNodesChangeInternal, onChangeCanvas, readOnly, setNodes, setEdges]
  );

  const onNodeDragStop = useCallback(() => {
    if (readOnly) return;
    onChangeCanvas(nodesRef.current, edgesRef.current, true);
  }, [onChangeCanvas, readOnly]);

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

      setNodes(currentNodes as any[]);
      setEdges(currentEdges as any[]);
      nodesRef.current = currentNodes;
      edgesRef.current = currentEdges;
      onChangeCanvas(currentNodes, currentEdges, true);
    },
    [onChangeCanvas, readOnly, setNodes, setEdges]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      if (readOnly) return;
      const removeChanges = changes.filter((c) => c.type === "remove");
      if (removeChanges.length === 0) {
        onEdgesChangeInternal(changes);
        return;
      }

      const nextEdges = applyEdgeChanges(changes, edgesRef.current as any[]) as unknown as WorkflowEdge[];
      setEdges(nextEdges as any[]);
      edgesRef.current = nextEdges;
      onChangeCanvas(nodesRef.current, nextEdges, true);
    },
    [onEdgesChangeInternal, onChangeCanvas, readOnly, setEdges]
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
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onNodesDelete={onNodesDelete}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
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
