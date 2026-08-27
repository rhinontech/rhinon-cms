/**
 * Address hygiene for anything that lands in `leads.email`.
 *
 * A single malformed address is disproportionately expensive here: SES rejects
 * the whole send for that recipient, and until it is resolved the lead stays
 * pending, which keeps its campaign from ever reaching "Completed". Cleaning at
 * ingest is what stops that from happening in the first place.
 */

/** Trailing dots ("user@example.com."), stray whitespace, and wrapping <> or quotes. */
export function normalizeEmail(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;

  let value = raw.toString().trim();
  if (!value) return null;

  // "Display Name <user@example.com>" and quoted forms show up in pasted CSVs.
  const angled = value.match(/<([^>]+)>\s*$/);
  if (angled) value = angled[1];

  value = value
    .replace(/^["'\s]+|["'\s]+$/g, "")
    // Internal whitespace is never valid in the addresses we handle.
    .replace(/\s+/g, "")
    // The root-label dot is legal in DNS but SES rejects it on a destination.
    .replace(/\.+$/, "")
    .replace(/^\.+/, "")
    .toLowerCase();

  return value || null;
}

/** Deliberately permissive — catches the shapes SES hard-rejects, not RFC 5322. */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return /^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/.test(email);
}
