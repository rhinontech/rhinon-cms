import { renderOgImage } from "@/components/og";

export const alt = "Pricing — Free CRM, HR & project software | Rhinon Tech";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgImage({
    eyebrow: "Pricing · Free for your whole team",
    title: "Free for everything. Pay only for the AI chatbot.",
    subtitle: "CRM, outreach, shared inbox, projects, HR, payroll and attendance at ₹0.",
    tones: ["#10c98f", "#2f5bff", "#7c5cff"],
    titleSize: 72,
  });
}

