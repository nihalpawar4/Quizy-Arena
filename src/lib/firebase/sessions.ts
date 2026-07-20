/**
 * Sessions Service
 *
 * Queries game session history for "Continue Playing" and game stats.
 */

import {
  queryDocuments,
  getDocument,
  where,
  orderBy,
  limit,
} from './firestore';
import type { ArenaSessionDocument, ArenaStarDocument } from './types';

export interface RecentGame {
  gameSlug: string;
  bestScore: number;
  lastPlayedAt: Date;
  playCount: number;
  stars: number;
}

/**
 * Get the user's most recently played unique games.
 * Returns up to `maxGames` unique games, sorted by most recent.
 */
export async function getRecentGames(
  uid: string,
  maxGames = 5,
): Promise<RecentGame[]> {
  // Query recent sessions (get more than needed since we deduplicate)
  const sessions = await queryDocuments<ArenaSessionDocument>(
    'arena_sessions',
    where('userId', '==', uid),
    orderBy('playedAt', 'desc'),
    limit(20),
  );

  // Deduplicate by gameSlug, keeping the most recent
  const seen = new Set<string>();
  const uniqueSlugs: string[] = [];

  for (const session of sessions) {
    if (!seen.has(session.gameSlug)) {
      seen.add(session.gameSlug);
      uniqueSlugs.push(session.gameSlug);
      if (uniqueSlugs.length >= maxGames) break;
    }
  }

  // Load star data for each game
  const results: RecentGame[] = [];

  for (const slug of uniqueSlugs) {
    const starDoc = await getDocument<ArenaStarDocument>(
      'arena_stars',
      `${uid}_${slug}`,
    );

    results.push({
      gameSlug: slug,
      bestScore: starDoc?.bestScore ?? 0,
      lastPlayedAt: starDoc?.lastPlayedAt?.toDate() ?? new Date(),
      playCount: starDoc?.playCount ?? 0,
      stars: starDoc?.stars ?? 0,
    });
  }

  return results;
}

/**
 * Get stats for a specific game.
 */
export async function getGameStats(
  uid: string,
  gameSlug: string,
): Promise<ArenaStarDocument | null> {
  return getDocument<ArenaStarDocument>(
    'arena_stars',
    `${uid}_${gameSlug}`,
  );
}
