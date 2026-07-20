/**
 * Rewards Service
 *
 * Daily gift claiming, chest opening, and reward queries.
 * All reward operations are idempotent — no duplicate claims.
 */

import {
  getDocument,
  updateDocument,
  queryDocuments,
  serverTimestamp,
  increment,
  where,
  orderBy,
  Timestamp,
} from './firestore';
import type { ArenaChestDocument, UserDocument } from './types';

// ── Daily Gift ──

interface DailyGiftResult {
  coins: number;
  diamonds: number;
  streakDay: number;
}

/**
 * Base daily gift rewards, increasing with consecutive days.
 */
const DAILY_GIFT_TABLE = [
  { coins: 50, diamonds: 0 },   // Day 1
  { coins: 75, diamonds: 0 },   // Day 2
  { coins: 100, diamonds: 1 },  // Day 3
  { coins: 100, diamonds: 0 },  // Day 4
  { coins: 150, diamonds: 1 },  // Day 5
  { coins: 150, diamonds: 2 },  // Day 6
  { coins: 250, diamonds: 3 },  // Day 7 (weekly bonus)
];

/**
 * Check if the user can claim today's daily gift.
 */
export function canClaimDailyGift(lastClaimAt: Timestamp | null | undefined): boolean {
  if (!lastClaimAt) return true;

  const lastClaim = lastClaimAt.toDate();
  const now = new Date();

  // Reset at midnight local time
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return lastClaim < todayStart;
}

/**
 * Get the current daily gift streak day (1-7, resets after 7).
 */
export function getDailyGiftStreakDay(
  consecutiveDays: number,
): number {
  return (consecutiveDays % 7) + 1;
}

/**
 * Claim today's daily gift.
 * Returns the rewards, or null if already claimed today.
 */
export async function claimDailyGift(uid: string): Promise<DailyGiftResult | null> {
  // Load the user's current state
  const user = await getDocument<UserDocument & {
    lastDailyClaimAt?: Timestamp;
    dailyClaimStreak?: number;
  }>('users', uid);

  if (!user) return null;

  // Check if already claimed today
  if (!canClaimDailyGift(user.lastDailyClaimAt)) {
    return null;
  }

  // Calculate streak
  let streak = user.dailyClaimStreak ?? 0;

  // Check if streak continues (claimed yesterday)
  if (user.lastDailyClaimAt) {
    const lastClaim = user.lastDailyClaimAt.toDate();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);

    if (lastClaim >= yesterdayStart && lastClaim < yesterdayEnd) {
      streak++; // Continuing streak
    } else {
      streak = 0; // Streak broken, restart
    }
  }

  const streakDay = getDailyGiftStreakDay(streak);
  const gift = DAILY_GIFT_TABLE[streakDay - 1];

  // Award the gift
  const updateData: Record<string, unknown> = {
    coins: increment(gift.coins),
    lastDailyClaimAt: serverTimestamp(),
    dailyClaimStreak: streak,
    updatedAt: serverTimestamp(),
  };

  if (gift.diamonds > 0) {
    updateData.diamonds = increment(gift.diamonds);
  }

  await updateDocument('users', uid, updateData);

  return {
    coins: gift.coins,
    diamonds: gift.diamonds,
    streakDay,
  };
}

// ── Chests ──

/**
 * Get the user's unopened chests.
 */
export async function getUnopenedChests(uid: string): Promise<ArenaChestDocument[]> {
  return queryDocuments<ArenaChestDocument>(
    'arena_chests',
    where('userId', '==', uid),
    where('isOpened', '==', false),
    orderBy('earnedAt', 'desc'),
  );
}

/**
 * Open a chest and reveal its contents.
 * Returns the chest contents, or null if already opened.
 */
export async function openChest(
  uid: string,
  chestId: string,
): Promise<ArenaChestDocument['contents'] | null> {
  const chest = await getDocument<ArenaChestDocument>('arena_chests', chestId);

  if (!chest || chest.userId !== uid || chest.isOpened) {
    return null;
  }

  // Mark chest as opened
  await updateDocument('arena_chests', chestId, {
    isOpened: true,
    openedAt: serverTimestamp(),
  });

  // Award contents to user
  let coinReward = 0;
  let diamondReward = 0;
  let xpReward = 0;

  for (const item of chest.contents) {
    switch (item.type) {
      case 'coins':
        coinReward += Number(item.value);
        break;
      case 'diamonds':
        diamondReward += Number(item.value);
        break;
      case 'xp':
        xpReward += Number(item.value);
        break;
      case 'badge':
        // Add badge to user's collection
        // Handled separately
        break;
    }
  }

  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (coinReward > 0) updateData.coins = increment(coinReward);
  if (diamondReward > 0) updateData.diamonds = increment(diamondReward);
  if (xpReward > 0) updateData.globalXp = increment(xpReward);

  if (Object.keys(updateData).length > 1) {
    await updateDocument('users', uid, updateData);
  }

  return chest.contents;
}

// ── Lucky Wheel ──

export interface WheelSegment {
  label: string;
  type: 'coins' | 'diamonds' | 'xp';
  value: number;
  color: string;
}

export const WHEEL_SEGMENTS: WheelSegment[] = [
  { label: '25 Coins', type: 'coins', value: 25, color: '#F59E0B' },
  { label: '50 Coins', type: 'coins', value: 50, color: '#FBBF24' },
  { label: '1 Diamond', type: 'diamonds', value: 1, color: '#60A5FA' },
  { label: '75 Coins', type: 'coins', value: 75, color: '#F59E0B' },
  { label: '50 XP', type: 'xp', value: 50, color: '#8B5CF6' },
  { label: '100 Coins', type: 'coins', value: 100, color: '#FBBF24' },
  { label: '2 Diamonds', type: 'diamonds', value: 2, color: '#3B82F6' },
  { label: '150 Coins', type: 'coins', value: 150, color: '#F59E0B' },
];

export function canSpinWheel(lastSpinAt: Timestamp | null | undefined): boolean {
  if (!lastSpinAt) return true;
  const lastSpin = lastSpinAt.toDate();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return lastSpin < todayStart;
}

export interface WheelSpinResult {
  segmentIndex: number;
  segment: WheelSegment;
}

/**
 * Spin the lucky wheel — one free spin per day.
 */
export async function spinLuckyWheel(uid: string): Promise<WheelSpinResult | null> {
  const user = await getDocument<UserDocument>('users', uid);
  if (!user || !canSpinWheel(user.lastWheelSpinAt)) return null;

  // Weighted random — coins most common
  const weights = [20, 18, 8, 15, 12, 10, 5, 12];
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  let segmentIndex = 0;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) {
      segmentIndex = i;
      break;
    }
  }

  const segment = WHEEL_SEGMENTS[segmentIndex];
  const updateData: Record<string, unknown> = {
    lastWheelSpinAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (segment.type === 'coins') {
    updateData.coins = increment(segment.value);
  } else if (segment.type === 'diamonds') {
    updateData.diamonds = increment(segment.value);
  } else if (segment.type === 'xp') {
    updateData.globalXp = increment(segment.value);
    updateData.xp = increment(segment.value);
  }

  await updateDocument('users', uid, updateData);

  return { segmentIndex, segment };
}
