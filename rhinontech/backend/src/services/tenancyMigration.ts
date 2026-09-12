import { QueryTypes } from "sequelize";
import { sequelize } from "../config/database";
import { Organization } from "../models/Organization";
import { TENANT_MODELS } from "../models/tenantScope";

/**
 * Brings an existing single-tenant database up to the multi-tenant schema.
 *
 * Runs on every boot, BEFORE syncDatabase(). That ordering is the whole point:
 * sync({ alter }) cannot add a populated table's organizationId, cannot convert
 * a single-column UNIQUE into a composite one (alter never drops constraints,
 * deliberately), and cannot backfill. So this does those three things first and
 * hands sync a schema it can reconcile.
 *
 * Idempotent and additive — safe to re-run, drops no data. The only destructive
 * step is dropping the legacy single-column unique constraints that multi-tenancy
 * makes impossible; the composite replacements are declared on the models and
 * created by the sync that follows.
 */

export const PLATFORM_ORG = {
  name: "Rhinon Tech",
  slug: "rhinontech",
  // The platform org keeps the apex domain; tenants get <slug>.rhinontech.in.
  emailDomain: process.env.PLATFORM_EMAIL_DOMAIN || "rhinontech.in",
};

/** Legacy global uniques that cannot survive more than one organization. */
const LEGACY_UNIQUES: { table: string; column: string }[] = [
  { table: "roles", column: "slug" },
  { table: "users", column: "personalEmail" },
  { table: "leads", column: "email" },
  { table: "blogs", column: "slug" },
  { table: "case_studies", column: "slug" },
  { table: "events", column: "slug" },
  { table: "campaigns", column: "slug" },
  { table: "accounts", column: "domain" },
  { table: "letter_templates", column: "key" },
];

async function tableExists(table: string): Promise<boolean> {
  const rows = await sequelize.query<{ exists: boolean }>(
    `SELECT to_regclass(:qualified) IS NOT NULL AS exists`,
    { type: QueryTypes.SELECT, replacements: { qualified: `public."${table}"` } }
  );
  return Boolean(rows[0]?.exists);
}

/**
 * Drops UNIQUE constraints and bare unique indexes that cover exactly this one
 * column. Discovered from the catalog rather than guessed by name, because
 * Sequelize's inline uniques and its addIndex path produce different names.
 */
async function dropSingleColumnUnique(table: string, column: string): Promise<string[]> {
  const dropped: string[] = [];

  const constraints = await sequelize.query<{ conname: string }>(
    `SELECT con.conname
       FROM pg_constraint con
       JOIN pg_class rel ON rel.oid = con.conrelid
       JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE con.contype = 'u'
        AND nsp.nspname = 'public'
        AND rel.relname = :table
        AND array_length(con.conkey, 1) = 1
        AND (SELECT attname FROM pg_attribute
              WHERE attrelid = rel.oid AND attnum = con.conkey[1]) = :column`,
    { type: QueryTypes.SELECT, replacements: { table, column } }
  );
  for (const { conname } of constraints) {
    await sequelize.query(`ALTER TABLE "${table}" DROP CONSTRAINT "${conname}"`);
    dropped.push(conname);
  }

  const indexes = await sequelize.query<{ indexname: string }>(
    `SELECT i.relname AS indexname
       FROM pg_index x
       JOIN pg_class i ON i.oid = x.indexrelid
       JOIN pg_class t ON t.oid = x.indrelid
       JOIN pg_namespace nsp ON nsp.oid = t.relnamespace
      WHERE x.indisunique
        AND NOT x.indisprimary
        AND nsp.nspname = 'public'
        AND t.relname = :table
        AND x.indnatts = 1
        AND (SELECT attname FROM pg_attribute
              WHERE attrelid = t.oid AND attnum = x.indkey[0]) = :column
        AND NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conindid = i.oid)`,
    { type: QueryTypes.SELECT, replacements: { table, column } }
  );
  for (const { indexname } of indexes) {
    await sequelize.query(`DROP INDEX "${indexname}"`);
    dropped.push(indexname);
  }

  return dropped;
}

