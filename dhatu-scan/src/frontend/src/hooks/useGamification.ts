import { useCallback } from "react";
import { useApp } from "../context/AppContext";
import { saveGamification } from "../data/gamificationRepository";
import type { Badge, GamificationState } from "../types";
import {
  ALL_BADGES,
  getLevel,
  getLevelProgress,
} from "../utils/assessmentLogic";

interface UseGamificationReturn {
  gamification: GamificationState;
  levelProgress: number;
  awardXP: (amount: number, reason?: string) => void;
  unlockBadge: (badgeId: string) => Badge | null;
  checkAndUnlockBadges: () => Badge[];
  getLevelInfo: () => ReturnType<typeof getLevel>;
}

export function useGamification(): UseGamificationReturn {
  const { state, awardXP: contextAwardXP } = useApp();
  const { gamification } = state;

  const levelProgress = getLevelProgress(gamification.xp);

  const awardXP = useCallback(
    (amount: number, _reason?: string) => {
      contextAwardXP(amount);
    },
    [contextAwardXP],
  );

  const unlockBadge = useCallback(
    (badgeId: string): Badge | null => {
      const existing = gamification.badges.find((b) => b.id === badgeId);
      if (existing?.unlocked) return null; // already unlocked

      const badgeTemplate = ALL_BADGES.find((b) => b.id === badgeId);
      if (!badgeTemplate) return null;

      const newBadge: Badge = {
        ...badgeTemplate,
        unlocked: true,
        unlockedAt: new Date().toISOString(),
      };

      const updatedBadges = gamification.badges.map((b) =>
        b.id === badgeId ? newBadge : b,
      );

      // Add if not present
      if (!gamification.badges.find((b) => b.id === badgeId)) {
        updatedBadges.push(newBadge);
      }

      const updated: GamificationState = {
        ...gamification,
        badges: updatedBadges,
        xp: gamification.xp + newBadge.xpReward,
      };
      const levelInfo = getLevel(updated.xp);
      updated.level = levelInfo.level;
      updated.levelName = levelInfo.name;

      void saveGamification(updated);
      return newBadge;
    },
    [gamification],
  );

  const checkAndUnlockBadges = useCallback((): Badge[] => {
    const unlocked: Badge[] = [];
    const { checkups, badges } = gamification;

    const isUnlocked = (id: string) =>
      badges.find((b) => b.id === id)?.unlocked;

    if (checkups >= 1 && !isUnlocked("first_scan")) {
      const b = unlockBadge("first_scan");
      if (b) unlocked.push(b);
    }
    if (checkups >= 3 && !isUnlocked("three_checkups")) {
      const b = unlockBadge("three_checkups");
      if (b) unlocked.push(b);
    }
    if (checkups >= 6 && !isUnlocked("six_months")) {
      const b = unlockBadge("six_months");
      if (b) unlocked.push(b);
    }
    if (state.children.length >= 2 && !isUnlocked("multi_child")) {
      const b = unlockBadge("multi_child");
      if (b) unlocked.push(b);
    }

    return unlocked;
  }, [gamification, state.children.length, unlockBadge]);

  const getLevelInfo = useCallback(
    () => getLevel(gamification.xp),
    [gamification.xp],
  );

  return {
    gamification,
    levelProgress,
    awardXP,
    unlockBadge,
    checkAndUnlockBadges,
    getLevelInfo,
  };
}
