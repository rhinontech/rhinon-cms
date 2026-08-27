import { Op } from "sequelize";
import { Lead, CampaignActivity } from "../models";
import { enrichLeadWithAI } from "./gemini";
import { fetchWebsiteText } from "./research";

/**
 * Refreshes stale AI enrichment in the background.
 *
 * Company context rots — people change jobs, funding lands, the pitch that made
 * sense six months ago doesn't. This re-runs enrichment for leads whose intel is
 * older than the staleness window, oldest first.
 *
 * Deliberately small and rate-limited: enrichment costs a model call and a page
 * fetch each, so this trickles rather than storms. Off unless
 * LEAD_REENRICH_ENABLED is set.
 */
const STALE_DAYS = Number(process.env.LEAD_REENRICH_STALE_DAYS || 90);
const BATCH_SIZE = Number(process.env.LEAD_REENRICH_BATCH || 15);
const GAP_MS = Number(process.env.LEAD_REENRICH_GAP_MS || 2000);

export function isReEnrichmentEnabled(): boolean {
  return String(process.env.LEAD_REENRICH_ENABLED || "").toLowerCase() === "true";
}

export async function runReEnrichmentCycle(): Promise<{ scanned: number; refreshed: number; failed: number }> {
  if (!isReEnrichmentEnabled()) return { scanned: 0, refreshed: 0, failed: 0 };

  const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);

  // Only leads still worth spending a model call on: dead ends are skipped.
  const candidates = await Lead.findAll({
    where: {
      enrichment: { [Op.ne]: null as any },
      updatedAt: { [Op.lt]: cutoff },
      status: { [Op.notIn]: ["Bounced", "Unsubscribed"] },
      lifecycleStage: { [Op.notIn]: ["Unqualified", "Customer"] },
    },
    order: [["updatedAt", "ASC"]],
    limit: BATCH_SIZE,
  });

  let refreshed = 0;
  let failed = 0;

  for (const lead of candidates) {
    try {
      const websiteText = await fetchWebsiteText(lead.website);
      const enrichment = await enrichLeadWithAI(lead.name, lead.company, {
        title: lead.title,
        industry: lead.industry,
        keywords: lead.keywords,
        technologies: lead.technologies,
        website: lead.website,
        websiteText,
      });

      if (enrichment.error) {
        failed++;
        continue;
      }

      await lead.update({ enrichment });
      await CampaignActivity.create({
        leadId: lead.id,
        campaignId: lead.campaignId,
        type: "Enrichment",
        content: "Scheduled re-enrichment refreshed this lead's intel.",
        generatedContent: JSON.stringify(enrichment),
      });
      refreshed++;
    } catch (err: any) {
      console.error(`[Re-enrichment] Failed for lead ${lead.id}:`, err.message);
      failed++;
    }

    // Space the calls out so a batch never looks like a burst to the provider.
    if (GAP_MS > 0) await new Promise((resolve) => setTimeout(resolve, GAP_MS));
  }

  return { scanned: candidates.length, refreshed, failed };
}
