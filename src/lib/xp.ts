/**
 * XP & Level Calculation System
 *
 * Global XP = Arena XP + Quizy XP (stored on user doc)
 * Arena XP = XP earned only in Arena (stored on arena_profiles doc)
 *
 * Level curve: xpForLevel(n) = floor(100 * n^1.3)
 */

/**
 * XP required to reach a specific level (from level n-1 to n).
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level, 1.3));
}

/**
 * Total cumulative XP required to reach a level.
 */
export function cumulativeXpForLevel(level: number): number {
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

/**
 * Calculate level from total XP.
 */
export function levelFromXp(totalXp: number): number {
  let level = 1;
  let accumulated = 0;

  while (true) {
    const nextRequired = xpForLevel(level + 1);
    if (accumulated + nextRequired > totalXp) break;
    accumulated += nextRequired;
    level++;
  }

  return level;
}

/**
 * Get XP progress within the current level (0 to 1).
 */
export function xpProgress(totalXp: number): number {
  const level = levelFromXp(totalXp);
  const currentLevelStart = cumulativeXpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const xpIntoLevel = totalXp - currentLevelStart;

  if (nextLevelXp === 0) return 1;
  return Math.min(xpIntoLevel / nextLevelXp, 1);
}

/**
 * Get XP remaining to next level.
 */
export function xpToNextLevel(totalXp: number): number {
  const level = levelFromXp(totalXp);
  const currentLevelStart = cumulativeXpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  return nextLevelXp - (totalXp - currentLevelStart);
}

/**
 * Calculate XP earned from a game session.
 */
export function calculateGameXp(params: {
  baseXp: number;
  score: number;
  maxScore: number;
  streakDays: number;
  isPersonalBest: boolean;
}): number {
  const { baseXp, score, maxScore, streakDays, isPersonalBest } = params;

  // Performance multiplier (0.5x to 2.0x)
  const performance = maxScore > 0 ? score / maxScore : 0.5;
  const performanceMultiplier = 0.5 + performance * 1.5;

  // Streak bonus
  let streakMultiplier = 1;
  if (streakDays >= 30) streakMultiplier = 1.5;
  else if (streakDays >= 7) streakMultiplier = 1.25;
  else if (streakDays >= 3) streakMultiplier = 1.1;

  // Personal best bonus
  const pbBonus = isPersonalBest ? 50 : 0;

  return Math.floor(baseXp * performanceMultiplier * streakMultiplier + pbBonus);
}

/**
 * Calculate coins earned from a game session.
 */
export function calculateGameCoins(params: {
  baseCoinReward: number;
  score: number;
  maxScore: number;
}): number {
  const performance = params.maxScore > 0 ? params.score / params.maxScore : 0.5;
  return Math.floor(params.baseCoinReward * (0.5 + performance));
}

/**
 * Calculate stars earned from a game session (0-3).
 */
export function calculateStars(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  const ratio = score / maxScore;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.7) return 2;
  if (ratio >= 0.4) return 1;
  return 0;
}

/**
 * Calculate skill points awarded after a game.
 */
export function calculateSkillPoints(params: {
  score: number;
  maxScore: number;
  isPersonalBest: boolean;
}): number {
  const { score, maxScore, isPersonalBest } = params;
  const ratio = maxScore > 0 ? score / maxScore : 0;

  if (isPersonalBest) return 7;
  if (ratio >= 0.9) return 5;
  if (ratio >= 0.7) return 3;
  if (ratio >= 0.4) return 2;
  return 1;
}

/**
 * Calculate Brain Score (weighted average of all 8 skills).
 */
export function calculateBrainScore(skills: {
  memory: number;
  logic: number;
  focus: number;
  reaction: number;
  creativity: number;
  problemSolving: number;
  patternRecognition: number;
  decisionMaking: number;
}): number {
  const values = Object.values(skills);
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round(sum / values.length);
}

/**
 * Rank definitions.
 */
export const RANKS = [
  { id: 'bronze_3', name: 'Bronze III', minRp: 0 },
  { id: 'bronze_2', name: 'Bronze II', minRp: 100 },
  { id: 'bronze_1', name: 'Bronze I', minRp: 200 },
  { id: 'silver_3', name: 'Silver III', minRp: 350 },
  { id: 'silver_2', name: 'Silver II', minRp: 500 },
  { id: 'silver_1', name: 'Silver I', minRp: 700 },
  { id: 'gold_3', name: 'Gold III', minRp: 950 },
  { id: 'gold_2', name: 'Gold II', minRp: 1200 },
  { id: 'gold_1', name: 'Gold I', minRp: 1500 },
  { id: 'platinum_3', name: 'Platinum III', minRp: 1900 },
  { id: 'platinum_2', name: 'Platinum II', minRp: 2300 },
  { id: 'platinum_1', name: 'Platinum I', minRp: 2800 },
  { id: 'diamond_3', name: 'Diamond III', minRp: 3500 },
  { id: 'diamond_2', name: 'Diamond II', minRp: 4200 },
  { id: 'diamond_1', name: 'Diamond I', minRp: 5000 },
  { id: 'champion', name: 'Champion', minRp: 6000 },
] as const;

/**
 * Get rank name from rank points.
 */
export function getRankFromPoints(rp: number): (typeof RANKS)[number] {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (rp >= RANKS[i].minRp) return RANKS[i];
  }
  return RANKS[0];
}
