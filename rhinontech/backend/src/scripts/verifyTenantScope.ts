/**
 * Proves the tenant hooks actually rewrite queries.
 *
 * Runs against a deliberately unreachable database: every hook fires before
 * Sequelize opens a connection, so we can capture the final WHERE clause and
 * assert on it without touching a real DB. Run with:
 *   DATABASE_URL=postgres://verify@127.0.0.1:1/verify npx tsx src/scripts/verifyTenantScope.ts
 */
import { Op } from "sequelize";
import { User, Blog, Permission, Organization } from "../models";
import { installTenantScope } from "../models/tenantScope";
import { runAsSystem, runForOrg } from "../services/tenantContext";

installTenantScope();

const ORG_A = "11111111-1111-1111-1111-111111111111";

let captured: any = null;
for (const model of [User, Blog, Permission, Organization]) {
  (model as any).addHook("beforeFindAfterOptions", (options: any) => {
    captured = options;
    throw new Error("__STOP__"); // cut the call before it needs a connection
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

/**
 * Walks a where tree looking for `key`. Has to recurse through Op.and, whose
 * symbol keys JSON.stringify silently drops — which is exactly what made the
 * first version of this script report a false failure.
 */
function valueAt(where: any, key: string): unknown {
  if (!where || typeof where !== "object") return undefined;
  if (where[key] !== undefined) return where[key];
  for (const clause of where[Op.and] ?? []) {
    const found = valueAt(clause, key);
    if (found !== undefined) return found;
  }
  return undefined;
}

function orgIdIn(where: any): string | null {
  return (valueAt(where, "organizationId") as string) ?? null;
}

/** Symbol-aware dump, so a failure prints the clause it actually built. */
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

async function main() {
  // 1. A tenant model inside runForOrg must be filtered.
  let opts = await capture(() => runForOrg(ORG_A, () => User.findAll()));
  check("findAll is org-filtered", orgIdIn(opts?.where) === ORG_A, show(opts?.where));

  // 2. The caller's own where survives alongside the org filter.
  opts = await capture(() =>
    runForOrg(ORG_A, () => Blog.findAll({ where: { status: "Published" } }))
  );
  const both =
    orgIdIn(opts?.where) === ORG_A && valueAt(opts?.where, "status") === "Published";
  check("caller where is preserved", both, show(opts?.where));

  // 3. findByPk must not become a cross-tenant read.
  opts = await capture(() =>
    runForOrg(ORG_A, () => User.findByPk("22222222-2222-2222-2222-222222222222"))
  );
  check("findByPk is org-filtered", orgIdIn(opts?.where) === ORG_A, show(opts?.where));

  // 4. unscoped() must NOT be an escape hatch — it drops defaultScope, not hooks.
  opts = await capture(() => runForOrg(ORG_A, () => User.unscoped().findAll()));
  check("unscoped() still filtered", orgIdIn(opts?.where) === ORG_A, show(opts?.where));

  // 5. System context is deliberately unfiltered.
  opts = await capture(() => runAsSystem("verify", () => User.findAll()));
  check("runAsSystem is unfiltered", orgIdIn(opts?.where) === null, show(opts?.where));

  // 6. Non-tenant root (Organization) joining to a tenant model filters the join.
  opts = await capture(() =>
    runForOrg(ORG_A, () => Organization.findAll({ include: [{ model: User }] }))
  );
  const inc = opts?.include?.[0];
  check("tenant include is filtered", orgIdIn(inc?.where) === ORG_A, show(inc?.where));

  // 7. Organization itself is never filtered by org.
  opts = await capture(() => runForOrg(ORG_A, () => Organization.findAll()));
  check("Organization not self-filtered", orgIdIn(opts?.where) === null, show(opts?.where));

  // 8. Strict mode turns a context-less tenant query into a hard failure.
  process.env.TENANT_STRICT = "true";
  let threw = "";
  try {
    await User.findAll();
  } catch (err: any) {
    threw = err.message;
  }
  check("strict mode throws with no context", threw.includes("[Tenancy]"), threw.slice(0, 90));
  process.env.TENANT_STRICT = "";

  // 9. Writes get stamped with the active org.
  const draft = Blog.build({ title: "t", excerpt: "e", content: "c", slug: "s" } as any);
  runForOrg(ORG_A, () => {
    for (const hook of (Blog as any).options.hooks.beforeCreate ?? []) hook(draft, {});
  });
  check("create stamps organizationId", (draft as any).organizationId === ORG_A, String((draft as any).organizationId));

  // 10. A write aimed at another org is refused outright.
  const foreign = Blog.build({ title: "t", excerpt: "e", content: "c", slug: "s" } as any);
  (foreign as any).organizationId = "99999999-9999-9999-9999-999999999999";
  let refused = "";
  try {
    runForOrg(ORG_A, () => {
      for (const hook of (Blog as any).options.hooks.beforeCreate ?? []) hook(foreign, {});
    });
  } catch (err: any) {
    refused = err.message;
  }
  check("cross-org write refused", refused.includes("Refusing"), refused.slice(0, 90));

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
