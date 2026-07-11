import { describe, it, expect } from "vitest";
import {
  parseHex,
  relativeLuminance,
  buildCardGradient,
  FALLBACK_HEX,
} from "../playerCardColor";

describe("parseHex", () => {
  it("parses 6-digit hex", () => {
    expect(parseHex("#2196F3")).toEqual({ r: 33, g: 150, b: 243 });
  });

  it("parses 3-digit shorthand hex", () => {
    expect(parseHex("#fff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("returns null for invalid input", () => {
    expect(parseHex("not-a-color")).toBeNull();
    expect(parseHex(null)).toBeNull();
    expect(parseHex(undefined)).toBeNull();
    expect(parseHex("")).toBeNull();
  });
});

describe("relativeLuminance", () => {
  it("white is brighter than black", () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeGreaterThan(
      relativeLuminance({ r: 0, g: 0, b: 0 }),
    );
  });
});

describe("buildCardGradient", () => {
  it("falls back to the neutral color for null/invalid hex", () => {
    const fallback = buildCardGradient(FALLBACK_HEX);
    expect(buildCardGradient(null)).toEqual(fallback);
    expect(buildCardGradient("garbage")).toEqual(fallback);
  });

  it("keeps both stops safe for unscrimmed white text on a light color", () => {
    const { from, to } = buildCardGradient("#F5C518"); // ball yellow
    // 0.30 = white text stays >= 3:1 (WCAG AA large text) on either stop
    expect(relativeLuminance(parseHex(from)!)).toBeLessThanOrEqual(0.3);
    expect(relativeLuminance(parseHex(to)!)).toBeLessThanOrEqual(0.3);
  });

  it("pushes a light color's stops well below its own natural luminance", () => {
    const yellow = parseHex("#F5C518")!; // ball yellow, luminance well above 0.5
    const naturalLuminance = relativeLuminance(yellow);

    const { from, to } = buildCardGradient("#F5C518");

    // The guardrail must darken meaningfully below the raw color itself,
    // not just apply the same lighten/darken math a dark hue would get.
    expect(relativeLuminance(parseHex(from)!)).toBeLessThan(naturalLuminance);
    expect(relativeLuminance(parseHex(to)!)).toBeLessThan(naturalLuminance);
  });

  it("leaves an already-dark color's top stop close to a simple lighten (no forced push)", () => {
    const green = parseHex("#2D8B4E")!; // court green, luminance well below 0.45
    const naturalLuminance = relativeLuminance(green);

    const { from } = buildCardGradient("#2D8B4E");
    const fromLuminance = relativeLuminance(parseHex(from)!);

    // Dark colors only need the "slightly lightened" top stop, not the
    // guardrail's repeated darkening — so it should land above the base
    // color's own luminance (lightened), not collapse toward black.
    expect(fromLuminance).toBeGreaterThan(naturalLuminance);
  });

  it("returns distinct hex stops", () => {
    const { from, to } = buildCardGradient("#2196F3");
    expect(from).not.toEqual(to);
  });
});
