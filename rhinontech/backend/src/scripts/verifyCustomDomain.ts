/**
 * Exercises the custom-domain flow end to end against a real database and a
 * stand-in for SES, so it never touches AWS. Point DATABASE_URL at a throwaway
 * database that the API has already booted against (so the schema exists):
 *
 *   DATABASE_URL=postgres://… npm run verify:customdomain
 */
import crypto from "crypto";
import { sequelize } from "../config/database";
import { Organization, Site } from "../models";
import { provisionOrganizationDefaults } from "../services/orgProvisioning";
import { requestCustomDomain, refreshCustomDomain, removeCustomDomain, normalizeDomain, CustomDomainError } from "../services/customDomain";
import { resolveInboundRecipient } from "../services/inboundRouting";
import { brandSender, refreshSendingDomains } from "../services/siteSender";
import { runAsSystem, runForOrg } from "../services/tenantContext";

const results: { name: string; pass: boolean; detail?: string }[] = [];
const check = (name: string, pass: boolean, detail = "") => results.push({ name, pass, detail });

// A minimal SES: identities that start unverified and verify when told to.
function fakeSes() {
  const identities = new Map<string, { verified: boolean; failed: boolean }>();
  return {
    identities,
    send: async (cmd: any) => {
      const kind = cmd.constructor.name;
      const id = cmd.input?.EmailIdentity as string;
      if (kind === "CreateEmailIdentityCommand") {
        if (identities.has(id)) { const e: any = new Error("exists"); e.name = "AlreadyExistsException"; throw e; }
        identities.set(id, { verified: false, failed: false });
        return { DkimAttributes: { Tokens: ["tokA", "tokB", "tokC"] } };
      }
      if (kind === "GetEmailIdentityCommand") {
        const i = identities.get(id);
        if (!i) { const e: any = new Error("nf"); e.name = "NotFoundException"; throw e; }
        return { VerifiedForSendingStatus: i.verified, DkimAttributes: { Status: i.failed ? "FAILED" : i.verified ? "SUCCESS" : "PENDING" } };
      }
      if (kind === "DeleteEmailIdentityCommand") { identities.delete(id); return {}; }
      throw new Error(`unexpected ${kind}`);
    },
  } as any;
}

const expectError = async (fn: () => Promise<unknown>) => {
  try { await fn(); return null; } catch (e: any) { return e instanceof CustomDomainError ? e : (e as Error); }
};

