"use client";

import { ImageCard } from "./ImageCard";
import type { IndexedImage } from "@/types/image";

interface ImageGridProps {
  images: IndexedImage[];
  selectedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
  /** Score per image id; absent when no target colours are set. */
  scores?: ReadonlyMap<string, number>;
}

export function ImageGrid({ images, selectedIds, onToggle, scores }: ImageGridProps) {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-black/15 py-20 text-center">
        <p className="text-sm font-medium">No images yet</p>
        <p className="text-sm opacity-60">
          Select images or a folder to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {images.map((image) => (
        <ImageCard
          key={image.id}
          image={image}
          selected={selectedIds.has(image.id)}
          onToggle={onToggle}
          score={scores?.get(image.id)}
        />
      ))}
    </div>
  );
}
