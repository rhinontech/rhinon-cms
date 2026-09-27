/**
 * Module boundary between the platform and a customer workspace, plus public
 * tenant routing.
 *
 * Run against a THROWAWAY database with the server on TEST_API (default :5002).
 * Creates a "swiggy" workspace, so run it on its own database — the isolation
 * suite claims the same slug.
 */
const API = process.env.TEST_API || "http://localhost:5002";
const results = [];
const check = (n, p, d = "") => results.push({ n, p, d });

async function call(path, { method = "GET", token, body, headers = {} } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data = null; try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

const signup = (name, slug, person, email) => call("/auth/signup", { method: "POST", body: {
  fullName: person, personalEmail: email, password: "Password123", organizationName: name, organizationSlug: slug } });

const run = async () => {
  const a = await signup("Swiggy", "swiggy", "Aman Gupta", "aman@gmail.com");
  const tokenA = a.data.token;
  const apiKeyA = a.data.apiKey;

  // --- Content is a platform module, not part of a workspace --------------
  // Sites still exist per-org in the data model (the platform org publishes
  // rhinonlabs + uppercurve through them), but the CMS is not sold: a customer
  // gets 403, and never sees the sidebar item because the grant is withheld.
  const sitesA = await call("/content/sites", { token: tokenA });
  check("tenant cannot list sites", sitesA.status === 403, String(sitesA.status));

  const blog = await call("/content/blogs", { method: "POST", token: tokenA, body: {
    title: "Scaling Swiggy Ops", excerpt: "How we did it", content: "Body text", status: "Published" } });
  check("tenant cannot write a blog", blog.status === 403, `${blog.status} ${blog.data?.message ?? ""}`);

  const platformOnly = ["/startup-ideas", "/analytics/overview", "/docs-access", "/deploy/history"];
  for (const path of platformOnly) {
    const res = await call(path, { token: tokenA });
    check(`tenant is refused ${path}`, res.status === 403, String(res.status));
  }

  // Provisioning would invite into Rhinon's own Slack/GitHub on a shared token.
  const prov = await call("/provisioning/00000000-0000-0000-0000-000000000000/slack",
    { method: "POST", token: tokenA });
  check("tenant is refused provisioning", prov.status === 403, String(prov.status));

  // --- the live marketing site is untouched --------------------------------
  const platformBlogs = await call("/public/blogs");
  check("unkeyed /public/blogs still answers (rhinonlabs back-comp)", platformBlogs.status === 200,
    String(platformBlogs.status));
  check("platform sees none of the tenant's posts", Array.isArray(platformBlogs.data) && platformBlogs.data.length === 0,
    `count=${(platformBlogs.data || []).length}`);

  const uppercurve = await call("/public/blogs?domain=uppercurve");
  check("legacy ?domain=uppercurve still resolves", uppercurve.status === 200, String(uppercurve.status));

  // --- public tenant routing still resolves workspaces ---------------------
  const bySlug = await call("/public/swiggy/blogs");
  check("/public/:orgSlug/blogs resolves the workspace",
    bySlug.status === 200 && bySlug.data?.length === 0, `${bySlug.status} count=${(bySlug.data || []).length}`);

  const byKey = await call("/public/blogs", { headers: { "x-api-key": apiKeyA } });
  check("x-api-key resolves the workspace",
    byKey.status === 200 && byKey.data?.length === 0, `${byKey.status} count=${(byKey.data || []).length}`);

  const unknown = await call("/public/doesnotexist/blogs");
  check("unknown workspace slug 404s", unknown.status === 404, String(unknown.status));

  // --- the booking bug ----------------------------------------------------
  // The booking page is Rhinon Labs' own (support@rhinon.tech organizes the
  // invite), so a workspace does not get one — while rhinonlabs.com keeps its.
  const avail = await call("/public/swiggy/schedule-call/availability?date=2026-12-15");
  const availPlatform = await call("/public/schedule-call/availability?date=2026-12-15");
  check("tenant has no booking page", avail.status === 404, `${avail.status}`);
  check("platform booking endpoint still reachable", availPlatform.status !== 404, `${availPlatform.status}`);

  let failed = 0;
  for (const r of results) { if (!r.p) failed++; console.log(`${r.p ? "PASS" : "FAIL"}  ${r.n}${r.p ? "" : `  <- ${r.d}`}`); }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
};
run().catch((e) => { console.error(e); process.exit(1); });
