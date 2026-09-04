"use client";

import { useCallback } from "react";
import { isLight, rgbToHex } from "@/lib/colors";
import type { IndexedImage } from "@/types/image";

interface ImageCardProps {
  image: IndexedImage;
  selected: boolean;
  onToggle: (id: string) => void;
  /** Colour-match score, 0-1. Omitted when no target colours are set. */
  score?: number;
  /** Omitted when visual similarity isn't available for this view. */
  onFindSimilar?: (id: string) => void;
  /** Marks the image the current similarity search started from. */
  isSimilaritySource?: boolean;
}

export function ImageCard({
  image,
  selected,
  onToggle,
  score,
  onFindSimilar,
  isSimilaritySource,
}: ImageCardProps) {
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
    <div
      title={image.fileName}
      className={`group relative block aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
        selected
          ? "border-[#1c1c1c]"
          : isSimilaritySource
            ? "border-black/40"
            : "border-transparent hover:border-black/20"
      }`}
    >
      {/* Fills the card so the whole thumbnail toggles selection; the palette
          strip and action button sit above it. */}
      <button
        type="button"
        onClick={() => onToggle(image.id)}
        aria-pressed={selected}
        aria-label={`Select ${image.fileName}`}
        className="absolute inset-0 z-0 cursor-pointer"
      />
      {/* Local blob URL set via ref; next/image has nothing to optimize here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={attachImage}
        alt={image.fileName}
        loading="lazy"
        decoding="async"
        className="pointer-events-none h-full w-full bg-black/5 object-cover"
      />

      {score !== undefined && (
        <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white">
          {Math.round(score * 100)}%
        </span>
      )}

      {image.dominantColors.length > 0 && (
        // Taller on hover so the individual swatches are easy to hit. The
        // ring and shadow keep the strip readable as a strip even when its
        // colours are drawn from — and so blend into — the image beneath.
        <span
          className="absolute inset-x-0 top-0 flex h-2 transition-all group-hover:h-4"
          style={{
            // An inline shadow rather than a utility: it must render whatever
            // the image beneath it looks like, and a light inner line plus a
            // dark outer one reads against both pale and dark photographs.
            boxShadow:
              "inset 0 0 0 1px rgba(255,255,255,0.35), 0 1px 4px rgba(0,0,0,0.55)",
          }}
        >
          {image.dominantColors.map((entry, i) => {
            const hex = rgbToHex(entry.color);
            const share = Math.round(entry.weight * 100);

            return (
              <span
                key={`${hex}-${i}`}
                className={`group/swatch relative h-full ${
                  // A hairline between neighbours, keyed to each swatch's own
                  // lightness so adjacent similar colours stay separable.
                  isLight(entry.color)
                    ? "border-r border-black/25 last:border-r-0"
                    : "border-r last:border-r-0"
                }`}
                style={{ backgroundColor: hex, width: `${entry.weight * 100}%` }}
              >
                {/* The strip is only a few pixels tall, so an invisible pad
                    below each swatch gives the pointer something to land on. */}
                <span className="absolute inset-x-0 top-0 h-5" />

                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-1/2 top-full z-10 flex -translate-x-1/2 translate-y-1 items-center gap-1.5 whitespace-nowrap rounded border border-white/15 bg-[#1c1c1c] px-1.5 py-1 font-mono text-[10px] leading-none text-white opacity-0 shadow-md transition-opacity group-hover/swatch:opacity-100"
                >
                  {/* Repeat the colour in the tooltip, so the reading is tied
                      to a swatch even when the strip is a thin band. */}
                  <span
                    className="h-2.5 w-2.5 rounded-xs ring-1 ring-white/25"
                    style={{ backgroundColor: hex }}
                  />
                  {hex} · {share}%
                </span>
              </span>
            );
          })}
        </span>
      )}

      {selected && (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#1c1c1c] text-[11px] font-bold text-white">
          ✓
        </span>
      )}

      <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-black/70 to-transparent px-2 pb-1.5 pt-4 text-left text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
        {image.fileName}
      </span>

      {onFindSimilar && (
        <button
          type="button"
          onClick={() => onFindSimilar(image.id)}
          className="absolute bottom-2 right-2 z-10 cursor-pointer rounded border border-white/15 bg-[#1c1c1c] px-1.5 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          {isSimilaritySource ? "source" : "find similar"}
        </button>
      )}
    </div>
  );
}
