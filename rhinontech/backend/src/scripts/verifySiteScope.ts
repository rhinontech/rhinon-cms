/**
 * Proves the per-brand (site) hooks rewrite queries the way the modules assume.
 *
 * Same trick as verifyTenantScope: run against an unreachable database and
 * capture the final options before Sequelize needs a connection. Run with:
 *   npm run verify:sites
 */
import { Op } from "sequelize";
import { Lead, InboxEmail, PageView, Workflow, PipelineStage } from "../models";
import { runForOrg } from "../services/tenantContext";
import { runForSite, runAcrossSites } from "../services/siteContext";

const ORG_A = "11111111-1111-1111-1111-111111111111";
const SITE_A = { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", slug: "rhinonlabs" };

let captured: any = null;
for (const model of [Lead, InboxEmail, PageView, Workflow, PipelineStage]) {
  (model as any).addHook("beforeFindAfterOptions", (options: any) => {
    captured = options;
    throw new Error("__STOP__");
  });
}

async function capture(fn: () => Promise<unknown>) {
  captured = null;
  try {
    await fn();
  } catch (err: any) {
    if (err.message !== "__STOP__") throw err;
  }
  return captured;
}

function valueAt(where: any, key: string): unknown {
  if (!where || typeof where !== "object") return undefined;
  if (where[key] !== undefined) return where[key];
  for (const clause of where[Op.and] ?? []) {
    const found = valueAt(clause, key);
    if (found !== undefined) return found;
  }
  return undefined;
}

function show(where: any): string {
  if (!where || typeof where !== "object") return String(where);
  const parts: string[] = [];
  for (const k of Object.keys(where)) parts.push(`${k}: ${JSON.stringify(where[k])}`);
  const and = where[Op.and];
  if (Array.isArray(and)) parts.push(`[Op.and]: [${and.map(show).join(", ")}]`);
  return `{ ${parts.join(", ")} }`;
}

const results: { name: string; pass: boolean; detail: string }[] = [];
function check(name: string, pass: boolean, detail: string) {
  results.push({ name, pass, detail });
}

const inOrg = <T>(fn: () => T) => runForOrg(ORG_A, fn);

async function main() {
  // 1. An explicitly chosen site filters reads.
  let opts = await capture(() =>
    inOrg(() => runForSite(SITE_A, true, () => Lead.findAll()))
  );
  check("explicit site filters reads", valueAt(opts?.where, "siteId") === SITE_A.id, show(opts?.where));

  // 2. The caller's own where survives alongside the site filter.
  opts = await capture(() =>
    inOrg(() => runForSite(SITE_A, true, () => Lead.findAll({ where: { status: "New" } })))
  );
  check(
    "caller where is preserved",
    valueAt(opts?.where, "siteId") === SITE_A.id && valueAt(opts?.where, "status") === "New",
    show(opts?.where)
  );

  // 3. Org filtering still applies on top — the two axes compose.
  check("org filter still applied", valueAt(opts?.where, "organizationId") === ORG_A, show(opts?.where));

  // 4. A resolved-but-not-chosen site does NOT filter. This is what keeps the
  //    dashboard and exports whole-workspace after a default site is resolved.
  opts = await capture(() =>
    inOrg(() => runForSite(SITE_A, false, () => PageView.findAll()))
  );
  check("implicit site does not filter", valueAt(opts?.where, "siteId") === undefined, show(opts?.where));

  // 5. No site context at all (cron sweeps) is unfiltered.
  opts = await capture(() => inOrg(() => InboxEmail.findAll()));
  check("no site context is unfiltered", valueAt(opts?.where, "siteId") === undefined, show(opts?.where));

  // 6. runAcrossSites escapes an active filter.
  opts = await capture(() =>
    inOrg(() => runForSite(SITE_A, true, () => runAcrossSites(() => Workflow.findAll())))
  );
  check("runAcrossSites is unfiltered", valueAt(opts?.where, "siteId") === undefined, show(opts?.where));

  // 7. Shared workspace config is never brand-split.
  opts = await capture(() =>
    inOrg(() => runForSite(SITE_A, true, () => PipelineStage.findAll()))
  );
  check("shared config not site-filtered", valueAt(opts?.where, "siteId") === undefined, show(opts?.where));

  // 8. Writes are stamped even when the caller did not choose a site.
  const draft = Lead.build({ name: "n", company: "c", email: "e@x.com" } as any);
  inOrg(() =>
    runForSite(SITE_A, false, () => {
      for (const hook of (Lead as any).options.hooks.beforeCreate ?? []) hook(draft, {});
    })
  );
  check("create stamps siteId", draft.siteId === SITE_A.id, String(draft.siteId));

  // 9. An explicit siteId on the row wins — inbound mail inherits its lead's brand.
  const inherited = InboxEmail.build({ threadKey: "t", ownerEmail: "o@x.com" } as any);
  inherited.siteId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
  inOrg(() =>
    runForSite(SITE_A, true, () => {
      for (const hook of (InboxEmail as any).options.hooks.beforeCreate ?? []) hook(inherited, {});
    })
  );
  check("explicit siteId is not overwritten", inherited.siteId === "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", String(inherited.siteId));

  let failed = 0;
  for (const r of results) {
    if (!r.pass) failed++;
    console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.pass ? "" : `\n        got: ${r.detail}`}`);
  }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
