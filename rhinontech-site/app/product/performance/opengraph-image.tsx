import { renderProductOgImage } from "@/components/og";

export const alt = "Performance — Review cycles, goals and feedback | Rhinon Tech";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderProductOgImage("performance");
}

