/**
 * Strict-tenancy sweep.
 *
 * Calls every GET route the API declares — as a fresh workspace owner, and
 * anonymously for the public ones — against a server running with
 * TENANT_STRICT=true, then reports anything that answered 5xx. Under strict mode
 * a query that reaches a tenant-owned model outside a tenant context throws, so
 * a 5xx here is a route that would leak (or break) once strict is the default.
 *
 * With SWEEP_WRITES=1 it also sends POST/PUT/PATCH/DELETE with an empty body, which
 * should all be refused with a 4xx. Run it against a throwaway database (see hardening-test.mjs):
 *
 *   SERVER_LOG=/tmp/server.log node scripts/strict-sweep.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const API = process.env.TEST_API || "http://localhost:5099";
const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");
const UUID = "00000000-0000-4000-8000-000000000000";

// app.ts: import xRoutes from "./routes/x"  +  app.use("/mount", ...xRoutes)
const app = fs.readFileSync(path.join(SRC, "app.ts"), "utf8");
const imports = Object.fromEntries([...app.matchAll(/import (\w+) from "\.\/routes\/(\w+)"/g)].map((m) => [m[1], m[2]]));
const mounts = [];
for (const m of app.matchAll(/app\.use\(\s*"([^"]+)"[^;]*?\b(\w+Routes)\b/g)) {
  if (imports[m[2]]) mounts.push({ mount: m[1], file: imports[m[2]] });
}

const routes = [];
for (const { mount, file } of mounts) {
  const src = fs.readFileSync(path.join(SRC, "routes", `${file}.ts`), "utf8");
  for (const m of src.matchAll(/router\.(get|post|put|patch|delete)\(\s*"([^"]*)"/g)) {
    const method = m[1].toUpperCase();
    if (method !== "GET" && !process.env.SWEEP_WRITES) continue;
    const url = (mount + (m[2] === "/" ? "" : m[2]))
      .replace(/\/:orgSlug/g, "/nobody")
      .replace(/:(\w+)/g, (_, p) => (/token/i.test(p) ? "x" : UUID));
    routes.push({ file, url, method });
  }
}

const tag = Math.random().toString(16).slice(2, 8);
const signup = await fetch(`${API}/auth/signup`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ fullName: "Sweep Owner", personalEmail: `sweep-${tag}@example.com`, password: "Passw0rdTest1", organizationName: "Sweep", organizationSlug: `sweep-${tag}` }),
});
const { token } = await signup.json();
if (!token) { console.error("signup failed", signup.status); process.exit(2); }

const SKIP = [/^\/deploy\/.*\/(stream|log)/, /^\/auth\/signup$/, /^\/webhooks\//]; // long-lived streams
// Answer 5xx by design when their dependency (outbound mail, LinkedIn app credentials) is not configured,
// as it is in a throwaway test environment.
const EXPECTED_5XX = new Set(["POST /auth/resend-verification", "GET /linkedin/auth"]);
const bad = [];
let n = 0;
for (const r of routes) {
  if (SKIP.some((re) => re.test(r.url))) continue;
  for (const auth of [true, false]) {
    n++;
    try {
      const write = r.method !== "GET";
      const res = await fetch(API + r.url, {
        method: r.method, redirect: "manual", signal: AbortSignal.timeout(15000),
        headers: { ...(write ? { "Content-Type": "application/json" } : {}), ...(auth ? { Authorization: `Bearer ${token}` } : {}) },
        ...(write ? { body: "{}" } : {}),
      });
      if (res.status >= 500 && !EXPECTED_5XX.has(`${r.method} ${r.url}`)) bad.push({ r, auth, status: res.status, body: (await res.text()).slice(0, 120) });
    } catch (e) {
      bad.push({ r, auth, status: "ERR", body: e.message });
    }
  }
}

const log = process.env.SERVER_LOG ? fs.readFileSync(process.env.SERVER_LOG, "utf8") : "";
const tenancy = [...new Set(log.split("\n").filter((l) => /\[Tenancy\].*no tenant context/.test(l)))];

console.log(`${routes.length} routes${process.env.SWEEP_WRITES ? " (incl. writes)" : " (GET)"}, ${n} requests`);
for (const b of bad) console.log(`5xx  ${b.auth ? "auth" : "anon"}  ${b.status}  ${b.r.method} ${b.r.url}  (${b.r.file})  ${b.body}`);
for (const t of tenancy.slice(0, 30)) console.log(`TENANCY  ${t}`);
console.log(bad.length || tenancy.length ? `\n${bad.length} failing request(s), ${tenancy.length} unscoped-query line(s)` : "\nclean: no 5xx and no unscoped queries");
process.exit(bad.length || tenancy.length ? 1 : 0);
