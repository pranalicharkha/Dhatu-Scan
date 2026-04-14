import type { GamificationState } from "@/types";
import { type LocalGamificationState, STORES, withStore } from "./db";
import { enqueueSync } from "./syncQueueRepository";

const GAMIFICATION_ID = "default" as const;

function getCurrentParentEmail(): string | null {
  const email = localStorage.getItem("dhatu_auth_email");
  return email?.trim() || null;
}

export async function saveGamification(state: GamificationState) {
  const ownerEmail = getCurrentParentEmail();
  const localState: LocalGamificationState = {
    ...state,
    id: GAMIFICATION_ID,
    ownerEmail: ownerEmail ?? undefined,
    syncStatus: "pending",
  };

  await withStore(STORES.gamification, "readwrite", (store) =>
    store.put(localState),
  );
  await enqueueSync("gamification", GAMIFICATION_ID, "upsert", localState);
}

export async function getGamification(): Promise<LocalGamificationState | null> {
  const ownerEmail = getCurrentParentEmail();
  if (!ownerEmail) return null;

  const state = await withStore<LocalGamificationState | undefined>(
    STORES.gamification,
    "readonly",
    (store) => store.get(GAMIFICATION_ID),
  );

  if (!state || state.ownerEmail !== ownerEmail) return null;
  return state;
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
