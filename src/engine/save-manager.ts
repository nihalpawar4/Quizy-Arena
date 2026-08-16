/**
 * Save Manager
 *
 * Single save pipeline for every game.
 * Atomically updates user profile, arena profile, game levels, XP, coins, and skills.
 *
 * Uses `set` with `{ merge: true }` and explicit map objects for `gameLevels` and `personalBests`
 * so nested properties merge safely regardless of whether the profile document already existed.
 */

import type { SavePayload, RewardResult, GameDefinition } from './types';
import type { SkillId } from '@/lib/constants';
import {
  createBatch,
  getDocRef,
  serverTimestamp,
  increment,
  documentExists,
  setDocument,
  updateDocument,
  invalidateCollection,
} from '@/lib/firebase/firestore';
import { skillIdToArenaField } from '@/lib/firebase/skill-fields';
import { QUIZY_XP_SHARE } from '@/lib/game-economy';
import { enqueueOffline, getUnsyncedItems, markSynced, cleanQueue, isDuplicate } from './offline-queue';
import { validateSession, recordSessionTimestamp } from './anti-cheat';
import { getUnlockedWorldSlugs } from '@/lib/worlds';
import { createArenaProfile } from '@/lib/firebase/arena-profile';
import {
  getDailyChallengeSlug,
  getTodayDateKey,
  DAILY_CHALLENGE_LEVELS_REQUIRED,
} from '@/lib/daily-challenge';

interface SaveInput {
  payload: SavePayload;
  rewards: RewardResult;
  definition: GameDefinition;
  /** Current gameLevels from arena profile for world-unlock projection */
  currentGameLevels?: Record<string, number>;
}

/**
 * Save a completed game session.
 * Returns true if saved or queued successfully.
 */
export async function saveGameSession(input: SaveInput): Promise<boolean> {
  const { payload, rewards, definition } = input;

  // Validate session
  const validation = validateSession(payload, definition);
  if (!validation.isValid) {
    console.warn('[SaveManager] Invalid session:', validation.reason);
    return false;
  }

  // Prevent duplicate saves
  if (isDuplicate(payload.sessionId)) {
    console.warn('[SaveManager] Duplicate session:', payload.sessionId);
    return false;
  }

  // Record for rate limiting
  recordSessionTimestamp();

  // Try online save
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      await writeBatch(input);
      return true;
    } catch (error) {
      console.warn('[SaveManager] Online batch save failed, falling back to individual writes:', error);
      try {
        await fallbackSave(input);
        return true;
      } catch (fbErr) {
        console.warn('[SaveManager] Fallback save failed, queuing offline:', fbErr);
        enqueueOffline(payload);
        return true;
      }
    }
  } else {
    enqueueOffline(payload);
    return true;
  }
}

/**
 * Process the offline queue (call on reconnect).
 */
export async function processOfflineQueue(
  getDefinition: (slug: string) => GameDefinition | undefined,
): Promise<number> {
  const items = getUnsyncedItems();
  if (items.length === 0) return 0;

  let synced = 0;

  for (const item of items) {
    try {
      const definition = getDefinition(item.data.gameSlug);
      if (!definition) continue;

      await writeBatchFromPayload(item.data);
      markSynced(item.id);
      synced++;
    } catch (error) {
      console.warn('[SaveManager] Failed to sync offline item:', item.id, error);
      break;
    }
  }

  cleanQueue();
  return synced;
}

/**
 * Write all critical documents in ONE atomic Firestore batch using set(..., { merge: true }).
 */
