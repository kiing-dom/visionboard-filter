/// <reference lib="webworker" />

import { embedImage } from "@/lib/embeddings";

export type EmbedRequest = { id: string; kind: "image"; file: Blob };

export type EmbedResponse =
  | { id: string; ok: true; embedding: number[] }
  | { id: string; ok: false; error: string };

/**
 * Model loading and inference both happen here, so a cold start never blocks
 * the grid. The first message pays the download; later ones are fast.
 */
self.onmessage = async (event: MessageEvent<EmbedRequest>) => {
  const request = event.data;
  const { id } = request;

  try {
    const embedding = await embedImage(request.file);

    self.postMessage({ id, ok: true, embedding } satisfies EmbedResponse);
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    } satisfies EmbedResponse);
  }
};
