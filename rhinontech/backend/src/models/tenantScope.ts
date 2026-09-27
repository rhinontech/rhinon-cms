import { DataTypes, ModelStatic, Model, Op } from "sequelize";
import { sequelize } from "../config/database";
import { currentOrganizationId, getTenantContext, isStrict } from "../services/tenantContext";

// Tenant-owned models. Everything here gets an `organizationId` column and is
// filtered automatically by the hooks below.
//
// Imported from the individual model files rather than ./index to avoid a cycle
// (index imports this module at the end of its own setup).
import { User } from "./User";
import { Role } from "./Role";
import { InboxConversation } from "./InboxConversation";
import { InboxMessage } from "./InboxMessage";
import { InboxEmail } from "./InboxEmail";
import { Payroll } from "./Payroll";
import { Payslip } from "./Payslip";
import { Task } from "./Task";
import { Subtask } from "./Subtask";
import { TaskComment } from "./TaskComment";
import { TaskTag } from "./TaskTag";
import { TaskDependency } from "./TaskDependency";
import { TaskAttachment } from "./TaskAttachment";
import { TaskActivity } from "./TaskActivity";
import { TimeEntry } from "./TimeEntry";
import { Attendance } from "./Attendance";
import { AttendanceRequest } from "./AttendanceRequest";
import { AttendancePolicy } from "./AttendancePolicy";
import { Project } from "./Project";
import { ProjectMember } from "./ProjectMember";
import { ClientRequest } from "./ClientRequest";
import { Team } from "./Team";
import { TeamMember } from "./TeamMember";
import { WorkflowStatus } from "./WorkflowStatus";
import { FieldDefinition } from "./FieldDefinition";
import { Lead } from "./Lead";
import { Campaign } from "./Campaign";
import { CampaignTemplate } from "./CampaignTemplate";
import { CampaignActivity } from "./CampaignActivity";
import { ContactGroup } from "./ContactGroup";
import { ContactGroupMember } from "./ContactGroupMember";
import { LeaveType } from "./LeaveType";
import { LeaveBalance } from "./LeaveBalance";
import { LeaveRequest } from "./LeaveRequest";
import { ReviewCycle } from "./ReviewCycle";
import { ReviewGoal } from "./ReviewGoal";
import { ReviewSubmission } from "./ReviewSubmission";
import { Document } from "./Document";
import { LetterTemplate } from "./LetterTemplate";
import { LinkedInToken } from "./LinkedInToken";
import { GoogleCalendarToken } from "./GoogleCalendarToken";
import { Site } from "./Site";
import { Blog } from "./Blog";
import { CaseStudy } from "./CaseStudy";
import { Event } from "./Event";
import { EventGuest } from "./EventGuest";
import { EventEmailTemplate } from "./EventEmailTemplate";
import { EventEnrollmentEmail } from "./EventEnrollmentEmail";
import { EventCertificateTemplate } from "./EventCertificateTemplate";
import { MailboxAddress } from "./MailboxAddress";
import { Page } from "./Page";
import { PageShare } from "./PageShare";
import { PageAttachment } from "./PageAttachment";
import { Workflow } from "./Workflow";
import { WorkflowEnrollment } from "./WorkflowEnrollment";
import { Account } from "./Account";
import { PipelineStage } from "./PipelineStage";
import { Deal } from "./Deal";
import { Activity } from "./Activity";
import { SavedView } from "./SavedView";
import { Unsubscribe } from "./Unsubscribe";
import { DocsAccess } from "./DocsAccess";
import { StartupIdea } from "./StartupIdea";
import { Deployment } from "./Deployment";
import { PageView } from "./PageView";
import { Visitor } from "./Visitor";

/**
 * Every model whose rows belong to exactly one organization.
 *
 * Deliberately NOT in this list:
 *   - Organization  — the tenant itself
 *   - Permission    — a global catalog; per-org grants live on Role, which IS scoped
 *   - RolePermission— reached only through a scoped Role
 */
export const TENANT_MODELS: ModelStatic<any>[] = [
  User, Role,
  InboxConversation, InboxMessage, InboxEmail,
  Payroll, Payslip,
  Task, Subtask, TaskComment, TaskTag, TaskDependency, TaskAttachment, TaskActivity, TimeEntry,
  Attendance, AttendanceRequest, AttendancePolicy,
  Project, ProjectMember, ClientRequest, Team, TeamMember, WorkflowStatus, FieldDefinition,
  Lead, Campaign, CampaignTemplate, CampaignActivity, ContactGroup, ContactGroupMember,
  LeaveType, LeaveBalance, LeaveRequest,
  ReviewCycle, ReviewGoal, ReviewSubmission,
  Document, LetterTemplate,
  LinkedInToken, GoogleCalendarToken,
  Site, Blog, CaseStudy, Event, EventGuest,
  EventEmailTemplate, EventEnrollmentEmail, EventCertificateTemplate,
  MailboxAddress,
  Page, PageShare, PageAttachment,
  Workflow, WorkflowEnrollment,
  Account, PipelineStage, Deal, Activity, SavedView,
  Unsubscribe, DocsAccess,
  StartupIdea, Deployment,
  PageView, Visitor,
];

const TENANT_MODEL_NAMES = new Set(TENANT_MODELS.map((m) => m.name));

export function isTenantModel(model: unknown): boolean {
  const name = (model as ModelStatic<any>)?.name;
  return typeof name === "string" && TENANT_MODEL_NAMES.has(name);
}

/** Marks options we've already touched, so nested calls don't double-filter. */
const SCOPED = Symbol("tenantScopeApplied");

