/**
 * Rewards Engine
 *
 * Calculates XP, coins, diamonds, and skill deltas after a game.
 * Integrates with existing xp.ts calculations.
 */

import type {
  GameDefinition,
  GameDifficulty,
  ScoreResult,
  RewardResult,
} from './types';
import type { SkillId } from '@/lib/constants';
import {
  calculateGameXp,
  calculateGameCoins,
  calculateSkillPoints,
  calculateBrainScore,
  levelFromXp,
} from '@/lib/xp';
import { QUIZY_XP_SHARE } from '@/lib/game-economy';

interface RewardInput {
  definition: GameDefinition;
  scoreResult: ScoreResult;
  difficulty: GameDifficulty;
  level: number;
  rawScore: number;
  correctAnswers: number;
  wrongAnswers: number;
  maxCombo: number;

  // Player context
  currentArenaXp: number;
  currentGlobalXp: number;
  currentArenaStreak: number;
  currentSkills: Record<string, number>;
  previousBestScore: number | null;
  gamesPlayedToday: number;
}

/**
 * Calculate all rewards from a completed game session.
 */
export function calculateRewards(input: RewardInput): RewardResult {
  const {
    definition,
    scoreResult,
    difficulty,
    level,
    rawScore,
    currentArenaXp,
    currentGlobalXp,
    currentArenaStreak,
    currentSkills,
    previousBestScore,
    gamesPlayedToday,
  } = input;

  const maxScore = definition.difficultyConfig[difficulty].maxScore;
  const isPersonalBest = previousBestScore === null || scoreResult.finalScore > previousBestScore;

  // ── XP Calculation ──
  let xpEarned = calculateGameXp({
    baseXp: definition.baseXp,
    score: scoreResult.finalScore,
    maxScore: maxScore * scoreResult.difficultyMultiplier,
    streakDays: currentArenaStreak,
    isPersonalBest,
  });

  // First play bonus (+50%)
  if (previousBestScore === null) {
    xpEarned = Math.floor(xpEarned * 1.5);
  }

  // Daily bonus: first 3 games get +20%
  if (gamesPlayedToday < 3) {
    xpEarned = Math.floor(xpEarned * 1.2);
  }

  // Level multiplier: higher game levels earn more XP
  const levelMultiplier = 1 + Math.min((level - 1) * 0.025, 0.5); // Up to +50%
  xpEarned = Math.floor(xpEarned * levelMultiplier);

  // Cap at 500 XP per game (applied after all multipliers to be the true ceiling)
  xpEarned = Math.min(xpEarned, 500);

  // ── Coins ──
  const coinsEarned = calculateGameCoins({
    baseCoinReward: definition.baseCoinReward,
    score: scoreResult.finalScore,
    maxScore: maxScore * scoreResult.difficultyMultiplier,
  });

  // ── Diamonds (probabilistic + level bonus) ──
  let diamondsEarned = 0;
  if (Math.random() < definition.diamondChance) {
    diamondsEarned = scoreResult.stars >= 3 ? 5 : scoreResult.stars >= 2 ? 3 : 1;
  }
  // Bonus diamonds every 5th game level
  if (level > 0 && level % 5 === 0) {
    diamondsEarned += 5;
  }

  // ── Skill Deltas ──
  const baseSkillPoints = calculateSkillPoints({
    score: scoreResult.finalScore,
    maxScore: maxScore * scoreResult.difficultyMultiplier,
    isPersonalBest,
  });

  const skillDeltas: Partial<Record<SkillId, number>> = {};
  for (const [skillId, weight] of Object.entries(definition.skillWeights)) {
    const delta = Math.max(1, Math.round(baseSkillPoints * (weight as number)));
    skillDeltas[skillId as SkillId] = delta;
  }

  // ── Level Calculations ──
  const newArenaXp = currentArenaXp + xpEarned;
  const quizyXpEarned = Math.floor(xpEarned * QUIZY_XP_SHARE);
  const newGlobalXp = currentGlobalXp + quizyXpEarned;
  const oldArenaLevel = levelFromXp(currentArenaXp);
  const newArenaLevel = levelFromXp(newArenaXp);
  const newGlobalLevel = levelFromXp(newGlobalXp);
  const didLevelUp = newArenaLevel > oldArenaLevel;

  // ── Brain Score ──
  const updatedSkills = { ...currentSkills };
  for (const [skillId, delta] of Object.entries(skillDeltas)) {
    const current = updatedSkills[skillId] ?? 0;
    updatedSkills[skillId] = Math.min(100, current + delta);
  }

  const newBrainScore = calculateBrainScore({
    memory: updatedSkills.memory ?? 0,
    logic: updatedSkills.logic ?? 0,
    focus: updatedSkills.focus ?? 0,
    reaction: updatedSkills.reaction ?? 0,
    creativity: updatedSkills.creativity ?? 0,
    problemSolving: updatedSkills.problemSolving ?? 0,
    patternRecognition: updatedSkills.patternRecognition ?? 0,
    decisionMaking: updatedSkills.decisionMaking ?? 0,
  });

  // ── Streak ──
  const streakMaintained = true; // Playing any game maintains streak
  // First play of the day increments streak by 1
  const newStreakCount = gamesPlayedToday === 0
    ? currentArenaStreak + 1
    : currentArenaStreak;

  return {
    xpEarned,
    coinsEarned,
    diamondsEarned,
    skillDeltas,
    isPersonalBest,
    newArenaXp,
    newGlobalXp,
    newArenaLevel,
    newGlobalLevel,
    didLevelUp,
    newBrainScore,
    streakMaintained,
    newStreakCount,
  };
}
