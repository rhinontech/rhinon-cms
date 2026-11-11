import { renderProductOgImage } from "@/components/og";

export const alt = "Team Chat & Meetings — Chat, group calls and meeting links | Rhinon Tech";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderProductOgImage("chat");
}

