'use client';

import { useState, useCallback, useRef } from 'react';
import { searchUsers, type SearchResult } from '@/lib/firebase/search';
import { classifyError, type ClassifiedError } from '@/lib/firebase/firebase-error';
import type { UserDocument } from '@/lib/firebase/types';

/**
 * Debounced search hook.
 *
 * Returns results, loading state, and a search function.
 * Debounces input by 300ms to minimize Firestore reads.
 * Ready to be wired to the search button in top-bar.
 */
export function useSearch(debounceMs = 300) {
  const [results, setResults] = useState<SearchResult<UserDocument> | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<ClassifiedError | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(0); // simple generation counter for stale results

  const search = useCallback((query: string) => {
    // Clear any pending debounced search
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Empty query: clear results immediately
    if (!query || query.length < 2) {
      setResults(null);
      setIsSearching(false);
      setError(null);
      return;
    }

    setIsSearching(true);

    timerRef.current = setTimeout(async () => {
      const generation = ++abortRef.current;

      try {
        const data = await searchUsers(query);
        // Only update if this is still the latest search
        if (generation === abortRef.current) {
          setResults(data);
          setError(null);
        }
      } catch (err) {
        if (generation === abortRef.current) {
          const classified = classifyError(err);
          setError(classified);
          setResults(null);
        }
      } finally {
        if (generation === abortRef.current) {
          setIsSearching(false);
        }
      }
    }, debounceMs);
  }, [debounceMs]);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setResults(null);
    setIsSearching(false);
    setError(null);
  }, []);

  return { results, isSearching, error, search, clear };
}
