import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  writeBatch,
  onSnapshot,
  serverTimestamp,
  increment,
  runTransaction,
  type DocumentReference,
  type QueryConstraint,
  type Unsubscribe,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from './config';
import { firebaseCache } from './cache';
import { classifyError } from './firebase-error';

// ── Re-exports for convenience ──
export {
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  Timestamp,
};
export type { Unsubscribe };

/**
 * Get a single document by path.
 * Cache-first: returns cached data if available and fresh.
 */
export async function getDocument<T>(
  collectionName: string,
  docId: string,
): Promise<T | null> {
  const cacheKey = `${collectionName}:${docId}`;

  // Check cache first
  const cached = firebaseCache.get<T | null>(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const snap = await getDoc(doc(getFirebaseDb(), collectionName, docId));
    const data = snap.exists() ? (snap.data() as T) : null;

    // Only cache existing documents — caching null can cause stale reads
    // when a document is created shortly after a miss (e.g. during onboarding)
    if (data !== null) {
      firebaseCache.set(cacheKey, data);
    }

    return data;
  } catch (error) {
    throw classifyError(error);
  }
}

/**
 * Set (create or overwrite) a document.
 * Invalidates cache for this document.
 */
export async function setDocument(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>,
  options?: { merge?: boolean },
): Promise<void> {
  try {
    const merge = options?.merge ?? false;
    await setDoc(doc(getFirebaseDb(), collectionName, docId), data, { merge });
    // Invalidate cache for this document
    firebaseCache.invalidate(`${collectionName}:${docId}`);
    // Also invalidate any query caches for this collection
    firebaseCache.invalidatePrefix(`${collectionName}:q:`);
  } catch (error) {
    throw classifyError(error);
  }
}

/**
 * Update specific fields on an existing document.
 * Invalidates cache for this document.
 */
export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    await updateDoc(doc(getFirebaseDb(), collectionName, docId), data);
    // Invalidate cache for this document
    firebaseCache.invalidate(`${collectionName}:${docId}`);
    // Also invalidate any query caches for this collection
    firebaseCache.invalidatePrefix(`${collectionName}:q:`);
  } catch (error) {
    throw classifyError(error);
  }
}

/**
 * Delete a document.
 * Invalidates cache for this document.
 */
export async function deleteDocument(
  collectionName: string,
  docId: string,
): Promise<void> {
  try {
    await deleteDoc(doc(getFirebaseDb(), collectionName, docId));
    firebaseCache.invalidate(`${collectionName}:${docId}`);
    firebaseCache.invalidatePrefix(`${collectionName}:q:`);
  } catch (error) {
    throw classifyError(error);
  }
}

/**
 * Atomically claim a new document (fails if it already exists).
 * Uses a Firestore transaction to prevent race conditions.
 * Returns true if the document was created, false if it already existed.
 */
export async function claimNewDocument(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>,
): Promise<boolean> {
  try {
    const ref = doc(getFirebaseDb(), collectionName, docId);
    const claimed = await runTransaction(getFirebaseDb(), async (transaction) => {
      const existing = await transaction.get(ref);
      if (existing.exists()) {
        return false; // Already taken
      }
      transaction.set(ref, data);
      return true;
    });

    if (claimed) {
      firebaseCache.invalidate(`${collectionName}:${docId}`);
      firebaseCache.invalidatePrefix(`${collectionName}:q:`);
    }

    return claimed;
  } catch (error) {
    throw classifyError(error);
  }
}

/**
 * Query documents from a collection with constraints.
 * Cache-first with a hash-based key derived from constraint types.
 */
export async function queryDocuments<T>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  // Build a deterministic hash from constraint internals
  const hash = constraints.map((c) => JSON.stringify({ t: c.type, ...c })).join('|');
  const cacheKey = `${collectionName}:q:${hash}`;

  // Check cache first
  const cached = firebaseCache.get<T[]>(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const q = query(collection(getFirebaseDb(), collectionName), ...constraints);
    const snap = await getDocs(q);
    const results = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as T);

    // Populate cache
    firebaseCache.set(cacheKey, results);

    return results;
  } catch (error) {
    throw classifyError(error);
  }
}

