/**
 * Settings Service
 *
 * Persists user preferences to Firebase.
 * Changes sync across Quizy + Arena automatically.
 */

import {
  updateDocument,
  serverTimestamp,
} from './firestore';

/**
 * Update a single setting field.
 */
export async function updateSetting(
  uid: string,
  key: string,
  value: unknown,
): Promise<void> {
  await updateDocument('users', uid, {
    [`settings.${key}`]: value,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update multiple settings at once.
 */
export async function updateSettings(
  uid: string,
  settings: Record<string, unknown>,
): Promise<void> {
  const update: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  for (const [key, value] of Object.entries(settings)) {
    update[`settings.${key}`] = value;
  }
  await updateDocument('users', uid, update);
}

/**
 * Update the user's display name (syncs across all apps).
 */
export async function updateDisplayName(
  uid: string,
  displayName: string,
): Promise<void> {
  await updateDocument('users', uid, {
    displayName,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update the user's theme preference (syncs across all apps).
 */
export async function updateThemePreference(
  uid: string,
  theme: 'light' | 'dark' | 'system',
): Promise<void> {
  await updateSetting(uid, 'theme', theme);
}
