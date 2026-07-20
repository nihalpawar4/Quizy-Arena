'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { setupPresence, updatePresencePage } from '@/lib/firebase/presence';

/**
 * Hook: manages real-time presence tracking via Firebase RTDB.
 *
 * - Starts the presence heartbeat on mount (when user is authenticated)
 * - Updates currentPage on route changes
 * - Tears down presence on unmount / sign-out
 *
 * Call once in AuthProvider or AppShell — not per-component.
 */
export function usePresence() {
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const pathname = usePathname();
  const cleanupRef = useRef<(() => void) | null>(null);

  // Setup/teardown presence on auth changes
  useEffect(() => {
    if (!uid) {
      // Cleanup if signed out
      cleanupRef.current?.();
      cleanupRef.current = null;
      return;
    }

    // Setup presence for this user
    cleanupRef.current = setupPresence(uid);

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [uid]);

  // Update current page on route change
  useEffect(() => {
    if (uid && pathname) {
      updatePresencePage(uid, pathname);
    }
  }, [uid, pathname]);
}
