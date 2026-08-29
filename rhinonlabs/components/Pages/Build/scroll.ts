// Shared smooth-scroll helper for the /build campaign page's in-page CTAs.
export function scrollToSection(id: string) {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
