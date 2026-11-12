import { renderProductOgImage } from "@/components/og";

export const alt = "HR & People — Onboarding, records, offer letters and e-signing | Rhinon Tech";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderProductOgImage("hr");
}

