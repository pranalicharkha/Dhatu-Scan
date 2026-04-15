import type { CurrentUser } from "./db";
import { STORES } from "./db";
import { requestToPromise, withStore } from "./db";

const USER_ID = 1;

export async function saveCurrentUser(user: CurrentUser): Promise<void> {
  await withStore(STORES.currentUser, "readwrite", (store) =>
    store.put({ ...user, id: USER_ID }),
  );
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  return withStore<CurrentUser | undefined>(
    STORES.currentUser,
    "readonly",
    (store) => store.get(USER_ID),
  ).then((user) => user ?? null);
}

export async function clearCurrentUser(): Promise<void> {
  await withStore(STORES.currentUser, "readwrite", (store) =>
    store.delete(USER_ID),
  );
}

export async function getCurrentUserToken(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.auth_token ?? null;
}

export async function getCurrentUserEmail(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.email ?? null;
}
