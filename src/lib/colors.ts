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

/**
 * Relative luminance, per WCAG. Used to decide whether a colour needs a light
 * or dark neighbour to stay distinguishable.
 */
export function luminance({ r, g, b }: RGBColor): number {
  const channel = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** True when dark text/edges read better against this colour than light ones. */
export function isLight(color: RGBColor): boolean {
  return luminance(color) > 0.5;
}
