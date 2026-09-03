"use client";

import { useEffect, useState } from "react";
import { extractPalette } from "./palette";
import { toAnalysisPixels } from "./image-processing";
import type { IndexedImage, PaletteEntry } from "@/types/image";

interface AnalysisTarget {
  id: string;
  file: Blob;
}

/**
 * Analyses images that have no palette yet, one at a time, yielding to the
 * event loop between images so the grid stays responsive. Still on the main
 * thread — Phase 3 moves it into a worker.
 *
 * The queue is keyed by id so images already analysed (or already failed) are
 * never revisited, and the effect re-runs only when the set of work changes.
 */
export function useAnalysis(
  images: IndexedImage[],
  onAnalysed: (id: string, palette: PaletteEntry[]) => void,
) {
  const [done, setDone] = useState<ReadonlySet<string>>(() => new Set());

  const targets: AnalysisTarget[] = images
    .filter(
      (image) =>
        image.file !== undefined &&
        image.dominantColors.length === 0 &&
        !done.has(image.id),
    )
    .map((image) => ({ id: image.id, file: image.file! }));

  // Stable identity for the work set, so re-renders that don't change what
  // needs analysing don't restart the queue.
  const queueKey = targets.map((target) => target.id).join(",");

  useEffect(() => {
    if (queueKey === "") return;

    let cancelled = false;
    const queue = queueKey.split(",");
    const byId = new Map(targets.map((target) => [target.id, target.file]));

    (async () => {
      for (const id of queue) {
        if (cancelled) return;

        const file = byId.get(id);
        if (file) {
          try {
            const pixels = await toAnalysisPixels(file);
            if (cancelled) return;
            onAnalysed(id, extractPalette(pixels));
          } catch {
            // Undecodable despite passing import. Mark it done so the queue
            // doesn't retry it forever.
          }
        }

        // Marking done also removes it from the next queue.
        setDone((current) => new Set(current).add(id));

        // Let the browser paint between images.
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    })();

    return () => {
      cancelled = true;
    };
    // `targets`/`onAnalysed` are derived from `queueKey`; depending on them
    // directly would restart the queue on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueKey]);

  // Derived rather than tracked: anything still queued is still pending.
  return { pending: targets.length };
}
