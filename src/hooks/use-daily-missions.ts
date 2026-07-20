'use client';

import { useState, useCallback, useTransition } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import {
  getDailyMissions,
  claimMissionReward,
  type MissionWithProgress,
} from '@/lib/firebase/missions';
import { classifyError, type ClassifiedError } from '@/lib/firebase/firebase-error';

/**
 * Hook: manages daily missions — loading, progress, claiming.
 * Returns error state for graceful error handling in UI.
 */
export function useDailyMissions() {
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const addToast = useUIStore((s) => s.addToast);

  const [missions, setMissions] = useState<MissionWithProgress[]>([]);
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadMissions = useCallback(async () => {
    if (!uid) {
      startTransition(() => {
        setMissions([]);
      });
      return;
    }

    setError(null);

    try {
      const data = await getDailyMissions(uid);
      startTransition(() => {
        setMissions(data);
      });
    } catch (err) {
      const classified = classifyError(err);
      startTransition(() => {
        setError(classified);
        setMissions([]);
      });
    }
  }, [uid]);

  // Load on mount and when uid changes
  const [hasLoaded, setHasLoaded] = useState(false);
  if (!hasLoaded && uid) {
    setHasLoaded(true);
    loadMissions();
  }
  // Reset when uid changes (sign-out)
  if (hasLoaded && !uid) {
    setHasLoaded(false);
    setMissions([]);
  }

  const claimReward = useCallback(async (missionId: string) => {
    if (!uid) return;

    try {
      const result = await claimMissionReward(uid, missionId);
      if (result) {
        addToast({
          message: 'Mission Complete!',
          description: `+${result.xp} XP, +${result.coins} Coins${result.diamonds > 0 ? `, +${result.diamonds} 💎` : ''}`,
          variant: 'success',
        });
        // Reload missions to reflect claimed state
        await loadMissions();
      } else {
        addToast({
          message: 'Already claimed',
          variant: 'warning',
        });
      }
    } catch (err) {
      const classified = classifyError(err);
      addToast({
        message: classified.message,
        variant: 'error',
      });
    }
  }, [uid, addToast, loadMissions]);

  const completedCount = missions.filter((m) => m.isCompleted).length;
  const claimedCount = missions.filter((m) => m.isClaimed).length;

  return {
    missions,
    isLoading: isPending,
    error,
    claimReward,
    completedCount,
    claimedCount,
    totalCount: missions.length,
    refresh: loadMissions,
  };
}
