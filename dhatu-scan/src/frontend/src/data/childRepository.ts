import type { ChildProfile } from "@/types";
import {
  getDb,
  type LocalChildProfile,
  STORES,
  requestToPromise,
  withStore,
} from "./db";
import { enqueueSync } from "./syncQueueRepository";

function toLocalChild(child: ChildProfile): LocalChildProfile {
  return {
    ...child,
    syncStatus: "pending",
    deleted: false,
  };
}

export async function saveChild(child: ChildProfile) {
  const localChild = toLocalChild(child);
  await withStore(STORES.children, "readwrite", (store) =>
    store.put(localChild),
  );
  await enqueueSync("child", child.id, "upsert", localChild);
}

export async function getChildren(): Promise<LocalChildProfile[]> {
  const children = await withStore<LocalChildProfile[]>(
    STORES.children,
    "readonly",
    (store) => store.getAll(),
  );

  return children.filter((child) => !child.deleted);
}

export async function getChild(id: string): Promise<LocalChildProfile | null> {
  const child = await withStore<LocalChildProfile | undefined>(
    STORES.children,
    "readonly",
    (store) => store.get(id),
  );

  return child && !child.deleted ? child : null;
}

export async function deleteChild(id: string) {
  const child = await getChild(id);
  if (!child) return;

  const deletedChild: LocalChildProfile = {
    ...child,
    deleted: true,
    syncStatus: "pending",
    updatedAt: new Date().toISOString(),
  };

  await withStore(STORES.children, "readwrite", (store) =>
    store.put(deletedChild),
  );
  await enqueueSync("child", id, "delete", deletedChild);
}

export async function markChildSynced(id: string) {
  const child = await withStore<LocalChildProfile | undefined>(
    STORES.children,
    "readonly",
    (store) => store.get(id),
  );

  if (!child) return;

  await withStore(STORES.children, "readwrite", (store) =>
    store.put({
      ...child,
      syncStatus: "synced",
      lastSyncedAt: new Date().toISOString(),
    } satisfies LocalChildProfile),
  );
}

export async function getPendingChildren(): Promise<LocalChildProfile[]> {
  const db = await getDb();
  const tx = db.transaction(STORES.children, "readonly");
  const index = tx.objectStore(STORES.children).index("syncStatus");
  const children = await requestToPromise<LocalChildProfile[]>(
    index.getAll("pending"),
  );

  return children.filter((child) => !child.deleted);
}
