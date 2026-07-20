'use client';

import { useState, useCallback, useTransition } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { getRecentGames, type RecentGame } from '@/lib/firebase/sessions';
import { classifyError, type ClassifiedError } from '@/lib/firebase/firebase-error';

/**
 * Hook: loads the user's recently played unique games for "Continue Playing".
 * Returns error state for graceful error handling in UI.
 */
export function useRecentGames(maxGames = 5) {
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const [games, setGames] = useState<RecentGame[]>([]);
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(async () => {
    if (!uid) {
      startTransition(() => {
        setGames([]);
      });
      return;
    }

    setError(null);

    try {
      const data = await getRecentGames(uid, maxGames);
      startTransition(() => {
        setGames(data);
      });
    } catch (err) {
      const classified = classifyError(err);
      startTransition(() => {
        setError(classified);
        setGames([]);
      });
    }
  }, [uid, maxGames]);

  // Load on mount and when uid changes
  const [hasLoaded, setHasLoaded] = useState(false);
  if (!hasLoaded && uid) {
    setHasLoaded(true);
    load();
  }
  if (hasLoaded && !uid) {
    setHasLoaded(false);
    setGames([]);
  }

  return { games, isLoading: isPending, error, refresh: load };
}
