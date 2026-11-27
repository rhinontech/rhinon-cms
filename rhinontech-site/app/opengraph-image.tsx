import { renderOgImage } from "@/components/og";

export const alt = "Rhinon Tech: the AI CRM for agencies and service businesses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgImage({
    title: "Win clients. Deliver the work. Keep them coming back.",
    subtitle: "The AI CRM for agencies and service businesses",
    titleSize: 72,
  });
}
