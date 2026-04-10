import {
  type SyncEntityType,
  type SyncOperation,
  type SyncQueueItem,
  STORES,
  withStore,
} from "./db";

function makeSyncId(entityType: SyncEntityType, entityId: string) {
  return `${entityType}:${entityId}`;
}

export async function enqueueSync(
  entityType: SyncEntityType,
  entityId: string,
  operation: SyncOperation,
  payload: unknown,
) {
  const item: SyncQueueItem = {
    id: makeSyncId(entityType, entityId),
    entityType,
    entityId,
    operation,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };

  await withStore(STORES.syncQueue, "readwrite", (store) => store.put(item));
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const items = await withStore<SyncQueueItem[]>(
    STORES.syncQueue,
    "readonly",
    (store) => store.getAll(),
  );

  return items.sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export async function removeSyncQueueItem(id: string) {
  await withStore(STORES.syncQueue, "readwrite", (store) => store.delete(id));
}

export async function markSyncQueueItemFailed(id: string, error: unknown) {
  const item = await withStore<SyncQueueItem | undefined>(
    STORES.syncQueue,
    "readonly",
    (store) => store.get(id),
  );

  if (!item) return;

  await withStore(STORES.syncQueue, "readwrite", (store) =>
    store.put({
      ...item,
      retryCount: item.retryCount + 1,
      lastError: error instanceof Error ? error.message : String(error),
    } satisfies SyncQueueItem),
  );
}
