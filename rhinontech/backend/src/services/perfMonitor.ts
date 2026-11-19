/**
 * Says out loud when the one Node thread is stalled, and why.
 *
 * Every request, cron job and socket shares a single event loop, so a stall is felt by
 * everyone at once — but nothing recorded one. pm2's metrics showed an event-loop p95 of
 * ~1.8 s while the request log (which times each request from the moment it starts)
 * could only show the symptom. This adds the two missing signals:
 *
 *   [Perf] event loop stalled in the last 30s: p99=…ms max=…ms
 *   [Perf] major GC paused the event loop 240ms (heapUsed=612MB)
 *   [Perf] memory rss=… heapUsed=… heapTotal=… heapLimit=… external=… arrayBuffers=…
 *
 * Stalls with no GC line next to them are CPU-bound request code; stalls that line up
 * with major GC pauses are heap pressure. Both are cheap to record: a histogram sampled
 * every 20 ms, a GC observer and one log line per 5 minutes.
 *
 * Env: PERF_LOG=off disables it; PERF_STALL_MS (default 250), PERF_GC_MS (100) and
 * PERF_WINDOW_MS (30000) tune what is worth a line.
 */
import { monitorEventLoopDelay, PerformanceObserver, constants } from "node:perf_hooks";
import v8 from "node:v8";

const enabled = (process.env.PERF_LOG || "on").toLowerCase() !== "off";
const STALL_MS = Number(process.env.PERF_STALL_MS) || 250;
const GC_MS = Number(process.env.PERF_GC_MS) || 100;
const WINDOW_MS = Number(process.env.PERF_WINDOW_MS) || 30_000;
const MEMORY_EVERY_MS = 5 * 60_000;

const mb = (bytes: number) => Math.round(bytes / 1048576);

const GC_KIND: Record<number, string> = {
  [constants.NODE_PERFORMANCE_GC_MAJOR]: "major",
  [constants.NODE_PERFORMANCE_GC_MINOR]: "minor",
  [constants.NODE_PERFORMANCE_GC_INCREMENTAL]: "incremental",
  [constants.NODE_PERFORMANCE_GC_WEAKCB]: "weak-callback",
};

function logMemory() {
  const m = process.memoryUsage();
  const h = v8.getHeapStatistics();
  console.log(
    `[Perf] memory rss=${mb(m.rss)}MB heapUsed=${mb(m.heapUsed)}MB heapTotal=${mb(m.heapTotal)}MB heapLimit=${mb(h.heap_size_limit)}MB external=${mb(m.external)}MB arrayBuffers=${mb(m.arrayBuffers)}MB`
  );
}

let started = false;

export function startPerfMonitor(): void {
  if (!enabled || started) return;
  started = true;

  const lag = monitorEventLoopDelay({ resolution: 20 });
  lag.enable();
  setInterval(() => {
    const p99 = lag.percentile(99) / 1e6;
    const max = lag.max / 1e6;
    if (p99 >= STALL_MS || max >= STALL_MS * 4) {
      console.warn(`[Perf] event loop stalled in the last ${Math.round(WINDOW_MS / 1000)}s: p99=${Math.round(p99)}ms max=${Math.round(max)}ms`);
    }
    lag.reset();
  }, WINDOW_MS).unref();

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration < GC_MS) continue;
      const kind = GC_KIND[(entry as unknown as { detail?: { kind?: number } }).detail?.kind ?? -1] ?? "unknown";
      console.warn(`[Perf] ${kind} GC paused the event loop ${Math.round(entry.duration)}ms (heapUsed=${mb(process.memoryUsage().heapUsed)}MB)`);
    }
  }).observe({ entryTypes: ["gc"] });

  logMemory(); // a baseline right after boot
  setInterval(logMemory, MEMORY_EVERY_MS).unref();
}