/**
 * Get a document reference (for batch writes).
 */
export function getDocRef(
  collectionName: string,
  docId: string,
): DocumentReference {
  return doc(getFirebaseDb(), collectionName, docId);
}

/**
 * Get a subcollection document reference.
 */
export function getSubDocRef(
  parentCollection: string,
  parentId: string,
  subCollection: string,
  docId: string,
): DocumentReference {
  return doc(getFirebaseDb(), parentCollection, parentId, subCollection, docId);
}

/**
 * Query subcollection documents.
 * Cache-first.
 */
export async function querySubCollection<T>(
  parentCollection: string,
  parentId: string,
  subCollection: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const hash = constraints.map((c) => JSON.stringify({ t: c.type, ...c })).join('|');
  const cacheKey = `${parentCollection}:${parentId}:${subCollection}:q:${hash}`;

  const cached = firebaseCache.get<T[]>(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const ref = collection(getFirebaseDb(), parentCollection, parentId, subCollection);
    const q = query(ref, ...constraints);
    const snap = await getDocs(q);
    const results = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as T);

    firebaseCache.set(cacheKey, results);

    return results;
  } catch (error) {
    throw classifyError(error);
  }
}

/**
 * Create a batch write. Call batch.commit() when done.
 */
export function createBatch() {
  return writeBatch(getFirebaseDb());
}

/**
 * Listen to a document in real-time.
 * Note: For deduplication, prefer listenerManager.listenToDocument().
 * This raw version is kept for backward compatibility.
 */
export function listenToDocument<T>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void,
): Unsubscribe {
  return onSnapshot(
    doc(getFirebaseDb(), collectionName, docId),
    (snap) => {
      const data = snap.exists() ? (snap.data() as T) : null;
      // Keep cache in sync with real-time data
      firebaseCache.set(`${collectionName}:${docId}`, data);
      callback(data);
    },
    (err) => {
      console.warn(`[Firestore] Listen to doc denied (${collectionName}/${docId}):`, err.code, err.message);
      callback(null);
    },
  );
}

/**
 * Listen to a subcollection in real-time.
 * Returns an unsubscribe function.
 */
export function listenToSubCollection<T>(
  parentCollection: string,
  parentId: string,
  subCollection: string,
  constraints: QueryConstraint[],
  callback: (data: T[]) => void,
): Unsubscribe {
  const ref = collection(getFirebaseDb(), parentCollection, parentId, subCollection);
  const q = constraints.length > 0 ? query(ref, ...constraints) : query(ref);

  return onSnapshot(
    q,
    (snap) => {
      const data = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as T);
      callback(data);
    },
    (err) => {
      console.warn(`[Firestore] Listen to subcollection denied (${parentCollection}/${parentId}/${subCollection}):`, err.code, err.message);
      callback([]);
    },
  );
}

/**
 * Check if a document exists.
 * Uses cache when available.
 */
export async function documentExists(
  collectionName: string,
  docId: string,
): Promise<boolean> {
  // Check cache first (if we cached the document, we know it exists)
  const cacheKey = `${collectionName}:${docId}`;
  const cached = firebaseCache.get(cacheKey);
  if (cached !== undefined) return cached !== null;

  try {
    const snap = await getDoc(doc(getFirebaseDb(), collectionName, docId));
    return snap.exists();
  } catch (error) {
    throw classifyError(error);
  }
}

/**
 * Invalidate all cache entries for a specific collection.
 * Call this after batch writes that affect multiple documents.
 */
export function invalidateCollection(collectionName: string): void {
  firebaseCache.invalidatePrefix(`${collectionName}:`);
}
