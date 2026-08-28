import { sequelize } from "./database";
import { Project } from "../models";

/**
 * One-off: give every pre-existing project an explicit owner.
 *
 * The access resolver already falls back to createdById while ownerId is null,
 * so this is not required for correctness — it just makes ownership explicit so
 * that transferring a project later means something.
 */
async function run() {
  await sequelize.authenticate();

  const [affected] = await Project.update(
    { ownerId: sequelize.col("createdById") as any },
    { where: { ownerId: null as any } }
  );

  const orphans = await Project.count({ where: { ownerId: null as any } });
  console.log(`[Backfill] Project owners set: ${affected}`);
  if (orphans > 0) {
    console.log(`[Backfill] ${orphans} project(s) still have no owner (no createdById either) — these stay workspace-visible.`);
  }

  await sequelize.close();
}

run().catch((err) => {
  console.error("[Backfill] Failed:", err.message);
  process.exit(1);
});
