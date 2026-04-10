import type { GamificationState } from "@/types";
import { type LocalGamificationState, STORES, withStore } from "./db";
import { enqueueSync } from "./syncQueueRepository";

const GAMIFICATION_ID = "default" as const;

export async function saveGamification(state: GamificationState) {
  const localState: LocalGamificationState = {
    ...state,
    id: GAMIFICATION_ID,
    syncStatus: "pending",
  };

  await withStore(STORES.gamification, "readwrite", (store) =>
    store.put(localState),
  );
  await enqueueSync("gamification", GAMIFICATION_ID, "upsert", localState);
}

export async function getGamification(): Promise<LocalGamificationState | null> {
  const state = await withStore<LocalGamificationState | undefined>(
    STORES.gamification,
    "readonly",
    (store) => store.get(GAMIFICATION_ID),
  );

  return state ?? null;
}

export async function markGamificationSynced() {
  const state = await getGamification();
  if (!state) return;

  await withStore(STORES.gamification, "readwrite", (store) =>
    store.put({
      ...state,
      syncStatus: "synced",
      lastSyncedAt: new Date().toISOString(),
    } satisfies LocalGamificationState),
  );
}
