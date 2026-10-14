// One-time fix: CSV imports were all stamped source "Apollo Import", even campaign
// list uploads. Relabel each such lead as "List · <first list it joined>".
// Leads in no list keep "Apollo Import" (those may genuinely be Apollo exports).
//
//   node scripts/relabel-import-sources.mjs           # dry run: prints counts only
//   node scripts/relabel-import-sources.mjs --apply   # writes, in one transaction
import "dotenv/config";
import pg from "pg";

const apply = process.argv.includes("--apply");
const url = process.env.DATABASE_URL;
const client = new pg.Client({ connectionString: url, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false } });

const PLAN = `
  WITH first_list AS (
    SELECT DISTINCT ON (m."leadId") m."leadId", g.name
    FROM contact_group_members m
    JOIN contact_groups g ON g.id = m."contactGroupId"
    ORDER BY m."leadId", m."createdAt" ASC
  )
  SELECT l.id, 'List · ' || f.name AS label
  FROM leads l JOIN first_list f ON f."leadId" = l.id
  WHERE l.source = 'Apollo Import'`;

await client.connect();
console.log(`Database: ${new URL(url).hostname}/${new URL(url).pathname.slice(1)} · mode: ${apply ? "APPLY" : "dry run"}`);

const { rows } = await client.query(`SELECT label, count(*)::int AS leads FROM (${PLAN}) p GROUP BY 1 ORDER BY 2 DESC`);
console.table(rows);
const total = rows.reduce((n, r) => n + r.leads, 0);
console.log(`${total} lead(s) would be relabelled.`);

if (apply) {
  await client.query("BEGIN");
  const res = await client.query(`UPDATE leads SET source = p.label FROM (${PLAN}) p WHERE leads.id = p.id`);
  await client.query("COMMIT");
  console.log(`Updated ${res.rowCount} lead(s).`);
}
await client.end();
