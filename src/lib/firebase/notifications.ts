/**
 * Notifications Service
 *
 * Real-time subcollection listener for user notifications.
 * Notifications live in `users/{uid}/notifications` — shared
 * across Quizy and Arena automatically.
 */

import {
  listenToSubCollection,
  querySubCollection,
  getSubDocRef,
  createBatch,
  orderBy,
  limit,
  where,
} from './firestore';
import { updateDoc, Timestamp } from 'firebase/firestore';
import { classifyError } from './firebase-error';
import type { NotificationDocument } from './types';
import type { Unsubscribe } from 'firebase/firestore';

/**
 * Listen to a user's notifications in real-time via onSnapshot.
 * Returns the latest N notifications, ordered by createdAt desc.
 */
export function listenToNotifications(
  uid: string,
  callback: (notifications: NotificationDocument[]) => void,
  maxNotifications = 50,
): Unsubscribe {
  return listenToSubCollection<NotificationDocument>(
    'users',
    uid,
    'notifications',
    [orderBy('createdAt', 'desc'), limit(maxNotifications)],
    callback,
  );
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(
  uid: string,
  notificationId: string,
): Promise<void> {
  try {
    const ref = getSubDocRef('users', uid, 'notifications', notificationId);
    await updateDoc(ref, { isRead: true });
  } catch (error) {
    throw classifyError(error);
  }
}

/**
 * Mark all unread notifications as read (batched).
 */
export async function markAllNotificationsRead(uid: string): Promise<void> {
  try {
    const unread = await querySubCollection<NotificationDocument>(
      'users',
      uid,
      'notifications',
      where('isRead', '==', false),
    );

    if (unread.length === 0) return;

    const batch = createBatch();
    for (const notif of unread) {
      if (!notif.id) continue;
      const ref = getSubDocRef('users', uid, 'notifications', notif.id);
      batch.update(ref, { isRead: true });
    }
    await batch.commit();
  } catch (error) {
    throw classifyError(error);
  }
}

/**
 * Archive (delete) notifications older than 30 days.
 * Call on sign-in to keep the subcollection lean.
 */
export async function archiveOldNotifications(uid: string): Promise<number> {
  try {
    const thirtyDaysAgo = Timestamp.fromDate(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    );

    const old = await querySubCollection<NotificationDocument>(
      'users',
      uid,
      'notifications',
      where('createdAt', '<', thirtyDaysAgo),
    );

    if (old.length === 0) return 0;

    const batch = createBatch();
    for (const notif of old) {
      if (!notif.id) continue;
      const ref = getSubDocRef('users', uid, 'notifications', notif.id);
      batch.delete(ref);
    }
    await batch.commit();

    return old.length;
  } catch (error) {
    throw classifyError(error);
  }
}

/**
 * Get count of unread notifications (one-time read, not listener).
 */
export async function getUnreadNotificationCount(
  uid: string,
): Promise<number> {
  try {
    const unread = await querySubCollection<NotificationDocument>(
      'users',
      uid,
      'notifications',
      where('isRead', '==', false),
    );
    return unread.length;
  } catch (error) {
    throw classifyError(error);
  }
}
