import { ImageResponse } from "next/og";
import { getCourse, COURSES } from "@/components/Pages/Courses/courseData";
import fs from "fs";
import path from "path";

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = getCourse(slug) || COURSES[0];

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
          backgroundColor: "#06102B",
          backgroundImage:
            "radial-gradient(circle at 10% 20%, rgba(0,82,255,0.45) 0%, transparent 60%), radial-gradient(circle at 90% 80%, rgba(0,194,255,0.22) 0%, transparent 60%)",
          padding: "48px 64px",
          color: "#FFFFFF",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {/* Top Navbar */}
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
            <div style={{ display: "flex", fontSize: "24px", fontWeight: 900, letterSpacing: "-0.5px" }}>
              <span style={{ color: "#FFFFFF" }}>UPPER</span>
              <span style={{ color: "#818CF8" }}>CURVE</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#7DD3FC",
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "monospace",
              letterSpacing: "2.5px",
              textTransform: "uppercase",
            }}
          >
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#00C2FF" }} />
            <span>{course.eyebrow?.trim() || "6 WEEKS LIVE COHORT · LIMITED SEATS"}</span>
          </div>
        </div>

        {/* 2-Column Main Section Matching Course Landing Hero */}
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
          {/* Left Column (Pitch) */}
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
                fontSize: "64px",
                fontWeight: 900,
                lineHeight: 0.98,
                letterSpacing: "-2px",
              }}
            >
              <span style={{ color: "#FFFFFF" }}>{course.title}</span>
              <span
                style={{
                  backgroundImage: "linear-gradient(to right, #0052FF, #0077FF, #00C2FF)",
                  backgroundClip: "text",
                  color: "#00C2FF",
                }}
              >
                {course.titleAccent}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                fontSize: "19px",
                fontWeight: 500,
                color: "rgba(255,255,255,0.8)",
                lineHeight: 1.4,
                maxWidth: "560px",
              }}
            >
              {course.tagline || "Go beyond just using AI, Learn to build AI Agents that actually Work."}
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: "28px", marginTop: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "28px", fontWeight: 900, color: "#FFFFFF" }}>6</span>
                <span style={{ fontSize: "10px", fontFamily: "monospace", letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
                  Weeks Live
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "28px", fontWeight: 900, color: "#FFFFFF" }}>10+</span>
                <span style={{ fontSize: "10px", fontFamily: "monospace", letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
                  Agent Projects
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "28px", fontWeight: 900, color: "#FFFFFF" }}>1:1</span>
                <span style={{ fontSize: "10px", fontFamily: "monospace", letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
                  Mentorship
                </span>
              </div>
            </div>
          </div>

          {/* Right Column (Glassmorphism Enrolment Card matching the page) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: "0 0 380px",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              borderRadius: "20px",
              padding: "22px 24px",
              gap: "12px",
              boxShadow: "0 25px 60px rgba(0, 10, 40, 0.8)",
            }}
          >
            {/* Card top */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "10px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                fontSize: "11px",
                fontFamily: "monospace",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#6EE7B7", fontWeight: 700 }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#34D399" }} />
                <span>Enrolling now</span>
              </div>
              <span style={{ color: "rgba(255, 255, 255, 0.45)" }}>{course.cohortLabel || "Next Cohort"}</span>
            </div>

            {/* Card headline */}
            <div style={{ display: "flex", fontSize: "20px", fontWeight: 900, color: "#FFFFFF", lineHeight: 1.2 }}>
              <span>Go from Prompting to </span>
              <span style={{ color: "#7DD3FC", marginLeft: "6px" }}>Deploying.</span>
            </div>

            {/* Card points */}
            <div style={{ display: "flex", flexDirection: "column", gap: "7px", fontSize: "13px", color: "rgba(255, 255, 255, 0.9)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#7DD3FC", fontWeight: 900 }}>✓</span>
                <span>10+ Hands-On Agent Projects</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#7DD3FC", fontWeight: 900 }}>✓</span>
                <span>Live Weekly Sessions with 1:1 Doubts</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#7DD3FC", fontWeight: 900 }}>✓</span>
                <span>Verified UpperCurve Certificate</span>
              </div>
            </div>

            {/* CTA Button */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#0052FF",
                color: "#FFFFFF",
                padding: "10px 0",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 800,
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginTop: "4px",
              }}
            >
              CLAIM YOUR SEAT
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            paddingTop: "18px",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", gap: "20px", fontSize: "13px", color: "rgba(255, 255, 255, 0.5)", fontWeight: 500 }}>
            <span>Tools: Claude</span>
            <span>•</span>
            <span>LangGraph</span>
            <span>•</span>
            <span>CrewAI</span>
            <span>•</span>
            <span>n8n</span>
            <span>•</span>
            <span>Make.com</span>
          </div>

          <div style={{ display: "flex", fontSize: "16px", fontWeight: 800, color: "#818CF8" }}>
            uppercurve.in/courses
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
