import type { IndexedImage, PaletteEntry } from "@/types/image";

const DATABASE_NAME = "vbf";
const DATABASE_VERSION = 1;
const STORE = "images";

/**
 * What we persist. Deliberately excludes the original blob — per the spec,
 * the MVP keeps files in memory and persists only analysis results, so a
 * reload restores palettes without re-decoding.
 */
export interface StoredAnalysis {
  id: string;
  fileName: string;
  width: number;
  height: number;
  dominantColors: PaletteEntry[];
  createdAt: number;
}

let connection: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (connection) return connection;

  connection = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  // A failed open shouldn't poison every later call.
  connection.catch(() => {
    connection = null;
  });

  return connection;
}

function transact<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return open().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(STORE, mode);
        const request = run(transaction.objectStore(STORE));

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

/**
 * Storage is a cache, not a source of truth — a browser in private mode or
 * with storage disabled should degrade to re-analysing, not break. Callers
 * get an empty result rather than an exception.
 */
export async function loadAnalyses(): Promise<Map<string, StoredAnalysis>> {
  try {
    const rows = await transact<StoredAnalysis[]>("readonly", (store) =>
      store.getAll(),
    );
    return new Map(rows.map((row) => [row.id, row]));
  } catch {
    return new Map();
  }
}

export async function saveAnalysis(image: IndexedImage): Promise<void> {
  try {
    await transact("readwrite", (store) =>
      store.put({
        id: image.id,
        fileName: image.fileName,
        width: image.width,
        height: image.height,
        dominantColors: image.dominantColors,
        createdAt: image.createdAt,
      } satisfies StoredAnalysis),
    );
  } catch {
    // Cache write failed; the palette is still live in memory.
  }
}

export async function clearAnalyses(): Promise<void> {
  try {
    await transact("readwrite", (store) => store.clear());
  } catch {
    // Nothing to do.
  }
}
