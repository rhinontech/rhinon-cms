/**
 * HTTP status for an error caught in a route handler.
 *
 * A model validation failure (a required field missing, a value the wrong shape)
 * is the caller's mistake, not a server fault — it should answer 400 so clients
 * can show the message and monitoring does not page on someone submitting an
 * empty form. Anything else stays 500.
 */
export function statusFor(err: unknown): number {
  const name = (err as { name?: string } | null)?.name ?? "";
  const pgCode = (err as any)?.parent?.code ?? (err as any)?.original?.code;
  if (name === "SequelizeValidationError" || name === "SequelizeUniqueConstraintError") return 400;
  if (pgCode === "22P02" || pgCode === "23502") return 400; // malformed id, NOT NULL violation
  return 500;
}