/**
 * Adds `organizationId` to a model at runtime instead of editing 60 model files.
 *
 * One definition means a model added later cannot quietly miss the column —
 * assertTenantColumns() fails the boot if it does.
 *
 * Nullable on purpose: the boot migration backfills existing rows and only then
 * applies SET NOT NULL, so sync({ alter }) never has to fight a populated table.
 */
function ensureOrgAttribute(model: ModelStatic<any>) {
  const raw = model.rawAttributes as Record<string, unknown>;
  if (raw.organizationId) return;
  raw.organizationId = {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: "organizations", key: "id" },
  };
  // refreshAttributes is runtime-only in the v6 typings.
  (model as unknown as { refreshAttributes(): void }).refreshAttributes();
}

function unscopedQueryDetected(modelName: string, operation: string) {
  const ctx = getTenantContext();
  if (ctx?.mode === "system") return; // declared out loud via runAsSystem()

  const message =
    `[Tenancy] ${operation} on ${modelName} ran with no tenant context. ` +
    `Wrap it in runForOrg() or, if it is genuinely cross-tenant, runAsSystem("<why>").`;

  if (isStrict()) throw new Error(message);
  console.warn(message);
}

function andWhere(existing: unknown, organizationId: string) {
  const scope = { organizationId };
  if (existing === undefined || existing === null) return scope;
  return { [Op.and]: [scope, existing] };
}

/** Applies the org filter to includes whose parent query isn't itself scoped. */
function scopeIncludes(includes: any, organizationId: string) {
  if (!Array.isArray(includes)) return;
  for (const inc of includes) {
    if (!inc) continue;
    const model = typeof inc === "function" ? inc : inc.model;
    if (isTenantModel(model) && typeof inc === "object") {
      inc.where = andWhere(inc.where, organizationId);
    }
    if (typeof inc === "object" && inc.include) scopeIncludes(inc.include, organizationId);
  }
}

export function installTenantScope() {
  for (const model of TENANT_MODELS) ensureOrgAttribute(model);

  /**
   * Hooks are registered PER MODEL, not via sequelize.addHook.
   *
   * Sequelize's findAll/count do not set `options.model` before running
   * beforeFind — only update/destroy/bulkCreate/upsert do. A global hook would
   * therefore have no reliable way to tell which model it is filtering and
   * would silently scope nothing on the single most common operation. Capturing
   * the model in a closure removes the guesswork.
   */
  for (const model of TENANT_MODELS) {
    const modelName = model.name;

    const scopeRead = (operation: string) => (options: any) => {
      if (!options || options[SCOPED]) return;
      const orgId = currentOrganizationId();
      if (!orgId) {
        unscopedQueryDetected(modelName, operation);
        return;
      }
      options.where = andWhere(options.where, orgId);
      options[SCOPED] = true;
    };

    model.addHook("beforeFind", scopeRead("find"));
    model.addHook("beforeCount", scopeRead("count"));
    // Bulk update/destroy never load instances, so the filter has to land on
    // the WHERE clause or the statement crosses tenants wholesale.
    model.addHook("beforeBulkUpdate", scopeRead("bulkUpdate"));
    model.addHook("beforeBulkDestroy", scopeRead("bulkDestroy"));

    const stamp = (operation: string) => (instance: Model) => {
      const orgId = currentOrganizationId();
      const current = (instance as any).organizationId as string | null | undefined;

      if (!orgId) {
        // A system-context write must name its org explicitly, or the row lands
        // ownerless and is invisible to every tenant query afterwards.
        if (!current) unscopedQueryDetected(modelName, operation);
        return;
      }
      if (!current) {
        (instance as any).organizationId = orgId;
        return;
      }
      if (current !== orgId) {
        throw new Error(
          `[Tenancy] Refusing ${operation} on ${modelName}: row belongs to ` +
            `organization ${current} but the request is scoped to ${orgId}.`
        );
      }
    };

    model.addHook("beforeCreate", stamp("create"));
    model.addHook("beforeUpdate", stamp("update"));
    model.addHook("beforeDestroy", stamp("destroy"));
    model.addHook("beforeBulkCreate", (instances: Model[]) => {
      const apply = stamp("bulkCreate");
      for (const instance of instances) apply(instance);
    });
  }

  // A non-tenant root (Organization, Permission, the RolePermission join) can
  // still join out to tenant rows. Include entries DO carry `.model`, so the
  // walker works where the root-level hook could not.
  for (const model of Object.values(sequelize.models) as ModelStatic<any>[]) {
    if (isTenantModel(model)) continue;
    model.addHook("beforeFind", (options: any) => {
      const orgId = currentOrganizationId();
      if (orgId && options?.include) scopeIncludes(options.include, orgId);
    });
  }
}

/** Boot guard: a tenant model without the column would silently leak. */
export function assertTenantColumns() {
  const missing = TENANT_MODELS.filter((m) => !(m.rawAttributes as any).organizationId);
  if (missing.length) {
    throw new Error(
      `[Tenancy] Missing organizationId on: ${missing.map((m) => m.name).join(", ")}`
    );
  }
}

/**
 * Strips tenancy keys from client-supplied input.
 *
 * Several routes do `Model.create({ ...req.body })`. Now that organizationId
 * decides which tenant owns a row, letting it arrive from the browser is
 * mass-assignment straight across the isolation boundary. The write hooks would
 * refuse a mismatch anyway, but failing at the edge gives a 400 instead of a
 * 500 and keeps the refusal legible.
 */
export function stripTenantKeys<T extends Record<string, unknown>>(body: T): T {
  if (!body || typeof body !== "object") return body;
  const { organizationId: _ignored, ...rest } = body as Record<string, unknown>;
  return rest as T;
}
