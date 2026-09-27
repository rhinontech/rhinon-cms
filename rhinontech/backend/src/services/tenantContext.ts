import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Per-request tenant context.
 *
 * Multi-tenant isolation in this codebase is NOT "remember to add
 * `where: { organizationId }`" — there are ~850 query call sites across 40 route
 * files, and `authorize()` waves every org's superadmin past every permission
 * check, so a single forgotten clause is a cross-tenant read reachable by an
 * ordinary customer.
 *
 * Instead, the org travels with the async execution context and Sequelize global
 * hooks (see models/tenantScope.ts) inject it into every query on a tenant-owned
 * model. Code that legitimately runs outside a tenant — cron jobs, SES webhooks,
 * the public CMS API, the auth lookup that *resolves* the tenant — has to say so
 * out loud via runAsSystem(), which makes those sites greppable instead of
 * indistinguishable from bugs.
 */

export type TenantMode = "tenant" | "system";

export interface TenantContext {
  mode: TenantMode;
  organizationId: string | null;
  userId: string | null;
  /** Shown in strict-mode errors so an unscoped query names its own origin. */
  label: string;
}

const storage = new AsyncLocalStorage<TenantContext>();

/** Throw instead of warning when a tenant model is queried with no context. */
export function isStrict(): boolean {
  return process.env.TENANT_STRICT === "true";
}

export function getTenantContext(): TenantContext | undefined {
  return storage.getStore();
}

/** The active org, or null under system context / no context at all. */
export function currentOrganizationId(): string | null {
  const ctx = storage.getStore();
  return ctx?.mode === "tenant" ? ctx.organizationId : null;
}

export function currentUserId(): string | null {
  return storage.getStore()?.userId ?? null;
}

/** Run `fn` scoped to one organization. Every tenant query inside is filtered. */
export function runForOrg<T>(
  organizationId: string,
  fn: () => T,
  opts: { userId?: string | null; label?: string } = {}
): T {
  return storage.run(
    {
      mode: "tenant",
      organizationId,
      userId: opts.userId ?? null,
      label: opts.label ?? "tenant",
    },
    fn
  );
}

/**
 * Run `fn` with tenant filtering deliberately off — cron sweeps, inbound
 * webhooks that have to find the tenant before they can scope to it, the public
 * API, and the auth lookup itself.
 *
 * `label` is mandatory: it is what turns "this query is unscoped" from a silent
 * property of the code into something you can read in a log line.
 */
export function runAsSystem<T>(label: string, fn: () => T): T {
  return storage.run(
    { mode: "system", organizationId: null, userId: null, label },
    fn
  );
}

/**
 * Enter tenant context and keep it for the remainder of an Express request.
 * AsyncLocalStorage propagates through the await chain, so everything
 * downstream of next() — including handlers registered later — sees the org.
 */
export function enterTenantContext(
  organizationId: string,
  userId: string | null,
  next: () => void,
  label = "request"
): void {
  runForOrg(organizationId, next, { userId, label });
}
