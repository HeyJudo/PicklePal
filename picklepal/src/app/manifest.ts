import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DinkDay",
    short_name: "DinkDay",
    description:
      "Live scoring, fair rotations, persistent rankings, and shareable Game Day recaps for your pickleball crew.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fff9",
    theme_color: "#2D8B4E",
    icons: [
      {
        src: "/icon",
        sizes: "any",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