async function writeBatch(input: SaveInput): Promise<void> {
  const { payload, rewards } = input;

  // Ensure arena_profile exists first
  const hasArenaProfile = await documentExists('arena_profiles', payload.userId);
  if (!hasArenaProfile) {
    await createArenaProfile(payload.userId, rewards.newGlobalXp);
  }

  const batch = createBatch();
  const levelCompleted = payload.metadata?.levelCompleted === true;
  const highestLevel = (payload.metadata?.highestLevel as number) ?? payload.level;

  // Project gameLevels as they will be after this save, for world-unlock gating
  const projectedGameLevels: Record<string, number> = {
    ...(input.currentGameLevels ?? {}),
  };
  if (levelCompleted && highestLevel >= 1) {
    projectedGameLevels[payload.gameSlug] = Math.max(
      projectedGameLevels[payload.gameSlug] ?? 0,
      highestLevel,
    );
  }

  // 1. arena_profiles/{uid}
  const arenaRef = getDocRef('arena_profiles', payload.userId);
  const arenaUpdate: Record<string, unknown> = {
    uid: payload.userId,
    arenaXp: increment(rewards.xpEarned),
    arenaLevel: rewards.newArenaLevel,
    brainScore: rewards.newBrainScore,
    gamesPlayed: increment(1),
    totalPlayTimeSec: increment(payload.durationSec),
    lastPlayedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    unlockedWorldSlugs: getUnlockedWorldSlugs(projectedGameLevels),
  };

  if (levelCompleted) {
    arenaUpdate.gamesWon = increment(1);
    if (highestLevel >= 1) {
      arenaUpdate[`gameLevels.${payload.gameSlug}`] = highestLevel;
    }

    // Daily challenge completion: if this game is today's daily slug
    // and the player just completed the required number of levels
    const todayDailySlug = getDailyChallengeSlug();
    if (
      payload.gameSlug === todayDailySlug &&
      highestLevel >= DAILY_CHALLENGE_LEVELS_REQUIRED
    ) {
      arenaUpdate.dailyChallengeDate = getTodayDateKey();
      arenaUpdate.dailyChallengeSlug = todayDailySlug;
    }
  }

  if (rewards.newStreakCount > 0) {
    arenaUpdate.arenaStreak = rewards.newStreakCount;
  }

  for (const [skillId, delta] of Object.entries(rewards.skillDeltas)) {
    const fieldName = skillIdToArenaField(skillId);
    arenaUpdate[fieldName] = increment(delta as number);
  }

  if (payload.isPersonalBest) {
    arenaUpdate[`personalBests.${payload.gameSlug}`] = payload.score;
  }

  // Use batch.update (not set+merge) so dot-notation field paths like
  // 'gameLevels.speed-math' are resolved as nested updates, not literal keys.
  // The document is guaranteed to exist (checked above on line 121–124).
  batch.update(arenaRef, arenaUpdate);

  // 2. users/{uid} — update coins, diamonds, globalXp, globalLevel, and 10% arena XP sync
  const quizyXpEarned = Math.floor(rewards.xpEarned * QUIZY_XP_SHARE);
  const userRef = getDocRef('users', payload.userId);
  const userUpdate: Record<string, unknown> = {
    globalXp: rewards.newGlobalXp,
    globalLevel: rewards.newGlobalLevel,
    coins: increment(payload.coinsEarned),
    diamonds: increment(payload.diamondsEarned),
    xp: increment(quizyXpEarned),
    updatedAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  };

  batch.set(userRef, userUpdate, { merge: true });

  // 3. arena_sessions/{sessionId} — session log
  const sessionRef = getDocRef('arena_sessions', payload.sessionId);
  batch.set(sessionRef, {
    userId: payload.userId,
    gameId: payload.gameSlug,
    gameSlug: payload.gameSlug,
    level: payload.level,
    score: payload.score,
    accuracy: payload.accuracy,
    durationSec: payload.durationSec,
    xpEarned: payload.xpEarned,
    coinsEarned: payload.coinsEarned,
    starsEarned: payload.starsEarned,
    difficulty: payload.difficulty,
    isPersonalBest: payload.isPersonalBest,
    skillPointsAwarded: payload.skillDeltas,
    correctAnswers: payload.correctAnswers,
    wrongAnswers: payload.wrongAnswers,
    maxCombo: payload.maxCombo,
    metadata: payload.metadata,
    playedAt: serverTimestamp(),
  });

  await batch.commit();

  // Invalidate caches so real-time listeners and subsequent reads see updated data
  invalidateCollection('arena_profiles');
  invalidateCollection('users');
  invalidateCollection('arena_sessions');
}

