/**
 * Runs the boot migration + model sync against DATABASE_URL, then exits.
 *
 * Same sequence server.ts performs at startup, minus the cron jobs and the
 * listener — so the schema change can be rehearsed against a scratch database
 * before it runs anywhere real:
 *   DATABASE_URL=postgres://…/rhinon_local npx ts-node --transpile-only src/scripts/runSiteMigration.ts
 */
import { sequelize } from "../config/database";
import { syncDatabase } from "../models";
import { runTenancyMigration, auditOrphanRows } from "../services/tenancyMigration";
import { runAsSystem } from "../services/tenantContext";

async function main() {
  await runAsSystem("migration-rehearsal", async () => {
    await sequelize.authenticate();
    console.log("Database connected:", sequelize.getDatabaseName());

    const tenancy = await runTenancyMigration();
    console.log(
      `[Tenancy] ${tenancy.columnsAdded} column(s) added · ${tenancy.rowsBackfilled} row(s) adopted · ` +
        `${tenancy.sitesCreated} site(s), ${tenancy.contentMapped} content row(s) · ` +
        `${tenancy.moduleRowsMapped} module row(s) assigned to a site`
    );

    await syncDatabase();
    console.log("Models synced");

    const orphans = await auditOrphanRows();
    console.log(
      orphans.length
        ? "[Tenancy] orphans: " + orphans.map((o) => `${o.table}=${o.orphans}`).join(", ")
        : "[Tenancy] no orphan rows"
    );
  });
  await sequelize.close();
}

main().catch(async (err) => {
  console.error(err);
  await sequelize.close().catch(() => {});
  process.exit(1);
});