export async function runTenancyMigration(): Promise<{
  defaultOrgId: string;
  columnsAdded: number;
  rowsBackfilled: number;
  uniquesDropped: string[];
}> {
  // 1. The organizations table must exist before anything can reference it.
  await Organization.sync();

  // 2. The platform org — everything that exists today belongs to it.
  const [org] = await Organization.findOrCreate({
    where: { slug: PLATFORM_ORG.slug },
    defaults: {
      name: PLATFORM_ORG.name,
      slug: PLATFORM_ORG.slug,
      emailDomain: PLATFORM_ORG.emailDomain,
      isPlatform: true,
      status: "active",
      plan: "enterprise",
      sesStatus: "verified",
      settings: { displayName: PLATFORM_ORG.name, legalName: "Rhinon Tech Private Limited" },
    },
  });

  let columnsAdded = 0;
  let rowsBackfilled = 0;

  // 3 + 4. Add the column wherever it is missing, then adopt every orphan row.
  for (const model of TENANT_MODELS) {
    const table = model.getTableName() as string;
    if (!(await tableExists(table))) continue; // new model — sync will create it

    const before = await sequelize.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = :table
          AND column_name = 'organizationId'`,
      { type: QueryTypes.SELECT, replacements: { table } }
    );
    if (Number(before[0]?.count ?? 0) === 0) {
      await sequelize.query(`ALTER TABLE "${table}" ADD COLUMN "organizationId" UUID`);
      columnsAdded++;
    }

    const [, meta] = await sequelize.query(
      `UPDATE "${table}" SET "organizationId" = :orgId WHERE "organizationId" IS NULL`,
      { replacements: { orgId: org.id } }
    );
    rowsBackfilled += (meta as { rowCount?: number })?.rowCount ?? 0;

    // Every query in the app now filters on this column — without an index that
    // is a sequential scan per request on tables like tasks and leads.
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS "idx_${table}_organizationId" ON "${table}" ("organizationId")`
    );
  }

  // 5. Retire the global uniques. Composite replacements are on the models and
  //    get created by the syncDatabase() that runs straight after this.
  const uniquesDropped: string[] = [];
  for (const { table, column } of LEGACY_UNIQUES) {
    if (!(await tableExists(table))) continue;
    const dropped = await dropSingleColumnUnique(table, column);
    uniquesDropped.push(...dropped.map((name) => `${table}.${column} (${name})`));
  }

  return { defaultOrgId: org.id, columnsAdded, rowsBackfilled, uniquesDropped };
}

/**
 * Reports rows that never got an owner. Deliberately a warning, not a NOT NULL
 * constraint: on a live database a missed system-context insert should surface
 * as a loud log line, not a 500. Set TENANCY_ENFORCE_NOT_NULL=true to tighten
 * once the warning count has sat at zero.
 */
export async function auditOrphanRows(): Promise<{ table: string; orphans: number }[]> {
  const orphaned: { table: string; orphans: number }[] = [];

  for (const model of TENANT_MODELS) {
    const table = model.getTableName() as string;
    if (!(await tableExists(table))) continue;

    const rows = await sequelize.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM "${table}" WHERE "organizationId" IS NULL`,
      { type: QueryTypes.SELECT }
    );
    const orphans = Number(rows[0]?.count ?? 0);
    if (orphans > 0) orphaned.push({ table, orphans });
  }

  if (process.env.TENANCY_ENFORCE_NOT_NULL === "true" && orphaned.length === 0) {
    for (const model of TENANT_MODELS) {
      const table = model.getTableName() as string;
      if (!(await tableExists(table))) continue;
      await sequelize.query(
        `ALTER TABLE "${table}" ALTER COLUMN "organizationId" SET NOT NULL`
      );
    }
  }

  return orphaned;
}
