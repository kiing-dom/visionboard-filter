"use client";

import { useRef, useState } from "react";
import { filesFromDrop, indexFiles, isSupportedImage } from "@/lib/images";
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
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  // dragenter/dragleave fire for every child the pointer crosses, and
  // relatedTarget is unreliable, so count the pairs instead.
  const dragDepth = useRef(0);

  async function ingest(picked: File[]) {
    if (picked.length === 0) return;

    const supported = picked.filter(isSupportedImage);
    setSkipped(picked.length - supported.length);
    setIsReading(true);

    try {
      onImport(await indexFiles(supported));
    } finally {
      setIsReading(false);
    }
  }

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);

    // Reset immediately so picking the same folder twice still fires onChange.
    event.target.value = "";
    await ingest(picked);
  }

  async function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDraggedOver(false);
    if (busy) return;

    await ingest(await filesFromDrop(event.dataTransfer));
  }

  const busy = isReading || disabled;

  return (
    <div
      onDragEnter={() => {
        dragDepth.current += 1;
        setIsDraggedOver(true);
      }}
      onDragOver={(event) => {
        // Without preventDefault the browser navigates to the dropped file.
        event.preventDefault();
        setIsDraggedOver(true);
      }}
      onDragLeave={() => {
        // Only unhighlight once every entered element has been left, so
        // crossing the buttons inside the zone doesn't make it flicker.
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setIsDraggedOver(false);
      }}
      onDrop={handleDrop}
      className={`flex flex-wrap items-center gap-3 rounded-lg border-2 border-dashed p-3 transition-colors ${
        isDraggedOver ? "border-[#1c1c1c] bg-black/3" : "border-black/10"
      }`}
    >
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
        className="rounded-md border tracking-tight border-black/15 px-3 py-1.5 text-sm font-medium transition-colors hover:cursor-pointer hover:bg-black/5 disabled:opacity-50"
      >
        select images
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => directoryInputRef.current?.click()}
        className="rounded-md border tracking-tight border-black/15 px-3 py-1.5 text-sm font-medium transition-colors hover:cursor-pointer hover:bg-black/5 disabled:opacity-50"
      >
        select folder
      </button>

      <span className="text-sm tracking-tight opacity-40">or drop images and folders here</span>

      {isReading && <span className="text-sm opacity-60">Reading images…</span>}
      {!isReading && skipped !== null && skipped > 0 && (
        <span className="text-sm opacity-60">
          Skipped {skipped} unsupported {skipped === 1 ? "file" : "files"}
        </span>
      )}
    </div>
  );
}
