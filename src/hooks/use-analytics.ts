'use client';

import { useState, useCallback, useTransition } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { getPlayerAnalytics, type PlayerAnalytics } from '@/lib/firebase/analytics';
import { classifyError, type ClassifiedError } from '@/lib/firebase/firebase-error';

/**
 * Hook: loads player analytics from existing Firestore data.
 * Results are cached — minimal Firestore reads on re-renders.
 */
export function useAnalytics() {
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const [analytics, setAnalytics] = useState<PlayerAnalytics | null>(null);
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(async () => {
    if (!uid) {
      startTransition(() => {
        setAnalytics(null);
      });
      return;
    }

    setError(null);

    try {
      const data = await getPlayerAnalytics(uid);
      startTransition(() => {
        setAnalytics(data);
      });
    } catch (err) {
      const classified = classifyError(err);
      startTransition(() => {
        setError(classified);
        setAnalytics(null);
      });
    }
  }, [uid]);

  // Load on mount
  const [hasLoaded, setHasLoaded] = useState(false);
  if (!hasLoaded && uid) {
    setHasLoaded(true);
    load();
  }
  if (hasLoaded && !uid) {
    setHasLoaded(false);
    setAnalytics(null);
  }

  return { analytics, isLoading: isPending, error, refresh: load };
}
