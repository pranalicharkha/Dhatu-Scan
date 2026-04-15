import type { ChildProfile } from "@/types";
import {
  getDb,
  type LocalChildProfile,
  STORES,
  requestToPromise,
  withStore,
} from "./db";
import { enqueueSync } from "./syncQueueRepository";

function getCurrentParentEmail(): string | null {
  const email = localStorage.getItem("dhatu_auth_email");
  return email?.trim() || null;
}

function toLocalChild(child: ChildProfile): LocalChildProfile {
  const ownerEmail = getCurrentParentEmail();
  return {
    ...child,
    ownerEmail: ownerEmail ?? undefined,
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
  const ownerEmail = getCurrentParentEmail();
  if (!ownerEmail) return [];

  const children = await withStore<LocalChildProfile[]>(
    STORES.children,
    "readonly",
    (store) => store.getAll(),
  );

  // STRICT: Only show children that belong to this parent's email
  // This ensures data isolation between different parent accounts
  const scopedChildren = children.filter(
    (child) => !child.deleted && child.ownerEmail === ownerEmail,
  );

  // De-duplicate accidental local+cloud copies for the same profile.
  const deduped = new Map<string, LocalChildProfile>();
  for (const child of scopedChildren) {
    const key = `${child.name.trim().toLowerCase()}|${child.dateOfBirth}|${child.gender}`;
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, child);
      continue;
    }
    const existingTime = new Date(existing.updatedAt).getTime();
    const childTime = new Date(child.updatedAt).getTime();
    if (childTime >= existingTime) {
      deduped.set(key, child);
    }
  }
  return Array.from(deduped.values());
}

export async function getChild(id: string): Promise<LocalChildProfile | null> {
  const ownerEmail = getCurrentParentEmail();
  if (!ownerEmail) return null;

  const child = await withStore<LocalChildProfile | undefined>(
    STORES.children,
    "readonly",
    (store) => store.get(id),
  );

  // STRICT: Only return child if it belongs to this parent
  return child && !child.deleted && child.ownerEmail === ownerEmail ? child : null;
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

export async function replaceChildId(oldId: string, child: ChildProfile) {
  const localChild = toLocalChild(child);
  await withStore(STORES.children, "readwrite", (store) => {
    store.delete(oldId);
    return store.put(localChild);
  });
}

export async function getPendingChildren(): Promise<LocalChildProfile[]> {
  const ownerEmail = getCurrentParentEmail();
  if (!ownerEmail) return [];

  const db = await getDb();
  const tx = db.transaction(STORES.children, "readonly");
  const index = tx.objectStore(STORES.children).index("syncStatus");
  const children = await requestToPromise<LocalChildProfile[]>(
    index.getAll("pending"),
  );

  return children.filter(
    (child) => !child.deleted && child.ownerEmail === ownerEmail,
  );
}
