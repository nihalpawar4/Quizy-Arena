/**
 * Keeps Arena in sync with the shared Quizy ecosystem user document.
 * Same Firebase Auth email → same users/{uid} doc → XP, coins, profile sync in real time.
 */

import { getDocument, updateDocument, documentExists, serverTimestamp } from './firestore';
import type { UserDocument } from './types';
import { createArenaProfile } from './arena-profile';
import { levelFromXp } from '@/lib/xp';
import { getUnlockedWorldSlugs } from '@/lib/worlds';

export async function syncEcosystemOnLogin(
  uid: string,
  opts: { email?: string | null; displayName?: string | null; photoURL?: string | null },
): Promise<void> {
  let user = await getDocument<UserDocument>('users', uid);

  if (!user) {
    return;
  }

  const legacyXp = user.xp ?? 0;
  const mergedGlobalXp = Math.max(user.globalXp ?? 0, legacyXp);
  const mergedLevel = levelFromXp(mergedGlobalXp);

  const userUpdates: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  };

  if (mergedGlobalXp !== (user.globalXp ?? 0)) {
    userUpdates.globalXp = mergedGlobalXp;
    userUpdates.globalLevel = mergedLevel;
  }

  const displayName =
    user.displayName ||
    user.name ||
    opts.displayName ||
    'Player';
  if (!user.displayName && displayName) {
    userUpdates.displayName = displayName;
  }

  const avatar = user.avatarUrl || user.photoURL || opts.photoURL || null;
  if (!user.avatarUrl && avatar) {
    userUpdates.avatarUrl = avatar;
  }

  if (Object.keys(userUpdates).length > 2) {
    await updateDocument('users', uid, userUpdates);
    user = { ...user, ...userUpdates } as UserDocument;
  }

  const hasArena = await documentExists('arena_profiles', uid);
  if (!hasArena) {
    await createArenaProfile(uid, mergedGlobalXp);
    return;
  }

  await updateDocument('arena_profiles', uid, {
    unlockedWorldSlugs: getUnlockedWorldSlugs(),
    updatedAt: serverTimestamp(),
  });
}
