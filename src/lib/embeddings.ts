import {
  env,
  pipeline,
  type ImageFeatureExtractionPipeline,
} from "@huggingface/transformers";

/**
 * CLIP rather than a vision-only model: its image and text embeddings share a
 * space, so the same vectors we compute here power natural-language search in
 * Phase 5 without re-indexing the library.
 */
const MODEL = "Xenova/clip-vit-base-patch32";

/** Weights come from the Hugging Face CDN; nothing is bundled or served by us. */
env.allowLocalModels = false;

let loading: Promise<ImageFeatureExtractionPipeline> | null = null;

/**
 * Loaded on first use, not at import: the model is tens of megabytes, and the
 * colour engine must keep working for anyone who never asks for similarity.
 */
export function loadEmbedder(): Promise<ImageFeatureExtractionPipeline> {
  if (!loading) {
    // q8 rather than fp32: roughly a quarter the download for a visual
    // similarity ranking, where small precision losses don't change the order.
    loading = pipeline("image-feature-extraction", MODEL, {
      dtype: "q8",
    }) as Promise<ImageFeatureExtractionPipeline>;

    // A failed load shouldn't permanently poison the module.
    loading.catch(() => {
      loading = null;
    });
  }

  return loading;
}

/**
 * Embeds one image. Vectors are L2-normalised so cosine similarity reduces to
 * a dot product, which keeps the comparison loop cheap.
 */
export async function embedImage(blob: Blob): Promise<number[]> {
  const embedder = await loadEmbedder();
  const bitmap = await createImageBitmap(blob);

  try {
    // The pipeline accepts a RawImage; build one from the decoded bitmap so
    // we never hand it a URL it would have to fetch.
    const { RawImage } = await import("@huggingface/transformers");
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not acquire a 2D context");

    context.drawImage(bitmap, 0, 0);
    const image = new RawImage(
      new Uint8ClampedArray(
        context.getImageData(0, 0, bitmap.width, bitmap.height).data,
      ),
      bitmap.width,
      bitmap.height,
      4,
    );

    const features = await embedder(image);
    return normalise(Array.from(features.data as Float32Array));
  } finally {
    bitmap.close();
  }
}

function normalise(vector: number[]): number[] {
  const magnitude = Math.hypot(...vector);
  return magnitude === 0 ? vector : vector.map((value) => value / magnitude);
}

/**
 * Cosine similarity. Both vectors are assumed normalised, so this is a plain
 * dot product; the result is clamped because floating-point error can nudge
 * it a hair outside [-1, 1].
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let total = 0;
  for (let i = 0; i < a.length; i++) total += a[i] * b[i];

  return Math.min(1, Math.max(-1, total));
}
