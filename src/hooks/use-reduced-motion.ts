'use client';

import { useSyncExternalStore } from 'react';

/**
 * Detects prefers-reduced-motion media query.
 * Uses useSyncExternalStore for tear-free concurrent reads.
 *
 * Returns { prefersReducedMotion: boolean }
 * Use to disable Framer Motion animations and CSS transitions.
 */

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(callback: () => void): () => void {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  // During SSR, assume no preference (default animations enabled)
  return false;
}

export function useReducedMotion() {
  const prefersReducedMotion = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return { prefersReducedMotion };
}
