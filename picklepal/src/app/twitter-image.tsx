import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "DinkDay — Game day, handled.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#2D8B4E",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background accent circles */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-120px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(33, 150, 243, 0.15)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-80px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(245, 197, 24, 0.12)",
          }}
        />

        {/* Gold accent bar */}
        <div
          style={{
            width: "80px",
            height: "6px",
            background: "#F5C518",
            borderRadius: "3px",
            marginBottom: "32px",
          }}
        />

        {/* Wordmark */}
        <div
          style={{
            fontSize: "96px",
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-2px",
            lineHeight: 1,
            marginBottom: "24px",
          }}
        >
          Dink<span style={{ color: "#F5C518" }}>Day</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "36px",
            color: "rgba(255,255,255,0.85)",
            fontWeight: 400,
            letterSpacing: "0.02em",
            marginBottom: "48px",
          }}
        >
          Game day, handled.
        </div>

        {/* Supporting line */}
        <div
          style={{
            fontSize: "22px",
            color: "rgba(255,255,255,0.55)",
            fontWeight: 400,
            textAlign: "center",
            maxWidth: "700px",
          }}
        >
          Live scoring · Fair rotations · Persistent rankings · Shareable recaps
        </div>

        {/* Domain badge */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            right: "60px",
            fontSize: "18px",
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.04em",
          }}
        >
          dinkday.site
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
