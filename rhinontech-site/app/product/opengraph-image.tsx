import { renderOgImage } from "@/components/og";

export const alt = "Products — CRM, HR, payroll and projects in one workspace | Rhinon Tech";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgImage({
    eyebrow: "Products · 11 modules",
    title: "CRM, HR, payroll and projects, in one workspace.",
    subtitle: "Use one product or all eleven. One workspace, one login and one memory.",
    tones: ["#2f5bff", "#7c5cff", "#2cd3ff"],
    titleSize: 72,
  });
}

