'use client';

import { useEffect } from 'react';
import { onAuthChange } from '@/lib/firebase/auth';
import { listenerManager } from '@/lib/firebase/listener-manager';
import { firebaseCache } from '@/lib/firebase/cache';
import { useAuthStore } from '@/stores/auth-store';
import type { UserDocument, ArenaProfileDocument } from '@/lib/firebase/types';
import type { Unsubscribe } from 'firebase/firestore';
import { syncEcosystemOnLogin } from '@/lib/firebase/ecosystem-sync';
import { processOfflineQueue } from '@/engine/save-manager';
import { getGameDefinition } from '@/engine/registry';

/**
 * AuthProvider listens to Firebase Auth state changes and attaches
 * deduplicated real-time Firestore listeners for the user's shared
 * profile and Arena profile. Both documents auto-sync via onSnapshot.
 *
 * Uses ListenerManager to prevent duplicate Firestore listeners
 * when multiple components subscribe to the same data.
 *
 * Populates the FirebaseCache so subsequent getDocument() calls
 * for the user's profile hit cache instead of Firestore.
 *
 * Wrap this around the app in the root layout.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    setFirebaseUser,
    setUserProfile,
    setArenaProfile,
    setAuthLoading,
    setProfileLoading,
  } = useAuthStore();

  useEffect(() => {
    let unsubProfile: Unsubscribe | null = null;
    let unsubArena: Unsubscribe | null = null;

    const unsubAuth = onAuthChange((user) => {
      setFirebaseUser(user);

      // Tear down previous listeners
      unsubProfile?.();
      unsubArena?.();
      unsubProfile = null;
      unsubArena = null;

      if (user) {
        setProfileLoading(true);

        syncEcosystemOnLogin(user.uid, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        }).catch((err) => console.warn('[Auth] Ecosystem sync failed:', err));

        let profileLoaded = false;
        let arenaLoaded = false;

        const checkDone = () => {
          if (profileLoaded && arenaLoaded) {
            setProfileLoading(false);
          }
        };

        // Real-time listener: shared user profile (deduplicated via ListenerManager)
        unsubProfile = listenerManager.listenToDocument<UserDocument>(
          'users',
          user.uid,
          (data) => {
            setUserProfile(data);

            // Keep cache in sync so other reads are cache-first
            if (data) {
              firebaseCache.set(`users:${user.uid}`, data);
            } else {
              firebaseCache.invalidate(`users:${user.uid}`);
            }

            profileLoaded = true;
            checkDone();
          },
        );

        // Real-time listener: Arena-specific profile (deduplicated via ListenerManager)
        unsubArena = listenerManager.listenToDocument<ArenaProfileDocument>(
          'arena_profiles',
          user.uid,
          (data) => {
            setArenaProfile(data);

            // Keep cache in sync
            if (data) {
              firebaseCache.set(`arena_profiles:${user.uid}`, data);
            } else {
              firebaseCache.invalidate(`arena_profiles:${user.uid}`);
            }

            arenaLoaded = true;
            checkDone();
          },
        );
      } else {
        setUserProfile(null);
        setArenaProfile(null);

        // Clear all caches and listeners on sign-out
        firebaseCache.clear();
        listenerManager.removeAll();
      }

      setAuthLoading(false);
    });

    return () => {
      unsubAuth();
      unsubProfile?.();
      unsubArena?.();
    };
  }, [setFirebaseUser, setUserProfile, setArenaProfile, setAuthLoading, setProfileLoading]);

  // ── Offline queue: flush pending game saves when connectivity is restored ──
  useEffect(() => {
    const handleOnline = () => {
      const uid = useAuthStore.getState().firebaseUser?.uid;
      if (!uid) return;

      processOfflineQueue(getGameDefinition)
        .then((synced) => {
          if (synced > 0) {
            console.info(`[OfflineQueue] Synced ${synced} queued game session(s)`);
          }
        })
        .catch((err) => console.warn('[OfflineQueue] Failed to process queue:', err));
    };

    window.addEventListener('online', handleOnline);

    // Also try to flush on mount in case the app was reloaded while online
    // and there are stale items from a previous offline session
    handleOnline();

    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return <>{children}</>;
}
