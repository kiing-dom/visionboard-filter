export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface IndexedImage {
  id: string;
  fileName: string;
  width: number;
  height: number;

  /** Local reference to the original file/blob. */
  file?: Blob;

  dominantColors: RGBColor[];

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
