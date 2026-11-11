import { renderOgImage } from "@/components/og";

export const alt = "Rhinon AI — Built into your CRM, outreach, chatbot & HR";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgImage({
    eyebrow: "Rhinon AI",
    title: "AI built into the work. You stay in control.",
    subtitle: "Researches leads, drafts emails, answers visitors and updates records — with your approval.",
    tones: ["#7c5cff", "#ff5fb0", "#2f5bff"],
    titleSize: 72,
  });
}

