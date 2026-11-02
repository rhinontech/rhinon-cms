import { Op } from "sequelize";
import {
  Activity, BlogTopic, Blog, Campaign, Candidate, ChatConversation, ChatbotTicket, ChatbotTicketMessage,
  CompensationRevision, Deal, Deployment, Event, EventGuest, InboxConversation, Interview, JobOpening, Lead,
  LeaveRequest, Organization, PageShare, Permission, ReimbursementClaim, ReviewSubmission, Role, StartupIdea, User,
  AttendanceRequest,
} from "../models";
import { notify } from "./notifications";
import { currentUserId, runAsSystem, runForOrg } from "./tenantContext";

/**
 * Platform-wide notification triggers, as model hooks: any code path that saves
 * one of these records notifies people, without each route remembering to.
 * Bulk updates bypass hooks, so those few call notify() directly (payroll).
 */

/** Active users holding a permission, plus the workspace superadmin. Null = superadmin only. */
export async function usersWithPermission(permission: string | null): Promise<string[]> {
  const roles = await Role.findAll({
    attributes: ["id", "slug"],
    include: permission ? [{ model: Permission, attributes: ["name"], through: { attributes: [] }, required: false }] : [],
  });
  const ids = roles
    .filter((r: any) => r.slug === "superadmin" || (permission && r.Permissions?.some((p: any) => p.name === permission)))
    .map((r) => r.id);
  const users = await User.findAll({ where: { roleId: { [Op.in]: ids }, status: "active" } as any, attributes: ["id"] });
  return users.map((u) => u.id);
}

type Handler<T> = (row: T, actorId: string | null) => Promise<void>;

/** Runs after commit, in the row's org, and can never fail the save that triggered it. */
function watch<T extends { get: (k: string) => unknown }>(model: any, handlers: { created?: Handler<T>; updated?: Handler<T> }) {
  const wrap = (handler: Handler<T>) => (row: T, options: any) => {
    const actorId = currentUserId();
    const orgId = row.get("organizationId") as string | undefined;
    const run = () => {
      const work = () => handler(row, actorId);
      const job = orgId ? runForOrg(orgId, work, { label: "notify" }) : runAsSystem("notify", work);
      job.catch((err: any) => console.error(`[Notify] ${model.name} failed:`, err.message));
    };
    if (options?.transaction) options.transaction.afterCommit(run);
    else run();
  };
  if (handlers.created) model.afterCreate(wrap(handlers.created));
  if (handlers.updated) {
    // Read what changed now: it's gone once the save finishes.
    const inner = wrap(handlers.updated);
    model.afterUpdate((row: any, options: any) => {
      row.__before = { ...row._previousDataValues };
      inner(row, options);
    });
  }
}

const before = (row: any, field: string) => row.__before?.[field];
const changed = (row: any, field: string) => before(row, field) !== row.get(field);
const lower = (v: unknown) => String(v ?? "").toLowerCase();
const short = (v: unknown, n = 200) => String(v ?? "").slice(0, n);

