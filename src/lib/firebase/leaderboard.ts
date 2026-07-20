/**
 * Leaderboard Service
 *
 * Queries user collection for leaderboard data.
 * Sorted by globalXp descending.
 */

import {
  queryDocuments,
  where,
  orderBy,
  limit,
} from './firestore';
import type { UserDocument } from './types';

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  globalXp: number;
  globalLevel: number;
  rank: number;
}

/**
 * Get the global leaderboard (top N users by XP).
 */
export async function getGlobalLeaderboard(
  maxEntries = 10,
): Promise<LeaderboardEntry[]> {
  const users = await queryDocuments<UserDocument>(
    'users',
    orderBy('globalXp', 'desc'),
    limit(maxEntries),
  );

  return users.map((user, index) => ({
    uid: user.uid,
    displayName: user.displayName || 'Player',
    username: user.username || '',
    avatarUrl: user.avatarUrl ?? null,
    globalXp: user.globalXp ?? 0,
    globalLevel: user.globalLevel ?? 1,
    rank: index + 1,
  }));
}

/**
 * Get rank position for a specific user.
 * Counts how many users have more XP.
 */
export async function getUserRankPosition(
  userXp: number,
): Promise<number> {
  // Count users with higher XP
  const higherUsers = await queryDocuments<UserDocument>(
    'users',
    where('globalXp', '>', userXp),
  );

  return higherUsers.length + 1;
}
