import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#07090E",
          padding: "70px 80px",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(99, 102, 241, 0.25) 0%, transparent 50%), radial-gradient(circle at 85% 80%, rgba(236, 72, 153, 0.15) 0%, transparent 50%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#6366F1",
            }}
          />
          <span
            style={{
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#A3B8CC",
            }}
          >
            Rhinon Labs · Build Your MVP
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "950px" }}>
          <h1
            style={{
              fontSize: "58px",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              margin: 0,
            }}
          >
            Have a Startup Idea? Let&apos;s Build It.
          </h1>
          <p
            style={{
              fontSize: "26px",
              lineHeight: 1.4,
              color: "rgba(255, 255, 255, 0.65)",
              margin: 0,
            }}
          >
            Turn your startup idea into a launch-ready product without hiring a tech team. We design, build, and launch MVPs in weeks.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderTop: "1px solid rgba(255, 255, 255, 0.12)",
            paddingTop: "24px",
          }}
        >
          <span style={{ fontSize: "20px", color: "rgba(255, 255, 255, 0.5)" }}>
            rhinonlabs.com/build
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 24px",
              borderRadius: "999px",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              fontSize: "18px",
              fontWeight: 600,
              color: "#ffffff",
            }}
          >
            Launch in Weeks →
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

