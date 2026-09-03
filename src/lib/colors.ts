import type { RGBColor } from "@/types/image";

/** Parses `#abc`, `#aabbcc`, or the same without the hash. */
export function hexToRgb(hex: string): RGBColor | null {
  const value = hex.trim().replace(/^#/, "");

  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;

  if (!/^[0-9a-f]{6}$/i.test(full)) return null;

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: RGBColor): string {
  const part = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

/**
 * The furthest two colours in sRGB (black to white) are sqrt(3 * 255²) apart.
 * Used to normalise distance into a 0–1 similarity.
 */
const MAX_RGB_DISTANCE = Math.sqrt(3 * 255 ** 2);

export function rgbDistance(a: RGBColor, b: RGBColor): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

/** 1 = identical, 0 = maximally distant. */
export function colorSimilarity(a: RGBColor, b: RGBColor): number {
  return 1 - rgbDistance(a, b) / MAX_RGB_DISTANCE;
}
