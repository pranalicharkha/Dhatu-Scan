import type { GrowthHistory } from "./db";
import { STORES } from "./db";
import { requestToPromise, withStore } from "./db";

export async function saveGrowthHistory(
  history: GrowthHistory,
): Promise<void> {
  await withStore(STORES.growthHistory, "readwrite", (store) =>
    store.put(history),
  );
}

export async function getGrowthHistory(id: string): Promise<GrowthHistory | null> {
  return withStore<GrowthHistory | undefined>(
    STORES.growthHistory,
    "readonly",
    (store) => store.get(id),
  ).then((history) => history ?? null);
}

export async function getGrowthHistoryByChild(
  childId: string,
): Promise<GrowthHistory[]> {
  const db = await import("./db").then((m) => m.getDb());
  const tx = db.transaction(STORES.growthHistory, "readonly");
  const index = tx.objectStore(STORES.growthHistory).index("childId");
  const histories = await requestToPromise<GrowthHistory[]>(
    index.getAll(childId),
  );

  return histories.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export async function getAllGrowthHistory(): Promise<GrowthHistory[]> {
  return withStore<GrowthHistory[]>(STORES.growthHistory, "readonly", (store) =>
    store.getAll(),
  );
}

export async function deleteGrowthHistory(id: string): Promise<void> {
  await withStore(STORES.growthHistory, "readwrite", (store) =>
    store.delete(id),
  );
}
