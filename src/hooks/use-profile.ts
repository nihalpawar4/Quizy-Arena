'use client';

import { useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { updateDocument, serverTimestamp, documentExists, setDocument } from '@/lib/firebase/firestore';
import { uploadAvatar } from '@/lib/firebase/storage';
import { optimisticUpdate } from '@/lib/firebase/optimistic';
import { classifyError } from '@/lib/firebase/firebase-error';
import type { UserDocument, UserSettings } from '@/lib/firebase/types';

/**
 * Central profile hook — provides mutation functions with optimistic updates.
 *
 * All mutations immediately update the Zustand store (for instant UI feedback),
 * then persist to Firestore in the background. On failure, they roll back
 * to the previous value and show an error toast.
 *
 * Changes automatically sync to Quizy (and any other app) via the
 * shared `users/{uid}` Firestore document + real-time listeners.
 */
export function useProfile() {
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const userProfile = useAuthStore((s) => s.userProfile);
  const setUserProfile = useAuthStore((s) => s.setUserProfile);
  const addToast = useUIStore((s) => s.addToast);

  const uid = firebaseUser?.uid;

  /**
   * Update avatar — shows local blob preview immediately, uploads to Storage,
   * then updates the Firestore avatarUrl field.
   */
  const updateAvatar = useCallback(async (file: File): Promise<boolean> => {
    if (!uid || !userProfile) return false;

    // Create local preview URL for instant feedback
    const localPreviewUrl = URL.createObjectURL(file);

    return optimisticUpdate<UserDocument | null>({
      previousValue: userProfile,
      optimisticValue: { ...userProfile, avatarUrl: localPreviewUrl },
      applyToStore: setUserProfile,
      firebaseWrite: async () => {
        const downloadUrl = await uploadAvatar(uid, file);
        await updateDocument('users', uid, {
          avatarUrl: downloadUrl,
          updatedAt: serverTimestamp(),
        });
        // Update store with the real URL (not the blob)
        setUserProfile({ ...userProfile, avatarUrl: downloadUrl } as UserDocument);
        // Clean up blob URL
        URL.revokeObjectURL(localPreviewUrl);
      },
      successMessage: 'Avatar updated!',
      showSuccess: true,
    });
  }, [uid, userProfile, setUserProfile]);

  /**
   * Update display name — syncs across all Quizy apps.
   */
  const updateDisplayName = useCallback(async (displayName: string): Promise<boolean> => {
    if (!uid || !userProfile) return false;

    return optimisticUpdate<UserDocument | null>({
      previousValue: userProfile,
      optimisticValue: { ...userProfile, displayName },
      applyToStore: setUserProfile,
      firebaseWrite: async () => {
        await updateDocument('users', uid, {
          displayName,
          updatedAt: serverTimestamp(),
        });
      },
      successMessage: 'Display name updated!',
      showSuccess: true,
    });
  }, [uid, userProfile, setUserProfile]);

  /**
   * Update username — validates availability before writing.
   */
  const updateUsername = useCallback(async (username: string): Promise<boolean> => {
    if (!uid || !userProfile) return false;

    // Validate format
    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      addToast({
        message: 'Invalid username',
        description: 'Use 3-20 characters: lowercase letters, numbers, underscores.',
        variant: 'warning',
      });
      return false;
    }

    // Check availability
    try {
      const taken = await documentExists('usernames', username);
      if (taken) {
        addToast({
          message: 'Username taken',
          description: 'Please choose a different username.',
          variant: 'warning',
        });
        return false;
      }
    } catch (err) {
      const classified = classifyError(err);
      addToast({ message: classified.message, variant: 'error' });
      return false;
    }

    return optimisticUpdate<UserDocument | null>({
      previousValue: userProfile,
      optimisticValue: { ...userProfile, username },
      applyToStore: setUserProfile,
      firebaseWrite: async () => {
        // Release old username
        if (userProfile.username) {
          try {
            await updateDocument('usernames', userProfile.username, {});
          } catch {
            // Old username doc may not exist — safe to ignore
          }
        }
        // Claim new username
        await setDocument('usernames', username, {
          uid,
          createdAt: serverTimestamp(),
        });
        // Update user doc
        await updateDocument('users', uid, {
          username,
          updatedAt: serverTimestamp(),
        });
      },
      successMessage: 'Username updated!',
      showSuccess: true,
    });
  }, [uid, userProfile, setUserProfile, addToast]);

  /**
   * Update active profile frame.
   */
  const updateActiveFrame = useCallback(async (frameId: string | null): Promise<boolean> => {
    if (!uid || !userProfile) return false;

    return optimisticUpdate<UserDocument | null>({
      previousValue: userProfile,
      optimisticValue: { ...userProfile, activeFrame: frameId },
      applyToStore: setUserProfile,
      firebaseWrite: async () => {
        await updateDocument('users', uid, {
          activeFrame: frameId,
          updatedAt: serverTimestamp(),
        });
      },
    });
  }, [uid, userProfile, setUserProfile]);

  /**
   * Update active title.
   */
  const updateActiveTitle = useCallback(async (titleId: string | null): Promise<boolean> => {
    if (!uid || !userProfile) return false;

    return optimisticUpdate<UserDocument | null>({
      previousValue: userProfile,
      optimisticValue: { ...userProfile, activeTitle: titleId },
      applyToStore: setUserProfile,
      firebaseWrite: async () => {
        await updateDocument('users', uid, {
          activeTitle: titleId,
          updatedAt: serverTimestamp(),
        });
      },
    });
  }, [uid, userProfile, setUserProfile]);

  /**
   * Update active badges (max 3).
   */
  const updateActiveBadges = useCallback(async (badgeIds: string[]): Promise<boolean> => {
    if (!uid || !userProfile) return false;

    const limitedBadges = badgeIds.slice(0, 3);

    return optimisticUpdate<UserDocument | null>({
      previousValue: userProfile,
      optimisticValue: { ...userProfile, activeBadges: limitedBadges },
      applyToStore: setUserProfile,
      firebaseWrite: async () => {
        await updateDocument('users', uid, {
          activeBadges: limitedBadges,
          updatedAt: serverTimestamp(),
        });
      },
    });
  }, [uid, userProfile, setUserProfile]);

  /**
   * Update user settings — syncs across all Quizy apps.
   */
  const updateSettings = useCallback(async (
    settingsUpdate: Partial<UserSettings>,
  ): Promise<boolean> => {
    if (!uid || !userProfile) return false;

    const newSettings = { ...userProfile.settings, ...settingsUpdate };

    return optimisticUpdate<UserDocument | null>({
      previousValue: userProfile,
      optimisticValue: { ...userProfile, settings: newSettings },
      applyToStore: setUserProfile,
      firebaseWrite: async () => {
        const update: Record<string, unknown> = {
          updatedAt: serverTimestamp(),
        };
        for (const [key, value] of Object.entries(settingsUpdate)) {
          update[`settings.${key}`] = value;
        }
        await updateDocument('users', uid, update);
      },
    });
  }, [uid, userProfile, setUserProfile]);

  return {
    userProfile,
    uid,
    updateAvatar,
    updateDisplayName,
    updateUsername,
    updateActiveFrame,
    updateActiveTitle,
    updateActiveBadges,
    updateSettings,
  };
}
