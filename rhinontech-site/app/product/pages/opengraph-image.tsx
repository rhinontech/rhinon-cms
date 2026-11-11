import { renderProductOgImage } from "@/components/og";

export const alt = "Pages — Docs and notes in a tree, next to the work | Rhinon Tech";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderProductOgImage("pages");
}

