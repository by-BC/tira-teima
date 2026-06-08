// Armazenamento local de clipes em IndexedDB (Web API nativa, sem dependências).
// Guardamos os Blobs diretamente — IndexedDB lida bem com binários grandes,
// ao contrário de localStorage.

import type { StoredClip } from "@/types";

const DB_NAME = "tira-teima";
const STORE = "clips";
const VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB indisponível neste navegador."));
      return;
    }
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  return openDb().then((db) => db.transaction(STORE, mode).objectStore(STORE));
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// --- Pub/sub para a galeria reagir a mudanças sem prop drilling ---
type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeClips(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function emitChange() {
  listeners.forEach((l) => l());
}

// --- CRUD ---

export async function saveClip(blob: Blob, durationHint = 15): Promise<StoredClip> {
  const clip: StoredClip = {
    id: crypto.randomUUID(),
    blob,
    mimeType: blob.type || "video/webm",
    durationHint,
    size: blob.size,
    createdAt: Date.now(),
  };
  const store = await tx("readwrite");
  await reqToPromise(store.put(clip));
  emitChange();
  return clip;
}

export async function listClips(): Promise<StoredClip[]> {
  const store = await tx("readonly");
  const all = await reqToPromise(store.getAll() as IDBRequest<StoredClip[]>);
  return all.sort((a, b) => b.createdAt - a.createdAt); // mais novos primeiro
}

export async function deleteClip(id: string): Promise<void> {
  const store = await tx("readwrite");
  await reqToPromise(store.delete(id));
  emitChange();
}

export async function clearClips(): Promise<void> {
  const store = await tx("readwrite");
  await reqToPromise(store.clear());
  emitChange();
}
