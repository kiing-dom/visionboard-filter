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

/**
 * CLIP's text and image embeddings sit in a shared space but not on top of
 * each other: even a perfect textual match scores only ~0.3, and every score
 * for one query lands in a narrow band. Shown raw, the best possible hit
 * would read as "30% match".
 *
 * So semantic scores are rescaled against the range this query actually
 * produced — the strongest match becomes 1, the weakest 0. That makes the
 * ordering legible without implying a precision the raw numbers don't carry.
 */
export function normaliseScores(
  scores: ReadonlyMap<string, number>,
): Map<string, number> {
  const values = [...scores.values()];
  if (values.length === 0) return new Map();

  const lowest = Math.min(...values);
  const highest = Math.max(...values);
  const span = highest - lowest;

  // Every image scored identically; treat them all as equally good.
  if (span < 1e-6) {
    return new Map([...scores.keys()].map((id) => [id, 1]));
  }

  return new Map(
    [...scores].map(([id, score]) => [id, (score - lowest) / span]),
  );
}
