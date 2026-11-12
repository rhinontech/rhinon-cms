import { renderOgImage } from "@/components/og";

export const alt = "Rhinon Tech: run your whole company from one workspace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgImage({
    title: "The workspace that runs your whole company.",
    subtitle: "CRM · Outreach · Inbox · Projects · HR · Payroll · AI",
    titleSize: 82,
  });
}
