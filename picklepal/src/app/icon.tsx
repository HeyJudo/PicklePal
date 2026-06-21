import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const svgBuffer = await readFile(
    join(process.cwd(), "public", "assets", "logo-mark.svg"),
  );
  const svgBase64 = svgBuffer.toString("base64");
  const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "32px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={svgDataUrl} alt="" width={32} height={32} />
      </div>
    ),
    { ...size },
  );
}
