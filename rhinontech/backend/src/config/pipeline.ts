import { PipelineStage, DEFAULT_STAGES } from "../models/PipelineStage";

/**
 * Seeds the default deal stages the first time the app boots against a database
 * that has none. Never touches existing rows, so renames/reorders made in the UI
 * survive restarts (same contract as syncPermissionCatalog).
 */
export async function seedPipelineStages(): Promise<{ total: number; created: number }> {
  const existing = await PipelineStage.count();
  if (existing > 0) return { total: existing, created: 0 };

  const rows = await PipelineStage.bulkCreate(DEFAULT_STAGES);
  return { total: rows.length, created: rows.length };
}
