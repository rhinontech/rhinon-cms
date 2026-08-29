import { Role } from "./Role";
import { Permission } from "./Permission";
import { User } from "./User";
import { InboxConversation } from "./InboxConversation";
import { InboxMessage } from "./InboxMessage";
import { InboxEmail } from "./InboxEmail";
import { Payroll } from "./Payroll";
import { Payslip } from "./Payslip";
import { Task } from "./Task";
import { Attendance } from "./Attendance";
import { Project } from "./Project";
import { ClientRequest } from "./ClientRequest";
import { Lead } from "./Lead";
import { CampaignTemplate } from "./CampaignTemplate";
import { Campaign } from "./Campaign";
import { CampaignActivity } from "./CampaignActivity";
import { ContactGroup } from "./ContactGroup";
import { ContactGroupMember } from "./ContactGroupMember";
import { AttendanceRequest } from "./AttendanceRequest";
import { AttendancePolicy } from "./AttendancePolicy";
import { LeaveType } from "./LeaveType";
import { LeaveBalance } from "./LeaveBalance";
import { LeaveRequest } from "./LeaveRequest";
import { ReviewCycle } from "./ReviewCycle";
import { ReviewGoal } from "./ReviewGoal";
import { ReviewSubmission } from "./ReviewSubmission";
import { Document } from "./Document";
import { LetterTemplate } from "./LetterTemplate";
import { LinkedInToken } from "./LinkedInToken";
import { Subtask } from "./Subtask";
import { TaskComment } from "./TaskComment";
import { TaskTag } from "./TaskTag";
import { Blog } from "./Blog";
import { CaseStudy } from "./CaseStudy";
import { Event } from "./Event";
import { PageView } from "./PageView";
import { DocsAccess } from "./DocsAccess";
import { Page } from "./Page";
import { PageShare } from "./PageShare";
import { PageAttachment } from "./PageAttachment";
import { Workflow } from "./Workflow";
import { WorkflowEnrollment } from "./WorkflowEnrollment";
import { Visitor } from "./Visitor";
import { GoogleCalendarToken } from "./GoogleCalendarToken";
import { Unsubscribe } from "./Unsubscribe";
import { Account } from "./Account";
import { PipelineStage } from "./PipelineStage";
import { Deal } from "./Deal";
import { Activity } from "./Activity";
import { SavedView } from "./SavedView";
import { Team } from "./Team";
import { TeamMember } from "./TeamMember";
import { ProjectMember } from "./ProjectMember";
import { WorkflowStatus } from "./WorkflowStatus";
import { TaskDependency } from "./TaskDependency";
import { TaskAttachment } from "./TaskAttachment";
import { FieldDefinition } from "./FieldDefinition";
import { TimeEntry } from "./TimeEntry";
import { TaskActivity } from "./TaskActivity";
import { StartupIdea } from "./StartupIdea";
import { Deployment } from "./Deployment";
import { DataTypes } from "sequelize";
import { sequelize } from "../config/database";

// RolePermission join table
const RolePermission = sequelize.define(
  "RolePermission",
  {
    roleId: { type: DataTypes.UUID, allowNull: false },
    permissionId: { type: DataTypes.UUID, allowNull: false },
  },
  { tableName: "role_permissions", timestamps: false }
);

// Role <-> Permission
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: "roleId" });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: "permissionId" });

// User <-> Role
User.belongsTo(Role, { foreignKey: "roleId", as: "role" });
Role.hasMany(User, { foreignKey: "roleId" });

// Inbox
InboxConversation.belongsTo(User, { foreignKey: "assignedToUserId", as: "assignee" });
User.hasMany(InboxConversation, { foreignKey: "assignedToUserId", as: "assignedConversations" });
InboxConversation.hasMany(InboxMessage, { foreignKey: "conversationId", as: "messages", onDelete: "CASCADE" });
InboxMessage.belongsTo(InboxConversation, { foreignKey: "conversationId", as: "conversation" });

// Payroll
Payroll.hasMany(Payslip, { foreignKey: "payrollId", as: "payslips", onDelete: "CASCADE" });
Payslip.belongsTo(Payroll, { foreignKey: "payrollId", as: "payroll" });
Payslip.belongsTo(User, { foreignKey: "userId", as: "employee" });
User.hasMany(Payslip, { foreignKey: "userId", as: "payslips" });
Payroll.belongsTo(User, { foreignKey: "processedById", as: "processedBy" });

