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
import { calculateXP, getLevel } from "../utils/assessmentLogic";
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

const defaultGamification: GamificationState = {
  xp: 0,
  level: 1,
  levelName: "Starting Point",
  badges: [],
  checkups: 0,
  streak: 0,
};

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
      return { ...state, children: action.payload };
    case "SET_ACTIVE_CHILD":
      return { ...state, activeChildId: action.payload };
    case "ADD_CHILD":
      return { ...state, children: [...state.children, action.payload] };
    case "UPDATE_CHILD":
      return {
        ...state,
        children: state.children.map((child) =>
          child.id === action.payload.id ? action.payload : child,
        ),
      };
    case "REPLACE_CHILD_ID":
      return {
        ...state,
        children: state.children.map((child) =>
          child.id === action.payload.oldId ? action.payload.child : child,
        ),
        activeChildId:
          state.activeChildId === action.payload.oldId
            ? action.payload.child.id
            : state.activeChildId,
      };
    case "REMOVE_CHILD":
      return {
        ...state,
        children: state.children.filter((child) => child.id !== action.payload),
        activeChildId: state.activeChildId === action.payload ? null : state.activeChildId,
      };
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
  awardXP: (xp: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const loadScopedState = useCallback(async (): Promise<AppState> => {
    const childProfiles = await getChildren();
    const allAssessments = await getAssessments();
    const storedGamification = await getGamification();
    const gamification = storedGamification
      ? {
          ...storedGamification,
          level: getLevel(storedGamification.xp).level,
          levelName: getLevel(storedGamification.xp).name,
        }
      : defaultGamification;
    const auth = isAuthenticated();

    return {
      children: childProfiles,
      assessments: allAssessments,
      activeChildId: childProfiles[0]?.id ?? null,
      gamification,
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
        
        if (deletedCount > 0) {
          console.log(`[Init] Deleted ${deletedCount} dummy children`);
        }
      } catch (e) {
        console.error("[Init] Failed to delete dummy children:", e);
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
    void saveChild(child);
    dispatch({ type: "ADD_CHILD", payload: child });
    dispatch({ type: "SET_ACTIVE_CHILD", payload: child.id });
  }, []);

  const updateChild = useCallback((child: ChildProfile) => {
    void saveChild(child);
    dispatch({ type: "UPDATE_CHILD", payload: child });
  }, []);

  const removeChild = useCallback((id: string) => {
    void deleteChild(id);
    dispatch({ type: "REMOVE_CHILD", payload: id });
  }, []);

  const replaceChildId = useCallback((oldId: string, child: ChildProfile) => {
    void replaceChildIdInRepo(oldId, child);
    dispatch({ type: "REPLACE_CHILD_ID", payload: { oldId, child } });
  }, []);

  const setActiveChild = useCallback((id: string | null) => {
    dispatch({ type: "SET_ACTIVE_CHILD", payload: id });
  }, []);

  const awardXP = useCallback(
    (xp: number) => {
      const updated: GamificationState = {
        ...state.gamification,
        xp: state.gamification.xp + xp,
        checkups: state.gamification.checkups + 1,
      };
      const levelInfo = getLevel(updated.xp);
      updated.level = levelInfo.level;
      updated.levelName = levelInfo.name;
      void saveGamification(updated);
      dispatch({ type: "UPDATE_GAMIFICATION", payload: updated });
    },
    [state.gamification],
  );

  const addAssessment = useCallback(
    (assessment: Assessment) => {
      void saveAssessmentRecord(assessment);
      dispatch({ type: "ADD_ASSESSMENT", payload: assessment });
      const xp = calculateXP(assessment);
      awardXP(xp);
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
