import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";
import {
  getAssessments,
  saveAssessmentRecord,
} from "../data/assessmentRepository";
import {
  getChildren,
  saveChild,
  deleteChild,
  replaceChildId as replaceChildIdInRepo,
} from "../data/childRepository";
import {
  getGamification,
  saveGamification,
} from "../data/gamificationRepository";
import { getCurrentUser } from "../data/userRepository";
import { startAutoSync, stopAutoSync } from "../data/syncService";
import type { Assessment, ChildProfile, GamificationState } from "../types";
import {
  calculateXP,
  createInitialGamificationState,
} from "../utils/assessmentLogic";
// Sample data removed - using real user data only

interface AppState {
  children: ChildProfile[];
  assessments: Assessment[];
  activeChildId: string | null;
  gamification: GamificationState;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AppAction =
  | { type: "INIT"; payload: AppState }
  | { type: "SET_CHILDREN"; payload: ChildProfile[] }
  | { type: "SET_ACTIVE_CHILD"; payload: string | null }
  | { type: "ADD_CHILD"; payload: ChildProfile }
  | { type: "UPDATE_CHILD"; payload: ChildProfile }
  | { type: "REPLACE_CHILD_ID"; payload: { oldId: string; child: ChildProfile } }
  | { type: "REMOVE_CHILD"; payload: string }
  | { type: "ADD_ASSESSMENT"; payload: Assessment }
  | { type: "UPDATE_GAMIFICATION"; payload: GamificationState }
  | { type: "SET_LOADING"; payload: boolean };

const defaultGamification: GamificationState = createInitialGamificationState();

const initialState: AppState = {
  children: [],
  assessments: [],
  activeChildId: null,
  gamification: defaultGamification,
  isAuthenticated: false,
  isLoading: true,
};

const META_KEYS = {
  INITIALIZED: "dhatu_indexeddb_initialized",
  AUTH: "dhatu_auth",
  AUTH_EMAIL: "dhatu_auth_email",
} as const;

function isInitialized(): boolean {
  return localStorage.getItem(META_KEYS.INITIALIZED) === "true";
}

function markInitialized(): void {
  localStorage.setItem(META_KEYS.INITIALIZED, "true");
}

function isAuthenticated(): boolean {
  return localStorage.getItem(META_KEYS.AUTH) === "true";
}

function setAuthenticated(value: boolean): void {
  localStorage.setItem(META_KEYS.AUTH, value ? "true" : "false");
}

function setAuthEmail(email: string | null): void {
  if (email && email.trim().length > 0) {
    localStorage.setItem(META_KEYS.AUTH_EMAIL, email.trim());
    return;
  }

  localStorage.removeItem(META_KEYS.AUTH_EMAIL);
}

function ensureChildGamification(
  child: ChildProfile,
  fallback?: GamificationState,
): ChildProfile {
  return {
    ...child,
    gamification: createInitialGamificationState(child.gamification ?? fallback),
  };
}

function deriveActiveGamification(
  children: ChildProfile[],
  activeChildId: string | null,
  fallback: GamificationState = defaultGamification,
): GamificationState {
  const activeChild =
    children.find((child) => child.id === activeChildId) ?? children[0] ?? null;
  return activeChild?.gamification
    ? createInitialGamificationState(activeChild.gamification)
    : fallback;
}

async function syncAuthIdentityFromCurrentUser() {
  const user = await getCurrentUser();
  setAuthEmail(user?.email ?? null);
  return user;
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "INIT":
      return { ...action.payload, isLoading: false };
    case "SET_CHILDREN":
      return {
        ...state,
        children: action.payload,
        gamification: deriveActiveGamification(
          action.payload,
          state.activeChildId,
          state.gamification,
        ),
      };
    case "SET_ACTIVE_CHILD":
      return {
        ...state,
        activeChildId: action.payload,
        gamification: deriveActiveGamification(
          state.children,
          action.payload,
          state.gamification,
        ),
      };
    case "ADD_CHILD":
      return {
        ...state,
        children: [...state.children, action.payload],
        activeChildId: action.payload.id,
        gamification: createInitialGamificationState(action.payload.gamification),
      };
    case "UPDATE_CHILD": {
      const updatedChildren = state.children.map((child) =>
        child.id === action.payload.id ? action.payload : child,
      );
      return {
        ...state,
        children: updatedChildren,
        gamification: deriveActiveGamification(
          updatedChildren,
          state.activeChildId,
          state.gamification,
        ),
      };
    }
    case "REPLACE_CHILD_ID": {
      const replacedChildren = state.children.map((child) =>
        child.id === action.payload.oldId ? action.payload.child : child,
      );
      const nextActiveChildId =
        state.activeChildId === action.payload.oldId
          ? action.payload.child.id
          : state.activeChildId;
      return {
        ...state,
        children: replacedChildren,
        activeChildId: nextActiveChildId,
        gamification: deriveActiveGamification(
          replacedChildren,
          nextActiveChildId,
          state.gamification,
        ),
      };
    }
    case "REMOVE_CHILD": {
      const remainingChildren = state.children.filter(
        (child) => child.id !== action.payload,
      );
      const remainingActiveChildId =
        state.activeChildId === action.payload ? null : state.activeChildId;
      return {
        ...state,
        children: remainingChildren,
        activeChildId: remainingActiveChildId,
        gamification: deriveActiveGamification(
          remainingChildren,
          remainingActiveChildId,
          defaultGamification,
        ),
      };
    }
    case "ADD_ASSESSMENT":
      return {
        ...state,
        assessments: [action.payload, ...state.assessments],
      };
    case "UPDATE_GAMIFICATION":
      return { ...state, gamification: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  activeChild: ChildProfile | null;
  activeAssessments: Assessment[];
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  addChild: (child: ChildProfile) => void;
  updateChild: (child: ChildProfile) => void;
  replaceChildId: (oldId: string, child: ChildProfile) => void;
  removeChild: (id: string) => void;
  setActiveChild: (id: string | null) => void;
  addAssessment: (assessment: Assessment) => void;
  awardXP: (xp: number, childId?: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const loadScopedState = useCallback(async (): Promise<AppState> => {
    const childProfiles = await getChildren();
    const allAssessments = await getAssessments();
    const storedGamification = await getGamification();
    const legacyGamification = storedGamification
      ? createInitialGamificationState(storedGamification)
      : defaultGamification;
    const gamificationSeedUsed = childProfiles.some((child) => child.gamification);
    const normalizedChildren = childProfiles.map((child, index) =>
      ensureChildGamification(
        child,
        !gamificationSeedUsed && index === 0 ? legacyGamification : undefined,
      ),
    );
    normalizedChildren.forEach((child, index) => {
      if (!childProfiles[index]?.gamification) {
        void saveChild(child);
      }
    });
    const activeChildId = normalizedChildren[0]?.id ?? null;
    const auth = isAuthenticated();

    return {
      children: normalizedChildren,
      assessments: allAssessments,
      activeChildId,
      gamification: deriveActiveGamification(
        normalizedChildren,
        activeChildId,
        legacyGamification,
      ),
      isAuthenticated: auth,
      isLoading: false,
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        // Clear old Dexie database if it exists
        await deleteOldDexieDb();
        
        // Delete dummy/sample children
        await deleteDummyChildren();
        
        // Fix children without ownerEmail by assigning to current user
        await fixOrphanedChildren();
        
        // Initialize with empty state - no sample data
        markInitialized();

        if (cancelled) return;
        const scopedState = await loadScopedState();
        dispatch({ type: "INIT", payload: scopedState });
      } catch (err) {
        console.error("Failed to initialize app state:", err);
        if (!cancelled) dispatch({ type: "SET_LOADING", payload: false });
      }
    }

    async function deleteOldDexieDb() {
      try {
        // Delete the old Dexie database (DhatuScanDB) if it exists
        await indexedDB.deleteDatabase("DhatuScanDB");
        console.log("[Init] Old DhatuScanDB deleted successfully");
      } catch (e) {
        // Ignore errors - database might not exist
      }
    }

    async function deleteDummyChildren() {
      try {
        // Import here to avoid circular dependency
        const { withStore, STORES } = await import("../data/db");
        
        // Get all children
        const allChildren = await withStore<{id: string; name: string}[]>(
          STORES.children,
          "readonly",
          (store) => store.getAll(),
        );
        
        // Delete dummy/sample children (Arjun, Priya, Rohan, etc.)
        const dummyNames = ["arjun", "priya", "rohan", "aarav", "test", "sample"];
        const dummyChildIds: string[] = [];
        let deletedCount = 0;
        
        for (const child of allChildren) {
          if (dummyNames.includes(child.name?.toLowerCase()?.trim())) {
            dummyChildIds.push(child.id);
            await withStore(STORES.children, "readwrite", (store) =>
              store.delete(child.id),
            );
            deletedCount++;
            console.log(`[Init] Deleted dummy child: ${child.name} (${child.id})`);
          }
        }
        
        // Also delete all assessments for dummy children
        if (dummyChildIds.length > 0) {
          // Get all assessments
          const allAssessments = await withStore<{id: string; childId: string}[]>(
            STORES.assessments,
            "readonly",
            (store) => store.getAll(),
          );
          
          let deletedAssessments = 0;
          for (const assessment of allAssessments) {
            if (dummyChildIds.includes(assessment.childId)) {
              await withStore(STORES.assessments, "readwrite", (store) =>
                store.delete(assessment.id),
              );
              deletedAssessments++;
            }
          }
          
          if (deletedAssessments > 0) {
            console.log(`[Init] Deleted ${deletedAssessments} assessments for dummy children`);
          }
        }
        
        // Also delete assessments with dummy child names (orphaned assessments)
        const allAssessments = await withStore<{id: string; childId: string}[]>(
          STORES.assessments,
          "readonly",
          (store) => store.getAll(),
        );
        
        let deletedOrphanedAssessments = 0;
        for (const assessment of allAssessments) {
          // Check if the childId references a dummy child (already deleted)
          if (!allChildren.find(c => c.id === assessment.childId)) {
            await withStore(STORES.assessments, "readwrite", (store) =>
              store.delete(assessment.id),
            );
            deletedOrphanedAssessments++;
          }
        }
        
        if (deletedOrphanedAssessments > 0) {
          console.log(`[Init] Deleted ${deletedOrphanedAssessments} orphaned assessments`);
        }
        
        if (deletedCount > 0) {
          console.log(`[Init] Deleted ${deletedCount} dummy children`);
        }
      } catch (e) {
        console.error("[Init] Failed to delete dummy children:", e);
      }
    }

    async function fixOrphanedChildren() {
      try {
        // Fix children without ownerEmail by assigning them to current user
        const { withStore, STORES } = await import("../data/db");
        const ownerEmail = localStorage.getItem("dhatu_auth_email");
        if (!ownerEmail) return;

        const allChildren = await withStore<{id: string; name: string; ownerEmail?: string}[]>(
          STORES.children,
          "readonly",
          (store) => store.getAll(),
        );

        let fixedCount = 0;
        for (const child of allChildren) {
          if (!child.ownerEmail) {
            await withStore(STORES.children, "readwrite", (store) =>
              store.put({
                ...child,
                ownerEmail,
              }),
            );
            fixedCount++;
            console.log(`[Init] Fixed orphaned child: ${child.name} assigned to ${ownerEmail}`);
          }
        }

        if (fixedCount > 0) {
          console.log(`[Init] Fixed ${fixedCount} orphaned children`);
        }
      } catch (e) {
        console.error("[Init] Failed to fix orphaned children:", e);
      }
    }

    initialize();

    // Start auto-sync when app initializes
    startAutoSync();

    return () => {
      cancelled = true;
    };
  }, [loadScopedState]);

  // Cleanup auto-sync on unmount
  useEffect(() => {
    return () => {
      stopAutoSync();
    };
  }, []);

  const addChild = useCallback((child: ChildProfile) => {
    const childWithGamification = ensureChildGamification(child);
    void saveChild(childWithGamification);
    dispatch({ type: "ADD_CHILD", payload: childWithGamification });
  }, []);

  const updateChild = useCallback((child: ChildProfile) => {
    const childWithGamification = ensureChildGamification(child);
    void saveChild(childWithGamification);
    dispatch({ type: "UPDATE_CHILD", payload: childWithGamification });
  }, []);

  const removeChild = useCallback((id: string) => {
    void deleteChild(id);
    dispatch({ type: "REMOVE_CHILD", payload: id });
  }, []);

  const replaceChildId = useCallback((oldId: string, child: ChildProfile) => {
    const childWithGamification = ensureChildGamification(child);
    void replaceChildIdInRepo(oldId, childWithGamification);
    dispatch({
      type: "REPLACE_CHILD_ID",
      payload: { oldId, child: childWithGamification },
    });
  }, []);

  const setActiveChild = useCallback((id: string | null) => {
    dispatch({ type: "SET_ACTIVE_CHILD", payload: id });
  }, []);

  const awardXP = useCallback(
    (xp: number, childId?: string) => {
      const targetChildId = childId ?? state.activeChildId;
      if (!targetChildId) return;

      const targetChild = state.children.find((child) => child.id === targetChildId);
      if (!targetChild) return;

      const updatedGamification = createInitialGamificationState({
        ...targetChild.gamification,
        xp: (targetChild.gamification?.xp ?? 0) + xp,
        checkups: (targetChild.gamification?.checkups ?? 0) + 1,
        lastCheckupDate: new Date().toISOString(),
      });

      const updatedChild: ChildProfile = {
        ...targetChild,
        gamification: updatedGamification,
        updatedAt: new Date().toISOString(),
      };

      void saveChild(updatedChild);
      void saveGamification(updatedGamification);
      dispatch({ type: "UPDATE_CHILD", payload: updatedChild });
    },
    [state.activeChildId, state.children],
  );

  const addAssessment = useCallback(
    (assessment: Assessment) => {
      void saveAssessmentRecord(assessment);
      dispatch({ type: "ADD_ASSESSMENT", payload: assessment });
      const xp = calculateXP(assessment);
      awardXP(xp, assessment.childId);
    },
    [awardXP],
  );

  const activeChild =
    state.children.find((child) => child.id === state.activeChildId) ?? null;
  const activeAssessments = state.assessments.filter(
    (assessment) => assessment.childId === state.activeChildId,
  );

  const signIn = useCallback(async () => {
    await syncAuthIdentityFromCurrentUser();
    setAuthenticated(true);
    const scopedState = await loadScopedState();
    dispatch({ type: "INIT", payload: scopedState });
  }, [loadScopedState]);

  const signOut = useCallback(async () => {
    setAuthenticated(false);
    setAuthEmail(null);
    const scopedState = await loadScopedState();
    dispatch({ type: "INIT", payload: scopedState });
  }, [loadScopedState]);

  return (
    <AppContext.Provider
      value={{
        state,
        activeChild,
        activeAssessments,
        signIn,
        signOut,
        addChild,
        updateChild,
        replaceChildId,
        removeChild,
        setActiveChild,
        addAssessment,
        awardXP,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
