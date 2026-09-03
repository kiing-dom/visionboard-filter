import type { RGBColor } from "@/types/image";

/** Analysis size. Big enough to keep overall character, small enough to be cheap. */
const ANALYSIS_SIZE = 256;

/** Pixels below this alpha carry no meaningful colour. */
const MIN_ALPHA = 125;

/**
 * Decodes and downscales in one step. `createImageBitmap` does the resampling
 * natively and works on a worker thread, which matters once this moves off the
 * main thread in Phase 3.
 */
export async function toAnalysisPixels(blob: Blob): Promise<RGBColor[]> {
  const bitmap = await createImageBitmap(blob);

  const scale = Math.min(
    1,
    ANALYSIS_SIZE / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    bitmap.close();
    throw new Error("Could not acquire a 2D context");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const { data } = context.getImageData(0, 0, width, height);
  const pixels: RGBColor[] = [];

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < MIN_ALPHA) continue;
    pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
  }

  return pixels;
}
