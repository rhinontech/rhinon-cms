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
            "radial-gradient(ellipse 70% 60% at 30% -10%, #E4EEFF 0%, #FFFFFF 70%), radial-gradient(circle at 90% 90%, rgba(0,194,255,0.12) 0%, #FFFFFF 60%)",
          padding: "48px 64px",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {/* Top Header: Logo + Eyebrow */}
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
              <img src={logoSrc} alt="UpperCurve" width={56} height={30} style={{ objectFit: "contain" }} />
            ) : null}
            <div style={{ display: "flex", fontSize: "26px", fontWeight: 900, letterSpacing: "-0.5px" }}>
              <span style={{ color: "#0B1B42" }}>UPPER</span>
              <span style={{ color: "#4F46E5" }}>CURVE</span>
            </div>
          </div>

          {/* Eyebrow badge matching page: Free Certification AI Workshop */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              border: "1px solid #D6E4FF",
              backgroundColor: "#FFFFFF",
              padding: "6px 16px",
              borderRadius: "9999px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#0B1B3D",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#0052FF" }} />
            <span>Free Certification AI Workshop</span>
          </div>
        </div>

        {/* 2-Column Main Section Matching LandingHero.tsx */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "48px",
            width: "100%",
            margin: "auto 0",
          }}
        >
          {/* Left Column (Content) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: "1 1 58%",
              gap: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: "50px",
                fontWeight: 900,
                color: "#0B1B3D",
                lineHeight: 1.1,
                letterSpacing: "-1.5px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span
                  style={{
                    backgroundColor: "#EBF3FF",
                    color: "#0B1B3D",
                    padding: "2px 18px",
                    borderRadius: "14px",
                    fontWeight: 900,
                  }}
                >
                  Free
                </span>
                <span>Live AI</span>
              </div>
              <div style={{ display: "flex" }}>
                <span
                  style={{
                    backgroundImage: "linear-gradient(to right, #0052FF, #0077FF, #00C2FF)",
                    backgroundClip: "text",
                    color: "#0052FF",
                    fontWeight: 900,
                  }}
                >
                  Certification Workshops
                </span>
              </div>
              <div style={{ display: "flex" }}>
                <span>for Builders.</span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                fontSize: "17px",
                fontWeight: 500,
                color: "#475569",
                lineHeight: 1.45,
                maxWidth: "540px",
              }}
            >
              Workshops and masterclasses designed to give you proof of skill, not just theory. Every event issues a verifiable certificate once you build the project.
            </div>

            {/* Stats matching LandingHero.tsx */}
            <div style={{ display: "flex", gap: "32px", marginTop: "8px" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "28px", fontWeight: 900, color: "#0B1B3D" }}>3000+</span>
                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "#94A3B8" }}>
                  Attendees
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "28px", fontWeight: 900, color: "#0B1B3D" }}>8</span>
                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "#94A3B8" }}>
                  Workshops
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "28px", fontWeight: 900, color: "#0B1B3D" }}>100%</span>
                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "#94A3B8" }}>
                  Free Access
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #E2E8F0",
            paddingTop: "18px",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", gap: "24px", fontSize: "14px", color: "#64748B", fontWeight: 600 }}>
            <span>🔴 Live Interactive Sessions</span>
            <span>•</span>
            <span>🏆 Verifiable Certificate</span>
            <span>•</span>
            <span>💬 Active Builder Community</span>
          </div>

          <div style={{ display: "flex", fontSize: "18px", fontWeight: 800, color: "#0052FF" }}>
            uppercurve.in/events
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
