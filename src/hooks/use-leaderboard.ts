'use client';

import { useState, useCallback, useEffect, useTransition } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import {
  getGlobalLeaderboard,
  getUserRankPosition,
  type LeaderboardEntry,
} from '@/lib/firebase/leaderboard';
import { classifyError, type ClassifiedError } from '@/lib/firebase/firebase-error';

/**
 * Hook: loads the global leaderboard + current user's rank.
 * Returns error state for graceful error handling in UI.
 *
 * Uses useEffect for initial load to avoid setting state
 * before the component mounts (React 19 strict mode).
 */
export function useLeaderboard(maxEntries = 10) {
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const globalXp = useAuthStore((s) => s.userProfile?.globalXp ?? 0);

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();

  const load = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const [leaderboard, rank] = await Promise.all([
        getGlobalLeaderboard(maxEntries),
        uid ? getUserRankPosition(globalXp) : Promise.resolve(null),
      ]);
      startTransition(() => {
        setEntries(leaderboard);
        setUserRank(rank);
        setIsLoading(false);
      });
    } catch (err) {
      const classified = classifyError(err);
      startTransition(() => {
        setError(classified);
        setEntries([]);
        setUserRank(null);
        setIsLoading(false);
      });
    }
  }, [maxEntries, uid, globalXp, startTransition]);

  // Load on mount — useEffect ensures state updates happen after mount
  useEffect(() => {
    load();
  }, [load]);

  return { entries, userRank, isLoading, error, refresh: load };
}
