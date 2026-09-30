/**
 * Pre-launch hardening regression test.
 *
 * Covers what the isolation test does not: the inbound-mail webhook refusing
 * forged messages, per-workspace unsubscribe, rate limiting, client-supplied S3
 * keys, owner email verification gating outbound mail, and cron auth.
 *
 * Run against a THROWAWAY database with a server started from a directory that
 * has no .env, strict tenancy on, and known secrets:
 *
 *   createdb rhinon_hardening_test
 *   cd /tmp && DATABASE_URL=postgres://$USER@localhost:5432/rhinon_hardening_test \
 *     JWT_SECRET=test-secret-xyz CRON_SECRET=test-cron NODE_ENV=test TENANT_STRICT=true \
 *     RATE_LIMIT_SIGNUP_MAX=100 \
 *     AWS_ACCESS_KEY_ID=x AWS_SECRET_ACCESS_KEY=y AWS_S3_BUCKET=b PORT=5099 \
 *     PUBLIC_API_URL=http://localhost:5099 node <repo>/rhinontech/backend/dist/server.js
 *   DATABASE_URL=... node scripts/hardening-test.mjs
 *
 * Start the server fresh: rate-limit counters are per process.
 */
import crypto from "crypto";
import fs from "fs";
import pg from "pg";

// RFC 6238 TOTP, independent of the server's implementation so the two can disagree.
const b32 = (t) => { let bits = 0, v = 0; const out = []; for (const c of t.toUpperCase()) { v = (v << 5) | "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".indexOf(c); bits += 5; if (bits >= 8) { out.push((v >>> (bits - 8)) & 255); bits -= 8; } } return Buffer.from(out); };
const totp = (secret, offsetSteps = 0) => {
  const ctr = Buffer.alloc(8); ctr.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000) + offsetSteps));
  const h = crypto.createHmac("sha1", b32(secret)).update(ctr).digest(); const o = h[h.length - 1] & 15;
  return String(((h[o] & 127) << 24 | h[o + 1] << 16 | h[o + 2] << 8 | h[o + 3]) % 1e6).padStart(6, "0");
};

const API = process.env.TEST_API || "http://localhost:5099";
const JWT_SECRET = process.env.JWT_SECRET || "test-secret-xyz";
const CRON_SECRET = process.env.CRON_SECRET || "test-cron";
const DB = process.env.DATABASE_URL;
const results = [];
// Secrets the run generated, checked against the server log at the end.
const probes = [];
const check = (name, pass, detail = "") => results.push({ name, pass, detail });