/**
 * Fallback save logic: updates individual documents if batch write fails.
 */
async function fallbackSave(input: SaveInput): Promise<void> {
  const { payload, rewards } = input;
  const levelCompleted = payload.metadata?.levelCompleted === true;
  const highestLevel = (payload.metadata?.highestLevel as number) ?? payload.level;

  // 1. Update arena_profiles
  const projectedGameLevels: Record<string, number> = {
    ...(input.currentGameLevels ?? {}),
  };
  if (levelCompleted && highestLevel >= 1) {
    projectedGameLevels[payload.gameSlug] = Math.max(
      projectedGameLevels[payload.gameSlug] ?? 0,
      highestLevel,
    );
  }

  const arenaUpdate: Record<string, unknown> = {
    uid: payload.userId,
    arenaXp: increment(rewards.xpEarned),
    arenaLevel: rewards.newArenaLevel,
    brainScore: rewards.newBrainScore,
    gamesPlayed: increment(1),
    totalPlayTimeSec: increment(payload.durationSec),
    lastPlayedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    unlockedWorldSlugs: getUnlockedWorldSlugs(projectedGameLevels),
  };

  if (levelCompleted) {
    arenaUpdate.gamesWon = increment(1);
    if (highestLevel >= 1) {
      arenaUpdate[`gameLevels.${payload.gameSlug}`] = highestLevel;
    }
  }

  for (const [skillId, delta] of Object.entries(rewards.skillDeltas)) {
    const fieldName = skillIdToArenaField(skillId);
    arenaUpdate[fieldName] = increment(delta as number);
  }

  if (payload.isPersonalBest) {
    arenaUpdate[`personalBests.${payload.gameSlug}`] = payload.score;
  }

  await updateDocument('arena_profiles', payload.userId, arenaUpdate);

  const quizyXpEarned = Math.floor(rewards.xpEarned * QUIZY_XP_SHARE);
  await setDocument('users', payload.userId, {
    globalXp: rewards.newGlobalXp,
    globalLevel: rewards.newGlobalLevel,
    coins: increment(payload.coinsEarned),
    diamonds: increment(payload.diamondsEarned),
    xp: increment(quizyXpEarned),
    updatedAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  }, { merge: true });

  // Invalidate caches for real-time updates
  invalidateCollection('arena_profiles');
  invalidateCollection('users');
}

/**
 * Simplified batch write for offline queue items.
 */
async function writeBatchFromPayload(payload: SavePayload): Promise<void> {
  const levelCompleted = payload.metadata?.levelCompleted === true;
  const highestLevel = (payload.metadata?.highestLevel as number) ?? payload.level;

  const arenaUpdate: Record<string, unknown> = {
    uid: payload.userId,
    arenaXp: increment(payload.xpEarned),
    gamesPlayed: increment(1),
    totalPlayTimeSec: increment(payload.durationSec),
    lastPlayedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (levelCompleted) {
    arenaUpdate.gamesWon = increment(1);
    if (highestLevel >= 1) {
      // Use dot-notation so Firestore updates only this game's level
      // instead of replacing the entire gameLevels map
      arenaUpdate[`gameLevels.${payload.gameSlug}`] = highestLevel;
    }
  }

  for (const [skillId, delta] of Object.entries(payload.skillDeltas)) {
    const fieldName = skillIdToArenaField(skillId);
    arenaUpdate[fieldName] = increment(delta as number);
  }

  await updateDocument('arena_profiles', payload.userId, arenaUpdate);

  await setDocument('users', payload.userId, {
    globalXp: increment(Math.floor(payload.xpEarned * QUIZY_XP_SHARE)),
    coins: increment(payload.coinsEarned),
    diamonds: increment(payload.diamondsEarned),
    xp: increment(Math.floor(payload.xpEarned * QUIZY_XP_SHARE)),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
