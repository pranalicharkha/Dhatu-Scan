import { useCallback } from "react";
import { useApp } from "../context/AppContext";
import type { Badge, GamificationState } from "../types";
import {
  ALL_BADGES,
  createInitialGamificationState,
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
  const {
    state,
    activeChild,
    awardXP: contextAwardXP,
    updateChild,
  } = useApp();
  const gamification =
    activeChild?.gamification
      ? createInitialGamificationState(activeChild.gamification)
      : state.gamification;

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
      if (!activeChild) return null;

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

      const updated: GamificationState = createInitialGamificationState({
        ...gamification,
        badges: updatedBadges,
        xp: gamification.xp + newBadge.xpReward,
      });

      updateChild({
        ...activeChild,
        gamification: updated,
        updatedAt: new Date().toISOString(),
      });
      return newBadge;
    },
    [activeChild, gamification, updateChild],
  );

  const checkAndUnlockBadges = useCallback((): Badge[] => {
    const unlocked: Badge[] = [];
    const { checkups, badges } = gamification;

    const isUnlocked = (id: string) =>
      badges.find((b) => b.id === id)?.unlocked;

    if (checkups >= 3 && !isUnlocked("three_checkups")) {
      const b = unlockBadge("three_checkups");
      if (b) unlocked.push(b);
    }
    if (checkups >= 6 && !isUnlocked("six_months")) {
      const b = unlockBadge("six_months");
      if (b) unlocked.push(b);
    }

    return unlocked;
  }, [gamification, unlockBadge]);

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
