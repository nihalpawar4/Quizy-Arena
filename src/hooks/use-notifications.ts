'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import {
  listenToNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  archiveOldNotifications,
} from '@/lib/firebase/notifications';
import { classifyError } from '@/lib/firebase/firebase-error';
import { useUIStore } from '@/stores/ui-store';
import type { NotificationDocument } from '@/lib/firebase/types';

/**
 * Hook: real-time notifications via Firestore onSnapshot.
 *
 * Returns notifications, unread count, and mutation functions.
 * Automatically archives old notifications on first load.
 */
export function useNotifications(maxNotifications = 50) {
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const addToast = useUIStore((s) => s.addToast);

  const [notifications, setNotifications] = useState<NotificationDocument[]>([]);
  const [isLoading, setIsLoading] = useState(!!uid);
  const hasArchivedRef = useRef(false);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!uid) return;

    const unsub = listenToNotifications(uid, (data) => {
      setNotifications(data);
      setIsLoading(false);

      // Archive old notifications once per session (cleanup, fire-and-forget)
      if (!hasArchivedRef.current) {
        hasArchivedRef.current = true;
        archiveOldNotifications(uid).catch(() => {
          // Silent fail — cleanup is non-critical
        });
      }
    }, maxNotifications);

    return () => {
      unsub();
    };
  }, [uid, maxNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markRead = useCallback(async (notificationId: string) => {
    if (!uid) return;
    try {
      await markNotificationRead(uid, notificationId);
    } catch (err) {
      const classified = classifyError(err);
      addToast({ message: classified.message, variant: 'error' });
    }
  }, [uid, addToast]);

  const markAllRead = useCallback(async () => {
    if (!uid) return;
    try {
      await markAllNotificationsRead(uid);
      addToast({ message: 'All notifications marked as read', variant: 'success' });
    } catch (err) {
      const classified = classifyError(err);
      addToast({ message: classified.message, variant: 'error' });
    }
  }, [uid, addToast]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markRead,
    markAllRead,
  };
}
