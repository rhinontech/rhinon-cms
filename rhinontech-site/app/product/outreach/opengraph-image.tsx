import { productOgAlt, renderProductOgImage } from "@/components/og";

export const alt = productOgAlt("outreach");
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderProductOgImage("outreach");
}

