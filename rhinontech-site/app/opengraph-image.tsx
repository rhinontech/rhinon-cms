import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Rhinon Tech: run your whole company from one workspace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logo = await readFile(path.join(process.cwd(), "public/brand/logo-white.png"));
  const src = `data:image/png;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          color: "white",
          background:
            "radial-gradient(60% 70% at 100% 0%, rgba(124,92,255,0.75), transparent 60%), radial-gradient(60% 70% at 0% 100%, rgba(47,91,255,0.7), transparent 60%), radial-gradient(40% 50% at 90% 100%, rgba(255,95,176,0.45), transparent 60%), #050b24",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" width={380} height={104} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.02, letterSpacing: -3 }}>The workspace that runs your whole company.</div>
          <div style={{ marginTop: 28, fontSize: 30, color: "rgba(255,255,255,0.7)" }}>CRM · Outreach · Inbox · Projects · HR · Payroll · AI</div>
        </div>
      </div>
    ),
    size,
  );
}
