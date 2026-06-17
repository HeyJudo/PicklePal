import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "180px",
          height: "180px",
          background: "#2D8B4E",
          borderRadius: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          fontSize: "110px",
          fontWeight: 900,
          color: "#ffffff",
        }}
      >
        D
      </div>
    ),
    { width: 180, height: 180 },
  );
}