// Tasks — two separate associations to User
Task.belongsTo(User, { foreignKey: "assigneeId", as: "assignee" });
Task.belongsTo(User, { foreignKey: "createdById", as: "creator" });
User.hasMany(Task, { foreignKey: "assigneeId", as: "assignedTasks" });
User.hasMany(Task, { foreignKey: "createdById", as: "createdTasks" });

// Task self-referencing for blockedById
Task.belongsTo(Task, { foreignKey: "blockedById", as: "blocker" });
Task.hasMany(Task, { foreignKey: "blockedById", as: "blockedTasks" });

// Subtasks
Subtask.belongsTo(Task, { foreignKey: "taskId", as: "task" });
Task.hasMany(Subtask, { foreignKey: "taskId", as: "subtasks", onDelete: "CASCADE" });

// Task Comments
TaskComment.belongsTo(Task, { foreignKey: "taskId", as: "task" });
Task.hasMany(TaskComment, { foreignKey: "taskId", as: "comments", onDelete: "CASCADE" });
TaskComment.belongsTo(User, { foreignKey: "userId", as: "author" });
User.hasMany(TaskComment, { foreignKey: "userId", as: "taskComments" });

// --- Wrike-parity task graph -------------------------------------------------

// Custom statuses (Board columns). projectId null = the company default set.
Task.belongsTo(WorkflowStatus, { foreignKey: "statusId", as: "workflowStatus" });
WorkflowStatus.hasMany(Task, { foreignKey: "statusId", as: "tasks" });
WorkflowStatus.belongsTo(Project, { foreignKey: "projectId", as: "project" });
Project.hasMany(WorkflowStatus, { foreignKey: "projectId", as: "workflowStatuses" });

// Real subitems: a child Task, not a checklist row.
Task.belongsTo(Task, { foreignKey: "parentTaskId", as: "parent" });
Task.hasMany(Task, { foreignKey: "parentTaskId", as: "children" });

// Gantt dependency graph (supersedes the single blockedById edge).
Task.hasMany(TaskDependency, { foreignKey: "successorId", as: "dependsOn", onDelete: "CASCADE" });
Task.hasMany(TaskDependency, { foreignKey: "predecessorId", as: "blocks", onDelete: "CASCADE" });
TaskDependency.belongsTo(Task, { foreignKey: "predecessorId", as: "predecessor" });
TaskDependency.belongsTo(Task, { foreignKey: "successorId", as: "successor" });

// Files tab
Task.hasMany(TaskAttachment, { foreignKey: "taskId", as: "attachments", onDelete: "CASCADE" });
TaskAttachment.belongsTo(Task, { foreignKey: "taskId", as: "task" });
TaskAttachment.belongsTo(User, { foreignKey: "uploadedById", as: "uploadedBy" });

// Custom field columns
FieldDefinition.belongsTo(Project, { foreignKey: "projectId", as: "project" });
Project.hasMany(FieldDefinition, { foreignKey: "projectId", as: "fieldDefinitions" });
FieldDefinition.belongsTo(User, { foreignKey: "createdById", as: "creator" });

// Task activity feed
Task.hasMany(TaskActivity, { foreignKey: "taskId", as: "activity", onDelete: "CASCADE" });
TaskActivity.belongsTo(Task, { foreignKey: "taskId", as: "task" });
TaskActivity.belongsTo(User, { foreignKey: "userId", as: "actor" });

// Time tracking
Task.hasMany(TimeEntry, { foreignKey: "taskId", as: "timeEntries", onDelete: "CASCADE" });
TimeEntry.belongsTo(Task, { foreignKey: "taskId", as: "task" });
TimeEntry.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(TimeEntry, { foreignKey: "userId", as: "timeEntries" });

// Task Tags
TaskTag.belongsTo(Task, { foreignKey: "taskId", as: "task" });
Task.hasMany(TaskTag, { foreignKey: "taskId", as: "tags", onDelete: "CASCADE" });

// Work projects and client requests
Project.belongsTo(User, { foreignKey: "createdById", as: "creator" });
User.hasMany(Project, { foreignKey: "createdById", as: "createdProjects" });
Task.belongsTo(Project, { foreignKey: "projectId", as: "project" });
Project.hasMany(Task, { foreignKey: "projectId", as: "tasks" });
ClientRequest.belongsTo(Project, { foreignKey: "projectId", as: "project" });
Project.hasMany(ClientRequest, { foreignKey: "projectId", as: "clientRequests" });
ClientRequest.belongsTo(User, { foreignKey: "createdById", as: "creator" });
User.hasMany(ClientRequest, { foreignKey: "createdById", as: "createdClientRequests" });

