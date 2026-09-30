/**
 * Proof that the background jobs are actually running.
 *
 * The API can answer /health happily while the scheduler that sends every
 * campaign and automation step has silently stopped, and nobody finds out until
 * a customer asks why nothing went out. Each job records a beat when it runs;
 * /health/deep reports how long ago the last one was.
 */
const beats = new Map<string, number>();
const bootedAt = Date.now();

export const beat = (name: string) => void beats.set(name, Date.now());
export const uptimeSeconds = () => Math.floor((Date.now() - bootedAt) / 1000);

export function heartbeat(name: string, maxAgeSeconds: number) {
  const last = beats.get(name);
  // Give a job one full interval after boot before calling its silence a fault.
  if (last === undefined) return { ok: uptimeSeconds() < maxAgeSeconds, lastRunAt: null as string | null, ageSeconds: null as number | null };
  const age = Math.floor((Date.now() - last) / 1000);
  return { ok: age <= maxAgeSeconds, lastRunAt: new Date(last).toISOString(), ageSeconds: age };
}
