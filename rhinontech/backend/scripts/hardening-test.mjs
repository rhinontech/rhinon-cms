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
 *     AWS_ACCESS_KEY_ID=x AWS_SECRET_ACCESS_KEY=y AWS_S3_BUCKET=b PORT=5099 \
 *     PUBLIC_API_URL=http://localhost:5099 node <repo>/rhinontech/backend/dist/server.js
 *   DATABASE_URL=... node scripts/hardening-test.mjs
 *
 * Start the server fresh: the signup rate limit is per process.
 */
import crypto from "crypto";
import pg from "pg";

const API = process.env.TEST_API || "http://localhost:5099";
const JWT_SECRET = process.env.JWT_SECRET || "test-secret-xyz";
const CRON_SECRET = process.env.CRON_SECRET || "test-cron";
const DB = process.env.DATABASE_URL;
const results = [];
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

// ── Report ──────────────────────────────────────────────────────────────────
await db?.end();
let failed = 0;
for (const r of results) {
  if (!r.pass) failed++;
  console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.pass ? "" : `   ← ${r.detail}`}`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
