import { Router } from "express";
import { Workflow } from "../models/Workflow";
import { WorkflowEnrollment } from "../models/WorkflowEnrollment";
import { enrollStaticListLeads, runWorkflowEngineCycle } from "../services/workflowEngine";

const router = Router();

const DEFAULT_WORKFLOW = {
  id: "wf-1",
  name: "User Signup - DB",
  description: "Auto-enrolls new users signing up from the website into a welcome sequence.",
  status: "active",
  version: 1,
  triggerType: "realtime_lead",
  triggerConfig: {
    watchedSources: ["User signups"],
    allowReEnrollment: false,
  },
  nodes: [
    {
      id: "node-trigger",
      type: "trigger",
      position: { x: 250, y: 50 },
      data: { label: "When a new lead arrives", subtitle: "Auto-enrolls matching new leads.", status: "READY", nodeType: "trigger" },
    },
    {
      id: "node-wait-1",
      type: "wait",
      position: { x: 250, y: 190 },
      data: { label: "Wait", subtitle: "6 hours", status: "READY", nodeType: "wait", config: { delayHours: 6 } },
    },
    {
      id: "node-email-1",
      type: "send_email",
      position: { x: 250, y: 330 },
      data: {
        label: "Send email",
        subtitle: "Free Resources: 500+ Claude P...",
        status: "READY",
        nodeType: "send_email",
        config: {
          fromEmail: "noreply@theproductspace.in",
          fromName: "The Product Space",
          subject: "Free Resources: 500+ Claude Prompts Included",
        },
      },
    },
    {
      id: "node-exit",
      type: "exit",
      position: { x: 250, y: 470 },
      data: { label: "Exit", subtitle: "End of workflow", status: "READY", nodeType: "exit" },
    },
  ],
  edges: [
    { id: "e1", source: "node-trigger", target: "node-wait-1", type: "addStepEdge" },
    { id: "e2", source: "node-wait-1", target: "node-email-1", type: "addStepEdge" },
    { id: "e3", source: "node-email-1", target: "node-exit", type: "addStepEdge" },
  ],
  stats: { active: 0, completed: 0, failed: 0, cancelled: 0 },
};

async function ensureDefaultWorkflow() {
  try {
    const count = await Workflow.count();
    if (count === 0) {
      await Workflow.create(DEFAULT_WORKFLOW);
    }
  } catch (err: any) {
    console.error("[Workflows] Default seed failed:", err.message);
  }
}

