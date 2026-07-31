export type WorkflowStatus = "draft" | "active" | "paused" | "archived";
export type WorkflowTriggerType = "static_list" | "realtime_lead";

export type NodeType = "trigger" | "send_email" | "wait" | "if_then" | "exit";

export interface NodeConfig {
  fromEmail?: string;
  fromName?: string;
  subject?: string;
  emailBody?: string;
  delayValue?: number;
  delayUnit?: "minutes" | "hours" | "days";
  delayMinutes?: number;
  delayHours?: number;
  delayDays?: number;
  conditionType?: "email_opened" | "link_clicked";
  checkDelayValue?: number;
  checkDelayUnit?: "minutes" | "hours" | "days";
  checkDelayMinutes?: number;
  checkDelayHours?: number;
  checkDelayDays?: number;
}

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string;
  subtitle?: string;
  status?: "NOT SET" | "INCOMPLETE" | "READY";
  nodeType: NodeType;
  config?: NodeConfig;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
}

export interface WorkflowStats {
  active: number;
  completed: number;
  failed: number;
  cancelled: number;
}

export interface WorkflowItem {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  version: number;
  triggerType: WorkflowTriggerType;
  triggerConfig?: {
    watchedSources?: string[];
    allowReEnrollment?: boolean;
    listIds?: string[];
    batchSize?: number;
  };
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  stats: WorkflowStats;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowEnrollment {
  id: string;
  workflowId: string;
  workflowName?: string;
  leadName: string;
  leadEmail: string;
  source: string;
  status: "active" | "completed" | "failed" | "cancelled";
  currentNodeId: string;
  enrolledAt: string;
}
