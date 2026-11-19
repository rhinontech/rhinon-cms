import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { bySlug } from "@/content/products";

const SIZE = { width: 1200, height: 630 };

export async function renderOgImage({
  eyebrow,
  title,
  subtitle,
  tones = ["#7c5cff", "#2f5bff", "#ff5fb0"],
  titleSize = 76,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  tones?: [string, string] | [string, string, string];
  titleSize?: number;
}) {
  const logo = await readFile(path.join(process.cwd(), "public/brand/logo-white.png"));
  const src = `data:image/png;base64,${logo.toString("base64")}`;
  const [t1, t2, t3] = [tones[0], tones[1], tones[2] ?? tones[0]];

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
          background: `radial-gradient(60% 70% at 100% 0%, ${t1}bf, transparent 60%), radial-gradient(60% 70% at 0% 100%, ${t2}b3, transparent 60%), radial-gradient(40% 50% at 90% 100%, ${t3}73, transparent 60%), #050b24`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" width={340} height={93} />
          {eyebrow && (
            <div
              style={{
                display: "flex",
                padding: "10px 22px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.22)",
                background: "rgba(255,255,255,0.08)",
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.9)",
              }}
            >
              {eyebrow}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: titleSize, fontWeight: 700, lineHeight: 1.04, letterSpacing: -2.5 }}>{title}</div>
          <div style={{ marginTop: 26, fontSize: 30, lineHeight: 1.3, color: "rgba(255,255,255,0.74)" }}>{subtitle}</div>
        </div>
      </div>
    ),
    SIZE,
  );
}

export function renderProductOgImage(slug: string) {
  const product = bySlug(slug);
  if (!product) {
    return renderOgImage({
      title: "The workspace that runs your whole company.",
      subtitle: "CRM · Outreach · Inbox · Projects · HR · Payroll · AI",
    });
  }
  return renderOgImage({
    eyebrow: product.premium ? `${product.group} · Premium Add-on` : `${product.group} · Free for your team`,
    title: product.name,
    subtitle: product.short,
    tones: product.tone,
    titleSize: 84,
  });
}

