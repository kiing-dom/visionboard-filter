"use client";

import { useCallback } from "react";
import { rgbToHex } from "@/lib/colors";
import type { IndexedImage } from "@/types/image";

interface ImageCardProps {
  image: IndexedImage;
  selected: boolean;
  onToggle: (id: string) => void;
  /** Colour-match score, 0-1. Omitted when no target colours are set. */
  score?: number;
}

export function ImageCard({ image, selected, onToggle, score }: ImageCardProps) {
  const file = image.file;

  /**
   * Create and revoke the object URL in a ref callback so both halves stay
   * tied to the element's real lifetime. Creating in render (useMemo) and
   * revoking in an effect breaks under Strict Mode's double-invoke: the
   * cleanup revokes a URL that the retained memo then renders again.
   */
  const attachImage = useCallback(
    (node: HTMLImageElement | null) => {
      if (!node || !file) return;

      const url = URL.createObjectURL(file);
      node.src = url;

      return () => {
        node.removeAttribute("src");
        URL.revokeObjectURL(url);
      };
    },
    [file],
  );

  return (
    <button
      type="button"
      onClick={() => onToggle(image.id)}
      aria-pressed={selected}
      title={image.fileName}
      className={`group relative block aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
        selected
          ? "border-blue-500"
          : "border-transparent hover:border-black/20"
      }`}
    >
      {/* Local blob URL set via ref; next/image has nothing to optimize here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={attachImage}
        alt={image.fileName}
        loading="lazy"
        decoding="async"
        className="h-full w-full bg-black/5 object-cover"
      />

      {score !== undefined && (
        <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white">
          {Math.round(score * 100)}%
        </span>
      )}

      {image.dominantColors.length > 0 && (
        <span className="pointer-events-none absolute inset-x-0 top-0 flex h-1.5">
          {image.dominantColors.map((entry, i) => (
            <span
              key={`${rgbToHex(entry.color)}-${i}`}
              style={{
                backgroundColor: rgbToHex(entry.color),
                width: `${entry.weight * 100}%`,
              }}
            />
          ))}
        </span>
      )}

      {selected && (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[11px] font-bold text-white">
          ✓
        </span>
      )}

      <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-4 text-left text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
        {image.fileName}
      </span>
    </button>
  );
}
