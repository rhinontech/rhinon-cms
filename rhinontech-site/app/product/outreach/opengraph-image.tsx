import { renderProductOgImage } from "@/components/og";

export const alt = "Outreach — AI cold email that sounds like you wrote it | Rhinon Tech";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderProductOgImage("outreach");
}

