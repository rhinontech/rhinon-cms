import express from "express";

/**
 * Routes rejected promises into Express's error pipeline.
 *
 * This is Express 4 (despite the async/await style used throughout): it does
 * NOT await handlers, so a rejection inside `async (req, res) => …` escapes the
 * router entirely. It became an unhandled rejection, which by default kills the
 * process — GET /inbox/conversations matched /inbox/:id, Postgres rejected
 * "conversations" as a uuid, and the backend exited, taking every tenant's
 * in-flight request with it. Any signed-in user could do it with a typo'd URL.
 *
 * Wrapping every handler at the framework level is the only version of this fix
 * that cannot be forgotten at the ~600 call sites, and it keeps working for
 * routes added later. Handlers still reject exactly as before; the rejection now
 * reaches the error middleware in app.ts instead of the process.
 *
 * Must run before any route is declared, since it patches the methods that
 * build the layer stack.
 */
type Handler = (...args: unknown[]) => unknown;

function wrap(fn: Handler): Handler {
  // Arity 4 is an error handler ((err, req, res, next)). Express selects those
  // by `length`, so they are left alone — and `length` is preserved below for
  // the same reason.
  if (typeof fn !== "function" || fn.length >= 4) return fn;

  const wrapped = function (this: unknown, ...args: unknown[]) {
    const next = args[2] as ((err?: unknown) => void) | undefined;
    try {
      const result = fn.apply(this, args) as unknown;
      if (result && typeof (result as Promise<unknown>).catch === "function") {
        (result as Promise<unknown>).catch((err) => next?.(err));
      }
      return result;
    } catch (err) {
      next?.(err);
      return undefined;
    }
  };

  Object.defineProperty(wrapped, "length", { value: fn.length });
  Object.defineProperty(wrapped, "name", { value: fn.name });
  return wrapped as Handler;
}

const wrapAll = (args: unknown[]) =>
  args.map((arg) =>
    typeof arg === "function"
      ? wrap(arg as Handler)
      : Array.isArray(arg)
        ? arg.map((item) => (typeof item === "function" ? wrap(item as Handler) : item))
        : arg
  );

let patched = false;

export function installAsyncErrorHandling(): void {
  if (patched) return;
  patched = true;

  const METHODS = [
    "get", "post", "put", "patch", "delete", "head", "options", "all",
  ] as const;

  // router.get(...) and friends end up here, as does app.get(...).
  const routeProto = (express as unknown as { Route: { prototype: Record<string, unknown> } }).Route
    .prototype;
  for (const method of METHODS) {
    const original = routeProto[method] as Handler | undefined;
    if (typeof original !== "function") continue;
    routeProto[method] = function (this: unknown, ...args: unknown[]) {
      return (original as (...a: unknown[]) => unknown).apply(this, wrapAll(args));
    };
  }

  // router.use(...) / app.use(...) — plain middleware, where `authenticate` and
  // the tenant-context entry points live.
  const routerProto = express.Router as unknown as Record<string, unknown>;
  const originalUse = routerProto.use as Handler | undefined;
  if (typeof originalUse === "function") {
    routerProto.use = function (this: unknown, ...args: unknown[]) {
      return (originalUse as (...a: unknown[]) => unknown).apply(this, wrapAll(args));
    };
  }
}

// Self-installing: route modules call router.get(...) at import time, so the
// patch has to be in place before any of them are loaded. Importing this module
// first in app.ts is what guarantees that ordering.
installAsyncErrorHandling();
