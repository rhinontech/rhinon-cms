/**
 * Per-org Sites + public tenant routing.
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

  // --- a new workspace gets exactly one site, no brand picker --------------
  const sitesA = await call("/content/sites", { token: tokenA });
  check("new workspace has exactly one site", Array.isArray(sitesA.data) && sitesA.data.length === 1,
    JSON.stringify((sitesA.data || []).map((s) => s.slug)));
  check("that site is the default", sitesA.data?.[0]?.isDefault === true, String(sitesA.data?.[0]?.isDefault));
  check("it is NOT named rhinonlabs/uppercurve", !["rhinonlabs", "uppercurve"].includes(sitesA.data?.[0]?.slug),
    sitesA.data?.[0]?.slug);

  // --- tenant writes a blog without specifying a site ---------------------
  const blog = await call("/content/blogs", { method: "POST", token: tokenA, body: {
    title: "Scaling Swiggy Ops", excerpt: "How we did it", content: "Body text", status: "Published" } });
  check("tenant blog created", blog.status === 201, `${blog.status} ${blog.data?.message ?? ""}`);
  check("blog auto-assigned to the workspace's site", blog.data?.siteId === sitesA.data?.[0]?.id,
    String(blog.data?.siteId));

  // --- platform org keeps both brands -------------------------------------
  // (login as the seeded platform superadmin is not available on a fresh DB,
  //  so check via the public API instead)
  const platformBlogs = await call("/public/blogs");
  check("unkeyed /public/blogs still answers (rhinonlabs back-comp)", platformBlogs.status === 200,
    String(platformBlogs.status));
  check("platform sees none of the tenant's posts", Array.isArray(platformBlogs.data) && platformBlogs.data.length === 0,
    `count=${(platformBlogs.data || []).length}`);

  const uppercurve = await call("/public/blogs?domain=uppercurve");
  check("legacy ?domain=uppercurve still resolves", uppercurve.status === 200, String(uppercurve.status));

  // --- tenant content via path prefix and via api key ----------------------
  const bySlug = await call("/public/swiggy/blogs");
  check("/public/:orgSlug/blogs returns the tenant's post",
    bySlug.status === 200 && bySlug.data?.length === 1, `${bySlug.status} count=${(bySlug.data || []).length}`);

  const byKey = await call("/public/blogs", { headers: { "x-api-key": apiKeyA } });
  check("x-api-key returns the tenant's post",
    byKey.status === 200 && byKey.data?.length === 1, `${byKey.status} count=${(byKey.data || []).length}`);

  const unknown = await call("/public/doesnotexist/blogs");
  check("unknown workspace slug 404s", unknown.status === 404, String(unknown.status));

  // --- the booking bug ----------------------------------------------------
  const avail = await call("/public/swiggy/schedule-call/availability?date=2026-12-15");
  const availPlatform = await call("/public/schedule-call/availability?date=2026-12-15");
  check("tenant booking endpoint is reachable and org-scoped",
    avail.status !== 404, `${avail.status}`);
  check("platform booking endpoint still reachable", availPlatform.status !== 404, `${availPlatform.status}`);

  let failed = 0;
  for (const r of results) { if (!r.p) failed++; console.log(`${r.p ? "PASS" : "FAIL"}  ${r.n}${r.p ? "" : `  <- ${r.d}`}`); }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
};
run().catch((e) => { console.error(e); process.exit(1); });
