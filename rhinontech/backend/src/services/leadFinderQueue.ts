import { Op } from "sequelize";
import { Lead, ContactGroup, ContactGroupMember, LeadFinderTarget, Site } from "../models";
import { findLeads, FinderPerson, FinderResult } from "./leadFinder";
import { verifyFirstWorking } from "./emailVerifier";
import { runAsSystem, runForOrg } from "./tenantContext";
import { runForSite } from "./siteContext";

/**
 * Daily Lead Finder run: every queued company (LeadFinderTarget) gets its
 * founders found, their emails checked without sending, and the ones that
 * work added to the CRM list "Lead Finder". Campaigns are then built by hand
 * from that list.
 *
 * LEAD_FINDER_DAILY_LIMIT (default 20) caps companies per workspace per run,
 * which keeps the free tool quotas (Hunter, Serper, email checks) from
 * running dry in the first week.
 */

export const LEAD_LIST_NAME = "Lead Finder";
const DAILY_LIMIT = () => Math.max(1, parseInt(process.env.LEAD_FINDER_DAILY_LIMIT || "20", 10) || 20);
const PER_COMPANY = 3;
const DECISION_MAKER = /found|owner|ceo|chief|managing|director|partner|president|proprietor|principal|head/i;

/** Founders and owners first; if the company names none, its best-sourced people. */
function pickPeople(result: FinderResult): FinderPerson[] {
  const withEmail = result.people.filter((p) => p.email);
  const leaders = withEmail.filter((p) => DECISION_MAKER.test(p.title ?? ""));
  return (leaders.length ? leaders : withEmail).slice(0, PER_COMPANY);
}

interface AddedLead {
  name: string;
  title: string | null;
  email: string;
  emailStatus: string;
  sources: string[];
}

/** Finds, verifies and saves one company's leads. Runs inside its org and site context. */
async function processTarget(target: LeadFinderTarget): Promise<void> {
  await target.update({ status: "running", attempts: target.attempts + 1, error: null });
  try {
    const result = await findLeads({ company: target.company ?? undefined, website: target.website ?? undefined });
    if (!result.acceptsMail) throw new Error(`${result.domain} can't receive email (no mail servers).`);

    const added: AddedLead[] = [];
    const skipped: { name: string; reason: string }[] = [];
    for (const p of pickPeople(result)) {
      const { best, tried } = await verifyFirstWorking([p.email!, ...p.alternatives]);
      if (best?.status === "verified") {
        added.push({ name: p.name, title: p.title, email: best.email, emailStatus: "verified", sources: p.sources });
      } else if (best?.status === "catchall" && (p.confidence === "found" || p.sources.length >= 2)) {
        // Catch-all domains can't confirm a mailbox, so the person needs evidence instead:
        // an address seen on their site / by a tool, or two sources agreeing they exist.
        added.push({ name: p.name, title: p.title, email: best.email, emailStatus: "catchall", sources: p.sources });
      } else if (!best && p.confidence === "found" && tried.every((t) => t.status === "unknown")) {
        // Couldn't check (quota) but a tool or their website lists this exact address.
        added.push({ name: p.name, title: p.title, email: p.email!, emailStatus: "found", sources: p.sources });
      } else {
        skipped.push({ name: p.name, reason: best?.status === "catchall" ? "only one source, and the domain accepts any address" : tried.at(-1)?.detail || "no working email" });
      }
    }

    const leadsAdded = await saveLeads(target, result, added);
    await target.update({
      status: "done",
      company: target.company || result.company,
      peopleFound: result.people.length,
      leadsAdded,
      processedAt: new Date(),
      result: { domain: result.domain, added, skipped, notes: result.notes },
    });
  } catch (err: any) {
    await target.update({ status: "failed", error: String(err?.message || err).slice(0, 500), processedAt: new Date() });
  }
}

async function saveLeads(target: LeadFinderTarget, result: FinderResult, added: AddedLead[]): Promise<number> {
  if (!added.length) return 0;
  const existing = await Lead.findAll({ where: { email: { [Op.in]: added.map((a) => a.email) } }, attributes: ["email"] });
  const known = new Set(existing.map((l) => l.email.toLowerCase()));
  const fresh = added.filter((a) => !known.has(a.email));
  if (!fresh.length) return 0;

  const created = await Lead.bulkCreate(
    fresh.map((a) => ({
      name: a.name,
      email: a.email,
      company: result.company,
      title: a.title,
      website: result.website,
      companyLinkedinUrl: result.companyInfo?.linkedin ?? null,
      employeeCount: result.companyInfo?.employees ?? null,
      industry: result.companyInfo?.industry ?? null,
      emailStatus: a.emailStatus,
      source: "Lead Finder",
      status: "New",
      raw: { leadFinder: { sources: a.sources, targetId: target.id } },
    })) as any[]
  );
  const [group] = await ContactGroup.findOrCreate({
    where: { name: LEAD_LIST_NAME },
    defaults: { name: LEAD_LIST_NAME, description: "Added automatically by the daily Lead Finder run.", createdById: target.createdById },
  });
  await ContactGroupMember.bulkCreate(
    created.map((l) => ({ contactGroupId: group.id, leadId: l.id, addedById: target.createdById })) as any[],
    { ignoreDuplicates: true }
  );
  return created.length;
}

const running = new Set<string>(); // org ids with a run in progress

/** Processes up to the daily limit of one workspace's queue, oldest first. */
export async function runQueueForOrg(organizationId: string): Promise<number> {
  if (running.has(organizationId)) return 0;
  running.add(organizationId);
  try {
    return await runForOrg(organizationId, async () => {
      const targets = await LeadFinderTarget.findAll({
        where: { status: "queued" },
        order: [["createdAt", "ASC"]],
        limit: DAILY_LIMIT(),
      });
      for (const t of targets) {
        const siteId = (t as any).siteId as string | null;
        const site = siteId ? await Site.findByPk(siteId, { attributes: ["id", "slug"] }) : null;
        // Leads land in the same brand the company was queued under.
        await runForSite(site ? { id: site.id, slug: (site as any).slug } : null, true, () => processTarget(t));
      }
      return targets.length;
    }, { label: "lead-finder" });
  } finally {
    running.delete(organizationId);
  }
}

/** Cron entry: every workspace with queued companies. Stuck "running" rows are requeued first. */
export async function runLeadFinderQueue(): Promise<void> {
  const orgIds = await runAsSystem("cron:lead-finder", async () => {
    await LeadFinderTarget.update(
      { status: "queued" },
      { where: { status: "running", updatedAt: { [Op.lt]: new Date(Date.now() - 2 * 60 * 60_000) } } }
    );
    const rows = await LeadFinderTarget.findAll({ where: { status: "queued" }, attributes: ["organizationId"], group: ["organizationId"] });
    return rows.map((r) => (r as any).organizationId as string).filter(Boolean);
  });
  for (const orgId of orgIds) {
    const n = await runQueueForOrg(orgId);
    if (n) console.log(`[Lead Finder] Processed ${n} companies for org ${orgId}.`);
  }
}
