import { DataTypes, ModelStatic, Model, Op } from "sequelize";
import { currentSiteFilter, currentSiteId } from "../services/siteContext";

// Business models that belong to one brand within a workspace.
//
// Imported from the individual files rather than ./index to avoid a cycle
// (index imports this module during its own setup), exactly as tenantScope does.
import { InboxConversation } from "./InboxConversation";
import { InboxMessage } from "./InboxMessage";
import { InboxEmail } from "./InboxEmail";
import { Lead } from "./Lead";
import { Account } from "./Account";
import { Deal } from "./Deal";
import { Activity } from "./Activity";
import { Campaign } from "./Campaign";
import { CampaignTemplate } from "./CampaignTemplate";
import { ContactGroup } from "./ContactGroup";
import { Workflow } from "./Workflow";
import { WorkflowEnrollment } from "./WorkflowEnrollment";
import { PageView } from "./PageView";
import { Visitor } from "./Visitor";

/**
 * Site-owned models, by module:
 *
 *   Inbox       InboxConversation, InboxMessage, InboxEmail
 *   CRM         Lead, Account, Deal, Activity
 *   Outreach    Campaign, CampaignTemplate, ContactGroup
 *   Automation  Workflow, WorkflowEnrollment
 *   Analytics   PageView, Visitor
 *
 * Deliberately NOT here:
 *   - Blog / CaseStudy / Event — already carry siteId and are filtered
 *     explicitly by the Content routes; auto-scoping them would double up.
 *   - PipelineStage, WorkflowStatus, FieldDefinition, SavedView — workspace
 *     configuration, shared by every brand. Splitting them would mean
 *     provisioning a fresh pipeline per site and would strand saved filters.
 *   - CampaignActivity, ContactGroupMember, Unsubscribe — child rows only ever
 *     reached through a parent that IS scoped, plus a suppression list that must
 *     stay workspace-wide (unsubscribing from one brand's mail is a global "no").
 */
export const SITE_MODELS: ModelStatic<any>[] = [
  InboxConversation, InboxMessage, InboxEmail,
  Lead, Account, Deal, Activity,
  Campaign, CampaignTemplate, ContactGroup,
  Workflow, WorkflowEnrollment,
  PageView, Visitor,
];

const SITE_MODEL_NAMES = new Set(SITE_MODELS.map((m) => m.name));

export function isSiteModel(model: unknown): boolean {
  const name = (model as ModelStatic<any>)?.name;
  return typeof name === "string" && SITE_MODEL_NAMES.has(name);
}

/** Marks options we've already touched, so nested calls don't double-filter. */
const SCOPED = Symbol("siteScopeApplied");

function ensureSiteAttribute(model: ModelStatic<any>) {
  const raw = model.rawAttributes as Record<string, unknown>;
  if (raw.siteId) return;
  raw.siteId = {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: "sites", key: "id" },
  };
  (model as unknown as { refreshAttributes(): void }).refreshAttributes();
}

function andWhere(existing: unknown, siteId: string) {
  const scope = { siteId };
  if (existing === undefined || existing === null) return scope;
  return { [Op.and]: [scope, existing] };
}

/**
 * Adds `siteId` to the models above and filters/stamps it from the request's
 * site context.
 *
 * Read filtering is opt-in (only when the caller named a site) so that cron
 * jobs, the dashboard and cross-brand reports keep seeing the whole workspace.
 * Write stamping is not opt-in: a row created while any site is resolved gets
 * that site, or it would be invisible to every brand-scoped screen afterwards.
 *
 * Nested includes are NOT walked. A scoped parent already restricts the rows
 * that come back, and filtering children as well would hide, say, a campaign
 * activity written by the cron before site stamping existed.
 */
export function installSiteScope() {
  for (const model of SITE_MODELS) ensureSiteAttribute(model);

  for (const model of SITE_MODELS) {
    const scopeRead = (options: any) => {
      if (!options || options[SCOPED]) return;
      const siteId = currentSiteFilter();
      if (!siteId) return; // no site asked for → whole workspace, as before
      options.where = andWhere(options.where, siteId);
      options[SCOPED] = true;
    };

    model.addHook("beforeFind", scopeRead);
    model.addHook("beforeCount", scopeRead);
    model.addHook("beforeBulkUpdate", scopeRead);
    model.addHook("beforeBulkDestroy", scopeRead);

    const stamp = (instance: Model) => {
      if ((instance as any).siteId) return; // an explicit siteId always wins
      const siteId = currentSiteId();
      if (siteId) (instance as any).siteId = siteId;
    };

    model.addHook("beforeCreate", stamp);
    model.addHook("beforeBulkCreate", (instances: Model[]) => {
      for (const instance of instances) stamp(instance);
    });
  }
}

/** Boot guard: a site model without the column would silently match nothing. */
export function assertSiteColumns() {
  const missing = SITE_MODELS.filter((m) => !(m.rawAttributes as any).siteId);
  if (missing.length) {
    throw new Error(`[Sites] Missing siteId on: ${missing.map((m) => m.name).join(", ")}`);
  }
}

/** Strips `siteId` from client input — which brand a row joins is the server's call. */
export function stripSiteKeys<T extends Record<string, unknown>>(body: T): T {
  if (!body || typeof body !== "object") return body;
  const { siteId: _ignored, ...rest } = body as Record<string, unknown>;
  return rest as T;
}
