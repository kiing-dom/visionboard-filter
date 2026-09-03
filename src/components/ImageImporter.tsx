"use client";

import { useRef, useState } from "react";
import { indexFiles, isSupportedImage } from "@/lib/images";
import type { IndexedImage } from "@/types/image";

interface ImageImporterProps {
  onImport: (images: IndexedImage[]) => void;
  disabled?: boolean;
}

export function ImageImporter({ onImport, disabled }: ImageImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const directoryInputRef = useRef<HTMLInputElement>(null);
  const [isReading, setIsReading] = useState(false);
  const [skipped, setSkipped] = useState<number | null>(null);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);

    // Reset immediately so picking the same folder twice still fires onChange.
    event.target.value = "";
    if (picked.length === 0) return;

    const supported = picked.filter(isSupportedImage);
    setSkipped(picked.length - supported.length);
    setIsReading(true);

    try {
      const images = await indexFiles(supported);
      onImport(images);
    } finally {
      setIsReading(false);
    }
  }

  const busy = isReading || disabled;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleChange}
      />
      <input
        ref={directoryInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleChange}
        // Not in React's HTMLInputElement types; both spellings are needed
        // for Chromium and WebKit respectively.
        {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
      />

      <button
        type="button"
        disabled={busy}
        onClick={() => fileInputRef.current?.click()}
        className="rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-50"
      >
        Select images
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => directoryInputRef.current?.click()}
        className="rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-50"
      >
        Select folder
      </button>

      {isReading && <span className="text-sm opacity-60">Reading images…</span>}
      {!isReading && skipped !== null && skipped > 0 && (
        <span className="text-sm opacity-60">
          Skipped {skipped} unsupported {skipped === 1 ? "file" : "files"}
        </span>
      )}
    </div>
  );
}