(async () => {
  const tag = crypto.randomBytes(3).toString("hex");
  const mk = async (slug: string, plan: "free" | "starter") => {
    const org = await runAsSystem("verify", () =>
      Organization.create({ name: slug, slug, emailDomain: `${slug}.rhinontech.in`, status: "active", plan, settings: {} } as any)
    );
    await provisionOrganizationDefaults(org.id);
    return org;
  };
  const paid = await mk(`cdpaid-${tag}`, "starter");
  const other = await mk(`cdother-${tag}`, "starter");
  const third = await mk(`cdthird-${tag}`, "starter");
  const free = await mk(`cdfree-${tag}`, "free");
  const platform = (await runAsSystem("verify", () => Organization.findOne({ where: { isPlatform: true } })))!;
  const domain = `acme-${tag}.com`;
  const ses = fakeSes();
  const reload = (id: string) => Organization.findByPk(id) as Promise<Organization>;
  const siteOf = (orgId: string, where: any) => runForOrg(orgId, () => Site.findOne({ where }));

  // ── validation ────────────────────────────────────────────────────────────
  for (const [label, input] of [["free mail provider", "gmail.com"], ["platform domain", "rhinontech.in"], ["platform subdomain", "x.rhinontech.in"], ["email address", "a@b.com"], ["url", "https://acme.com"], ["single label", "localhost"], ["bad label", "-x.com"], ["empty", ""]] as const) {
    const err = await expectError(async () => normalizeDomain(input));
    check(`rejects ${label}`, err instanceof CustomDomainError, String(err?.message));
  }
  check("normalises case and trailing dot", normalizeDomain(" ACME.com. ") === "acme.com");

  // ── a free workspace cannot; a paid one gets exactly one ──────────────────
  const gated = await expectError(() => requestCustomDomain(free, { domain }, ses));
  check("free plan cannot add a custom domain", gated instanceof CustomDomainError && gated.status === 402, String(gated?.message));

  const view = await requestCustomDomain(paid, { domain }, ses);
  const item = view.domains[0];
  check("request returns pending with DKIM, SPF and optional DMARC/MX records",
    item?.status === "pending" && item.records.filter((r) => r.type === "CNAME").length === 3 && item.records.some((r) => r.type === "TXT" && r.value.includes("amazonses")) && item.records.some((r) => r.type === "MX" && r.optional), JSON.stringify(item?.records.map((r) => r.type)));
  check("the inbound MX is marked optional and carries a warning", (item.records.find((r) => r.type === "MX")?.purpose ?? "").includes("WARNING"));
  check("a paid workspace's limit is one and it is now used up", view.limit === 1 && view.canAddMore === false);
  check("the first domain is recorded on the organization", (await reload(paid.id)).customDomain === domain);

  const second = await expectError(async () => requestCustomDomain(await reload(paid.id), { domain: `other-${tag}.com` }, ses));
  check("a customer cannot add a second domain", second instanceof CustomDomainError && second.status === 409, String(second?.message));
  const brand = await expectError(() => requestCustomDomain(other, { domain: `brand-${tag}.com`, brandName: "Extra" }, ses));
  check("a customer cannot create extra brands", brand instanceof CustomDomainError && brand.status === 403, String(brand?.message));
  const dupe = await expectError(() => requestCustomDomain(other, { domain }, ses));
  check("another workspace cannot claim the same domain", dupe instanceof CustomDomainError && dupe.status === 409, String(dupe?.message));

  // ── pending changes nothing ───────────────────────────────────────────────
  const pending = await refreshCustomDomain(await reload(paid.id), ses);
  check("still pending while DNS is not published", pending.domains[0].status === "pending");
  check("an unverified domain routes no inbound mail", (await resolveInboundRecipient(`hi@${domain}`)) === null);
  check("the brand still sends from the platform domain", !(await siteOf(paid.id, { isDefault: true }))?.sendingDomain);

  // ── verification ──────────────────────────────────────────────────────────
  ses.identities.get(domain).verified = true;
  const done = await refreshCustomDomain(await reload(paid.id), ses);
  check("verifies once SES sees the DKIM records", done.domains[0].status === "verified");
  const siteAfter = await siteOf(paid.id, { isDefault: true });
  check("the brand now sends from the customer's domain", siteAfter?.sendingDomain === domain, String(siteAfter?.sendingDomain));
  await refreshSendingDomains();
  const rewritten = await runForOrg(paid.id, () => brandSender(`sam@cdpaid-${tag}.rhinontech.in`, siteAfter!.id));
  check("outbound addresses are rewritten onto it, keeping the local part", rewritten === `sam@${domain}`, String(rewritten));
  check("a verified domain routes inbound mail to its workspace", (await resolveInboundRecipient(`hello@${domain}`))?.organizationId === paid.id);
  check("...and only that exact domain", (await resolveInboundRecipient(`hello@not-${domain}`)) === null);

  const failing = await requestCustomDomain(other, { domain: `fail-${tag}.com` }, ses);
  ses.identities.get(`fail-${tag}.com`).failed = true;
  const failed = await refreshCustomDomain(await reload(other.id), ses);
  check("a failed DKIM check is reported as failed", failing.domains[0].status === "pending" && failed.domains[0].status === "failed");

  // ── removal ───────────────────────────────────────────────────────────────
  const removed = await removeCustomDomain(await reload(paid.id), domain, ses);
  check("removal clears the domain, the brand and the SES identity",
    removed.domains.length === 0 && !(await siteOf(paid.id, { isDefault: true }))?.sendingDomain && !ses.identities.has(domain) && (await reload(paid.id)).customDomain === null);
  check("a removed domain no longer routes mail", (await resolveInboundRecipient(`hello@${domain}`)) === null);
  const gone = await expectError(() => removeCustomDomain(paid, "never-added.com", ses));
  check("removing a domain that is not there is a 404", gone instanceof CustomDomainError && gone.status === 404);
  const reuse = await requestCustomDomain(third, { domain }, fakeSes());
  check("once removed, the domain can be claimed by someone else", reuse.domains[0].status === "pending");

  // ── the platform workspace: many domains, one per brand ───────────────────
  const d1 = `rl-${tag}.com`, d2 = `uc-${tag}.com`, d3 = `third-${tag}.com`, d4 = `fourth-${tag}.com`;
  const pses = fakeSes();
  const p1 = await requestCustomDomain(platform, { domain: d1 }, pses);
  check("the platform workspace has no domain limit", p1.limit === null && p1.canAddMore === true);
  const p2 = await requestCustomDomain(await reload(platform.id), { domain: d2, brandName: `Uppercurve ${tag}` }, pses);
  const brand2 = p2.domains.find((d) => d.domain === d2)!;
  check("a platform domain can create its own brand", !!brand2.siteId && p2.domains.length === 2);
  const reuseBrand = await expectError(async () => requestCustomDomain(await reload(platform.id), { domain: d3, siteId: brand2.siteId! }, pses));
  check("a brand has only one sending domain", reuseBrand instanceof CustomDomainError && reuseBrand.status === 409, String(reuseBrand?.message));
  const p3 = await requestCustomDomain(await reload(platform.id), { domain: d3, brandName: `Third ${tag}` }, pses);
  check("the platform workspace can keep adding domains", p3.domains.length === 3 && p3.canAddMore === true);
  const nobrand = await expectError(async () => requestCustomDomain(await reload(platform.id), { domain: d4, siteId: "00000000-0000-4000-8000-000000000000" }, pses));
  check("an unknown brand is refused", nobrand instanceof CustomDomainError && nobrand.status === 404, String(nobrand?.message));
  check("...and nothing was registered for the refused domain", !pses.identities.has(d4));

  for (const d of [d1, d2, d3]) pses.identities.get(d).verified = true;
  const pv = await refreshCustomDomain(await reload(platform.id), pses);
  check("all of the platform's domains verify independently", pv.domains.every((d) => d.status === "verified"));
  const sites = await Promise.all(pv.domains.map((d) => runForOrg(platform.id, () => Site.findByPk(d.siteId!))));
  check("each brand sends from its own domain", sites.map((x) => x?.sendingDomain).sort().join() === [d1, d2, d3].sort().join());
  const routes = await Promise.all([d1, d2, d3].map((d) => resolveInboundRecipient(`hi@${d}`)));
  check("inbound mail for every domain reaches the platform workspace, on the right brand",
    routes.every((r) => r?.organizationId === platform.id) && new Set(routes.map((r) => r!.siteId)).size === 3, JSON.stringify(routes.map((r) => r?.siteId)));

  await removeCustomDomain(await reload(platform.id), d1, pses);
  const afterRemove = await reload(platform.id);
  check("removing one platform domain leaves the others and re-points the primary",
    afterRemove.settings.emailDomains!.length === 2 && afterRemove.customDomain === d2, String(afterRemove.customDomain));
  await removeCustomDomain(afterRemove, d2, pses);
  await removeCustomDomain(await reload(platform.id), d3, pses);
  const clean = await reload(platform.id);
  check("the platform workspace is left exactly as it was", clean.customDomain === null && (clean.settings.emailDomains ?? []).length === 0);
  // The brands this run created are scratch data.
  await runForOrg(platform.id, async () => {
    for (const d of sites) if (d && !d.isDefault) await d.destroy();
  });

  // clean up what this script created
  await runAsSystem("verify", async () => {
    for (const o of [paid, other, third, free]) {
      await sequelize.query(`DELETE FROM sites WHERE "organizationId" = :id`, { replacements: { id: o.id } });
      await sequelize.query(`DELETE FROM role_permissions WHERE "roleId" IN (SELECT id FROM roles WHERE "organizationId" = :id)`, { replacements: { id: o.id } });
      for (const t of ["pipeline_stages", "workflow_statuses", "roles"]) {
        await sequelize.query(`DELETE FROM "${t}" WHERE "organizationId" = :id`, { replacements: { id: o.id } }).catch(() => {});
      }
      await o.destroy().catch(() => {});
    }
  });

  let failedCount = 0;
  for (const r of results) { if (!r.pass) failedCount++; console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.pass ? "" : `   ← ${r.detail}`}`); }
  console.log(`\n${results.length - failedCount}/${results.length} passed`);
  await sequelize.close();
  process.exit(failedCount ? 1 : 0);
})();
