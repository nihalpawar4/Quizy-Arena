/**
 * Anti-Cheat — Lightweight Session Validation
 *
 * Validates session data before saving.
 * Prevents obvious cheating without overcomplicating.
 */

import type { SavePayload, GameDefinition } from './types';

export interface ValidationResult {
  isValid: boolean;
  reason: string | null;
}

/**
 * Validate a game session before saving.
 */
export function validateSession(
  payload: SavePayload,
  definition: GameDefinition,
): ValidationResult {
  // 1. Score can't exceed max (with 1.7x multiplier for combo/difficulty)
  const maxPossible = definition.difficultyConfig[payload.difficulty].maxScore;
  const absoluteMax = maxPossible * 2.5; // Generous ceiling
  if (payload.score > absoluteMax) {
    return { isValid: false, reason: 'Score exceeds maximum possible' };
  }

  // 2. Duration sanity
  if (payload.durationSec < 2) {
    return { isValid: false, reason: 'Game completed too quickly' };
  }
  if (payload.durationSec > 600) {
    return { isValid: false, reason: 'Game duration exceeds maximum' };
  }

  // 3. XP sanity (capped at 500)
  if (payload.xpEarned > 500) {
    return { isValid: false, reason: 'XP exceeds per-game maximum' };
  }

  // 4. Stars sanity
  if (payload.starsEarned < 0 || payload.starsEarned > 3) {
    return { isValid: false, reason: 'Invalid star count' };
  }

  // 5. Accuracy sanity
  if (payload.accuracy < 0 || payload.accuracy > 100) {
    return { isValid: false, reason: 'Invalid accuracy value' };
  }

  // 6. Answers sanity
  if (payload.correctAnswers < 0 || payload.wrongAnswers < 0) {
    return { isValid: false, reason: 'Negative answer count' };
  }

  return { isValid: true, reason: null };
}

// ── Rate Limiting (client-side) ──

const SESSION_TIMESTAMPS_KEY = 'arena_session_timestamps';
const MAX_GAMES_PER_HOUR = 30;
const MAX_GAMES_PER_DAY = 100;

/**
 * Check if the user has exceeded rate limits.
 */
export function checkRateLimit(): ValidationResult {
  try {
    const raw = localStorage.getItem(SESSION_TIMESTAMPS_KEY);
    const timestamps: number[] = raw ? JSON.parse(raw) : [];
    const now = Date.now();

    // Clean old timestamps (older than 24h)
    const recent = timestamps.filter((t) => now - t < 24 * 60 * 60 * 1000);

    // Check hourly limit
    const lastHour = recent.filter((t) => now - t < 60 * 60 * 1000);
    if (lastHour.length >= MAX_GAMES_PER_HOUR) {
      return { isValid: false, reason: 'Too many games this hour. Take a break!' };
    }

    // Check daily limit
    if (recent.length >= MAX_GAMES_PER_DAY) {
      return { isValid: false, reason: 'Daily game limit reached. Come back tomorrow!' };
    }

    return { isValid: true, reason: null };
  } catch {
    return { isValid: true, reason: null }; // Fail open
  }
}

/**
 * Record a game session timestamp for rate limiting.
 */
export function recordSessionTimestamp(): void {
  try {
    const raw = localStorage.getItem(SESSION_TIMESTAMPS_KEY);
    const timestamps: number[] = raw ? JSON.parse(raw) : [];
    const now = Date.now();

    // Keep only last 24h
    const recent = timestamps.filter((t) => now - t < 24 * 60 * 60 * 1000);
    recent.push(now);

    localStorage.setItem(SESSION_TIMESTAMPS_KEY, JSON.stringify(recent));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get games played today count.
 */
export function getGamesPlayedToday(): number {
  try {
    const raw = localStorage.getItem(SESSION_TIMESTAMPS_KEY);
    const timestamps: number[] = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return timestamps.filter((t) => t >= todayStart.getTime()).length;
  } catch {
    return 0;
  }
}
