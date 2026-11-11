import { renderProductOgImage } from "@/components/og";

export const alt = "AI Chatbot — A website assistant trained on your own content | Rhinon Tech";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderProductOgImage("chatbot");
}