// Teams — the membership unit behind private/team-scoped projects
Team.belongsTo(User, { foreignKey: "createdById", as: "creator" });
User.hasMany(Team, { foreignKey: "createdById", as: "createdTeams" });
Team.hasMany(TeamMember, { foreignKey: "teamId", as: "members", onDelete: "CASCADE" });
TeamMember.belongsTo(Team, { foreignKey: "teamId", as: "team" });
TeamMember.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(TeamMember, { foreignKey: "userId", as: "teamMemberships" });
Team.belongsToMany(User, { through: TeamMember, foreignKey: "teamId", otherKey: "userId", as: "users" });
User.belongsToMany(Team, { through: TeamMember, foreignKey: "userId", otherKey: "teamId", as: "teams" });

Project.belongsTo(Team, { foreignKey: "teamId", as: "team" });
Team.hasMany(Project, { foreignKey: "teamId", as: "projects" });
Project.belongsTo(User, { foreignKey: "ownerId", as: "owner" });
User.hasMany(Project, { foreignKey: "ownerId", as: "ownedProjects" });

// External collaborators / explicit per-project grants
Project.hasMany(ProjectMember, { foreignKey: "projectId", as: "collaborators", onDelete: "CASCADE" });
ProjectMember.belongsTo(Project, { foreignKey: "projectId", as: "project" });
ProjectMember.belongsTo(User, { foreignKey: "userId", as: "user" });
ProjectMember.belongsTo(User, { foreignKey: "invitedById", as: "invitedBy" });
User.hasMany(ProjectMember, { foreignKey: "userId", as: "projectMemberships" });

// Attendance
Attendance.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(Attendance, { foreignKey: "userId", as: "attendance" });

AttendanceRequest.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(AttendanceRequest, { foreignKey: "userId", as: "requests" });
AttendanceRequest.belongsTo(User, { foreignKey: "processedById", as: "processor" });

AttendancePolicy.belongsTo(User, { foreignKey: "lastUpdatedById", as: "updater" });

// Leave Associations
LeaveType.hasMany(LeaveBalance, { foreignKey: "leaveTypeId", as: "balances" });
LeaveBalance.belongsTo(LeaveType, { foreignKey: "leaveTypeId", as: "leaveType" });
LeaveBalance.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(LeaveBalance, { foreignKey: "userId", as: "leaveBalances" });
LeaveRequest.belongsTo(User, { foreignKey: "userId", as: "user" });
LeaveRequest.belongsTo(User, { foreignKey: "processedById", as: "processor" });
LeaveRequest.belongsTo(LeaveType, { foreignKey: "leaveTypeId", as: "leaveType" });
User.hasMany(LeaveRequest, { foreignKey: "userId", as: "leaveRequests" });

// Performance Associations
ReviewCycle.belongsTo(User, { foreignKey: "createdById", as: "creator" });
User.hasMany(ReviewCycle, { foreignKey: "createdById", as: "createdCycles" });

ReviewGoal.belongsTo(User, { foreignKey: "userId", as: "user" });
ReviewGoal.belongsTo(ReviewCycle, { foreignKey: "cycleId", as: "cycle" });
ReviewGoal.belongsTo(User, { foreignKey: "createdById", as: "creator" });
User.hasMany(ReviewGoal, { foreignKey: "userId", as: "goals" });
ReviewCycle.hasMany(ReviewGoal, { foreignKey: "cycleId", as: "goals" });

ReviewSubmission.belongsTo(ReviewCycle, { foreignKey: "cycleId", as: "cycle" });
ReviewSubmission.belongsTo(User, { foreignKey: "revieweeId", as: "reviewee" });
ReviewSubmission.belongsTo(User, { foreignKey: "reviewerId", as: "reviewer" });
ReviewCycle.hasMany(ReviewSubmission, { foreignKey: "cycleId", as: "submissions" });
User.hasMany(ReviewSubmission, { foreignKey: "revieweeId", as: "reviewsReceived" });
User.hasMany(ReviewSubmission, { foreignKey: "reviewerId", as: "reviewsGiven" });

