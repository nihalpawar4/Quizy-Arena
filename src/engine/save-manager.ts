/**
 * Save Manager
 *
 * Single save pipeline for every game.
 * Writes game data to Firestore using atomic operations where possible.
 * Falls back to offline queue if network is unavailable.
 *
 * Uses set() with merge:true for safety (documents may not exist yet).
 * Uses increment() for all numeric accumulating fields.
 * Syncs 10% of arena XP to the Quizy user profile.
 */

import type { SavePayload, RewardResult, GameDefinition } from './types';
import type { SkillId } from '@/lib/constants';
import {
  createBatch,
  getDocRef,
  serverTimestamp,
  increment,
} from '@/lib/firebase/firestore';
import { enqueueOffline, getUnsyncedItems, markSynced, cleanQueue, isDuplicate } from './offline-queue';
import { validateSession, recordSessionTimestamp } from './anti-cheat';
import { getUnlockedWorldSlugs } from '@/lib/worlds';

interface SaveInput {
  payload: SavePayload;
  rewards: RewardResult;
  definition: GameDefinition;
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
  if (navigator.onLine) {
    try {
      await writeBatch(input);
      return true;
    } catch (error) {
      console.warn('[SaveManager] Online save failed, queuing offline:', error);
      try {
        enqueueOffline(payload);
      } catch (e) {
        console.error('[SaveManager] Failed to queue offline:', e);
      }
      return true;
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
 * Write all critical documents in ONE atomic Firestore batch.
 * Uses set() with merge:true to safely handle documents that might not exist.
 * Uses increment() for all accumulating numeric fields.
 */
async function writeBatch(input: SaveInput): Promise<void> {
  const { payload, rewards } = input;
  const batch = createBatch();

  // 1. arena_sessions/{sessionId} — always a new document
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

  // 2. arena_profiles/{uid} — use set+merge for safety, increment for accumulators
  const arenaRef = getDocRef('arena_profiles', payload.userId);
  const levelCompleted = payload.metadata?.levelCompleted === true;
  const prevHighest = (payload.metadata?.highestLevel as number) ?? 0;

  const arenaData: Record<string, unknown> = {
    uid: payload.userId,
    arenaXp: increment(rewards.xpEarned),
    arenaLevel: rewards.newArenaLevel,
    brainScore: rewards.newBrainScore,
    gamesPlayed: increment(1),
    totalPlayTimeSec: increment(payload.durationSec),
    lastPlayedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Track wins
  if (levelCompleted) {
    arenaData.gamesWon = increment(1);
  }

  // Update streak
  if (rewards.newStreakCount > 0) {
    arenaData.arenaStreak = rewards.newStreakCount;
  }

  // Update skill scores using increment
  for (const [skillId, delta] of Object.entries(rewards.skillDeltas)) {
    const fieldName = `skill${skillId.charAt(0).toUpperCase()}${skillId.slice(1)}`;
    arenaData[fieldName] = increment(delta as number);
  }

  // Update personal best
  if (payload.isPersonalBest) {
    arenaData[`personalBests.${payload.gameSlug}`] = payload.score;
  }

  // Per-game level progress
  if (levelCompleted && prevHighest > 0) {
    arenaData[`gameLevels.${payload.gameSlug}`] = prevHighest;
  }

  // Sync unlocked worlds
  arenaData.unlockedWorldSlugs = getUnlockedWorldSlugs(rewards.newGlobalLevel);

  batch.set(arenaRef, arenaData, { merge: true } as never);

  // 3. arena_stars/{uid}_{gameSlug}
  const starsRef = getDocRef('arena_stars', `${payload.userId}_${payload.gameSlug}`);
  const starsData: Record<string, unknown> = {
    userId: payload.userId,
    gameId: payload.gameSlug,
    playCount: increment(1),
    lastPlayedAt: serverTimestamp(),
  };
  if (payload.isPersonalBest) {
    starsData.stars = payload.starsEarned;
    starsData.bestScore = payload.score;
  }
  batch.set(starsRef, starsData, { merge: true } as never);

  // 4. users/{uid} — update coins, diamonds, globalXp, and 10% arena XP sync
  const quizyXpSync = Math.floor(rewards.newArenaXp * 0.1);
  const userRef = getDocRef('users', payload.userId);
  batch.set(userRef, {
    globalXp: rewards.newGlobalXp,
    globalLevel: rewards.newGlobalLevel,
    coins: increment(payload.coinsEarned),
    diamonds: increment(payload.diamondsEarned),
    xp: quizyXpSync, // 10% of lifetime arena XP for Quizy profile
    updatedAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  }, { merge: true } as never);

  await batch.commit();
}

/**
 * Simplified batch write for offline queue items.
 */
async function writeBatchFromPayload(payload: SavePayload): Promise<void> {
  const batch = createBatch();

  // Session document
  const sessionRef = getDocRef('arena_sessions', payload.sessionId);
  batch.set(sessionRef, {
    userId: payload.userId,
    gameId: payload.gameSlug,
    gameSlug: payload.gameSlug,
    score: payload.score,
    accuracy: payload.accuracy,
    durationSec: payload.durationSec,
    xpEarned: payload.xpEarned,
    coinsEarned: payload.coinsEarned,
    starsEarned: payload.starsEarned,
    difficulty: payload.difficulty,
    isPersonalBest: payload.isPersonalBest,
    skillPointsAwarded: payload.skillDeltas,
    metadata: payload.metadata,
    playedAt: serverTimestamp(),
  });

  // Arena profile — use set+merge and increment
  const arenaRef = getDocRef('arena_profiles', payload.userId);
  const arenaOffline: Record<string, unknown> = {
    uid: payload.userId,
    arenaXp: increment(payload.xpEarned),
    gamesPlayed: increment(1),
    totalPlayTimeSec: increment(payload.durationSec),
    lastPlayedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (payload.metadata?.levelCompleted === true) {
    arenaOffline.gamesWon = increment(1);
  }

  for (const [skillId, delta] of Object.entries(payload.skillDeltas)) {
    const fieldName = `skill${skillId.charAt(0).toUpperCase()}${skillId.slice(1)}`;
    arenaOffline[fieldName] = increment(delta as number);
  }

  if (payload.metadata?.levelCompleted === true && typeof payload.metadata?.highestLevel === 'number') {
    arenaOffline[`gameLevels.${payload.gameSlug}`] = payload.metadata.highestLevel;
  }

  batch.set(arenaRef, arenaOffline, { merge: true } as never);

  // User coins/xp — use set+merge and increment
  const userRef = getDocRef('users', payload.userId);
  batch.set(userRef, {
    globalXp: increment(payload.xpEarned),
    coins: increment(payload.coinsEarned),
    diamonds: increment(payload.diamondsEarned),
    xp: increment(Math.floor(payload.xpEarned * 0.1)),
    updatedAt: serverTimestamp(),
  }, { merge: true } as never);

  await batch.commit();
}
