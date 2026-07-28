"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { WorkflowsListPage } from "@/components/Admin/Automation/WorkflowsListPage";
import { WorkflowItem } from "@/types/automation";
import { apiFetch } from "@/lib/api";

export default function WorkflowsPage() {
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1] || "admin";
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; data: WorkflowItem[] }>("/workflows");
      if (res.success && Array.isArray(res.data)) {
        setWorkflows(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch workflows from API:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleRefresh = () => {
    fetchWorkflows();
  };

  const handleCreateWorkflow = async (name: string) => {
    try {
      const res = await apiFetch<{ success: boolean; data: WorkflowItem }>("/workflows", {
        method: "POST",
        body: JSON.stringify({
          name,
          triggerType: "realtime_lead",
          nodes: [
            {
              id: "node-trigger",
              type: "trigger",
              position: { x: 250, y: 50 },
              data: {
                label: "Trigger not set",
                subtitle: "Click to choose how leads enter this workflow",
                status: "NOT SET",
                nodeType: "trigger",
              },
            },
            {
              id: "node-exit",
              type: "exit",
              position: { x: 250, y: 250 },
              data: {
                label: "Exit",
                subtitle: "End of workflow",
                status: "READY",
                nodeType: "exit",
              },
            },
          ],
          edges: [
            {
              id: "e_trigger_exit",
              source: "node-trigger",
              target: "node-exit",
              type: "addStepEdge",
            },
          ],
        }),
      });

      if (res.success && res.data) {
        setWorkflows((prev) => [res.data, ...prev]);
      }
    } catch (err) {
      console.error("Failed to create workflow via API:", err);
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    try {
      await apiFetch(`/workflows/${id}`, { method: "DELETE" });
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      console.error("Failed to delete workflow via API:", err);
    }
  };

  const handleDuplicateWorkflow = async (id: string) => {
    const target = workflows.find((w) => w.id === id);
    if (!target) return;

    try {
      const res = await apiFetch<{ success: boolean; data: WorkflowItem }>("/workflows", {
        method: "POST",
        body: JSON.stringify({
          name: `Copy of ${target.name}`,
          description: target.description,
          triggerType: target.triggerType,
          triggerConfig: target.triggerConfig,
          nodes: target.nodes,
          edges: target.edges,
        }),
      });

      if (res.success && res.data) {
        setWorkflows((prev) => [res.data, ...prev]);
      }
    } catch (err) {
      console.error("Failed to duplicate workflow via API:", err);
    }
  };

  return (
    <WorkflowsListPage
      workflows={workflows}
      roleSlug={roleSlug}
      onRefresh={handleRefresh}
      onCreateWorkflow={handleCreateWorkflow}
      onDeleteWorkflow={handleDeleteWorkflow}
      onDuplicateWorkflow={handleDuplicateWorkflow}
    />
  );
}
