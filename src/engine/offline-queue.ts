/**
 * Offline Queue
 *
 * Queues game session saves in localStorage when offline.
 * Processes queue when connectivity is restored.
 */

import type { OfflineQueueItem, SavePayload } from './types';

const QUEUE_KEY = 'arena_offline_queue';

/**
 * Add an item to the offline queue.
 */
export function enqueueOffline(data: SavePayload): void {
  try {
    const queue = getQueue();
    const item: OfflineQueueItem = {
      id: data.sessionId,
      timestamp: Date.now(),
      type: 'game_session',
      data,
      isSynced: false,
    };
    queue.push(item);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('[OfflineQueue] Failed to enqueue:', error);
  }
}

/**
 * Get all unsynced items from the queue.
 */
export function getUnsyncedItems(): OfflineQueueItem[] {
  return getQueue().filter((item) => !item.isSynced);
}

/**
 * Mark an item as synced.
 */
export function markSynced(id: string): void {
  try {
    const queue = getQueue();
    const item = queue.find((q) => q.id === id);
    if (item) {
      item.isSynced = true;
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }
  } catch (error) {
    console.error('[OfflineQueue] Failed to mark synced:', error);
  }
}

/**
 * Clean up synced items from the queue (keep queue small).
 */
export function cleanQueue(): void {
  try {
    const queue = getQueue().filter((item) => !item.isSynced);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('[OfflineQueue] Failed to clean:', error);
  }
}

/**
 * Check if an item with this ID already exists (prevents duplicates).
 */
export function isDuplicate(sessionId: string): boolean {
  return getQueue().some((item) => item.id === sessionId);
}

/**
 * Get the full queue from localStorage.
 */
function getQueue(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
