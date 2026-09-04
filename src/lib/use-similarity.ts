"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cosineSimilarity } from "./embeddings";
import type {
  EmbedRequest,
  EmbedResponse,
} from "@/workers/embedding-worker";
import type { IndexedImage } from "@/types/image";

export interface SimilarityState {
  /** Id of the image being compared against, if any. */
  sourceId: string | null;
  /** Score per image id, once computed. */
  scores: ReadonlyMap<string, number>;
  /** How many images still need embedding. */
  pending: number;
  /** True while the model itself is downloading. */
  loadingModel: boolean;
  error: string | null;
}

/**
 * Visual similarity, computed only when asked. Embedding the whole library
 * up front would download the model for people who only ever use colour
 * search, so nothing happens until "find similar" is clicked.
 */
export function useSimilarity(images: IndexedImage[]) {
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [scores, setScores] = useState<ReadonlyMap<string, number>>(
    () => new Map(),
  );
  const [pending, setPending] = useState(0);
  const [loadingModel, setLoadingModel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const embeddingsRef = useRef<Map<string, number[]>>(new Map());
  useEffect(
    () => () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    },
    [],
  );

  const clear = useCallback(() => {
    setSourceId(null);
    setScores(new Map());
    setError(null);
  }, []);

  /** Ensures every image has an embedding, reporting progress as it goes. */
  const embedAll = useCallback(async (all: IndexedImage[]) => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL("@/workers/embedding-worker.ts", import.meta.url),
        { type: "module" },
      );
    }
    const worker = workerRef.current;

    const missing = all.filter((image) => !embeddingsRef.current.has(image.id));
    setPending(missing.length);
    // The model download only happens on the very first request.
    setLoadingModel(embeddingsRef.current.size === 0 && missing.length > 0);

    for (const image of missing) {
      const embedding = await embedInWorker(worker, {
        id: image.id,
        kind: "image",
        file: image.file!,
      });

      if (embedding) embeddingsRef.current.set(image.id, embedding);
      setLoadingModel(false);
      setPending((count) => Math.max(0, count - 1));
    }

    return worker;
  }, []);

  const findSimilar = useCallback(
    async (id: string) => {
      const all = images.filter((image) => image.file);
      if (!all.some((image) => image.id === id)) return;

      setSourceId(id);
      setError(null);
      setScores(new Map());

      try {
        await embedAll(all);

        const reference = embeddingsRef.current.get(id);
        if (!reference) {
          setError("Could not embed the selected image.");
          return;
        }

        // Image-to-image scores already span a usable range, so they are
        // shown as-is; only cross-modal scores need rescaling.
        setScores(
          new Map(
            all
              .map((image): [string, number] => {
                const vector = embeddingsRef.current.get(image.id);
                return [
                  image.id,
                  vector ? cosineSimilarity(reference, vector) : 0,
                ];
              })
              .filter(([, score]) => score > 0),
          ),
        );
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Similarity search failed.",
        );
      } finally {
        setPending(0);
        setLoadingModel(false);
      }
    },
    [images, embedAll],
  );

  const state: SimilarityState = {
    sourceId,
    scores,
    pending,
    loadingModel,
    error,
  };

  return { ...state, findSimilar, clear };
}

function embedInWorker(
  worker: Worker,
  request: EmbedRequest,
): Promise<number[] | null> {
  return new Promise((resolve) => {
    const handle = (event: MessageEvent<EmbedResponse>) => {
      if (event.data.id !== request.id) return;

      worker.removeEventListener("message", handle);
      resolve(event.data.ok ? event.data.embedding : null);
    };

    worker.addEventListener("message", handle);
    worker.postMessage(request);
  });
}
