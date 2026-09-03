"use client";

import { ImageCard } from "./ImageCard";
import { rgbToHex } from "@/lib/colors";
import type { IndexedImage, RGBColor } from "@/types/image";

export interface ScoredImage {
  image: IndexedImage;
  score: number;
}

interface ColorColumnsProps {
  columns: { color: RGBColor; matches: ScoredImage[] }[];
  selectedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onFindSimilar?: (id: string) => void;
  similaritySourceId?: string | null;
}

/**
 * One column per target colour, so an image matching several colours appears
 * in each — the point is seeing which colours an image satisfies, not
 * partitioning the library.
 */
export function ColorColumns({
  columns,
  selectedIds,
  onToggle,
  onFindSimilar,
  similaritySourceId,
}: ColorColumnsProps) {
  return (
    <div
      className="grid items-start gap-5 overflow-x-auto"
      style={{
        gridTemplateColumns: `repeat(${columns.length}, minmax(160px, 220px))`,
      }}
    >
      {columns.map(({ color, matches }) => {
        const hex = rgbToHex(color);

        return (
          <section key={hex} className="flex min-w-0 flex-col gap-3">
            <header className="flex items-center gap-2 border-b border-black/10 pb-2">
              <span
                className="h-4 w-4 shrink-0 rounded border border-black/10"
                style={{ backgroundColor: hex }}
              />
              <code className="text-xs">{hex}</code>
              <span className="ml-auto text-xs opacity-50">
                {matches.length}
              </span>
            </header>

            {matches.length === 0 ? (
              <p className="rounded-lg border border-dashed border-black/15 py-8 text-center text-xs opacity-50">
                No matches
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {matches.map(({ image, score }) => (
                  <ImageCard
                    key={image.id}
                    image={image}
                    selected={selectedIds.has(image.id)}
                    onToggle={onToggle}
                    score={score}
                    onFindSimilar={onFindSimilar}
                    isSimilaritySource={image.id === similaritySourceId}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
