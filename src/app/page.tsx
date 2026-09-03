"use client";

import { useCallback, useMemo, useState } from "react";
import { ColorColumns } from "@/components/ColorColumns";
import { ColorPicker } from "@/components/ColorPicker";
import { ImageGrid } from "@/components/ImageGrid";
import { ImageImporter } from "@/components/ImageImporter";
import { ToleranceSlider } from "@/components/ToleranceSlider";
import { paletteScore } from "@/lib/similarity";
import { useAnalysis } from "@/lib/use-analysis";
import type { IndexedImage, PaletteEntry, RGBColor } from "@/types/image";

export default function Home() {
  const [images, setImages] = useState<IndexedImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [targetColors, setTargetColors] = useState<RGBColor[]>([]);
  const [tolerance, setTolerance] = useState(0.4);

  const handleImport = useCallback((imported: IndexedImage[]) => {
    setImages((current) => {
      // Re-importing an overlapping folder is normal; keep the first copy.
      const seen = new Set(current.map((image) => image.id));
      const additions = imported.filter((image) => !seen.has(image.id));
      return additions.length > 0 ? [...current, ...additions] : current;
    });
  }, []);

  const handleAnalysed = useCallback((id: string, palette: PaletteEntry[]) => {
    setImages((current) =>
      current.map((image) =>
        image.id === id ? { ...image, dominantColors: palette } : image,
      ),
    );
  }, []);

  const { pending } = useAnalysis(images, handleAnalysed);

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);

  // One column per target colour, each ranked by that colour alone. An image
  // matching several colours appears in each of them.
  const columns = useMemo(
    () =>
      targetColors.map((color) => {
        const matches = images
          .map((image) => ({
            image,
            score: paletteScore(image.dominantColors, [color]),
          }))
          .filter(({ score }) => score >= tolerance)
          .sort((a, b) => b.score - a.score);

        return { color, matches };
      }),
    [images, targetColors, tolerance],
  );

  // How many image/colour pairings the threshold is excluding.
  const hiddenCount = useMemo(() => {
    if (targetColors.length === 0) return 0;
    const shown = columns.reduce((total, c) => total + c.matches.length, 0);
    return images.length * targetColors.length - shown;
  }, [columns, images.length, targetColors.length]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">vbf</h1>
      </header>

      <section className="flex flex-col gap-4">
        <ImageImporter onImport={handleImport} />
        {images.length > 0 && (
          <ColorPicker colors={targetColors} onChange={setTargetColors} />
        )}
        {targetColors.length > 0 && (
          <ToleranceSlider
            value={tolerance}
            onChange={setTolerance}
            hidden={hiddenCount}
          />
        )}
      </section>

      {images.length > 0 && (
        <div className="flex items-center justify-between border-b border-black/10 pb-3 text-sm">
          <span className="opacity-60">
            {images.length} {images.length === 1 ? "image" : "images"}
            {selectedIds.size > 0 && ` · ${selectedIds.size} selected`}
            {pending > 0 && ` · analysing ${pending}…`}
            {targetColors.length > 0 &&
              pending === 0 &&
              ` · ${targetColors.length} colour ${targetColors.length === 1 ? "column" : "columns"}`}
          </span>
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="font-medium underline underline-offset-4 opacity-70 hover:opacity-100"
            >
              Clear selection
            </button>
          )}
        </div>
      )}

      <section className="flex-1">
        {columns.length > 0 ? (
          <ColorColumns
            columns={columns}
            selectedIds={selectedIds}
            onToggle={handleToggle}
          />
        ) : (
          <ImageGrid
            images={images}
            selectedIds={selectedIds}
            onToggle={handleToggle}
          />
        )}
      </section>
    </main>
  );
}
