/**
 * Listener Manager
 *
 * Deduplicates Firestore real-time (onSnapshot) listeners.
 * Multiple components subscribing to the same document or query
 * share a single Firestore listener. Reference-counted: the actual
 * Firestore listener is only torn down when all consumers unsubscribe.
 */

import {
  doc,
  collection,
  query,
  onSnapshot,
  type DocumentReference,
  type Query,
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from './config';

interface ListenerEntry {
  unsubscribe: Unsubscribe;
  callbacks: Set<(data: unknown) => void>;
  refCount: number;
  lastData: unknown;
}

class ListenerManager {
  private listeners = new Map<string, ListenerEntry>();

  /**
   * Subscribe to a document's real-time updates.
   * Returns an unsubscribe function.
   *
   * If a listener for the same key already exists, the callback
   * is added to the existing listener (no new Firestore connection).
   */
  listenToDocument<T>(
    collectionName: string,
    docId: string,
    callback: (data: T | null) => void,
  ): Unsubscribe {
    const key = `doc:${collectionName}:${docId}`;
    const wrappedCallback = callback as (data: unknown) => void;

    const existing = this.listeners.get(key);
    if (existing) {
      existing.callbacks.add(wrappedCallback);
      existing.refCount++;

      // Immediately deliver the last known data so the new subscriber
      // doesn't have to wait for the next snapshot.
      if (existing.lastData !== undefined) {
        callback(existing.lastData as T | null);
      }

      return () => this.removeCallback(key, wrappedCallback);
    }

    // Create a new Firestore listener
    const ref: DocumentReference = doc(getFirebaseDb(), collectionName, docId);
    const callbacks = new Set<(data: unknown) => void>([wrappedCallback]);

    const firestoreUnsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.exists() ? (snap.data() as T) : null;
        const entry = this.listeners.get(key);
        if (entry) {
          entry.lastData = data;
          for (const cb of entry.callbacks) {
            cb(data);
          }
        }
      },
      (error) => {
        console.warn(
          `[Firestore] Listener denied (${collectionName}/${docId}):`,
          error.code,
          error.message,
        );
        const entry = this.listeners.get(key);
        if (entry) {
          entry.lastData = null;
          for (const cb of entry.callbacks) {
            cb(null);
          }
        }
      },
    );

    this.listeners.set(key, {
      unsubscribe: firestoreUnsub,
      callbacks,
      refCount: 1,
      lastData: undefined,
    });

    return () => this.removeCallback(key, wrappedCallback);
  }

  /**
   * Subscribe to a subcollection's real-time updates (query).
   * Returns an unsubscribe function.
   */
  listenToSubCollection<T>(
    parentCollection: string,
    parentId: string,
    subCollection: string,
    constraints: QueryConstraint[],
    callback: (data: T[]) => void,
  ): Unsubscribe {
    // Build a deterministic key from the path + constraints (toString is stable enough)
    const constraintKey = constraints.map((c) => String(c)).join('|');
    const key = `sub:${parentCollection}:${parentId}:${subCollection}:${constraintKey}`;
    const wrappedCallback = callback as (data: unknown) => void;

    const existing = this.listeners.get(key);
    if (existing) {
      existing.callbacks.add(wrappedCallback);
      existing.refCount++;

      if (existing.lastData !== undefined) {
        callback(existing.lastData as T[]);
      }

      return () => this.removeCallback(key, wrappedCallback);
    }

    const ref = collection(getFirebaseDb(), parentCollection, parentId, subCollection);
    const q: Query = constraints.length > 0 ? query(ref, ...constraints) : query(ref);
    const callbacks = new Set<(data: unknown) => void>([wrappedCallback]);

    const firestoreUnsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as T);
        const entry = this.listeners.get(key);
        if (entry) {
          entry.lastData = data;
          for (const cb of entry.callbacks) {
            cb(data);
          }
        }
      },
      (error) => {
        console.warn(
          `[Firestore] Listener denied subcollection (${parentCollection}/${parentId}/${subCollection}):`,
          error.code,
          error.message,
        );
        const entry = this.listeners.get(key);
        if (entry) {
          entry.lastData = [];
          for (const cb of entry.callbacks) {
            cb([]);
          }
        }
      },
    );

    this.listeners.set(key, {
      unsubscribe: firestoreUnsub,
      callbacks,
      refCount: 1,
      lastData: undefined,
    });

    return () => this.removeCallback(key, wrappedCallback);
  }

  /**
   * Check how many active Firestore listeners exist.
   */
  get activeCount(): number {
    return this.listeners.size;
  }

  /**
   * Tear down all listeners. Called on sign-out.
   */
  removeAll(): void {
    for (const entry of this.listeners.values()) {
      entry.unsubscribe();
      entry.callbacks.clear();
    }
    this.listeners.clear();
  }

  /**
   * Remove a callback from a listener.
   * If the ref count drops to 0, tear down the Firestore listener.
   */
  private removeCallback(key: string, callback: (data: unknown) => void): void {
    const entry = this.listeners.get(key);
    if (!entry) return;

    entry.callbacks.delete(callback);
    entry.refCount--;

    if (entry.refCount <= 0) {
      entry.unsubscribe();
      this.listeners.delete(key);
    }
  }
}

/**
 * Singleton listener manager used across the app.
 */
export const listenerManager = new ListenerManager();
