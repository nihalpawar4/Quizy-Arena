/**
 * Save Manager
 *
 * Single save pipeline for every game.
 * Writes to 5 Firestore documents in ONE atomic batch.
 * Falls back to offline queue if network is unavailable.
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
import { getDailyChallengeSlug, getTodayDateKey } from '@/lib/daily-challenge';
import { getUnlockedWorldSlugs } from '@/lib/worlds';

interface SaveInput {
  payload: SavePayload;
  rewards: RewardResult;
  definition: GameDefinition;
}

/**
 * Save a completed game session.
 * Writes to 5 documents in one batch.
 * Falls back to offline queue if offline.
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
      enqueueOffline(payload);
      return true; // Queued successfully
    }
  } else {
    enqueueOffline(payload);
    return true; // Queued successfully
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

      // We don't have the full reward result offline, so we use the payload directly
      // The data was already calculated before queuing
      await writeBatchFromPayload(item.data);
      markSynced(item.id);
      synced++;
    } catch (error) {
      console.warn('[SaveManager] Failed to sync offline item:', item.id, error);
      break; // Stop on first failure, retry later
    }
  }

  cleanQueue();
  return synced;
}

/**
 * Write all 5 documents in ONE atomic Firestore batch.
 */
async function writeBatch(input: SaveInput): Promise<void> {
  const { payload, rewards } = input;
  const batch = createBatch();

  // 1. arena_sessions/{sessionId}
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

  // 2. arena_profiles/{uid}
  const arenaRef = getDocRef('arena_profiles', payload.userId);
  const arenaUpdate: Record<string, unknown> = {
    arenaXp: rewards.newArenaXp,
    arenaLevel: rewards.newArenaLevel,
    brainScore: rewards.newBrainScore,
    gamesPlayed: increment(1),
    totalPlayTimeSec: increment(payload.durationSec),
    lastPlayedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Update streak
  if (rewards.newStreakCount > 0) {
    arenaUpdate.arenaStreak = rewards.newStreakCount;
    // Update best streak if new streak exceeds it
    arenaUpdate.arenaStreakBest = rewards.newStreakCount;
  }

  // Update skill scores
  for (const [skillId, delta] of Object.entries(rewards.skillDeltas)) {
    const fieldName = `skill${skillId.charAt(0).toUpperCase()}${skillId.slice(1)}`;
    arenaUpdate[fieldName] = increment(delta as number);
  }

  // Update personal best
  if (payload.isPersonalBest) {
    arenaUpdate[`personalBests.${payload.gameSlug}`] = payload.score;
  }

  // Daily challenge completion
  const todaySlug = getDailyChallengeSlug();
  if (payload.gameSlug === todaySlug) {
    arenaUpdate.dailyChallengeDate = getTodayDateKey();
    arenaUpdate.dailyChallengeSlug = todaySlug;
  }

  // Sync unlocked worlds with global level
  arenaUpdate.unlockedWorldSlugs = getUnlockedWorldSlugs(rewards.newGlobalLevel);

  // Per-game level progress (1–3)
  if (payload.metadata?.levelCompleted === true && typeof payload.metadata.highestLevel === 'number') {
    arenaUpdate[`gameLevels.${payload.gameSlug}`] = payload.metadata.highestLevel;
  }

  batch.update(arenaRef, arenaUpdate);

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

  // 4. users/{uid}
  const userRef = getDocRef('users', payload.userId);
  batch.update(userRef, {
    globalXp: rewards.newGlobalXp,
    globalLevel: rewards.newGlobalLevel,
    coins: increment(payload.coinsEarned),
    diamonds: increment(payload.diamondsEarned),
    // Also update Quizy-compatible xp field
    xp: increment(payload.xpEarned),
    updatedAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  });

  // 5. arena_mission_progress/{uid}_{date}
  const today = new Date().toISOString().split('T')[0];
  const missionRef = getDocRef('arena_mission_progress', `${payload.userId}_${today}`);
  batch.set(
    missionRef,
    {
      userId: payload.userId,
      date: today,
      [`missions.play_game.currentValue`]: increment(1),
      [`missions.earn_xp.currentValue`]: increment(payload.xpEarned),
    },
    { merge: true } as never,
  );

  await batch.commit();
}

/**
 * Simplified batch write for offline queue items (no RewardResult available).
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

  // Increment arena profile stats
  const arenaRef = getDocRef('arena_profiles', payload.userId);
  batch.update(arenaRef, {
    arenaXp: increment(payload.xpEarned),
    gamesPlayed: increment(1),
    totalPlayTimeSec: increment(payload.durationSec),
    lastPlayedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Increment user coins/xp
  const userRef = getDocRef('users', payload.userId);
  batch.update(userRef, {
    globalXp: increment(payload.xpEarned),
    coins: increment(payload.coinsEarned),
    diamonds: increment(payload.diamondsEarned),
    xp: increment(payload.xpEarned),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}
