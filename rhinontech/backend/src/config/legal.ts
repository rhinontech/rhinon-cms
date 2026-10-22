/**
 * The legal documents a workspace owner agrees to.
 *
 * The version is what gets recorded on the organization, so when the terms change
 * bump TERMS_VERSION and every owner is asked to accept the new one (their
 * `termsAccepted` flag from /auth/me flips to false). The URLs are whatever the
 * published documents live at — this only points at them.
 */
export const legal = {
  termsVersion: process.env.TERMS_VERSION || "2026-10-01",
  termsUrl: process.env.TERMS_URL || "",
  privacyUrl: process.env.PRIVACY_URL || "",
  dpaUrl: process.env.DPA_URL || "",
  /** Off by default so the existing signup form keeps working until it sends acceptTerms. */
  requireAcceptance: process.env.REQUIRE_TERMS_ACCEPTANCE === "true",
};
