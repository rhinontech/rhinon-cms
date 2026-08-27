"use client";

import React, { useState, useEffect, use } from "react";
import { usePathname } from "next/navigation";
import { WorkflowHeader } from "@/components/Admin/Automation/WorkflowHeader";
import { WorkflowCanvas } from "@/components/Admin/Automation/WorkflowCanvas";
import { NodeConfigDrawer } from "@/components/Admin/Automation/NodeConfigDrawer";
import { WorkflowTriggerTab } from "@/components/Admin/Automation/WorkflowTriggerTab";
import { WorkflowSettingsTab } from "@/components/Admin/Automation/WorkflowSettingsTab";
import { WorkflowEnrollmentsTab } from "@/components/Admin/Automation/WorkflowEnrollmentsTab";
import { toast } from "sonner";
import { WorkflowItem, WorkflowNode, WorkflowEdge, NodeConfig, WorkflowEnrollment, WorkflowTriggerType } from "@/types/automation";
import { apiFetch } from "@/lib/api";
import { removeNodeAndBridge, repairWorkflowEdges } from "@/lib/workflowUtils";

export default function SingleWorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1] || "admin";

  const [activeTab, setActiveTab] = useState<"Editor" | "Trigger" | "Settings" | "Enrollments">("Editor");
  const [workflow, setWorkflow] = useState<WorkflowItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [enrollments, setEnrollments] = useState<WorkflowEnrollment[]>([]);

  const fetchWorkflowAndEnrollments = async () => {
    try {
      setLoading(true);
      const [wfRes, enrRes] = await Promise.allSettled([
        apiFetch<{ success: boolean; data: WorkflowItem }>(`/workflows/${resolvedParams.id}`),
        apiFetch<{ success: boolean; data: WorkflowEnrollment[] }>(`/workflows/${resolvedParams.id}/enrollments`),
      ]);

      if (wfRes.status === "fulfilled" && wfRes.value.success && wfRes.value.data) {
        const rawWf = wfRes.value.data;
        const { nodes: repairedNodes, edges: repairedEdges, repaired } = repairWorkflowEdges(
          rawWf.nodes || [],
          rawWf.edges || []
        );
        setWorkflow(rawWf);
        setNodes(repairedNodes);
        setEdges(repairedEdges);
        if (repaired) {
          saveWorkflowChanges({ nodes: repairedNodes, edges: repairedEdges });
        }
      }

      if (enrRes.status === "fulfilled" && enrRes.value.success && Array.isArray(enrRes.value.data)) {
        setEnrollments(enrRes.value.data);
      }
    } catch (err) {
      console.error("Failed to load workflow data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflowAndEnrollments();
  }, [resolvedParams.id]);

  const saveWorkflowChanges = async (updates: Partial<WorkflowItem>) => {
    if (!workflow) return;
    try {
      const res = await apiFetch<{ success: boolean; data: WorkflowItem }>(`/workflows/${workflow.id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });

      if (res.success && res.data) {
        setWorkflow(res.data);
      }
    } catch (err: any) {
      console.error("Failed to save workflow changes:", err);
      toast.error(err.message || "Failed to update workflow");
    }
  };

  const handleStatusChange = (newStatus: "draft" | "active" | "paused" | "archived") => {
    if (!workflow) return;

    if (newStatus === "active") {
      const watchedSources = workflow.triggerConfig?.watchedSources || [];
      const isNotSet = workflow.triggerType === "static_list" && watchedSources.length === 0;

      if (isNotSet) {
        toast.error("Please select recipient lists or sources in the Trigger tab before publishing.");
        setActiveTab("Trigger");
        return;
      }
    }

    setWorkflow((prev) => (prev ? { ...prev, status: newStatus } : null));
    saveWorkflowChanges({ status: newStatus });
  };

  const handleSaveNodeConfig = (nodeId: string, updatedConfig: NodeConfig, label?: string) => {
    const updatedNodes = nodes.map((n) => {
      if (n.id === nodeId) {
        const newLabel = label || n.data.label;

        let subtitle = n.data.subtitle;
        if (n.type === "send_email") {
          subtitle = updatedConfig.subject || "(no subject)";
        } else if (n.type === "wait") {
          if (updatedConfig.delayMinutes || updatedConfig.delayUnit === "minutes") {
            const val = updatedConfig.delayMinutes || updatedConfig.delayValue || 30;
            subtitle = `${val} minute${val === 1 ? "" : "s"}`;
          } else if (updatedConfig.delayDays || updatedConfig.delayUnit === "days") {
            const val = updatedConfig.delayDays || updatedConfig.delayValue || 1;
            subtitle = `${val} day${val === 1 ? "" : "s"}`;
          } else {
            const val = updatedConfig.delayHours || updatedConfig.delayValue || 24;
            subtitle = `${val} hour${val === 1 ? "" : "s"}`;
          }
        } else if (n.type === "if_then") {
          const condLabel = updatedConfig.conditionType === "link_clicked" ? "Link clicked" : "Email opened";
          let waitText = `${updatedConfig.checkDelayHours || updatedConfig.checkDelayValue || 24}h`;
          if (updatedConfig.checkDelayMinutes || updatedConfig.checkDelayUnit === "minutes") {
            waitText = `${updatedConfig.checkDelayMinutes || updatedConfig.checkDelayValue || 30}m`;
          } else if (updatedConfig.checkDelayDays || updatedConfig.checkDelayUnit === "days") {
            waitText = `${updatedConfig.checkDelayDays || updatedConfig.checkDelayValue || 1}d`;
          }
          subtitle = `${condLabel} (wait ${waitText})`;
        }

        return {
          ...n,
          data: {
            ...n.data,
            label: newLabel,
            status: "READY" as const,
            config: updatedConfig,
            subtitle,
          },
        };
      }
      return n;
    });

    setNodes(updatedNodes);
    saveWorkflowChanges({ nodes: updatedNodes, edges });

    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    const { nodes: newNodes, edges: newEdges } = removeNodeAndBridge(nodeId, nodes, edges);
    setNodes(newNodes);
    setEdges(newEdges);
    saveWorkflowChanges({ nodes: newNodes, edges: newEdges });
    setSelectedNode(null);
  };

  const handleCanvasChange = (
    newNodes: WorkflowNode[],
    newEdges: WorkflowEdge[],
    persistToApi: boolean = true
  ) => {
    setNodes(newNodes);
    setEdges(newEdges);
    if (persistToApi) {
      saveWorkflowChanges({ nodes: newNodes, edges: newEdges });
    }
  };

  const handleEnrollTest = async () => {
    if (!workflow) return;
    try {
      const res = await apiFetch<{ success: boolean; data: WorkflowEnrollment }>(`/workflows/${workflow.id}/enroll`, {
        method: "POST",
        body: JSON.stringify({
          leadName: "Test Lead User",
          leadEmail: `test-${Date.now()}@example.com`,
          source: "Manual test",
          currentNodeId: nodes[0]?.id || "node-trigger",
        }),
      });

      if (res.success && res.data) {
        setEnrollments((prev) => [res.data, ...prev]);
        setWorkflow((prev) =>
          prev
            ? {
              ...prev,
              stats: {
                ...prev.stats,
                active: (prev.stats?.active || 0) + 1,
              },
            }
            : null
        );
      }
    } catch (err) {
      console.error("Failed to enroll test lead via API:", err);
    }
    setActiveTab("Enrollments");
  };

  const handleCancelAllEnrollments = async () => {
    if (!workflow) return;
    try {
      await apiFetch(`/workflows/${workflow.id}/cancel-enrollments`, { method: "POST" });
      const enrRes = await apiFetch<{ success: boolean; data: WorkflowEnrollment[] }>(
        `/workflows/${workflow.id}/enrollments`
      );
      if (enrRes.success && Array.isArray(enrRes.data)) {
        setEnrollments(enrRes.data);
      }
      const wfRes = await apiFetch<{ success: boolean; data: WorkflowItem }>(`/workflows/${workflow.id}`);
      if (wfRes.success && wfRes.data) {
        setWorkflow(wfRes.data);
      }
    } catch (err) {
      console.error("Failed to cancel active enrollments via API:", err);
    }
  };

  const handleRunWorkflow = async () => {
    if (!workflow) return;
    try {
      const res = await apiFetch<{ success: boolean; data: WorkflowItem }>(`/workflows/${workflow.id}/run`, {
        method: "POST",
      });
      if (res.success && res.data) {
        setWorkflow(res.data);
      }
      const enrRes = await apiFetch<{ success: boolean; data: WorkflowEnrollment[] }>(
        `/workflows/${workflow.id}/enrollments`
      );
      if (enrRes.success && Array.isArray(enrRes.data)) {
        setEnrollments(enrRes.data);
      }
      setActiveTab("Enrollments");
    } catch (err) {
      console.error("Failed to run workflow via API:", err);
    }
  };

  if (loading || !workflow) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 font-medium">
        Loading workflow...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-gray-50/50">
      {/* Fixed Top Header */}
      <WorkflowHeader
        workflow={workflow}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onStatusChange={handleStatusChange}
        onEnrollTest={handleEnrollTest}
        onRunWorkflow={handleRunWorkflow}
        roleSlug={roleSlug}
      />

      {/* Main Tab Content */}
      <div className="flex-1 overflow-auto relative">
        {activeTab === "Editor" && (
          <div className="h-full w-full relative">
            <WorkflowCanvas
              nodes={nodes}
              edges={edges}
              onChangeCanvas={handleCanvasChange}
              onSelectNode={setSelectedNode}
              readOnly={workflow.status === "archived"}
            />
            {selectedNode && (
              <NodeConfigDrawer
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
                onSave={handleSaveNodeConfig}
                onDelete={handleDeleteNode}
              />
            )}
          </div>
        )}

        {activeTab === "Trigger" && (
          <WorkflowTriggerTab
            triggerType={workflow.triggerType}
            onTypeChange={(type: WorkflowTriggerType) => {
              setWorkflow((prev) => (prev ? { ...prev, triggerType: type } : null));
              saveWorkflowChanges({ triggerType: type });
            }}
            allowReEnrollment={workflow.triggerConfig?.allowReEnrollment || false}
            onReEnrollmentChange={(allow: boolean) => {
              const updatedConfig = { ...workflow.triggerConfig, allowReEnrollment: allow };
              setWorkflow((prev) => (prev ? { ...prev, triggerConfig: updatedConfig } : null));
              saveWorkflowChanges({ triggerConfig: updatedConfig });
            }}
            watchedSources={workflow.triggerConfig?.watchedSources || []}
            onSourcesChange={(sources: string[]) => {
              const updatedConfig = { ...workflow.triggerConfig, watchedSources: sources };
              const updatedNodes = nodes.map((n) => {
                if (n.type === "trigger" || n.data?.nodeType === "trigger") {
                  return {
                    ...n,
                    data: {
                      ...n.data,
                      status: sources.length > 0 ? ("READY" as const) : ("NOT SET" as const),
                      subtitle: sources.length > 0 ? `Selected: ${sources.join(", ")}` : "Click to choose how leads enter this workflow",
                    },
                  };
                }
                return n;
              });
              setNodes(updatedNodes);
              setWorkflow((prev) => (prev ? { ...prev, triggerConfig: updatedConfig, nodes: updatedNodes } : null));
              saveWorkflowChanges({ triggerConfig: updatedConfig, nodes: updatedNodes, edges });
            }}
            batchSize={workflow.triggerConfig?.batchSize || 100}
            onBatchSizeChange={(batchSize: number) => {
              const updatedConfig = { ...workflow.triggerConfig, batchSize };
              setWorkflow((prev) => (prev ? { ...prev, triggerConfig: updatedConfig } : null));
              saveWorkflowChanges({ triggerConfig: updatedConfig });
            }}
          />
        )}

        {activeTab === "Settings" && (
          <WorkflowSettingsTab
            workflow={workflow}
            onSave={(updated) => {
              setWorkflow((prev) =>
                prev ? { ...prev, name: updated.name, description: updated.description } : null
              );
              saveWorkflowChanges({ name: updated.name, description: updated.description });
            }}
            roleSlug={roleSlug}
          />
        )}

        {activeTab === "Enrollments" && (
          <WorkflowEnrollmentsTab
            enrollments={enrollments}
            onRefresh={fetchWorkflowAndEnrollments}
            onCancelAll={handleCancelAllEnrollments}
            workflowId={resolvedParams.id}
          />
        )}
      </div>
    </div>
  );
}
