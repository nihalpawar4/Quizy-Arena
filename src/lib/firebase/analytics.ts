/**
 * Analytics Service
 *
 * Client-side analytics derived from existing Firestore documents.
 * Computes stats from arena_profiles and arena_sessions — minimal
 * new Firestore writes.
 */

import { getDocument, querySubCollection, orderBy, limit } from './firestore';
import { classifyError } from './firebase-error';
import { firebaseCache } from './cache';
import type { ArenaProfileDocument, ArenaSessionDocument } from './types';

export interface PlayerAnalytics {
  gamesPlayed: number;
  totalScore: number;
  averageScore: number;
  highestScore: number;
  averageSessionTimeSec: number;
  totalPlayTimeSec: number;
  favoriteGame: string | null;
  currentStreak: number;
  longestStreak: number;
  brainScore: number;
  globalXpFromArena: number;
}

/**
 * Compute analytics for a player from existing documents.
 * Results are cached for 5 minutes.
 */
export async function getPlayerAnalytics(uid: string): Promise<PlayerAnalytics> {
  const cacheKey = `analytics:${uid}`;
  const cached = firebaseCache.get<PlayerAnalytics>(cacheKey);
  if (cached) return cached;

  try {
    // Load arena profile (has aggregate stats)
    const profile = await getDocument<ArenaProfileDocument>('arena_profiles', uid);

    if (!profile) {
      const empty: PlayerAnalytics = {
        gamesPlayed: 0,
        totalScore: 0,
        averageScore: 0,
        highestScore: 0,
        averageSessionTimeSec: 0,
        totalPlayTimeSec: 0,
        favoriteGame: null,
        currentStreak: 0,
        longestStreak: 0,
        brainScore: 0,
        globalXpFromArena: 0,
      };
      firebaseCache.set(cacheKey, empty);
      return empty;
    }

    // Compute highest score from personal bests (Record<string, number>)
    let highestScore = 0;
    if (profile.personalBests) {
      for (const score of Object.values(profile.personalBests)) {
        if (typeof score === 'number' && score > highestScore) {
          highestScore = score;
        }
      }
    }

    // Load recent sessions to compute average score and find favorite game
    const recentSessions = await querySubCollection<ArenaSessionDocument>(
      'arena_profiles',
      uid,
      'sessions',
      orderBy('playedAt', 'desc'),
      limit(50),
    );

    let totalRecentScore = 0;
    const gamePlayCounts: Record<string, number> = {};

    for (const session of recentSessions) {
      totalRecentScore += session.score ?? 0;
      const slug = session.gameSlug ?? 'unknown';
      gamePlayCounts[slug] = (gamePlayCounts[slug] ?? 0) + 1;
    }

    // Favorite game = most played
    let favoriteGame: string | null = null;
    let maxPlays = 0;
    for (const [slug, count] of Object.entries(gamePlayCounts)) {
      if (count > maxPlays) {
        maxPlays = count;
        favoriteGame = slug;
      }
    }

    const gamesPlayed = profile.gamesPlayed ?? 0;
    const totalPlayTimeSec = profile.totalPlayTimeSec ?? 0;

    const analytics: PlayerAnalytics = {
      gamesPlayed,
      totalScore: totalRecentScore,
      averageScore: recentSessions.length > 0
        ? Math.round(totalRecentScore / recentSessions.length)
        : 0,
      highestScore,
      averageSessionTimeSec: gamesPlayed > 0
        ? Math.round(totalPlayTimeSec / gamesPlayed)
        : 0,
      totalPlayTimeSec,
      favoriteGame,
      currentStreak: profile.arenaStreak ?? 0,
      longestStreak: profile.arenaStreakBest ?? 0,
      brainScore: profile.brainScore ?? 0,
      globalXpFromArena: profile.arenaXp ?? 0,
    };

    firebaseCache.set(cacheKey, analytics, 5 * 60 * 1000);
    return analytics;
  } catch (error) {
    throw classifyError(error);
  }
}
