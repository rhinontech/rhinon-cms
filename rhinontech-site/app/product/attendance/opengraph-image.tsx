import { renderProductOgImage } from "@/components/og";

export const alt = "Attendance & Leave — Clock in, request leave, approve in a tap | Rhinon Tech";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderProductOgImage("attendance");
}

