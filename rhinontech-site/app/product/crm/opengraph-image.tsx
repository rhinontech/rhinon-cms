import { renderProductOgImage } from "@/components/og";

export const alt = "CRM — Leads, deals and every email on one timeline | Rhinon Tech";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderProductOgImage("crm");
}

