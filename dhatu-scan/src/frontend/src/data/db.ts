import type { Assessment, ChildProfile, GamificationState } from "@/types";

export const DB_NAME = "dhatu-scan-db";
export const DB_VERSION = 2;

export const STORES = {
  children: "children",
  assessments: "assessments",
  gamification: "gamification",
  syncQueue: "syncQueue",
  scans: "scans",
} as const;

export type SyncStatus = "pending" | "synced" | "failed";
export type SyncEntityType = "child" | "assessment" | "gamification";
export type SyncOperation = "upsert" | "delete";

export type LocalChildProfile = ChildProfile & {
  ownerEmail?: string;
  syncStatus?: SyncStatus;
  lastSyncedAt?: string;
  serverVersion?: number;
  deleted?: boolean;
};

export type LocalAssessment = Assessment & {
  ownerEmail?: string;
  syncStatus?: SyncStatus;
  lastSyncedAt?: string;
  serverVersion?: number;
  deleted?: boolean;
};

export type LocalGamificationState = GamificationState & {
  id: "default";
  ownerEmail?: string;
  syncStatus?: SyncStatus;
  lastSyncedAt?: string;
  serverVersion?: number;
};

export interface SyncQueueItem {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: SyncOperation;
  payload: unknown;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

async function getRequestedDbVersion(): Promise<number> {
  const listDatabases = indexedDB.databases?.bind(indexedDB);
  if (!listDatabases) return DB_VERSION;

  try {
    const databases = await listDatabases();
    const existingDb = databases.find((db) => db.name === DB_NAME);
    return Math.max(DB_VERSION, existingDb?.version ?? 0);
  } catch {
    return DB_VERSION;
  }
}

function createIndexes(
  store: IDBObjectStore,
  indexes: Array<{ name: string; keyPath: string }>,
) {
  for (const index of indexes) {
    if (!store.indexNames.contains(index.name)) {
      store.createIndex(index.name, index.keyPath);
    }
  }
}

function ensureStore(
  db: IDBDatabase,
  storeName: string,
  options: IDBObjectStoreParameters,
) {
  if (db.objectStoreNames.contains(storeName)) {
    return null;
  }

  return db.createObjectStore(storeName, options);
}

function upgradeDb(db: IDBDatabase) {
  const childrenStore = ensureStore(db, STORES.children, { keyPath: "id" });
  if (childrenStore) {
    createIndexes(childrenStore, [
      { name: "syncStatus", keyPath: "syncStatus" },
      { name: "updatedAt", keyPath: "updatedAt" },
      { name: "deleted", keyPath: "deleted" },
    ]);
  }

  const assessmentsStore = ensureStore(db, STORES.assessments, {
    keyPath: "id",
  });
  if (assessmentsStore) {
    createIndexes(assessmentsStore, [
      { name: "childId", keyPath: "childId" },
      { name: "syncStatus", keyPath: "syncStatus" },
      { name: "date", keyPath: "date" },
      { name: "deleted", keyPath: "deleted" },
    ]);
  }

  const gamificationStore = ensureStore(db, STORES.gamification, {
    keyPath: "id",
  });
  if (gamificationStore) {
    createIndexes(gamificationStore, [
      { name: "syncStatus", keyPath: "syncStatus" },
    ]);
  }

  const syncQueueStore = ensureStore(db, STORES.syncQueue, {
    keyPath: "id",
  });
  if (syncQueueStore) {
    createIndexes(syncQueueStore, [
      { name: "entityType", keyPath: "entityType" },
      { name: "entityId", keyPath: "entityId" },
      { name: "createdAt", keyPath: "createdAt" },
    ]);
  }

  ensureStore(db, STORES.scans, { keyPath: "id" });

}

export function getDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = getRequestedDbVersion().then(
    (version) =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, version);

        request.onupgradeneeded = () => {
          upgradeDb(request.result);
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onblocked = () => {
          console.warn("IndexedDB upgrade blocked. Close other Dhatu-Scan tabs.");
        };
      }),
  );

  dbPromise = dbPromise.catch((error) => {
    dbPromise = null;
    throw error;
  });

  return dbPromise;
}

export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await getDb();
  const tx = db.transaction(storeName, mode);
  const store = tx.objectStore(storeName);
  return requestToPromise(callback(store));
}

export async function clearDhatuScanDb() {
  const db = await getDb();
  const tx = db.transaction(Object.values(STORES), "readwrite");

  for (const storeName of Object.values(STORES)) {
    tx.objectStore(storeName).clear();
  }

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
