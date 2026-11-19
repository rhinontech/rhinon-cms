import { renderProductOgImage } from "@/components/og";

export const alt = "Inbox — One shared inbox for replies and support | Rhinon Tech";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderProductOgImage("inbox");
}