export function registerNotificationEvents() {
  // ---------- People ----------
  watch<LeaveRequest>(LeaveRequest, {
    created: async (r, actorId) => {
      const who = await User.findByPk(r.userId, { attributes: ["fullName"] });
      await notify({ userIds: await usersWithPermission("leave:write"), type: "leave.requested", title: `${who?.fullName ?? "Someone"} requested ${r.days} day(s) of leave`, body: r.reason, link: "/leave", actorId });
    },
    updated: async (r, actorId) => {
      if (!changed(r, "status") || r.status === "Pending") return;
      await notify({ userIds: [r.userId], type: "leave.decided", title: `Your leave request was ${r.status.toLowerCase()}`, body: r.managerNote ?? null, link: "/leave", actorId });
    },
  });
  watch<any>(AttendanceRequest, {
    created: async (r, actorId) => {
      const who = await User.findByPk(r.get("userId"), { attributes: ["fullName"] });
      await notify({ userIds: await usersWithPermission("attendance:write"), type: "attendance.requested", title: `${who?.fullName ?? "Someone"} sent an attendance request`, link: "/attendance", actorId });
    },
    updated: async (r, actorId) => {
      if (!changed(r, "status")) return;
      await notify({ userIds: [r.get("userId")], type: "attendance.decided", title: `Your attendance request is now ${lower(r.get("status"))}`, link: "/attendance", actorId });
    },
  });
  watch<ReimbursementClaim>(ReimbursementClaim, {
    created: async (r, actorId) => {
      const who = await User.findByPk(r.userId, { attributes: ["fullName"] });
      await notify({ userIds: await usersWithPermission("payroll:write"), type: "payroll.claim_submitted", title: `${who?.fullName ?? "Someone"} submitted a ${r.category} reimbursement`, body: r.description, link: "/payroll", actorId });
    },
    updated: async (r, actorId) => {
      if (!changed(r, "status") || r.status === "pending") return;
      await notify({ userIds: [r.userId], type: "payroll.claim_decided", title: `Your ${r.category} reimbursement was ${r.status}`, body: r.reviewNote ?? null, link: "/payroll", actorId });
    },
  });
  watch<CompensationRevision>(CompensationRevision, {
    updated: async (r, actorId) => {
      if (!changed(r, "appliedAt") || !r.appliedAt) return;
      await notify({ userIds: [r.userId], type: "payroll.revision_applied", title: "Your salary revision has been applied", link: "/profile", actorId });
    },
  });
  watch<ReviewSubmission>(ReviewSubmission, {
    created: async (r, actorId) => {
      await notify({ userIds: [r.reviewerId], type: "performance.review_due", title: r.type === "self" ? "Your self review is ready to fill in" : "You have a review to complete", link: "/performance", actorId });
    },
    updated: async (r, actorId) => {
      if (!changed(r, "status") || r.status !== "submitted" || r.type !== "manager") return;
      await notify({ userIds: [r.revieweeId], type: "performance.feedback_shared", title: "Your manager submitted your review", link: "/performance", actorId });
    },
  });
  watch<any>(Interview, {
    created: async (r, actorId) => {
      const c = await Candidate.findByPk(r.get("candidateId"), { attributes: ["fullName"] });
      await notify({ userIds: [r.get("interviewerId")], type: "hiring.interview_assigned", title: `You're interviewing ${c?.fullName ?? "a candidate"} (${r.get("roundName")})`, link: "/employees", actorId });
    },
  });
  watch<any>(Candidate, {
    updated: async (r, actorId) => {
      if (!changed(r, "stage")) return;
      const opening = await JobOpening.findByPk(r.get("openingId"), { attributes: ["title", "hiringManagerId"] });
      await notify({ userIds: [opening?.hiringManagerId], type: "hiring.stage_changed", title: `${r.get("fullName")} moved to ${r.get("stage")} for ${opening?.title ?? "an opening"}`, link: "/employees", actorId });
    },
  });
  watch<User>(User, {
    created: async (u, actorId) => {
      if (u.userType === "guest") return;
      await notify({ userIds: await usersWithPermission("employees:write"), type: "people.joined", title: `${u.fullName} was added as a new employee`, link: "/employees", actorId });
    },
    updated: async (u, actorId) => {
      if (!changed(u, "exitDate") || !u.exitDate) return;
      await notify({ userIds: await usersWithPermission("employees:write"), type: "people.exit_scheduled", title: `${u.fullName}'s exit is scheduled`, link: "/employees", actorId });
    },
  });

  // ---------- Revenue ----------
  watch<Lead>(Lead, {
    created: async (l, actorId) => {
      await notify({ userIds: [l.ownerId], type: "crm.lead_assigned", title: `Lead assigned to you: ${l.name}`, link: "/crm", actorId });
    },
    updated: async (l, actorId) => {
      if (!changed(l, "ownerId")) return;
      await notify({ userIds: [l.ownerId], type: "crm.lead_assigned", title: `Lead assigned to you: ${l.name}`, link: "/crm", actorId });
    },
  });
  watch<Deal>(Deal, {
    created: async (d, actorId) => {
      await notify({ userIds: [d.ownerId], type: "crm.deal_assigned", title: `Deal assigned to you: ${d.title}`, link: "/crm", actorId });
    },
    updated: async (d, actorId) => {
      if (changed(d, "ownerId")) await notify({ userIds: [d.ownerId], type: "crm.deal_assigned", title: `Deal assigned to you: ${d.title}`, link: "/crm", actorId });
      if (changed(d, "status") && d.status !== "Open") {
        await notify({ userIds: [d.ownerId, d.createdById], type: "crm.deal_closed", title: `Deal ${d.status.toLowerCase()}: ${d.title}`, link: "/crm", actorId });
      }
    },
  });
  watch<Activity>(Activity, {
    created: async (a, actorId) => {
      if (a.direction !== "Inbound" || !a.leadId) return;
      const lead = await Lead.findByPk(a.leadId, { attributes: ["name", "ownerId"] });
      await notify({ userIds: [lead?.ownerId], type: "crm.lead_replied", title: `${lead?.name ?? "A lead"} replied`, body: short(a.subject ?? a.body), link: "/crm", actorId, groupKey: `reply:${a.leadId}` });
    },
  });
  watch<Campaign>(Campaign, {
    updated: async (c, actorId) => {
      if (!changed(c, "stage") || c.stage !== "Completed") return;
      await notify({ userIds: [c.createdById], type: "outreach.campaign_finished", title: `Campaign finished: ${c.name}`, link: "/outreach", actorId });
    },
  });

  // ---------- Support ----------
  watch<InboxConversation>(InboxConversation, {
    updated: async (c, actorId) => {
      if (!changed(c, "assignedToUserId")) return;
      await notify({ userIds: [c.assignedToUserId], type: "inbox.assigned", title: `Conversation assigned to you: ${c.subject}`, link: "/inbox", actorId });
    },
  });
  watch<ChatbotTicket>(ChatbotTicket, {
    created: async (t, actorId) => {
      const to = t.assignedUserId ? [t.assignedUserId] : await usersWithPermission("chatbot:write");
      await notify({ userIds: to, type: "chatbot.ticket_created", title: `New ticket: ${t.subject}`, body: t.customerEmail, link: "/chatbot", actorId });
    },
    updated: async (t, actorId) => {
      if (!changed(t, "assignedUserId")) return;
      await notify({ userIds: [t.assignedUserId], type: "chatbot.ticket_assigned", title: `Ticket assigned to you: ${t.subject}`, link: "/chatbot", actorId });
    },
  });
  watch<any>(ChatbotTicketMessage, {
    created: async (m, actorId) => {
      if (m.get("authorUserId")) return; // staff replies aren't news to staff
      const t = await ChatbotTicket.findByPk(m.get("ticketId"), { attributes: ["id", "subject", "assignedUserId"] });
      if (!t?.assignedUserId) return;
      await notify({ userIds: [t.assignedUserId], type: "chatbot.ticket_replied", title: `New reply on: ${t.subject}`, body: short(m.get("text")), link: "/chatbot", actorId, groupKey: `ticket:${t.id}` });
    },
  });
  watch<ChatConversation>(ChatConversation, {
    updated: async (c, actorId) => {
      if (changed(c, "assignedUserId")) {
        await notify({ userIds: [c.assignedUserId], type: "chatbot.chat_assigned", title: `Chat assigned to you: ${c.visitorName ?? c.title}`, link: "/chatbot", actorId });
      }
      const was = before(c, "meta")?.handoffRequestedAt;
      const now = (c.meta as any)?.handoffRequestedAt;
      if (now && now !== was) {
        const to = c.assignedUserId ? [c.assignedUserId] : await usersWithPermission("chatbot:write");
        await notify({ userIds: to, type: "chatbot.handoff", title: `${c.visitorName ?? "A visitor"} wants to talk to a person`, body: c.lastMessagePreview ?? null, link: "/chatbot", actorId });
      }
    },
  });

  // ---------- Events & content ----------
  watch<any>(EventGuest, {
    created: async (g, actorId) => {
      const event = await Event.findByPk(g.get("eventId"), { attributes: ["id", "title"] as any });
      const name = (event as any)?.title ?? g.get("eventName") ?? "an event";
      await notify({ userIds: await usersWithPermission("content:write"), type: "events.registration", title: `${g.get("name")} registered for ${name}`, link: "/content", actorId, groupKey: `event:${g.get("eventId")}` });
    },
  });
  watch<Blog>(Blog, {
    updated: async (b, actorId) => {
      if (!changed(b, "status") || lower(b.status) !== "published") return;
      await notify({ userIds: [b.createdById], type: "content.published", title: `Published: ${b.title}`, link: "/content", actorId });
    },
  });
  watch<BlogTopic>(BlogTopic, {
    updated: async (t, actorId) => {
      if (changed(t, "blogId") && t.blogId) await notify({ userIds: [t.createdById], type: "content.topic_ready", title: `AI draft ready: ${t.title}`, link: "/content", actorId });
      else if (changed(t, "error") && t.error) await notify({ userIds: [t.createdById], type: "content.topic_failed", title: `AI draft failed: ${t.title}`, body: short(t.error), link: "/content", actorId });
    },
  });
  watch<PageShare>(PageShare, {
    created: async (s, actorId) => {
      await notify({ userIds: [s.userId], type: "pages.shared", title: "A page was shared with you", link: `/pages/${s.pageId}`, actorId });
    },
  });

  // ---------- Platform (these rows only exist in the platform workspace) ----------
  watch<Deployment>(Deployment, {
    updated: async (d) => {
      if (!changed(d, "status") || d.status === "running") return;
      await notify({ userIds: [d.triggeredById], type: "platform.deploy_finished", title: `Deploy to ${d.target} ${d.status === "success" ? "succeeded" : "failed"}`, link: "/settings" });
    },
  });
  watch<StartupIdea>(StartupIdea, {
    created: async (i) => {
      await notify({ userIds: await usersWithPermission(null), type: "platform.startup_idea", title: `New startup idea from ${i.name}`, body: short(i.idea), link: "/startup-ideas" });
    },
  });
  watch<Organization>(Organization, {
    created: async (o) => {
      if (o.isPlatform) return;
      const platform = await Organization.findOne({ where: { isPlatform: true }, attributes: ["id"] });
      if (!platform) return;
      await runForOrg(platform.id, async () => {
        await notify({ userIds: await usersWithPermission(null), type: "platform.new_tenant", title: `New workspace: ${o.name}`, link: "/provisioning" });
      }, { label: "notify" });
    },
  });
}