async function call(path, { method = "GET", token, body, headers = {}, raw = false, redirect } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    redirect,
    headers: { ...(body && !raw ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    ...(body ? { body: raw ? body : JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* html or empty */ }
  return { status: res.status, json, text, headers: res.headers };
}

const unsubToken = (email, orgId) =>
  crypto.createHmac("sha256", JWT_SECRET).update(orgId ? `${orgId}:${email}` : email).digest("base64url").slice(0, 32);
const verifyToken = (userId) => {
  const payload = `${userId}.${Date.now() + 3600_000}`;
  const key = crypto.createHash("sha256").update(`email-verify:${JWT_SECRET}`).digest();
  return `${payload}.${crypto.createHmac("sha256", key).update(payload).digest("base64url")}`;
};

const tag = crypto.randomBytes(3).toString("hex");
const mkOrg = async (label) => {
  const res = await call("/auth/signup", {
    method: "POST",
    body: {
      fullName: `Owner ${label}`, personalEmail: `owner-${label}-${tag}@example.com`, password: "Passw0rdTest1",
      organizationName: `Hardening ${label}`, organizationSlug: `hard-${label}-${tag}`,
    },
  });
  return { token: res.json?.token, org: res.json?.organization, res };
};

const db = DB ? new pg.Client({ connectionString: DB }) : null;
await db?.connect();

// ── 1. Inbound mail webhook refuses anything it cannot authenticate ─────────
{
  const forged = {
    Type: "Notification", MessageId: "x", TopicArn: "arn:aws:sns:ap-south-1:999:attacker",
    Timestamp: new Date().toISOString(), SignatureVersion: "2", Signature: "AAAA",
    SigningCertURL: "https://sns.ap-south-1.amazonaws.com/x.pem",
    Message: JSON.stringify({ mail: { source: "a@b.c", destination: ["x@y.z"] }, receipt: { action: { type: "S3", bucketName: "b", objectKey: "k" } } }),
  };
  const hdr = { "x-amz-sns-message-type": "Notification", "Content-Type": "text/plain" };
  const r1 = await call("/webhooks/ses-inbound", { method: "POST", headers: hdr, body: JSON.stringify(forged), raw: true });
  check("forged SNS notification is rejected", r1.status === 403, `status ${r1.status}`);

  const sub = { ...forged, Type: "SubscriptionConfirmation", SubscribeURL: "https://attacker.example/confirm", Token: "t" };
  const r2 = await call("/webhooks/ses-inbound", { method: "POST", headers: { ...hdr, "x-amz-sns-message-type": "SubscriptionConfirmation" }, body: JSON.stringify(sub), raw: true });
  check("forged subscription confirmation is rejected", r2.status === 403, `status ${r2.status}`);

  const r3 = await call("/webhooks/ses-inbound", { method: "POST", headers: hdr, body: "not json at all", raw: true });
  check("malformed webhook body does not 500", r3.status < 500, `status ${r3.status}`);
}

// ── 2. Two workspaces ───────────────────────────────────────────────────────
const A = await mkOrg("a");
const B = await mkOrg("b");
check("both workspaces created", !!A.token && !!B.token, `${A.res.status}/${B.res.status}`);
check("signup reports email verification pending", A.res.json?.emailVerificationPending === true);

// ── 3. Unsubscribe is per workspace ─────────────────────────────────────────
{
  const email = `recipient-${tag}@example.com`;
  const q = (orgId, tok) => `email=${encodeURIComponent(email)}${orgId ? `&o=${orgId}` : ""}&t=${tok}`;

  const bad = await call(`/public/unsubscribe/one-click?${q(A.org.id, unsubToken(email, null))}`, { method: "POST" });
  check("org link with a legacy/unscoped signature is refused", bad.status === 403, `status ${bad.status}`);

  const swapped = await call(`/public/unsubscribe/one-click?${q(B.org.id, unsubToken(email, A.org.id))}`, { method: "POST" });
  check("link signed for org A cannot be replayed as org B", swapped.status === 403, `status ${swapped.status}`);

  const page = await call(`/public/unsubscribe/page?${q(A.org.id, unsubToken(email, A.org.id))}`);
  const countAfterGet = await db?.query(`SELECT count(*)::int AS n FROM unsubscribes WHERE email=$1`, [email]);
  check("GET unsubscribe page shows a form and changes nothing", page.status === 200 && page.text.includes("<form") && countAfterGet?.rows[0].n === 0);

  const ok = await call(`/public/unsubscribe/one-click?${q(A.org.id, unsubToken(email, A.org.id))}`, { method: "POST" });
  check("valid one-click unsubscribe succeeds", ok.status === 200, `status ${ok.status}`);
  const rows = await db?.query(`SELECT "organizationId" FROM unsubscribes WHERE email=$1`, [email]);
  check("opt-out is recorded against the sending org only",
    rows?.rows.length === 1 && rows.rows[0].organizationId === A.org.id, JSON.stringify(rows?.rows));

  const form = await call("/public/unsubscribe/page", {
    method: "POST", raw: true, headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ email: `b-${email}`, t: unsubToken(`b-${email}`, B.org.id), o: B.org.id }).toString(),
  });
  const bRows = await db?.query(`SELECT "organizationId" FROM unsubscribes WHERE email=$1`, [`b-${email}`]);
  check("footer-page confirm records against org B", form.status === 200 && bRows?.rows[0]?.organizationId === B.org.id, `status ${form.status}`);
}

// ── 3b. Legacy marketing-site unsubscribe form ──────────────────────────────
{
  const email = `legacy-${tag}@example.com`;
  const forged = await call("/public/unsubscribe", { method: "POST", body: { email, reason: "x", t: "bogus" } });
  check("legacy form refuses a bad signature", forged.status === 403, `status ${forged.status}`);
  const once = await call("/public/unsubscribe", { method: "POST", body: { email, reason: "r1", t: unsubToken(email, null) } });
  const twice = await call("/public/unsubscribe", { method: "POST", body: { email, reason: "r2" } });
  const n = await db?.query(`SELECT count(*)::int AS n FROM unsubscribes WHERE email=$1`, [email]);
  check("legacy form accepts a signed request and de-duplicates repeats", once.status === 201 && twice.status === 201 && n?.rows[0].n === 1, `${once.status}/${twice.status} rows=${n?.rows[0].n}`);
}

// ── 4. Client-supplied S3 keys must belong to the caller ────────────────────
{
  const mine = `inbox/${A.org.id}/mine.pdf`;
  const theirs = `inbox/${B.org.id}/theirs.pdf`;
  const legacy = `inbox/${crypto.randomUUID()}.pdf`;
  const res = await call("/inbox", {
    method: "POST", token: A.token,
    body: {
      toEmails: ["x@example.com"], subject: "s", body: "b", folder: "drafts",
      attachments: [
        { key: mine, name: "mine.pdf" }, { key: theirs, name: "theirs.pdf" },
        { key: legacy, name: "legacy.pdf" }, { key: `inbox/${A.org.id}/../${B.org.id}/x.pdf`, name: "trav.pdf" },
      ],
    },
  });
  const keys = (res.json?.attachments ?? []).map((a) => a.key);
  check("own-workspace attachment key is kept", keys.includes(mine), `status ${res.status} ${JSON.stringify(keys)}`);
  check("another workspace's key is dropped", !keys.includes(theirs));
  check("legacy un-namespaced key is dropped for a non-platform tenant", !keys.includes(legacy));
  check("path-traversal key is dropped", keys.length === 1);
}

// ── 5. Unverified workspaces cannot send outbound mail ──────────────────────
{
  const lead = await call("/leads", { method: "POST", token: A.token, body: { name: "Lee", company: "Acme", email: `lee-${tag}@example.com` } });
  const send = await call("/outreach/send", { method: "POST", token: A.token, body: { leadId: lead.json?.id, subject: "hi", body: "hello" } });
  check("outreach send is blocked until the owner verifies", send.status === 403 && send.json?.code === "EMAIL_NOT_VERIFIED", `status ${send.status} ${send.text.slice(0, 120)}`);

  const me1 = await call("/auth/me", { token: A.token });
  check("/auth/me reports verification pending", me1.json?.emailVerificationPending === true);

  const userId = (await db?.query(`SELECT id FROM users WHERE "personalEmail"=$1`, [`owner-a-${tag}@example.com`]))?.rows[0]?.id;
  const bogus = await call(`/auth/verify-email?token=${encodeURIComponent("x.y.z")}`, { redirect: "manual" });
  check("a forged verification token does not verify", (bogus.headers.get("location") || "").includes("verified=invalid"), bogus.headers.get("location") || "");
  const stillPending = await call("/auth/me", { token: A.token });
  check("...and the workspace stays unverified", stillPending.json?.emailVerificationPending === true);

  const good = await call(`/auth/verify-email?token=${encodeURIComponent(verifyToken(userId))}`, { redirect: "manual" });
  check("a valid token verifies and redirects", good.status === 302 && (good.headers.get("location") || "").includes("verified=1"), `status ${good.status}`);
  const me2 = await call("/auth/me", { token: A.token });
  check("/auth/me reports verified afterwards", me2.json?.emailVerificationPending === false);
  const bStill = await call("/auth/me", { token: B.token });
  check("verifying org A does not verify org B", bStill.json?.emailVerificationPending === true);
}

// ── 6. Cron entry point needs the secret ────────────────────────────────────
{
  const anon = await call("/campaigns/cron/run");
  check("cron run without the secret is refused", anon.status === 401, `status ${anon.status}`);
  const wrong = await call("/campaigns/cron/run", { headers: { Authorization: "Bearer rhinon-cron-secret" } });
  check("the old hard-coded cron secret no longer works", wrong.status === 401, `status ${wrong.status}`);
  const ok = await call("/campaigns/cron/run", { headers: { Authorization: `Bearer ${CRON_SECRET}` } });
  check("cron run with the secret works under strict tenancy", ok.status === 200 && ok.json?.success === true, `status ${ok.status} ${ok.text.slice(0, 100)}`);
}

// ── 7. Public document signing resolves its own tenant ──────────────────────
{
  const r = await call("/document-signing/not-a-real-token");
  check("unknown signing token is a clean 404 under strict tenancy", r.status === 404, `status ${r.status}`);
}

// ── 8. Brute-force protection + headers ─────────────────────────────────────
{
  const email = `nobody-${tag}@example.com`;
  const statuses = [];
  for (let i = 0; i < 10; i++) statuses.push((await call("/auth/login", { method: "POST", body: { email, password: "wrong" } })).status);
  check("repeated bad logins get rate limited", statuses.includes(429) && statuses[0] === 401, statuses.join(","));

  const other = await call("/auth/login", { method: "POST", body: { email: `someone-else-${tag}@example.com`, password: "wrong" } });
  check("the limit is per account, not a blanket lockout", other.status === 401, `status ${other.status}`);

  const h = await call("/health");
  check("security headers are set", h.headers.get("x-content-type-options") === "nosniff" && h.headers.get("x-powered-by") === null);
}


// ── 9. Plans, seats, quotas, trial expiry ───────────────────────────────────
{
  const usage = await call("/billing/usage", { token: A.token });
  check("usage summary reports the free plan with a trial end",
    usage.json?.plan === "free" && usage.json?.seats?.limit === 5 && !!usage.json?.trialEndsAt && usage.json?.trialExpired === false,
    JSON.stringify(usage.json));

  // Seats: owner + 4 fits the free plan's 5, the next is refused.
  const roles = await call("/roles", { token: A.token });
  const employeeRole = (roles.json?.roles ?? roles.json ?? []).find?.((r) => r.slug === "employee");
  const hire = (i) => call("/employees", {
    method: "POST", token: A.token,
    body: { fullName: `Hire ${i}`, personalEmail: `hire${i}-${tag}@example.com`, roleId: employeeRole?.id, department: "Ops", joiningDate: "2026-01-01", emailPrefix: `hire${i}` },
  });
  const hireStatuses = [];
  for (let i = 1; i <= 5; i++) hireStatuses.push((await hire(i)).status);
  check("seat limit admits up to the plan and then returns 402",
    hireStatuses.slice(0, 4).every((c) => c < 300) && hireStatuses[4] === 402, hireStatuses.join(","));

  // Email quota: fill today's counter, the next send is refused.
  await db?.query(
    `INSERT INTO usage_counters (id,"organizationId",kind,day,count,"createdAt","updatedAt")
     VALUES (gen_random_uuid(),$1,'email',(now() AT TIME ZONE 'Asia/Kolkata')::date,50,now(),now())
     ON CONFLICT ("organizationId",kind,day) DO UPDATE SET count=50`, [A.org.id]);
  const lead = await call("/leads", { method: "POST", token: A.token, body: { name: "Quota", company: "Acme", email: `quota-${tag}@example.com` } });
  const capped = await call("/outreach/send", { method: "POST", token: A.token, body: { leadId: lead.json?.id, subject: "hi", body: "hello" } });
  check("daily email allowance is enforced", capped.status === 402 && capped.json?.code === "PLAN_LIMIT", `status ${capped.status} ${capped.text.slice(0, 100)}`);

  // AI quota
  await db?.query(
    `INSERT INTO usage_counters (id,"organizationId",kind,day,count,"createdAt","updatedAt")
     VALUES (gen_random_uuid(),$1,'ai',(now() AT TIME ZONE 'Asia/Kolkata')::date,20,now(),now())
     ON CONFLICT ("organizationId",kind,day) DO UPDATE SET count=20`, [A.org.id]);
  const ai = await call("/campaigns/templates/generate", { method: "POST", token: A.token, body: { prompt: "intro email", channel: "Email" } });
  check("daily AI allowance is enforced", ai.status === 402, `status ${ai.status} ${ai.text.slice(0, 100)}`);

  const usage2 = await call("/billing/usage", { token: A.token });
  check("usage summary reflects the counters", usage2.json?.emailsToday?.used === 50 && usage2.json?.aiToday?.used === 20, JSON.stringify(usage2.json));

  // Expired trial: read-only
  await db?.query(`UPDATE organizations SET settings = settings || jsonb_build_object('trialEndsAt', to_jsonb($2::text)) WHERE id=$1`, [B.org.id, new Date(Date.now() - 86_400_000).toISOString()]);
  const read = await call("/leads", { token: B.token });
  const write = await call("/leads", { method: "POST", token: B.token, body: { name: "X", company: "Y", email: `x-${tag}@example.com` } });
  const bill = await call("/billing/usage", { token: B.token });
  check("expired trial can still read", read.status === 200, `status ${read.status}`);
  check("expired trial cannot write", write.status === 402 && write.json?.code === "TRIAL_EXPIRED", `status ${write.status}`);
  check("expired trial can still see billing state", bill.status === 200 && bill.json?.trialExpired === true);
  const aOk = await call("/leads", { method: "POST", token: A.token, body: { name: "Still", company: "Fine", email: `still-${tag}@example.com` } });
  check("another workspace is unaffected by org B's expiry", aOk.status < 300, `status ${aOk.status}`);
}

// ── 10. Platform operators manage plans; customers cannot ───────────────────
{
  const denied = await call("/platform/organizations", { token: A.token });
  check("a customer owner cannot list workspaces", denied.status === 403, `status ${denied.status}`);
  const deniedPatch = await call(`/platform/organizations/${B.org.id}`, { method: "PATCH", token: A.token, body: { plan: "enterprise" } });
  check("a customer owner cannot change a plan", deniedPatch.status === 403, `status ${deniedPatch.status}`);

  // Promote a scratch workspace to platform for the duration of the check.
  const C = await mkOrg("c");
  await db?.query(`UPDATE organizations SET "isPlatform"=true WHERE id=$1`, [C.org.id]);
  const list = await call("/platform/organizations", { token: C.token });
  check("platform superadmin can list workspaces", list.status === 200 && Array.isArray(list.json) && list.json.length >= 3, `status ${list.status}`);

  const ext = await call(`/platform/organizations/${B.org.id}`, { method: "PATCH", token: C.token, body: { extendTrialDays: 10 } });
  check("extending a trial moves the deadline forward", ext.status === 200 && ext.json?.trialExpired === false, `status ${ext.status} ${ext.text.slice(0, 100)}`);
  const writeAgain = await call("/leads", { method: "POST", token: B.token, body: { name: "Back", company: "Again", email: `back-${tag}@example.com` } });
  check("...and the workspace can write again", writeAgain.status < 300, `status ${writeAgain.status}`);

  const up = await call(`/platform/organizations/${A.org.id}`, { method: "PATCH", token: C.token, body: { plan: "enterprise", status: "active" } });
  const u3 = await call("/billing/usage", { token: A.token });
  check("upgrading to enterprise removes the limits", up.status === 200 && u3.json?.seats?.limit === null && u3.json?.emailsToday?.limit === null, JSON.stringify(u3.json));
  const capLifted = await call("/outreach/send", { method: "POST", token: A.token, body: { leadId: "00000000-0000-0000-0000-000000000000", subject: "hi", body: "hello" } });
  check("the email cap no longer applies after upgrade", capLifted.status !== 402, `status ${capLifted.status}`);

  const bad = await call(`/platform/organizations/${B.org.id}`, { method: "PATCH", token: C.token, body: { plan: "gold" } });
  check("an unknown plan is rejected", bad.status === 400, `status ${bad.status}`);

  await db?.query(`UPDATE organizations SET "isPlatform"=false WHERE id=$1`, [C.org.id]);
}


// ── 11. Audit log ───────────────────────────────────────────────────────────
{
  await call("/auth/login", { method: "POST", body: { email: `owner-a-${tag}@example.com`, password: "Passw0rdTest1", organizationSlug: A.org.slug } });
  await call("/auth/login", { method: "POST", body: { email: `owner-a-${tag}@example.com`, password: "WrongPassw0rd", organizationSlug: A.org.slug } });
  await new Promise((r) => setTimeout(r, 400)); // entries are written after the response
  const log = await call("/audit-log?limit=200", { token: A.token });
  const actions = (log.json?.entries ?? []).map((e) => e.action);
  check("audit log records sign-ins and failed sign-ins", actions.includes("auth.login") && actions.includes("auth.login_failed"), actions.slice(0, 6).join(","));
  check("audit log records sensitive writes (employee created)", actions.some((a) => a.startsWith("POST /employees")), actions.join(",").slice(0, 160));
  check("audit log records the platform's plan change on the customer", actions.includes("billing.plan_changed"));
  const leaked = (log.json?.entries ?? []).some((e) => e.actorName?.includes("Owner b"));
  const logB = await call("/audit-log", { token: B.token });
  check("a workspace never sees another's audit entries", !leaked && !(logB.json?.entries ?? []).some((e) => e.actorName?.includes("Owner a")));
  const noBody = JSON.stringify(log.json).includes("Passw0rd");
  check("audit entries never contain passwords or request bodies", !noBody);
}

// ── 12. Workspace export ────────────────────────────────────────────────────
{
  const ex = await call("/workspace/export", { token: A.token });
  let doc = null;
  try { doc = JSON.parse(ex.text); } catch { /* reported below */ }
  check("export is one valid JSON document", ex.status === 200 && !!doc?.tables, `status ${ex.status}`);
  const users = doc?.tables?.User ?? [];
  check("export contains the workspace's own people", users.some((u) => u.personalEmail === `owner-a-${tag}@example.com`));
  check("export contains no password hashes or tokens", !ex.text.includes("passwordHash") && !/"(resetToken|onboardingToken|accessToken)"/.test(ex.text));
  check("export leaves out stored integration credentials", !("LinkedInToken" in (doc?.tables ?? {})) && !("GoogleCalendarToken" in (doc?.tables ?? {})));
  check("export contains nothing from another workspace", !ex.text.includes(`owner-b-${tag}@example.com`) && !ex.text.includes(B.org.id));
  const hdr = ex.headers.get("content-disposition") || "";
  check("export downloads as a named file", hdr.includes("attachment") && hdr.includes(A.org.slug), hdr);
}

// ── 13. Scheduled deletion + purge ──────────────────────────────────────────
{
  const D = await mkOrg("d");
  const wrongSlug = await call("/workspace/deletion", { method: "POST", token: D.token, body: { confirmSlug: "nope", password: "Passw0rdTest1" } });
  check("deletion needs the workspace name typed back", wrongSlug.status === 400, `status ${wrongSlug.status}`);
  const wrongPw = await call("/workspace/deletion", { method: "POST", token: D.token, body: { confirmSlug: D.org.slug, password: "WrongPassw0rd" } });
  check("deletion needs the owner's password", wrongPw.status === 401, `status ${wrongPw.status}`);
  const sched = await call("/workspace/deletion", { method: "POST", token: D.token, body: { confirmSlug: D.org.slug, password: "Passw0rdTest1" } });
  check("deletion is scheduled with a grace period, not immediate", sched.status === 202 && sched.json?.scheduled === true && !!sched.json?.scheduledFor, `status ${sched.status}`);
  const still = await call("/leads", { token: D.token });
  check("the workspace keeps working during the grace period", still.status === 200);
  const cancel = await call("/workspace/deletion", { method: "DELETE", token: D.token });
  check("the owner can cancel", cancel.status === 200 && cancel.json?.scheduled === false);
  await call("/workspace/deletion", { method: "POST", token: D.token, body: { confirmSlug: D.org.slug, password: "Passw0rdTest1" } });

  // Give D real data across modules, then count what A and B hold so we can prove they are untouched.
  await call("/leads", { method: "POST", token: D.token, body: { name: "Doomed", company: "Gone", email: `doomed-${tag}@example.com` } });
  const droles = await call("/roles", { token: D.token });
  const drole = (droles.json?.roles ?? droles.json ?? []).find?.((r) => r.slug === "employee");
  await call("/employees", { method: "POST", token: D.token, body: { fullName: "Doomed Hire", personalEmail: `dh-${tag}@example.com`, roleId: drole?.id, department: "Ops", joiningDate: "2026-01-01", emailPrefix: "dh" } });
  await call("/campaigns", { method: "POST", token: D.token, body: { name: "Doomed campaign", channel: "Email" } });

  const tablesWithOrg = (await db.query(`SELECT table_name FROM information_schema.columns WHERE column_name='organizationId' AND table_schema='public'`)).rows.map((r) => r.table_name);
  const countFor = async (orgId) => {
    let total = 0;
    for (const t of tablesWithOrg) total += (await db.query(`SELECT count(*)::int AS n FROM "${t}" WHERE "organizationId"=$1`, [orgId])).rows[0].n;
    return total;
  };
  const beforeD = await countFor(D.org.id);
  const beforeA = await countFor(A.org.id);
  const beforeB = await countFor(B.org.id);
  check("the scratch workspace holds data to purge", beforeD > 10, `rows ${beforeD}`);

  // A customer owner must not be able to purge anyone.
  const deniedPurge = await call(`/platform/organizations/${D.org.id}/purge`, { method: "POST", token: A.token, body: { confirmSlug: D.org.slug } });
  check("a customer cannot use the platform purge", deniedPurge.status === 403, `status ${deniedPurge.status}`);

  const P = await mkOrg("p");
  await db.query(`UPDATE organizations SET "isPlatform"=true WHERE id=$1`, [P.org.id]);
  const noConfirm = await call(`/platform/organizations/${D.org.id}/purge`, { method: "POST", token: P.token, body: {} });
  check("platform purge refuses without the workspace name", noConfirm.status === 400, `status ${noConfirm.status}`);
  const purge = await call(`/platform/organizations/${D.org.id}/purge`, { method: "POST", token: P.token, body: { confirmSlug: D.org.slug } });
  check("platform purge succeeds", purge.status === 200 && purge.json?.rowsDeleted >= beforeD - 1, `status ${purge.status} ${purge.text.slice(0, 160)}`);
  const afterD = await countFor(D.org.id);
  const gone = (await db.query(`SELECT count(*)::int AS n FROM organizations WHERE id=$1`, [D.org.id])).rows[0].n;
  check("every table is empty for the purged workspace and its row is gone", afterD === 0 && gone === 0, `rows ${afterD}, org rows ${gone}`);
  const orphanRolePerms = (await db.query(`SELECT count(*)::int AS n FROM role_permissions rp WHERE NOT EXISTS (SELECT 1 FROM roles r WHERE r.id = rp."roleId")`)).rows[0].n;
  check("no role_permissions are left dangling", orphanRolePerms === 0, `${orphanRolePerms}`);
  check("other workspaces are untouched by the purge", (await countFor(A.org.id)) === beforeA && (await countFor(B.org.id)) === beforeB);
  const gonePlatform = await call(`/platform/organizations/${P.org.id}/purge`, { method: "POST", token: P.token, body: { confirmSlug: P.org.slug } });
  check("the platform workspace cannot be purged", gonePlatform.status === 400, `status ${gonePlatform.status}`);
  await db.query(`UPDATE organizations SET "isPlatform"=false WHERE id=$1`, [P.org.id]);
}


// ── 14. Terms acceptance ────────────────────────────────────────────────────
{
  const legal = await call("/public/legal");
  check("legal endpoint reports the current terms version", legal.status === 200 && !!legal.json?.termsVersion, legal.text.slice(0, 80));
  const me = await call("/auth/me", { token: A.token });
  check("a workspace that never accepted shows termsAccepted=false", me.json?.termsAccepted === false);
  const stale = await call("/auth/accept-terms", { method: "POST", token: A.token, body: { version: "1999-01-01" } });
  check("accepting an out-of-date version is refused", stale.status === 400, `status ${stale.status}`);
  const okTerms = await call("/auth/accept-terms", { method: "POST", token: A.token, body: { version: legal.json?.termsVersion } });
  const me2 = await call("/auth/me", { token: A.token });
  check("owner can accept the current terms", okTerms.status === 200 && me2.json?.termsAccepted === true, `status ${okTerms.status}`);
}

// ── 15. Two-factor sign-in ──────────────────────────────────────────────────
{
  const M = await mkOrg("m");
  const email = `owner-m-${tag}@example.com`;
  const login = (extra = {}) => call("/auth/login", { method: "POST", body: { email, password: "Passw0rdTest1", organizationSlug: M.org.slug, ...extra } });

  const plain = await login();
  check("without 2FA, sign-in returns a session directly", !!plain.json?.token && !plain.json?.mfaRequired);

  const setup = await call("/auth/2fa/setup", { method: "POST", token: M.token });
  check("setup returns a secret and an otpauth link", setup.status === 200 && /^[A-Z2-7]{32}$/.test(setup.json?.secret ?? "") && setup.json?.otpauthUrl?.startsWith("otpauth://totp/"), setup.text.slice(0, 120));
  const secret = setup.json?.secret;
  probes.push(secret);
  const stored = (await db.query(`SELECT "totpSecret" FROM users WHERE "personalEmail"=$1`, [email])).rows[0]?.totpSecret;
  check("the secret is encrypted at rest", stored?.startsWith("v1:") && !stored.includes(secret));
  const meBody = JSON.stringify((await call("/auth/me", { token: M.token })).json);
  check("the secret never appears in API output", !meBody.includes(secret) && !meBody.includes("totpSecret"));

  const badEnable = await call("/auth/2fa/enable", { method: "POST", token: M.token, body: { code: "000000" } });
  check("enabling with a wrong code fails", badEnable.status === 400, `status ${badEnable.status}`);
  const enable = await call("/auth/2fa/enable", { method: "POST", token: M.token, body: { code: totp(secret) } });
  const recovery = enable.json?.recoveryCodes ?? [];
  probes.push(...recovery);
  check("a correct code enables 2FA and returns 8 recovery codes", enable.status === 200 && recovery.length === 8, `status ${enable.status}`);
  const hashed = (await db.query(`SELECT "totpRecoveryCodes" FROM users WHERE "personalEmail"=$1`, [email])).rows[0]?.totpRecoveryCodes ?? [];
  check("recovery codes are stored hashed", hashed.length === 8 && !hashed.some((h) => recovery.includes(h)));

  const pw = await login();
  probes.push(pw.json?.mfaToken);
  check("after enabling, the password alone no longer opens a session", pw.json?.mfaRequired === true && !pw.json?.token && !!pw.json?.mfaToken, pw.text.slice(0, 100));
  const pending = await call("/auth/me", { token: pw.json?.mfaToken });
  check("the pending-2FA token cannot be used as a session", pending.status === 401, `status ${pending.status}`);

  const wrong = await call("/auth/login/mfa", { method: "POST", body: { mfaToken: pw.json?.mfaToken, code: "000000" } });
  check("a wrong code is refused", wrong.status === 401, `status ${wrong.status}`);
  // The enabling code already used this 30s step, so sign in with the next one —
  // which is also what a person does, waiting for the app to roll over.
  const code1 = totp(secret, 1);
  const good = await call("/auth/login/mfa", { method: "POST", body: { mfaToken: pw.json?.mfaToken, code: code1 } });
  check("a correct code completes sign-in", good.status === 200 && !!good.json?.token, `status ${good.status} ${good.text.slice(0, 100)}`);
  const session = await call("/auth/me", { token: good.json?.token });
  check("the resulting session works", session.status === 200);

  const pw2 = await login();
  const replay = await call("/auth/login/mfa", { method: "POST", body: { mfaToken: pw2.json?.mfaToken, code: code1 } });
  check("the same code cannot be used twice", replay.status === 401, `status ${replay.status}`);

  const pw3 = await login();
  const rec = await call("/auth/login/mfa", { method: "POST", body: { mfaToken: pw3.json?.mfaToken, recoveryCode: recovery[0] } });
  check("a recovery code signs in", rec.status === 200 && !!rec.json?.token, `status ${rec.status}`);
  const pw4 = await login();
  const recAgain = await call("/auth/login/mfa", { method: "POST", body: { mfaToken: pw4.json?.mfaToken, recoveryCode: recovery[0] } });
  check("a recovery code works only once", recAgain.status === 401, `status ${recAgain.status}`);

  const noPw = await call("/auth/2fa/disable", { method: "POST", token: good.json?.token, body: { password: "WrongPassw0rd", code: totp(secret, 1) } });
  check("disabling needs the password", noPw.status === 401, `status ${noPw.status}`);

  // Five misses lock the second step for this account.
  const pw5 = await login();
  const tries = [];
  for (let i = 0; i < 6; i++) tries.push((await call("/auth/login/mfa", { method: "POST", body: { mfaToken: pw5.json?.mfaToken, code: "111111" } })).status);
  check("repeated wrong codes lock the account's second step", tries.includes(429), tries.join(","));
}


// ── 16. Custom email domain (HTTP surface; the SES flow is in verify:customdomain) ──
{
  const none = await call("/email-domain", { token: A.token });
  check("a workspace starts with no custom domain", none.status === 200 && none.json?.domains?.length === 0 && none.json?.limit === 1, `status ${none.status} ${none.text.slice(0, 100)}`);
  const freeTry = await call("/email-domain", { method: "POST", token: B.token, body: { domain: "acme-free.com" } });
  check("a free-plan workspace is told to upgrade", freeTry.status === 402, `status ${freeTry.status}`);
  for (const [label, domain] of [["a free mail provider", "gmail.com"], ["the platform's own domain", "rhinontech.in"], ["an email address", "me@acme.com"]]) {
    const r = await call("/email-domain", { method: "POST", token: A.token, body: { domain } });
    check(`a paid workspace cannot claim ${label}`, r.status === 400, `status ${r.status}`);
  }
  const extraBrand = await call("/email-domain", { method: "POST", token: A.token, body: { domain: `brand-${tag}.com`, brandName: "Sneaky brand" } });
  check("a customer cannot create extra brands through the domain API", extraBrand.status === 403, `status ${extraBrand.status}`);
  const before = (await db.query(`SELECT "customDomain" FROM organizations WHERE id=$1`, [A.org.id])).rows[0].customDomain;
  const real = await call("/email-domain", { method: "POST", token: A.token, body: { domain: `unreachable-${tag}.com` } });
  const after = (await db.query(`SELECT "customDomain" FROM organizations WHERE id=$1`, [A.org.id])).rows[0].customDomain;
  check("if the email provider refuses, nothing is recorded", real.status >= 400 && before === null && after === null, `status ${real.status} after=${after}`);
}


// ── 17. Ops and support tooling ─────────────────────────────────────────────
{
  const h = await call("/health");
  const rid = h.headers.get("x-request-id") || "";
  check("every response carries an X-Request-Id", /^[\w-]{8,64}$/.test(rid), rid);
  const echoed = await call("/health", { headers: { "X-Request-Id": "trace-12345678" } });
  check("a well-formed caller-supplied request id is kept", echoed.headers.get("x-request-id") === "trace-12345678");
  const junk = await call("/health", { headers: { "X-Request-Id": "bad id with spaces" } });
  check("a malformed request id is replaced", junk.headers.get("x-request-id") !== "bad id with spaces");

  const deep = await call("/health/deep");
  check("deep health reports database and scheduler", deep.status === 200 && deep.json?.database?.ok === true && deep.json?.scheduler?.ok === true, deep.text.slice(0, 160));

  const P2 = await mkOrg("s");
  await db.query(`UPDATE organizations SET "isPlatform"=true WHERE id=$1`, [P2.org.id]);
  const detail = await call(`/platform/organizations/${A.org.id}`, { token: P2.token });
  check("platform staff get one-call workspace detail for support",
    detail.status === 200 && detail.json?.usage && detail.json?.owner?.email && Array.isArray(detail.json?.recentAudit) && detail.json?.deletion && detail.json?.customDomain, `status ${detail.status} ${detail.text.slice(0, 120)}`);
  check("...without customer content or secrets", !/passwordHash|totpSecret|resetToken|"leads"/.test(detail.text));
  const noAccess = await call(`/platform/organizations/${A.org.id}`, { token: B.token });
  check("a customer cannot read that detail", noAccess.status === 403, `status ${noAccess.status}`);
  await db.query(`UPDATE organizations SET "isPlatform"=false WHERE id=$1`, [P2.org.id]);

}


// ── 18. API key + upgrade requests (the settings screens' endpoints) ────────
{
  const info = await call("/workspace/api-key", { token: B.token });
  check("owner can see which API key is live (prefix only)", info.status === 200 && /^rh_live_/.test(info.json?.prefix ?? "") && !("apiKey" in (info.json ?? {})), info.text.slice(0, 100));

  const rot = await call("/workspace/api-key/rotate", { method: "POST", token: B.token });
  const newKey = rot.json?.apiKey;
  check("rotating returns a new key exactly once", rot.status === 200 && /^rh_live_/.test(newKey ?? ""), `status ${rot.status}`);
  probes.push(newKey);
  const info2 = await call("/workspace/api-key", { token: B.token });
  check("...and afterwards only the prefix is ever shown again", info2.json?.prefix === newKey?.slice(0, 16) && !JSON.stringify(info2.json).includes(newKey ?? "zzz"));
  const pub = await call("/public/blogs", { headers: { "x-api-key": newKey } });
  check("the new key works on the public API", pub.status === 200, `status ${pub.status}`);
  const stored = (await db.query(`SELECT "apiKeyHash" FROM organizations WHERE id=$1`, [B.org.id])).rows[0].apiKeyHash;
  check("only a hash of the key is stored", !!stored && stored !== newKey && !stored.includes("rh_live"));
  const oldKey = (await call("/public/blogs", { headers: { "x-api-key": "rh_live_thisWasNeverIssuedXXXXXXXXXXXXXXXX" } }));
  check("a key that is not the current one is refused", oldKey.status === 404, `status ${oldKey.status}`);

  const bad = await call("/billing/upgrade-request", { method: "POST", token: B.token, body: { plan: "gold" } });
  check("an upgrade request needs a real plan", bad.status === 400, `status ${bad.status}`);
  const same = await call("/billing/upgrade-request", { method: "POST", token: B.token, body: { plan: "free" } });
  check("asking for the plan you are on is refused", same.status === 400, `status ${same.status}`);
  const noMail = await call("/billing/upgrade-request", { method: "POST", token: B.token, body: { plan: "starter", note: "We are 12 people" } });
  const recorded = (await db.query(`SELECT settings->'upgradeRequest' AS r FROM organizations WHERE id=$1`, [B.org.id])).rows[0].r;
  check("if the request cannot be emailed, it is reported and NOT recorded as sent", noMail.status === 502 && recorded === null, `status ${noMail.status} recorded=${JSON.stringify(recorded)}`);

  // Platform staff see a pending request, and changing the plan answers it.
  await db.query(`UPDATE organizations SET settings = settings || '{"upgradeRequest":{"plan":"starter","note":null,"at":"2026-10-01T00:00:00Z","by":"x"}}'::jsonb WHERE id=$1`, [B.org.id]);
  const P3 = await mkOrg("u");
  await db.query(`UPDATE organizations SET "isPlatform"=true WHERE id=$1`, [P3.org.id]);
  const listed = await call("/platform/organizations", { token: P3.token });
  const row = (listed.json ?? []).find?.((o) => o.id === B.org.id);
  check("platform staff see the pending upgrade request in the list", row?.upgradeRequest?.plan === "starter", JSON.stringify(row?.upgradeRequest));
  await call(`/platform/organizations/${B.org.id}`, { method: "PATCH", token: P3.token, body: { plan: "starter" } });
  const cleared = (await db.query(`SELECT settings->'upgradeRequest' AS r FROM organizations WHERE id=$1`, [B.org.id])).rows[0].r;
  check("changing the plan clears the request", cleared === null, JSON.stringify(cleared));
  await db.query(`UPDATE organizations SET "isPlatform"=false WHERE id=$1`, [P3.org.id]);

  const employeeTry = await call("/workspace/api-key/rotate", { method: "POST" });
  check("rotating needs a signed-in owner", employeeTry.status === 401, `status ${employeeTry.status}`);
}


// ── 19. Nothing secret reached the server log (runs last so it sees every secret generated) ──
{
  if (process.env.SERVER_LOG) {
    await new Promise((r) => setTimeout(r, 300));
    const log = fs.readFileSync(process.env.SERVER_LOG, "utf8");
    check("the server log holds no passwords", !log.includes("Passw0rdTest1") && !log.includes("WrongPassw0rd"));
    const leaked = probes.filter((p) => p && log.includes(p));
    check(`the server log holds none of the ${probes.length} generated secrets (TOTP secret, recovery codes, MFA token)`, probes.length >= 10 && leaked.length === 0, `leaked: ${leaked.length}`);
    check("the server log holds no link tokens", !/verify-email\?token=[^*]/.test(log) && !/[?&]t=[A-Za-z0-9_-]{20,}/.test(log));
  }
}

// ── Report ──────────────────────────────────────────────────────────────────
await db?.end();
let failed = 0;
for (const r of results) {
  if (!r.pass) failed++;
  console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.pass ? "" : `   ← ${r.detail}`}`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
