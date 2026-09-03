"use client";

import { useEffect, useState } from "react";
import { loadAnalyses, saveAnalysis } from "./storage";
import type {
  AnalyseRequest,
  AnalyseResponse,
} from "@/workers/image-worker";
import type { IndexedImage, PaletteEntry } from "@/types/image";

/**
 * Analyses images that have no palette yet, one at a time in a worker, so
 * clustering never blocks the grid. Results are cached in IndexedDB and
 * restored on the next visit, so re-importing the same folder is instant.
 */
export function useAnalysis(
  images: IndexedImage[],
  onAnalysed: (id: string, palette: PaletteEntry[]) => void,
) {
  const [done, setDone] = useState<ReadonlySet<string>>(() => new Set());

  const targets = images.filter(
    (image) =>
      image.file !== undefined &&
      image.dominantColors.length === 0 &&
      !done.has(image.id),
  );

  // Stable identity for the work set, so renders that don't change what needs
  // analysing don't restart the queue.
  const queueKey = targets.map((target) => target.id).join(",");

  useEffect(() => {
    if (queueKey === "") return;

    let cancelled = false;
    const byId = new Map(images.map((image) => [image.id, image]));
    const worker = new Worker(
      new URL("@/workers/image-worker.ts", import.meta.url),
      { type: "module" },
    );

    (async () => {
      // Anything already analysed in a previous session skips the worker.
      const cached = await loadAnalyses();
      if (cancelled) return;

      for (const id of queueKey.split(",")) {
        if (cancelled) return;

        const image = byId.get(id);
        if (!image?.file) continue;

        const hit = cached.get(id);
        if (hit && hit.dominantColors.length > 0) {
          onAnalysed(id, hit.dominantColors);
          setDone((current) => new Set(current).add(id));
          continue;
        }

        const palette = await analyseInWorker(worker, {
          id,
          file: image.file,
        });
        if (cancelled) return;

        if (palette) {
          onAnalysed(id, palette);
          void saveAnalysis({ ...image, dominantColors: palette });
        }

        // Marked done either way, so a failure isn't retried forever.
        setDone((current) => new Set(current).add(id));
      }
    })();

    return () => {
      cancelled = true;
      worker.terminate();
    };
    // `images`/`onAnalysed` are covered by `queueKey`; depending on them
    // directly would restart the queue on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueKey]);

  // Derived rather than tracked: anything still queued is still pending.
  return { pending: targets.length };
}

function analyseInWorker(
  worker: Worker,
  request: AnalyseRequest,
): Promise<PaletteEntry[] | null> {
  return new Promise((resolve) => {
    const handle = (event: MessageEvent<AnalyseResponse>) => {
      if (event.data.id !== request.id) return;

      worker.removeEventListener("message", handle);
      resolve(event.data.ok ? event.data.palette : null);
    };

    worker.addEventListener("message", handle);
    worker.postMessage(request);
  });
}
