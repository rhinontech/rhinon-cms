import { productOgAlt, renderProductOgImage } from "@/components/og";

export const alt = productOgAlt("inbox");
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderProductOgImage("inbox");
}

