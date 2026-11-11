import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  let logoSrc = "";
  try {
    const logoBuffer = fs.readFileSync(path.join(process.cwd(), "public", "uppercurve_logo_nav.png"));
    logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  } catch {
    logoSrc = "";
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#FFFFFF",
          backgroundImage:
            "radial-gradient(ellipse 70% 50% at 50% 0%, #E2EDFF 0%, #FFFFFF 65%), radial-gradient(circle at 90% 90%, #F1F6FF 0%, #FFFFFF 50%)",
          padding: "50px 70px",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {/* Top Navbar mimic */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt="UpperCurve" width={60} height={33} style={{ objectFit: "contain" }} />
            ) : null}
            <div style={{ display: "flex", fontSize: "28px", fontWeight: 900, letterSpacing: "-0.5px" }}>
              <span style={{ color: "#0B1B42" }}>UPPER</span>
              <span style={{ color: "#4F46E5" }}>CURVE</span>
            </div>
          </div>

          {/* Eyebrow tag from page */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#0052FF",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "2.5px",
              textTransform: "uppercase",
            }}
          >
            <span style={{ opacity: 0.6 }}>‹</span>
            <span>THE MARKET HAS ALREADY CHANGED</span>
            <span style={{ opacity: 0.6 }}>›</span>
          </div>
        </div>

        {/* Center: Exact Headline from Homepage */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "14px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              fontSize: "58px",
              fontWeight: 900,
              color: "#0B1B3D",
              lineHeight: 1.12,
              letterSpacing: "-1.5px",
            }}
          >
            <div style={{ display: "flex" }}>
              <span>Become the Professional</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span
                style={{
                  backgroundColor: "#EBF3FF",
                  color: "#0B1B3D",
                  padding: "2px 20px",
                  borderRadius: "16px",
                  fontWeight: 900,
                  boxShadow: "0 2px 6px rgba(0, 82, 255, 0.08)",
                }}
              >
                Built
              </span>
              <span>for the</span>
              <span
                style={{
                  backgroundImage: "linear-gradient(to right, #0052FF, #0077FF, #00C2FF)",
                  backgroundClip: "text",
                  color: "#0052FF",
                  fontWeight: 900,
                }}
              >
                Next
              </span>
            </div>

            <div style={{ display: "flex" }}>
              <span
                style={{
                  backgroundImage: "linear-gradient(to right, #0052FF, #0066FF, #00B4D8)",
                  backgroundClip: "text",
                  color: "#0066FF",
                  fontWeight: 900,
                }}
              >
                Decade in AI.
              </span>
            </div>
          </div>

          {/* Subtitle from page */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              fontSize: "19px",
              color: "#475569",
              lineHeight: 1.45,
              maxWidth: "800px",
            }}
          >
            <span style={{ fontWeight: 700, color: "#1E293B" }}>The investment that compounds.</span>
            <span>
              Strong technical foundations, AI integrated at every stage, and a curriculum that evolves as the market does.
            </span>
          </div>

          {/* Button previews matching page */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "6px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#000000",
                color: "#FFFFFF",
                padding: "10px 24px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              Explore programs
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#FFFFFF",
                color: "#0B1B3D",
                border: "1.5px solid #CBD5E1",
                padding: "10px 24px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              Join the community
            </div>
          </div>
        </div>

        {/* Footer: Programs Strip from page */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #E2E8F0",
            paddingTop: "20px",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "24px", fontSize: "14px", color: "#64748B", fontWeight: 600 }}>
            <span style={{ textTransform: "uppercase", fontSize: "11px", letterSpacing: "2px", color: "#94A3B8", fontWeight: 800 }}>
              PROGRAMS:
            </span>
            <span>Platform Engineering</span>
            <span style={{ color: "#CBD5E1" }}>•</span>
            <span>Modern Software & AI Engineering</span>
            <span style={{ color: "#CBD5E1" }}>•</span>
            <span>Data Science & ML</span>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "18px",
              fontWeight: 800,
              color: "#0052FF",
            }}
          >
            uppercurve.in
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
