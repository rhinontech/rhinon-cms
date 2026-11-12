import { renderProductOgImage } from "@/components/og";

export const alt = "Work — Projects, tasks and a portal your clients love | Rhinon Tech";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderProductOgImage("work");
}

