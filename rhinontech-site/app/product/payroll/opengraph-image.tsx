import { renderProductOgImage } from "@/components/og";

export const alt = "Payroll — Monthly runs and payslips, built for India | Rhinon Tech";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderProductOgImage("payroll");
}

