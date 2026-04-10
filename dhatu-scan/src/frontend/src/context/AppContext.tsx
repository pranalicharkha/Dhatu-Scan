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
import { getChildren, saveChild } from "../data/childRepository";
import {
  getGamification,
  saveGamification,
} from "../data/gamificationRepository";
import type { Assessment, ChildProfile, GamificationState } from "../types";
import { calculateXP, getLevel } from "../utils/assessmentLogic";
import {
  SAMPLE_CHILDREN,
  SAMPLE_GAMIFICATION,
  getAllSampleAssessments,
} from "../utils/sampleData";

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
  | { type: "ADD_ASSESSMENT"; payload: Assessment }
  | { type: "UPDATE_GAMIFICATION"; payload: GamificationState }
  | { type: "SET_LOADING"; payload: boolean };

const defaultGamification: GamificationState = {
  xp: 0,
  level: 1,
  levelName: "Healthy Seed",
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
  signIn: () => void;
  signOut: () => void;
  addChild: (child: ChildProfile) => void;
  updateChild: (child: ChildProfile) => void;
  setActiveChild: (id: string | null) => void;
  addAssessment: (assessment: Assessment) => void;
  awardXP: (xp: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        if (!isInitialized()) {
          for (const child of SAMPLE_CHILDREN) await saveChild(child);
          for (const assessment of getAllSampleAssessments()) {
            await saveAssessmentRecord(assessment);
          }
          await saveGamification(SAMPLE_GAMIFICATION);
          markInitialized();
        }

        const childProfiles = await getChildren();
        const allAssessments = await getAssessments();
        const gamification = await getGamification();
        const auth = isAuthenticated();

        if (cancelled) return;

        dispatch({
          type: "INIT",
          payload: {
            children: childProfiles,
            assessments: allAssessments,
            activeChildId: childProfiles[0]?.id ?? null,
            gamification: gamification ?? defaultGamification,
            isAuthenticated: auth,
            isLoading: false,
          },
        });
      } catch (err) {
        console.error("Failed to initialize app state:", err);
        if (!cancelled) dispatch({ type: "SET_LOADING", payload: false });
      }
    }

    initialize();

    return () => {
      cancelled = true;
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

  const signIn = useCallback(() => {
    setAuthenticated(true);
    dispatch({
      type: "INIT",
      payload: {
        ...state,
        isAuthenticated: true,
        isLoading: false,
      },
    });
  }, [state]);

  const signOut = useCallback(() => {
    setAuthenticated(false);
    dispatch({
      type: "INIT",
      payload: {
        ...state,
        isAuthenticated: false,
        isLoading: false,
      },
    });
  }, [state]);

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
