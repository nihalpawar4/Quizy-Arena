/**
 * Daily Challenge — rotates by day of week, tracks completion.
 */

export const DAILY_CHALLENGE_GAMES = ['memory-match', 'speed-math', 'pattern-recall'] as const;

export type DailyChallengeSlug = (typeof DAILY_CHALLENGE_GAMES)[number];

export function getTodayDateKey(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDailyChallengeSlug(date = new Date()): DailyChallengeSlug {
  const idx = date.getDay() % DAILY_CHALLENGE_GAMES.length;
  return DAILY_CHALLENGE_GAMES[idx];
}

export function getHoursUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(1, Math.ceil((midnight.getTime() - now.getTime()) / 3600000));
}

export function isDailyChallengeCompleted(
  completedDate: string | null | undefined,
  completedSlug: string | null | undefined,
  date = new Date(),
): boolean {
  if (!completedDate || !completedSlug) return false;
  const todaySlug = getDailyChallengeSlug(date);
  return completedDate === getTodayDateKey() && completedSlug === todaySlug;
}

export const DAILY_CHALLENGE_REWARDS = {
  xp: 100,
  coins: 25,
} as const;
