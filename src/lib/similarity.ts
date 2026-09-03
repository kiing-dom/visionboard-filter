import type { PaletteEntry, RGBColor } from "@/types/image";
import { colorSimilarity } from "./colors";

/**
 * How well an image's palette satisfies the requested colours.
 *
 * Each target is matched against its closest colour in the palette, then those
 * per-target scores are averaged — so an image must account for every target,
 * not just one of them. The match is weighted by how much of the image the
 * matched colour covers, so a dominant match beats a trace of the same hue.
 */
export function paletteScore(
  palette: PaletteEntry[],
  targets: RGBColor[],
): number {
  if (targets.length === 0 || palette.length === 0) return 0;

  const scores = targets.map((target) => {
    let best = 0;

    for (const entry of palette) {
      // Weight is dampened with a square root: a colour covering 4% of an
      // image shouldn't score at a twenty-fifth of one covering 100%.
      const similarity = colorSimilarity(entry.color, target);
      const prominence = Math.sqrt(entry.weight);
      best = Math.max(best, similarity * (0.4 + 0.6 * prominence));
    }

    return best;
  });

  return scores.reduce((total, score) => total + score, 0) / scores.length;
}
