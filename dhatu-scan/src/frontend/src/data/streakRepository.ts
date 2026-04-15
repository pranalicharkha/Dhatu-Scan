import type { Streak } from "./db";
import { STORES } from "./db";
import { requestToPromise, withStore } from "./db";

function getCurrentParentEmail(): string | null {
  const email = localStorage.getItem("dhatu_auth_email");
  return email?.trim() || null;
}

export async function saveStreak(streak: Streak): Promise<void> {
  await withStore(STORES.streaks, "readwrite", (store) => store.put(streak));
}

export async function getStreak(id: string): Promise<Streak | null> {
  return withStore<Streak | undefined>(
    STORES.streaks,
    "readonly",
    (store) => store.get(id),
  ).then((streak) => streak ?? null);
}

export async function getStreakByParentEmail(
  email?: string,
): Promise<Streak | null> {
  const parentEmail = email ?? getCurrentParentEmail();
  if (!parentEmail) return null;

  const db = await import("./db").then((m) => m.getDb());
  const tx = db.transaction(STORES.streaks, "readonly");
  const index = tx.objectStore(STORES.streaks).index("parentEmail");
  const streaks = await requestToPromise<Streak[]>(index.getAll(parentEmail));

  return streaks[0] ?? null;
}

export async function getAllStreaks(): Promise<Streak[]> {
  return withStore<Streak[]>(STORES.streaks, "readonly", (store) =>
    store.getAll(),
  );
}

export async function deleteStreak(id: string): Promise<void> {
  await withStore(STORES.streaks, "readwrite", (store) => store.delete(id));
}
