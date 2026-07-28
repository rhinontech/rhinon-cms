import { WorkflowNode, WorkflowEdge, NodeType } from "@/types/automation";

/**
 * Removes a node and bridges incoming and outgoing edges to prevent broken workflow chains.
 */
export function removeNodeAndBridge(
  nodeId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
  const targetNode = nodes.find((n) => n.id === nodeId);
  if (!targetNode) return { nodes, edges };

  // 1. Protect Trigger node from deletion
  if (targetNode.type === "trigger" || targetNode.data?.nodeType === "trigger") {
    return { nodes, edges };
  }

  // 2. Protect terminal Exit nodes from deletion if deleting would leave a parent stranded
  if (targetNode.type === "exit" || targetNode.data?.nodeType === "exit") {
    const incoming = edges.filter((e) => e.target === nodeId);
    if (incoming.length > 0) {
      return { nodes, edges };
    }
  }

  const incomingEdges = edges.filter((e) => e.target === nodeId);
  const outgoingEdges = edges.filter((e) => e.source === nodeId);

  let updatedEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
  let updatedNodes = nodes.filter((n) => n.id !== nodeId);

  if (targetNode.type === "if_then" || targetNode.data?.nodeType === "if_then") {
    // If deleting an If/Then node:
    const inc = incomingEdges[0];
    const yesEdge = outgoingEdges.find((e) => e.sourceHandle === "yes") || outgoingEdges[0];
    const noEdge = outgoingEdges.find((e) => e.sourceHandle === "no");

    if (inc && yesEdge) {
      const bridgedEdge: WorkflowEdge = {
        id: `e_${inc.source}_${yesEdge.target}`,
        source: inc.source,
        sourceHandle: inc.sourceHandle,
        target: yesEdge.target,
        type: "addStepEdge",
      };
      updatedEdges.push(bridgedEdge);
    }

    // Clean up orphaned NO branch exit nodes if no other edge points to them
    if (noEdge) {
      const noTargetNode = updatedNodes.find((n) => n.id === noEdge.target);
      if (noTargetNode && (noTargetNode.type === "exit" || noTargetNode.data?.nodeType === "exit")) {
        const otherIncoming = updatedEdges.filter((e) => e.target === noTargetNode.id);
        if (otherIncoming.length === 0) {
          updatedNodes = updatedNodes.filter((n) => n.id !== noTargetNode.id);
        }
      }
    }
  } else {
    // Standard node deletion (send_email, wait, etc.)
    if (incomingEdges.length > 0 && outgoingEdges.length > 0) {
      const inc = incomingEdges[0];
      const out = outgoingEdges[0];
      const bridgedEdge: WorkflowEdge = {
        id: `e_${inc.source}_${out.target}`,
        source: inc.source,
        sourceHandle: inc.sourceHandle, // Preserves "yes" or "no" handle from parent If/then!
        target: out.target,
        type: "addStepEdge",
      };
      updatedEdges.push(bridgedEdge);
    }
  }

  // Final cleanup: remove any lingering edges pointing to or from non-existent nodes
  const nodeIds = new Set(updatedNodes.map((n) => n.id));
  updatedEdges = updatedEdges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

  return { nodes: updatedNodes, edges: updatedEdges };
}

/**
 * Adds a node in between an existing edge, creating YES and NO branches with Exit nodes if it's an If/then node.
 */
export function addNodeInEdge(
  edgeId: string,
  nodeType: NodeType,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): { nodes: WorkflowNode[]; edges: WorkflowEdge[]; newNode: WorkflowNode | null } {
  const targetEdge = edges.find((e) => e.id === edgeId);
  if (!targetEdge) return { nodes, edges, newNode: null };

  const sourceNode = nodes.find((n) => n.id === targetEdge.source);
  const targetNode = nodes.find((n) => n.id === targetEdge.target);

  if (!sourceNode || !targetNode) return { nodes, edges, newNode: null };

  const newNodeId = `node_${Date.now()}`;
  const newYPos = (sourceNode.position.y + targetNode.position.y) / 2;
  const isIfThen = nodeType === "if_then";

  const newNode: WorkflowNode = {
    id: newNodeId,
    type: nodeType,
    position: { x: sourceNode.position.x, y: newYPos },
    data: {
      label:
        nodeType === "send_email"
          ? "Send email"
          : nodeType === "wait"
          ? "Wait"
          : nodeType === "if_then"
          ? "If / then"
          : "Exit",
      subtitle:
        nodeType === "send_email"
          ? "(no subject)"
          : nodeType === "wait"
          ? "6 hours"
          : nodeType === "if_then"
          ? "Check condition"
          : "End of workflow",
      status: nodeType === "send_email" ? "INCOMPLETE" : "READY",
      nodeType,
      config: {},
    },
  };

  let updatedNodes: WorkflowNode[] = [];
  let newEdgesToAdd: WorkflowEdge[] = [];

  if (isIfThen) {
    const exitNoId = `node_exit_${Date.now()}`;
    const exitNoNode: WorkflowNode = {
      id: exitNoId,
      type: "exit",
      position: { x: sourceNode.position.x + 140, y: newYPos + 140 },
      data: {
        label: "Exit",
        subtitle: "End of workflow",
        status: "READY",
        nodeType: "exit",
        config: {},
      },
    };

    updatedNodes = nodes.map((n) => {
      if (n.position.y >= newYPos && n.id !== sourceNode.id) {
        return {
          ...n,
          position: {
            x: n.id === targetNode.id ? sourceNode.position.x - 140 : n.position.x,
            y: n.position.y + 140,
          },
        };
      }
      return n;
    });

    updatedNodes.push(newNode, exitNoNode);

    const edge1: WorkflowEdge = {
      id: `e_${sourceNode.id}_${newNodeId}`,
      source: sourceNode.id,
      sourceHandle: targetEdge.sourceHandle,
      target: newNodeId,
      type: "addStepEdge",
    };

    const edgeYes: WorkflowEdge = {
      id: `e_${newNodeId}_yes_${targetNode.id}`,
      source: newNodeId,
      sourceHandle: "yes",
      target: targetNode.id,
      type: "addStepEdge",
    };

    const edgeNo: WorkflowEdge = {
      id: `e_${newNodeId}_no_${exitNoId}`,
      source: newNodeId,
      sourceHandle: "no",
      target: exitNoId,
      type: "addStepEdge",
    };

    newEdgesToAdd = [edge1, edgeYes, edgeNo];
  } else {
    updatedNodes = nodes.map((n) => {
      if (n.position.y >= newYPos && n.id !== sourceNode.id) {
        return { ...n, position: { ...n.position, y: n.position.y + 140 } };
      }
      return n;
    });

    updatedNodes.push(newNode);

    const edge1: WorkflowEdge = {
      id: `e_${sourceNode.id}_${newNodeId}`,
      source: sourceNode.id,
      sourceHandle: targetEdge.sourceHandle,
      target: newNodeId,
      type: "addStepEdge",
    };

    const edge2: WorkflowEdge = {
      id: `e_${newNodeId}_${targetNode.id}`,
      source: newNodeId,
      target: targetNode.id,
      type: "addStepEdge",
    };

    newEdgesToAdd = [edge1, edge2];
  }

  const updatedEdges = edges
    .filter((e) => e.id !== edgeId)
    .concat(newEdgesToAdd);

  return { nodes: updatedNodes, edges: updatedEdges, newNode };
}
