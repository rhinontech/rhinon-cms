/**
 * Cross-tenant isolation test.
 *
 * Signs up two real workspaces over HTTP and checks that neither can see the
 * other. Run it against a THROWAWAY database — it creates organizations, users
 * and leads:
 *
 *   createdb rhinon_tenancy_test
 *   cd /tmp && DATABASE_URL=postgres://$USER@localhost:5432/rhinon_tenancy_test \
 *     JWT_SECRET=test PORT=5099 node <repo>/rhinontech/backend/dist/server.js
 *   node scripts/isolation-test.mjs
 *
 * Run from a directory with no .env so production credentials cannot load.
 *
 * Pair it with TENANT_STRICT=true, which turns any query that reaches a
 * tenant-owned model outside a tenant context into a thrown error rather than
 * a warning — that is how the unauthenticated /workflows router was found.
 */
const API = process.env.TEST_API || "http://localhost:5099";
const results = [];
const check = (name, pass, detail = "") => results.push({ name, pass, detail });

async function call(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  return { status: res.status, data };
}

const signup = (name, slug, person, email) =>
  call("/auth/signup", {
    method: "POST",
    body: {
      fullName: person,
      personalEmail: email,
      password: "Password123",
      organizationName: name,
      organizationSlug: slug,
    },
  });

const run = async () => {
  // --- signup ------------------------------------------------------------
  const a = await signup("Swiggy", "swiggy", "Aman Gupta", "aman@gmail.com");
  check("org A signup", a.status === 201, `${a.status} ${a.data?.message ?? ""}`);
  check(
    "org A email is on its own subdomain",
    a.data?.companyEmail === "aman@swiggy.rhinontech.in",
    a.data?.companyEmail
  );
  check("org A got an API key once", typeof a.data?.apiKey === "string" && a.data.apiKey.startsWith("rh_live_"), String(a.data?.apiKey).slice(0, 12));

  const b = await signup("Zomato", "zomato", "Riya Shah", "riya@gmail.com");
  check("org B signup", b.status === 201, `${b.status} ${b.data?.message ?? ""}`);
  check("org B email is on its own subdomain", b.data?.companyEmail === "riya@zomato.rhinontech.in", b.data?.companyEmail);

  // The single biggest schema blocker: roles.slug was globally unique, so this
  // second signup used to be impossible.
  check("second org provisioned its own roles", b.status === 201, "");

  // --- slug rules --------------------------------------------------------
  const dup = await signup("Swiggy Two", "swiggy", "X Y", "x@gmail.com");
  check("duplicate slug refused", dup.status === 409, String(dup.status));
  const reserved = await signup("Api Co", "api", "X Y", "x2@gmail.com");
  check("reserved infra slug refused", reserved.status === 400, `${reserved.status} ${reserved.data?.message ?? ""}`);
  const brand = await signup("Hdfc", "hdfc", "X Y", "x3@gmail.com");
  check("brand-squatting slug refused", brand.status === 400, `${brand.status} ${brand.data?.message ?? ""}`);

  const tokenA = a.data.token;
  const tokenB = b.data.token;

  // --- login -------------------------------------------------------------
  const login = await call("/auth/login", { method: "POST", body: { email: "aman@swiggy.rhinontech.in", password: "Password123" } });
  check("login by company address", login.status === 200 && login.data?.organization?.slug === "swiggy", `${login.status} ${login.data?.organization?.slug}`);

  // --- the lead-email constraint ----------------------------------------
  const sharedProspect = "cto@target.com";
  const leadA = await call("/leads", { method: "POST", token: tokenA, body: { name: "CTO Target", email: sharedProspect, company: "Target" } });
  const leadB = await call("/leads", { method: "POST", token: tokenB, body: { name: "CTO Target", email: sharedProspect, company: "Target" } });
  check("both orgs can hold the same prospect", leadA.status < 300 && leadB.status < 300, `A=${leadA.status} B=${leadB.status} ${leadB.data?.message ?? ""}`);

  // --- read isolation ----------------------------------------------------
  const listA = await call("/leads", { token: tokenA });
  const rowsA = Array.isArray(listA.data) ? listA.data : listA.data?.leads ?? listA.data?.rows ?? [];
  check("org A sees exactly its own leads", rowsA.length === 1, `count=${rowsA.length}`);

  const listB = await call("/leads", { token: tokenB });
  const rowsB = Array.isArray(listB.data) ? listB.data : listB.data?.leads ?? listB.data?.rows ?? [];
  check("org B sees exactly its own leads", rowsB.length === 1, `count=${rowsB.length}`);

  const idB = leadB.data?.id ?? rowsB[0]?.id;
  if (idB) {
    const cross = await call(`/leads/${idB}`, { token: tokenA });
    check("org A cannot read org B's lead by id", cross.status === 404 || cross.status === 403, String(cross.status));
  }

  // --- people/user isolation --------------------------------------------
  const peopleA = await call("/employees", { token: tokenA });
  const peopleRows = Array.isArray(peopleA.data) ? peopleA.data : peopleA.data?.rows ?? [];
  const foreign = peopleRows.filter((p) => (p.companyEmail || "").includes("zomato"));
  check("employee directory excludes other tenants", foreign.length === 0, `leaked=${foreign.length} total=${peopleRows.length}`);

  // --- platform-only modules --------------------------------------------
  const deployA = await call("/deploy/targets", { token: tokenA });
  check("tenant refused /deploy", deployA.status === 403, String(deployA.status));
  const ideasA = await call("/startup-ideas", { token: tokenA });
  check("tenant refused /startup-ideas", ideasA.status === 403, String(ideasA.status));

  // --- employee creation uses the org's domain ---------------------------
  const roles = await call("/roles", { token: tokenA });
  const roleRows = Array.isArray(roles.data) ? roles.data : roles.data?.rows ?? [];
  const employeeRole = roleRows.find((r) => r.slug === "employee");
  check("org A has its own roles", Boolean(employeeRole), roleRows.map((r) => r.slug).join(","));

  if (employeeRole) {
    const hire = await call("/employees", {
      method: "POST",
      token: tokenA,
      body: {
        fullName: "Neha Rao",
        personalEmail: "neha@gmail.com",
        roleId: employeeRole.id,
        department: "Sales",
        joiningDate: "2026-09-01",
        emailPrefix: "neha",
      },
    });
    check(
      "new employee lands on the org subdomain",
      hire.data?.companyEmail === "neha@swiggy.rhinontech.in",
      `${hire.status} ${hire.data?.companyEmail ?? hire.data?.message ?? ""}`
    );
  }

  // --- cross-tenant write attempt ---------------------------------------
  const orgBId = b.data?.organization?.id;
  const inject = await call("/leads", {
    method: "POST",
    token: tokenA,
    body: { name: "Injected", email: "inject@target.com", company: "X", organizationId: orgBId },
  });
  const injected = inject.status < 300 ? (inject.data?.organizationId === orgBId) : false;
  check("client cannot set organizationId", !injected, `status=${inject.status}`);

  let failed = 0;
  for (const r of results) {
    if (!r.pass) failed++;
    console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.pass ? "" : `  <- ${r.detail}`}`);
  }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
};

run().catch((e) => { console.error(e); process.exit(1); });
