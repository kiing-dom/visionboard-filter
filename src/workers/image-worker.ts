/// <reference lib="webworker" />

import { extractPalette } from "@/lib/palette";
import { toAnalysisPixels } from "@/lib/image-processing";
import type { PaletteEntry } from "@/types/image";

export interface AnalyseRequest {
  id: string;
  file: Blob;
}

export type AnalyseResponse =
  | { id: string; ok: true; palette: PaletteEntry[] }
  | { id: string; ok: false; error: string };

/**
 * One image per message. Decoding and clustering both happen here, so the
 * main thread only ever handles the resulting five colours.
 */
self.onmessage = async (event: MessageEvent<AnalyseRequest>) => {
  const { id, file } = event.data;

  try {
    const pixels = await toAnalysisPixels(file);
    const response: AnalyseResponse = {
      id,
      ok: true,
      palette: extractPalette(pixels),
    };
    self.postMessage(response);
  } catch (error) {
    const response: AnalyseResponse = {
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
};
