/**
 * Presence System (Firebase Realtime Database)
 *
 * Uses RTDB exclusively for:
 * - isOnline
 * - lastSeen
 * - currentApp
 * - currentPage
 * - currentGame
 *
 * Leverages RTDB's onDisconnect() for automatic cleanup
 * when a user closes their browser or loses connection.
 * Everything else continues using Firestore.
 */

import {
  ref,
  set,
  onValue,
  onDisconnect,
  serverTimestamp as rtdbTimestamp,
  type Unsubscribe,
} from 'firebase/database';
import { getFirebaseRtdb } from './config';

export interface PresenceData {
  isOnline: boolean;
  lastSeen: number | object; // number when reading, ServerValue when writing
  currentApp: 'arena' | 'quizy';
  currentPage: string;
  currentGame: string | null;
}

/**
 * Set up presence tracking for a user.
 * Must be called once when the user signs in.
 *
 * Returns a cleanup function that tears down the presence listeners.
 */
export function setupPresence(uid: string): () => void {
  const rtdb = getFirebaseRtdb();
  const presenceRef = ref(rtdb, `presence/${uid}`);
  const connectedRef = ref(rtdb, '.info/connected');

  // Listen for connection state changes
  const unsubConnected = onValue(connectedRef, (snap) => {
    if (!snap.val()) return;

    // Set the onDisconnect handler FIRST (before setting online)
    // This ensures cleanup even if the browser closes immediately
    const disconnectRef = onDisconnect(presenceRef);
    disconnectRef.set({
      isOnline: false,
      lastSeen: rtdbTimestamp(),
      currentApp: 'arena',
      currentPage: '',
      currentGame: null,
    });

    // Now mark as online
    set(presenceRef, {
      isOnline: true,
      lastSeen: rtdbTimestamp(),
      currentApp: 'arena',
      currentPage: typeof window !== 'undefined' ? window.location.pathname : '/',
      currentGame: null,
    });
  });

  // Cleanup function
  return () => {
    unsubConnected?.();
    // Mark as offline immediately
    set(presenceRef, {
      isOnline: false,
      lastSeen: rtdbTimestamp(),
      currentApp: 'arena',
      currentPage: '',
      currentGame: null,
    });
  };
}

/**
 * Update the current page the user is viewing.
 */
export function updatePresencePage(uid: string, page: string): void {
  const rtdb = getFirebaseRtdb();
  const pageRef = ref(rtdb, `presence/${uid}/currentPage`);
  set(pageRef, page);
}

/**
 * Update the current game the user is playing.
 * Pass null to clear (when game ends).
 */
export function updatePresenceGame(uid: string, gameSlug: string | null): void {
  const rtdb = getFirebaseRtdb();
  const gameRef = ref(rtdb, `presence/${uid}/currentGame`);
  set(gameRef, gameSlug);
}

/**
 * Listen to a specific user's presence in real-time.
 * Returns unsubscribe function.
 */
export function listenToPresence(
  uid: string,
  callback: (data: PresenceData | null) => void,
): Unsubscribe {
  const rtdb = getFirebaseRtdb();
  const presenceRef = ref(rtdb, `presence/${uid}`);

  return onValue(presenceRef, (snap) => {
    callback(snap.exists() ? (snap.val() as PresenceData) : null);
  });
}