// GET /workflows
router.get("/", async (req, res) => {
  try {
    await ensureDefaultWorkflow();
    const list = await Workflow.findAll({ order: [["createdAt", "DESC"]] });
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /workflows/:id
router.get("/:id", async (req, res) => {
  try {
    const item = await Workflow.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Workflow not found" });
    }
    res.json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /workflows
router.post("/", async (req, res) => {
  try {
    const { name, description, triggerType, triggerConfig, nodes, edges, stats } = req.body;
    const newWf = await Workflow.create({
      id: `wf-${Date.now()}`,
      name: name || "New Workflow",
      description: description || "",
      status: "draft",
      version: 1,
      triggerType: triggerType || "realtime_lead",
      triggerConfig: triggerConfig || {
        watchedSources: [],
        allowReEnrollment: false,
      },
      nodes: nodes || [],
      edges: edges || [],
      stats: stats || { active: 0, completed: 0, failed: 0, cancelled: 0 },
    });

    res.status(201).json({ success: true, data: newWf });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /workflows/:id
router.put("/:id", async (req, res) => {
  try {
    const item = await Workflow.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Workflow not found" });
    }

    const previousStatus = item.status;
    const requestedStatus = req.body.status;

    if (requestedStatus === "active") {
      const watchedSources = req.body.triggerConfig?.watchedSources || item.triggerConfig?.watchedSources || [];
      const triggerType = req.body.triggerType || item.triggerType || "static_list";

      if (triggerType === "static_list" && watchedSources.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please select recipient lists or sources in the Trigger tab before publishing.",
        });
      }
    }

    await item.update(req.body);

    // If workflow status was set to 'active', trigger static list enrollment and immediate execution cycle
    if (req.body.status === "active" || (item.status === "active" && previousStatus !== "active")) {
      enrollStaticListLeads(item.id).then(() => {
        runWorkflowEngineCycle();
      });
    }

    res.json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /workflows/:id/run - trigger bulk execution for static list workflow
router.post("/:id/run", async (req, res) => {
  try {
    const item = await Workflow.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Workflow not found" });
    }

    if (item.status !== "active") {
      await item.update({ status: "active" });
    }

    await enrollStaticListLeads(item.id);
    await runWorkflowEngineCycle();

    const updatedItem = await Workflow.findByPk(item.id);
    res.json({ success: true, message: "Workflow execution started", data: updatedItem });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /workflows/:id
router.delete("/:id", async (req, res) => {
  try {
    const item = await Workflow.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Workflow not found" });
    }

    await item.destroy();
    res.json({ success: true, message: "Workflow deleted" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /workflows/:id/enrollments - list all enrollments for a workflow
/**
 * GET /workflows/:id/stats — per-step performance.
 *
 * Counts live in each enrollment's trackingState rather than a separate events
 * table, so this walks enrollments in one read and folds them up in memory.
 * Fine at this scale; if enrollment volume ever makes it slow, the fix is an
 * events table, not a smarter query here.
 */
router.get("/:id/stats", async (req, res) => {
  try {
    const workflow = await Workflow.findByPk(req.params.id);
    if (!workflow) {
      res.status(404).json({ message: "Workflow not found" });
      return;
    }

    const enrollments = await WorkflowEnrollment.findAll({
      where: { workflowId: workflow.id },
      attributes: ["id", "status", "currentNodeId", "trackingState"],
    });

    const emailNodes = (workflow.nodes || []).filter(
      (n: any) => (n.type || n.data?.nodeType) === "send_email"
    );

    const perNode = new Map<string, { sent: number; opened: number; clicked: number }>();
    for (const node of emailNodes) perNode.set(node.id, { sent: 0, opened: 0, clicked: 0 });

    for (const enrollment of enrollments) {
      const nodes = (enrollment.trackingState || {}).nodes || {};
      for (const [nodeId, state] of Object.entries<any>(nodes)) {
        if (!perNode.has(nodeId)) perNode.set(nodeId, { sent: 0, opened: 0, clicked: 0 });
        const bucket = perNode.get(nodeId)!;
        if (state?.sentAt) bucket.sent++;
        if (state?.openedAt) bucket.opened++;
        if (state?.clickedAt) bucket.clicked++;
      }
    }

    const steps = emailNodes.map((node: any, i: number) => {
      const bucket = perNode.get(node.id) || { sent: 0, opened: 0, clicked: 0 };
      return {
        nodeId: node.id,
        step: i + 1,
        label: node.data?.label || `Email ${i + 1}`,
        subject: node.data?.config?.subject || null,
        ...bucket,
        // Rates against sends, not against enrollment count — a step nobody
        // reached yet should read as "no data", not as 0% performance.
        openRate: bucket.sent ? Math.round((bucket.opened / bucket.sent) * 100) : null,
        clickRate: bucket.sent ? Math.round((bucket.clicked / bucket.sent) * 100) : null,
      };
    });

    const byStatus: Record<string, number> = {};
    for (const e of enrollments) byStatus[e.status] = (byStatus[e.status] || 0) + 1;

    res.json({
      workflowId: workflow.id,
      totals: {
        enrollments: enrollments.length,
        ...byStatus,
        sent: steps.reduce((sum, st) => sum + st.sent, 0),
        opened: steps.reduce((sum, st) => sum + st.opened, 0),
        clicked: steps.reduce((sum, st) => sum + st.clicked, 0),
      },
      steps,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id/enrollments", async (req, res) => {
  try {
    const enrollments = await WorkflowEnrollment.findAll({
      where: { workflowId: req.params.id },
      order: [["enrolledAt", "DESC"]],
    });
    res.json({ success: true, data: enrollments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /workflows/:id/enroll - enroll a test lead or specific lead
router.post("/:id/enroll", async (req, res) => {
  try {
    const workflow = await Workflow.findByPk(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, message: "Workflow not found" });
    }

    const { leadName, leadEmail, source, currentNodeId } = req.body;
    const firstNodeId = workflow.nodes?.[0]?.id || currentNodeId || "node-trigger";

    const newEnrollment = await WorkflowEnrollment.create({
      id: `enr-${Date.now()}`,
      workflowId: workflow.id,
      leadName: leadName || "Test User",
      leadEmail: leadEmail || `test-${Date.now()}@example.com`,
      source: source || "Manual test",
      status: "active",
      currentNodeId: firstNodeId,
      enrolledAt: new Date(),
    });

    const activeCount = await WorkflowEnrollment.count({
      where: { workflowId: workflow.id, status: "active" },
    });
    const completedCount = await WorkflowEnrollment.count({
      where: { workflowId: workflow.id, status: "completed" },
    });
    const failedCount = await WorkflowEnrollment.count({
      where: { workflowId: workflow.id, status: "failed" },
    });
    const cancelledCount = await WorkflowEnrollment.count({
      where: { workflowId: workflow.id, status: "cancelled" },
    });

    await workflow.update({
      stats: {
        active: activeCount,
        completed: completedCount,
        failed: failedCount,
        cancelled: cancelledCount,
      },
    });

    res.status(201).json({ success: true, data: newEnrollment });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /workflows/:id/cancel-enrollments - cancel active enrollments
router.post("/:id/cancel-enrollments", async (req, res) => {
  try {
    const workflow = await Workflow.findByPk(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, message: "Workflow not found" });
    }

    await WorkflowEnrollment.update(
      { status: "cancelled" },
      { where: { workflowId: workflow.id, status: "active" } }
    );

    const activeCount = await WorkflowEnrollment.count({
      where: { workflowId: workflow.id, status: "active" },
    });
    const completedCount = await WorkflowEnrollment.count({
      where: { workflowId: workflow.id, status: "completed" },
    });
    const failedCount = await WorkflowEnrollment.count({
      where: { workflowId: workflow.id, status: "failed" },
    });
    const cancelledCount = await WorkflowEnrollment.count({
      where: { workflowId: workflow.id, status: "cancelled" },
    });

    await workflow.update({
      stats: {
        active: activeCount,
        completed: completedCount,
        failed: failedCount,
        cancelled: cancelledCount,
      },
    });

    res.json({ success: true, message: "Active enrollments cancelled" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
