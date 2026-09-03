"use client";

import { useCallback, useState } from "react";
import { ImageGrid } from "@/components/ImageGrid";
import { ImageImporter } from "@/components/ImageImporter";
import type { IndexedImage } from "@/types/image";

export default function Home() {
  const [images, setImages] = useState<IndexedImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const handleImport = useCallback((imported: IndexedImage[]) => {
    setImages((current) => {
      // Re-importing an overlapping folder is normal; keep the first copy.
      const seen = new Set(current.map((image) => image.id));
      const additions = imported.filter((image) => !seen.has(image.id));
      return additions.length > 0 ? [...current, ...additions] : current;
    });
  }, []);

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Vision Finder</h1>
        <p className="text-sm opacity-60">
          Find and organize images for vision boards — entirely in your browser.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <ImageImporter onImport={handleImport} />
        {/* SearchBar, ColorPicker, FilterPanel */}
      </section>

      {images.length > 0 && (
        <div className="flex items-center justify-between border-b border-black/10 pb-3 text-sm dark:border-white/15">
          <span className="opacity-60">
            {images.length} {images.length === 1 ? "image" : "images"}
            {selectedIds.size > 0 && ` · ${selectedIds.size} selected`}
          </span>
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              className="font-medium underline underline-offset-4 opacity-70 hover:opacity-100"
            >
              Clear selection
            </button>
          )}
        </div>
      )}

      <section className="flex-1">
        <ImageGrid
          images={images}
          selectedIds={selectedIds}
          onToggle={handleToggle}
        />
      </section>
    </main>
  );
}
