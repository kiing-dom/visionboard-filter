import type { IndexedImage } from "@/types/image";

/**
 * Formats we can decode on a canvas today. SVG is excluded deliberately —
 * it taints the canvas in some browsers and has no meaningful pixel size
 * until rendered.
 */
export const SUPPORTED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"] as const;

const SUPPORTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/**
 * Directory imports hand us everything on disk, so we filter by MIME type
 * where the browser provides one and fall back to the extension where it
 * doesn't (which happens for some files picked via `webkitdirectory`).
 */
export function isSupportedImage(file: File): boolean {
  if (file.type) return SUPPORTED_MIME_TYPES.has(file.type);

  const extension = file.name.split(".").pop()?.toLowerCase();
  return (
    extension !== undefined &&
    (SUPPORTED_EXTENSIONS as readonly string[]).includes(extension)
  );
}

/**
 * Identity for de-duplication. A directory import can overlap with files the
 * user already picked individually, and re-importing the same folder is a
 * normal thing to do. Name + size + mtime is wrong far less often than name
 * alone, and costs nothing.
 */
export function fileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

/**
 * Reads intrinsic dimensions without decoding the full image into a canvas.
 * Analysis (Phase 2) works from a downscaled copy instead.
 */
export function readImageSize(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not decode ${file.name}`));
    };

    image.src = url;
  });
}

/**
 * Turns picked files into index entries. Files that fail to decode are
 * dropped rather than throwing — one corrupt file in a folder of 500
 * shouldn't fail the whole import.
 */
export async function indexFiles(files: File[]): Promise<IndexedImage[]> {
  const results = await Promise.all(
    files.map(async (file): Promise<IndexedImage | null> => {
      try {
        const { width, height } = await readImageSize(file);
        return {
          id: fileKey(file),
          fileName: file.name,
          width,
          height,
          file,
          dominantColors: [],
          createdAt: Date.now(),
        };
      } catch {
        return null;
      }
    }),
  );

  return results.filter((image): image is IndexedImage => image !== null);
}
