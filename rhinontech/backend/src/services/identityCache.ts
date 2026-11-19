/**
 * Short-lived cache for the identity `authenticate()` derives on every request.
 *
 * Without it each API call re-reads the user, their role, every permission that role
 * grants and the organization, and hydrates ~50 Sequelize instances before the route
 * even starts. A page that fires twenty calls paid that twenty times, on a single
 * Node thread that every other user shares.
 *
 * The comment in authenticate() is explicit that offboarding, role changes and
 * permission grants must take effect immediately, so this cache is deliberately
 * not "just a TTL":
 *   - models/index.ts clears it whenever a User, Role, Permission, RolePermission or
 *     Organization row is written (after the transaction commits, so a request cannot
 *     re-cache pre-commit data);
 *   - the TTL is the backstop for writes that bypass Sequelize (raw SQL, another
 *     process), keeping the worst case to a few seconds.
 */

const TTL_MS = 10_000;
const MAX_ENTRIES = 1_000;

interface Entry<T> {
  value: T;
  expiresAt: number;
}

const entries = new Map<string, Entry<unknown>>();

export function getCachedIdentity<T>(userId: string): T | undefined {
  const hit = entries.get(userId);
  if (!hit) return undefined;
  if (hit.expiresAt <= Date.now()) {
    entries.delete(userId);
    return undefined;
  }
  return hit.value as T;
}

export function setCachedIdentity<T>(userId: string, value: T): void {
  // Cheapest eviction that keeps the map bounded: drop the oldest inserted key.
  if (entries.size >= MAX_ENTRIES) {
    const oldest = entries.keys().next().value;
    if (oldest !== undefined) entries.delete(oldest);
  }
  entries.set(userId, { value, expiresAt: Date.now() + TTL_MS });
}

/** Forget every cached identity. Cheap, and correct for any identity-affecting write. */
export function clearIdentityCache(): void {
  entries.clear();
}

/**
 * Hook body for models whose rows feed an identity. Clears now and again once the
 * surrounding transaction commits, so a request that lands in between cannot cache
 * the pre-commit state for the full TTL.
 */
export function invalidateIdentityAfterWrite(...args: unknown[]): void {
  clearIdentityCache();
  const options = args[args.length - 1] as { transaction?: { afterCommit?: (fn: () => void) => void } } | undefined;
  options?.transaction?.afterCommit?.(() => clearIdentityCache());
}
