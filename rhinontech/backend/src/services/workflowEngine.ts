import { Op } from "sequelize";
import { Workflow } from "../models/Workflow";
import { WorkflowEnrollment } from "../models/WorkflowEnrollment";
import { Lead, ContactGroup, ContactGroupMember } from "../models";
import { sendEmail } from "./mailer";

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
function isUuid(val: any): boolean {
  return typeof val === "string" && UUID_REGEX.test(val);
}

/**
 * Enrolls matching leads into a static list workflow when activated or triggered.
 */
export async function enrollStaticListLeads(workflowId: string) {
  try {
    const workflow = await Workflow.findByPk(workflowId);
    if (!workflow || workflow.status !== "active") return;

    const triggerConfig = workflow.triggerConfig || {};
    const watchedSources: string[] = triggerConfig.watchedSources || [];
    const allowReEnrollment = Boolean(triggerConfig.allowReEnrollment);

    let targetLeads: Lead[] = [];

    // 1. Try finding leads via Contact Groups matching names/IDs in watchedSources
    if (watchedSources.length > 0) {
      const validUuidSources = watchedSources.filter(isUuid);
      const orConditions: any[] = [{ name: { [Op.in]: watchedSources } }];
      if (validUuidSources.length > 0) {
        orConditions.push({ id: { [Op.in]: validUuidSources } });
      }

      const groups = await ContactGroup.findAll({
        where: {
          [Op.or]: orConditions,
        },
      });

      if (groups.length > 0) {
        const groupIds = groups.map((g) => g.id);
        const members = await ContactGroupMember.findAll({
          where: { contactGroupId: { [Op.in]: groupIds } },
        });
        const leadIds = members
          .map((m) => m.leadId)
          .filter((id): id is string => Boolean(id) && isUuid(id));
        if (leadIds.length > 0) {
          targetLeads = await Lead.findAll({ where: { id: { [Op.in]: leadIds } } });
        }
      }

      // 2. If no group leads, find leads matching source column directly
      if (targetLeads.length === 0) {
        targetLeads = await Lead.findAll({
          where: { source: { [Op.in]: watchedSources } },
          limit: 200,
        });
      }
    }

    // 3. Fallback: if no specific source leads found, get recent leads
    if (targetLeads.length === 0) {
      targetLeads = await Lead.findAll({ limit: 50, order: [["addedAt", "DESC"]] });
    }

    const triggerNode = workflow.nodes?.find((n: any) => n.type === "trigger") || workflow.nodes?.[0];
    const initialNodeId = triggerNode ? triggerNode.id : "node-trigger";

    let enrolledCount = 0;

    for (const lead of targetLeads) {
      if (!allowReEnrollment) {
        const existing = await WorkflowEnrollment.findOne({
          where: {
            workflowId: workflow.id,
            leadEmail: lead.email,
            status: "active",
          },
        });
        if (existing) continue;
      }

      await WorkflowEnrollment.create({
        id: `enr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        workflowId: workflow.id,
        leadId: lead.id && isUuid(lead.id) ? lead.id : null,
        leadName: lead.name || "Lead",
        leadEmail: lead.email,
        source: lead.source || "Static list",
        status: "active",
        currentNodeId: initialNodeId,
        nextStepAt: new Date(),
        enrolledAt: new Date(),
        executionLogs: [{ timestamp: new Date().toISOString(), step: "Enrolled in workflow" }],
      });

      enrolledCount++;
    }

    console.log(`[Workflow Engine] Enrolled ${enrolledCount} lead(s) into workflow ${workflow.id}`);
    await updateWorkflowStats(workflow.id);
  } catch (err: any) {
    console.error("[Workflow Engine] Failed to enroll static list leads:", err.message);
  }
}

/**
 * Runs a single cycle of the workflow execution engine.
 * Processes step execution for active enrollments across active workflows.
 */
export async function runWorkflowEngineCycle() {
  try {
    const activeWorkflows = await Workflow.findAll({ where: { status: "active" } });
    if (activeWorkflows.length === 0) return;

    const now = new Date();

    for (const workflow of activeWorkflows) {
      const batchSize = Number(workflow.triggerConfig?.batchSize) || 100;

      // Find active enrollments eligible to run (nextStepAt <= now or null)
      const enrollments = await WorkflowEnrollment.findAll({
        where: {
          workflowId: workflow.id,
          status: "active",
          [Op.or]: [{ nextStepAt: null }, { nextStepAt: { [Op.lte]: now } }],
        },
        limit: batchSize,
      });

      if (enrollments.length === 0) continue;

      const nodesMap = new Map((workflow.nodes || []).map((n: any) => [n.id, n]));
      const edges = workflow.edges || [];

      for (const enrollment of enrollments) {
        await executeEnrollmentSteps(enrollment, nodesMap, edges, workflow);
      }

      await updateWorkflowStats(workflow.id);
    }
  } catch (err: any) {
    console.error("[Workflow Engine] Execution cycle error:", err.message);
  }
}

/**
 * Step-by-step traversal for a single lead enrollment.
 */
async function executeEnrollmentSteps(
  enrollment: WorkflowEnrollment,
  nodesMap: Map<string, any>,
  edges: any[],
  workflow: Workflow
) {
  let currNodeId = enrollment.currentNodeId;
  const logs = Array.isArray(enrollment.executionLogs) ? [...enrollment.executionLogs] : [];
  let maxStepsPerCycle = 10; // Prevent infinite loops

  while (currNodeId && maxStepsPerCycle > 0) {
    maxStepsPerCycle--;
    const currentNode = nodesMap.get(currNodeId);

    if (!currentNode) {
      // Node missing, mark as completed or failed
      await enrollment.update({
        status: "completed",
        completedAt: new Date(),
        nextStepAt: null,
      });
      break;
    }

    const nodeType = currentNode.type || currentNode.data?.nodeType || "trigger";
    const config = currentNode.data?.config || {};

    if (nodeType === "trigger") {
      logs.push({ timestamp: new Date().toISOString(), step: `Trigger node executed (${currentNode.id})` });
      const nextEdge = edges.find((e) => e.source === currNodeId);
      if (nextEdge) {
        currNodeId = nextEdge.target;
        continue;
      } else {
        await enrollment.update({ status: "completed", completedAt: new Date(), nextStepAt: null });
        break;
      }
    }

    if (nodeType === "send_email") {
      const subjectTemplate = config.subject || "Updates from Rhinon Labs";
      const bodyTemplate =
        config.emailBody || "Hi {{name}},\n\nThank you for choosing us!";

      const subject = parseMergeTags(subjectTemplate, enrollment);
      let htmlBody = parseMergeTags(bodyTemplate, enrollment).replace(/\n/g, "<br/>");

      // Inject email tracking pixel and link click wrappers
      const port = process.env.PORT || 5003;
      const baseUrl = `http://localhost:5003`;

      // Rewrite links for click tracking
      htmlBody = htmlBody.replace(/<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["']/gi, (match, url) => {
        if (url && url.startsWith("http") && !url.includes("/public/track/")) {
          const trackedUrl = `${baseUrl}/public/track/click?e=${enrollment.id}&url=${encodeURIComponent(url)}`;
          return match.replace(url, trackedUrl);
        }
        return match;
      });

      // Append 1x1 transparent tracking pixel
      const trackingPixel = `<img src="${baseUrl}/public/track/open?e=${enrollment.id}" width="1" height="1" style="display:none;" alt="" />`;
      htmlBody = `${htmlBody}\n${trackingPixel}`;

      try {
        await sendEmail({
          to: enrollment.leadEmail,
          from: config.fromEmail,
          fromName: config.fromName || "Rhinon Automation",
          subject,
          html: htmlBody,
        });

        logs.push({
          timestamp: new Date().toISOString(),
          step: `Email sent to ${enrollment.leadEmail}: "${subject}"`,
        });
      } catch (err: any) {
        console.error(`[Workflow Engine] Email dispatch failed for ${enrollment.leadEmail}:`, err.message);
        logs.push({
          timestamp: new Date().toISOString(),
          step: `Email dispatch failed: ${err.message}`,
        });
      }

      const nextEdge = edges.find((e) => e.source === currNodeId);
      if (nextEdge) {
        currNodeId = nextEdge.target;
        continue;
      } else {
        await enrollment.update({ status: "completed", completedAt: new Date(), nextStepAt: null, executionLogs: logs });
        break;
      }
    }

    if (nodeType === "wait") {
      const isAlreadyWaiting = Boolean(enrollment.nextStepAt) && enrollment.currentNodeId === currNodeId;

      if (isAlreadyWaiting) {
        // Wait delay has completed; advance to next step
        const nextEdge = edges.find((e) => e.source === currNodeId);
        if (nextEdge) {
          currNodeId = nextEdge.target;
          continue;
        } else {
          await enrollment.update({
            status: "completed",
            completedAt: new Date(),
            nextStepAt: null,
            executionLogs: logs,
          });
          break;
        }
      } else {
        // Start wait delay
        let delayMs = 6 * 60 * 60 * 1000; // default 6 hours
        if (config.delayUnit === "minutes" || config.delayMinutes) {
          delayMs = Number(config.delayMinutes || config.delayValue || 30) * 60 * 1000;
        } else if (config.delayUnit === "days" || config.delayDays) {
          delayMs = Number(config.delayDays || config.delayValue || 1) * 24 * 60 * 60 * 1000;
        } else if (config.delayUnit === "hours" || config.delayHours) {
          delayMs = Number(config.delayHours || config.delayValue || 6) * 60 * 60 * 1000;
        }

        const nextExecution = new Date(Date.now() + delayMs);

        logs.push({
          timestamp: new Date().toISOString(),
          step: `Wait node: paused until ${nextExecution.toISOString()}`,
        });

        await enrollment.update({
          currentNodeId: currNodeId,
          nextStepAt: nextExecution,
          executionLogs: logs,
        });

        // Pause processing for this lead until wait delay expires
        break;
      }
    }

    if (nodeType === "if_then") {
      const isAlreadyWaiting = Boolean(enrollment.nextStepAt) && enrollment.currentNodeId === currNodeId;

      if (!isAlreadyWaiting) {
        // Schedule wait delay before evaluating condition
        let delayMs = 24 * 60 * 60 * 1000; // default 24 hours
        if (config.checkDelayUnit === "minutes" || config.checkDelayMinutes) {
          delayMs = Number(config.checkDelayMinutes || config.checkDelayValue || 30) * 60 * 1000;
        } else if (config.checkDelayUnit === "days" || config.checkDelayDays) {
          delayMs = Number(config.checkDelayDays || config.checkDelayValue || 1) * 24 * 60 * 60 * 1000;
        } else if (config.checkDelayUnit === "hours" || config.checkDelayHours) {
          delayMs = Number(config.checkDelayHours || config.checkDelayValue || 24) * 60 * 60 * 1000;
        }

        const nextExecution = new Date(Date.now() + delayMs);

        logs.push({
          timestamp: new Date().toISOString(),
          step: `If/Then node: waiting until ${nextExecution.toISOString()} before evaluating condition (${config.conditionType || "email_opened"})`,
        });

        await enrollment.update({
          currentNodeId: currNodeId,
          nextStepAt: nextExecution,
          executionLogs: logs,
        });

        // Pause processing for this lead until evaluation delay expires
        break;
      } else {
        // Wait duration expired; evaluate condition against trackingState
        const trackingState = enrollment.trackingState || {};
        let conditionResult = false;

        if (config.conditionType === "link_clicked") {
          conditionResult = Boolean(trackingState.linkClicked);
        } else {
          // Default to email_opened
          conditionResult = Boolean(trackingState.emailOpened);
        }

        logs.push({
          timestamp: new Date().toISOString(),
          step: `If/Then condition (${config.conditionType || "email_opened"}) evaluated to: ${conditionResult ? "YES (True)" : "NO (False)"}`,
        });

        // Find matching edge for 'yes' / 'true' or 'no' / 'false' branch
        const targetBranch = conditionResult ? ["yes", "true"] : ["no", "false"];
        const matchingEdge =
          edges.find(
            (e) => e.source === currNodeId && targetBranch.includes(String(e.sourceHandle || "").toLowerCase())
          ) || edges.find((e) => e.source === currNodeId);

        if (matchingEdge) {
          currNodeId = matchingEdge.target;
          continue;
        } else {
          await enrollment.update({ status: "completed", completedAt: new Date(), nextStepAt: null, executionLogs: logs });
          break;
        }
      }
    }

    if (nodeType === "exit") {
      logs.push({ timestamp: new Date().toISOString(), step: "Workflow execution completed at Exit node." });
      await enrollment.update({
        status: "completed",
        completedAt: new Date(),
        nextStepAt: null,
        executionLogs: logs,
      });
      break;
    }

    // Default step advance
    const nextEdge = edges.find((e) => e.source === currNodeId);
    if (nextEdge) {
      currNodeId = nextEdge.target;
    } else {
      await enrollment.update({ status: "completed", completedAt: new Date(), nextStepAt: null, executionLogs: logs });
      break;
    }
  }

  if (currNodeId !== enrollment.currentNodeId && enrollment.status === "active") {
    await enrollment.update({
      currentNodeId: currNodeId,
      nextStepAt: null,
      executionLogs: logs,
    });
  }
}

function parseMergeTags(text: string, enrollment: WorkflowEnrollment): string {
  if (!text) return "";
  return text
    .replace(/\{\{\s*name\s*\}\}/gi, enrollment.leadName || "Valued Lead")
    .replace(/\{\{\s*email\s*\}\}/gi, enrollment.leadEmail || "")
    .replace(/\{\{\s*source\s*\}\}/gi, enrollment.source || "Direct")
    .replace(/\{\{\s*company\s*\}\}/gi, "Rhinon Labs");
}

async function updateWorkflowStats(workflowId: string) {
  const active = await WorkflowEnrollment.count({ where: { workflowId, status: "active" } });
  const completed = await WorkflowEnrollment.count({ where: { workflowId, status: "completed" } });
  const failed = await WorkflowEnrollment.count({ where: { workflowId, status: "failed" } });
  const cancelled = await WorkflowEnrollment.count({ where: { workflowId, status: "cancelled" } });

  await Workflow.update(
    { stats: { active, completed, failed, cancelled } },
    { where: { id: workflowId } }
  );
}