// Document Associations
Document.belongsTo(User, { foreignKey: "employeeId", as: "employee" });
Document.belongsTo(User, { foreignKey: "uploadedById", as: "uploader" });
User.hasMany(Document, { foreignKey: "employeeId", as: "documents" });

// Letter Templates
LetterTemplate.belongsTo(User, { foreignKey: "updatedById", as: "updatedBy" });

// Outreach Associations
Campaign.belongsTo(CampaignTemplate, { foreignKey: "templateId", as: "template" });
CampaignTemplate.hasMany(Campaign, { foreignKey: "templateId", as: "campaigns" });

Campaign.belongsTo(User, { foreignKey: "createdById", as: "creator" });
User.hasMany(Campaign, { foreignKey: "createdById", as: "createdCampaigns" });

CampaignTemplate.belongsTo(User, { foreignKey: "createdById", as: "creator" });
User.hasMany(CampaignTemplate, { foreignKey: "createdById", as: "createdTemplates" });

Lead.belongsTo(Campaign, { foreignKey: "campaignId", as: "campaign" });
Campaign.hasMany(Lead, { foreignKey: "campaignId", as: "leads" });

CampaignActivity.belongsTo(Lead, { foreignKey: "leadId", as: "lead" });
Lead.hasMany(CampaignActivity, { foreignKey: "leadId", as: "activities" });

CampaignActivity.belongsTo(Campaign, { foreignKey: "campaignId", as: "campaign" });
Campaign.hasMany(CampaignActivity, { foreignKey: "campaignId", as: "activities" });

InboxEmail.belongsTo(Campaign, { foreignKey: "campaignId", as: "campaign" });
Campaign.hasMany(InboxEmail, { foreignKey: "campaignId", as: "inboxEmails" });
InboxEmail.belongsTo(Lead, { foreignKey: "leadId", as: "lead" });
Lead.hasMany(InboxEmail, { foreignKey: "leadId", as: "inboxEmails" });

// Contact Groups (many-to-many over Lead)
Lead.belongsToMany(ContactGroup, { through: ContactGroupMember, foreignKey: "leadId", otherKey: "contactGroupId", as: "groups" });
ContactGroup.belongsToMany(Lead, { through: ContactGroupMember, foreignKey: "contactGroupId", otherKey: "leadId", as: "members" });
ContactGroup.belongsTo(User, { foreignKey: "createdById", as: "creator" });
User.hasMany(ContactGroup, { foreignKey: "createdById", as: "createdContactGroups" });
ContactGroupMember.belongsTo(Lead, { foreignKey: "leadId", as: "lead" });
ContactGroupMember.belongsTo(ContactGroup, { foreignKey: "contactGroupId", as: "group" });

// Content (CMS) Associations
Blog.belongsTo(User, { foreignKey: "createdById", as: "author" });
User.hasMany(Blog, { foreignKey: "createdById", as: "blogs" });
CaseStudy.belongsTo(User, { foreignKey: "createdById", as: "author" });
User.hasMany(CaseStudy, { foreignKey: "createdById", as: "caseStudies" });
Event.belongsTo(User, { foreignKey: "createdById", as: "author" });
User.hasMany(Event, { foreignKey: "createdById", as: "events" });

// Pages (Notion-like docs) Associations
Page.belongsTo(User, { foreignKey: "ownerId", as: "owner" });
User.hasMany(Page, { foreignKey: "ownerId", as: "ownedPages" });
Page.belongsTo(Page, { foreignKey: "parentId", as: "parent" });
Page.hasMany(Page, { foreignKey: "parentId", as: "children" });
Page.hasMany(PageShare, { foreignKey: "pageId", as: "shares", onDelete: "CASCADE" });
PageShare.belongsTo(Page, { foreignKey: "pageId", as: "page" });
PageShare.belongsTo(User, { foreignKey: "userId", as: "user" });
Page.hasMany(PageAttachment, { foreignKey: "pageId", as: "attachments", onDelete: "CASCADE" });
PageAttachment.belongsTo(Page, { foreignKey: "pageId", as: "page" });
PageAttachment.belongsTo(User, { foreignKey: "uploadedById", as: "uploadedBy" });
Workflow.hasMany(WorkflowEnrollment, { foreignKey: "workflowId", as: "enrollments", onDelete: "CASCADE" });
WorkflowEnrollment.belongsTo(Workflow, { foreignKey: "workflowId", as: "workflow" });

