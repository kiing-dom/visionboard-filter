export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/** A dominant colour plus the share of the image it covers, 0-1. */
export interface PaletteEntry {
  color: RGBColor;
  weight: number;
}

export interface IndexedImage {
  id: string;
  fileName: string;
  width: number;
  height: number;

  /** Local reference to the original file/blob. */
  file?: Blob;

  /** Empty until analysis completes. Ordered by descending coverage. */
  dominantColors: PaletteEntry[];

  /** Populated once visual/semantic search lands. */
  embedding?: number[];
  labels?: string[];

  createdAt: number;
}

/** Relative weights for the combined ranking. MVP uses color only. */
export interface SearchWeights {
  semantic: number;
  color: number;
  visual: number;
  composition: number;
}
