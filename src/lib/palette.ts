import type { PaletteEntry, RGBColor } from "@/types/image";
import { rgbDistance } from "./colors";

export type { PaletteEntry };

const DEFAULT_COLOR_COUNT = 5;
const MAX_ITERATIONS = 12;

/**
 * k-means over sampled pixels. Seeded deterministically (k-means++ using a
 * fixed starting pixel) so re-analysing an image yields the same palette —
 * a shifting palette would make cached results inconsistent with fresh ones.
 */
export function extractPalette(
  pixels: RGBColor[],
  count: number = DEFAULT_COLOR_COUNT,
): PaletteEntry[] {
  if (pixels.length === 0) return [];

  const k = Math.min(count, pixels.length);
  let centroids = seedCentroids(pixels, k);
  const assignments = new Array<number>(pixels.length).fill(0);

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    let moved = false;

    for (let i = 0; i < pixels.length; i++) {
      const nearest = nearestIndex(pixels[i], centroids);
      if (nearest !== assignments[i]) {
        assignments[i] = nearest;
        moved = true;
      }
    }

    // Converged: another pass would produce identical centroids.
    if (!moved && iteration > 0) break;
    centroids = recomputeCentroids(pixels, assignments, centroids);
  }

  return summarise(pixels, assignments, centroids);
}

/**
 * k-means++ seeding, but with the first centroid fixed rather than random.
 * Spreading the initial centroids matters more than the starting choice, and
 * fixing it keeps the result reproducible.
 */
function seedCentroids(pixels: RGBColor[], k: number): RGBColor[] {
  const centroids: RGBColor[] = [pixels[0]];

  while (centroids.length < k) {
    let furthest = pixels[0];
    let furthestDistance = -1;

    for (const pixel of pixels) {
      const distance = Math.min(...centroids.map((c) => rgbDistance(pixel, c)));
      if (distance > furthestDistance) {
        furthestDistance = distance;
        furthest = pixel;
      }
    }

    // All remaining pixels duplicate an existing centroid.
    if (furthestDistance <= 0) break;
    centroids.push(furthest);
  }

  return centroids;
}

function nearestIndex(pixel: RGBColor, centroids: RGBColor[]): number {
  let best = 0;
  let bestDistance = Infinity;

  for (let i = 0; i < centroids.length; i++) {
    const distance = rgbDistance(pixel, centroids[i]);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }

  return best;
}

function recomputeCentroids(
  pixels: RGBColor[],
  assignments: number[],
  previous: RGBColor[],
): RGBColor[] {
  const sums = previous.map(() => ({ r: 0, g: 0, b: 0, n: 0 }));

  for (let i = 0; i < pixels.length; i++) {
    const bucket = sums[assignments[i]];
    bucket.r += pixels[i].r;
    bucket.g += pixels[i].g;
    bucket.b += pixels[i].b;
    bucket.n++;
  }

  // An empty cluster keeps its old centroid rather than collapsing to black.
  return sums.map((bucket, i) =>
    bucket.n === 0
      ? previous[i]
      : {
          r: Math.round(bucket.r / bucket.n),
          g: Math.round(bucket.g / bucket.n),
          b: Math.round(bucket.b / bucket.n),
        },
  );
}

function summarise(
  pixels: RGBColor[],
  assignments: number[],
  centroids: RGBColor[],
): PaletteEntry[] {
  const counts = centroids.map(() => 0);
  for (const assignment of assignments) counts[assignment]++;

  return centroids
    .map((color, i) => ({ color, weight: counts[i] / pixels.length }))
    .filter((entry) => entry.weight > 0)
    .sort((a, b) => b.weight - a.weight);
}