// ---------------------------------------------------------------------------
// CRM (Phase 1): Accounts, Deals, Activities
// ---------------------------------------------------------------------------
Account.belongsTo(User, { foreignKey: "ownerId", as: "owner" });
User.hasMany(Account, { foreignKey: "ownerId", as: "ownedAccounts" });

Lead.belongsTo(Account, { foreignKey: "accountId", as: "account" });
Account.hasMany(Lead, { foreignKey: "accountId", as: "contacts" });

Lead.belongsTo(User, { foreignKey: "ownerId", as: "owner" });
User.hasMany(Lead, { foreignKey: "ownerId", as: "ownedLeads" });

Deal.belongsTo(Account, { foreignKey: "accountId", as: "account" });
Account.hasMany(Deal, { foreignKey: "accountId", as: "deals" });

Deal.belongsTo(Lead, { foreignKey: "primaryLeadId", as: "primaryLead" });
Lead.hasMany(Deal, { foreignKey: "primaryLeadId", as: "deals" });

Deal.belongsTo(User, { foreignKey: "ownerId", as: "owner" });
User.hasMany(Deal, { foreignKey: "ownerId", as: "ownedDeals" });

Deal.belongsTo(PipelineStage, { foreignKey: "stageId", as: "stage" });
PipelineStage.hasMany(Deal, { foreignKey: "stageId", as: "deals" });

Activity.belongsTo(Lead, { foreignKey: "leadId", as: "lead" });
Lead.hasMany(Activity, { foreignKey: "leadId", as: "timeline" });

Activity.belongsTo(Account, { foreignKey: "accountId", as: "account" });
Account.hasMany(Activity, { foreignKey: "accountId", as: "timeline" });

Activity.belongsTo(Deal, { foreignKey: "dealId", as: "deal" });
Deal.hasMany(Activity, { foreignKey: "dealId", as: "timeline" });

Activity.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(Activity, { foreignKey: "userId", as: "activities" });

SavedView.belongsTo(User, { foreignKey: "createdById", as: "creator" });
User.hasMany(SavedView, { foreignKey: "createdById", as: "savedViews" });

// Won deals handed to delivery
Project.belongsTo(Deal, { foreignKey: "dealId", as: "deal" });
Deal.hasOne(Project, { foreignKey: "dealId", as: "project" });
Project.belongsTo(Account, { foreignKey: "accountId", as: "account" });
Account.hasMany(Project, { foreignKey: "accountId", as: "projects" });

// Follow-up tasks hanging off CRM records
Task.belongsTo(Lead, { foreignKey: "leadId", as: "lead" });
Lead.hasMany(Task, { foreignKey: "leadId", as: "tasks" });
Task.belongsTo(Deal, { foreignKey: "dealId", as: "deal" });
Deal.hasMany(Task, { foreignKey: "dealId", as: "tasks" });
Task.belongsTo(Account, { foreignKey: "accountId", as: "account" });
Account.hasMany(Task, { foreignKey: "accountId", as: "tasks" });

export {
  Role, Permission, RolePermission,
  User,
  InboxConversation, InboxMessage, InboxEmail,
  Payroll, Payslip,
  Task,
  Attendance,
  Project,
  ClientRequest,
  Lead,
  CampaignTemplate,
  Campaign,
  CampaignActivity,
  ContactGroup,
  ContactGroupMember,
  AttendanceRequest,
  AttendancePolicy,
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  ReviewCycle,
  ReviewGoal,
  ReviewSubmission,
  Document,
  LetterTemplate,
  LinkedInToken,
  Subtask,
  TaskComment,
  TaskTag,
  Blog,
  CaseStudy,
  Event,
  PageView,
  DocsAccess,
  Page,
  PageShare,
  PageAttachment,
  Workflow,
  WorkflowEnrollment,
  Visitor,
  GoogleCalendarToken,
  Unsubscribe,
  Account,
  PipelineStage,
  Deal,
  Activity,
  SavedView,
  Team,
  TeamMember,
  ProjectMember,
  WorkflowStatus,
  TaskDependency,
  TaskAttachment,
  FieldDefinition,
  TimeEntry,
  TaskActivity,
  StartupIdea,
  Deployment,
};

export async function syncDatabase(force = false) {
  // alter: { drop: false } — adds new columns/tables but never drops constraints,
  // avoiding the SequelizeUnknownConstraintError on PostgreSQL when FK constraints
  // don't already exist and Sequelize tries to DROP them before re-adding.
  await sequelize.sync({ force, alter: { drop: false } });
}
