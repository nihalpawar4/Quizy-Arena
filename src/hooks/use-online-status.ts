'use client';

import { useSyncExternalStore } from 'react';

/**
 * Subscribe to browser online/offline events.
 * Returns { isOnline: boolean }.
 *
 * Uses useSyncExternalStore for tear-free reads
 * (safe with React 18 concurrent features).
 */

function subscribe(callback: () => void): () => void {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot(): boolean {
  return navigator.onLine;
}

function getServerSnapshot(): boolean {
  // During SSR, assume online
  return true;
}

export function useOnlineStatus() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { isOnline };
}
