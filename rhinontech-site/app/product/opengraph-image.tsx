import { renderOgImage } from "@/components/og";

export const alt = "Products — CRM, HR, payroll and projects in one workspace | Rhinon Tech";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgImage({
    eyebrow: "Products",
    title: "Win clients, deliver the work, run your team.",
    subtitle: "CRM, AI Agent, outreach, projects with a client portal, chat, docs and HR in one workspace.",
    tones: ["#2f5bff", "#7c5cff", "#2cd3ff"],
    titleSize: 72,
  });
}

