import type { Assessment, ChildProfile, GamificationState } from "../types";

const KEYS = {
  ASSESSMENTS: "dhatu_assessments",
  CHILDREN: "dhatu_children",
  GAMIFICATION: "dhatu_gamification",
  INITIALIZED: "dhatu_initialized",
} as const;

function safeGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("Storage write failed:", err);
  }
}

// Assessments
export function saveAssessment(assessment: Assessment): void {
  const existing = getAssessments();
  const idx = existing.findIndex((a) => a.id === assessment.id);
  if (idx >= 0) {
    existing[idx] = assessment;
  } else {
    existing.push(assessment);
  }
  safeSet(KEYS.ASSESSMENTS, existing);
}

export function getAssessments(childId?: string): Assessment[] {
  const all = safeGet<Assessment[]>(KEYS.ASSESSMENTS) ?? [];
  if (!childId) return all;
  return all.filter((a) => a.childId === childId);
}

export function deleteAssessment(id: string): void {
  const existing = getAssessments().filter((a) => a.id !== id);
  safeSet(KEYS.ASSESSMENTS, existing);
}

// Child profiles
export function saveChildProfile(child: ChildProfile): void {
  const existing = getChildProfiles();
  const idx = existing.findIndex((c) => c.id === child.id);
  if (idx >= 0) {
    existing[idx] = child;
  } else {
    existing.push(child);
  }
  safeSet(KEYS.CHILDREN, existing);
}

export function getChildProfiles(): ChildProfile[] {
  return safeGet<ChildProfile[]>(KEYS.CHILDREN) ?? [];
}

export function deleteChildProfile(id: string): void {
  const existing = getChildProfiles().filter((c) => c.id !== id);
  safeSet(KEYS.CHILDREN, existing);
  // Also remove associated assessments
  const assessments = getAssessments().filter((a) => a.childId !== id);
  safeSet(KEYS.ASSESSMENTS, assessments);
}

// Gamification
export function saveGamificationState(state: GamificationState): void {
  safeSet(KEYS.GAMIFICATION, state);
}

export function getGamificationState(): GamificationState | null {
  return safeGet<GamificationState>(KEYS.GAMIFICATION);
}

// Data management
export function clearAllData(): void {
  for (const key of Object.values(KEYS)) {
    localStorage.removeItem(key);
  }
}

export function isInitialized(): boolean {
  return localStorage.getItem(KEYS.INITIALIZED) === "true";
}

export function markInitialized(): void {
  localStorage.setItem(KEYS.INITIALIZED, "true");
}

export function exportData(): string {
  const data = {
    children: getChildProfiles(),
    assessments: getAssessments(),
    gamification: getGamificationState(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}
