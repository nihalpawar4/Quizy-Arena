/**
 * Scoring Engine
 *
 * ONE scoring pipeline for every game.
 * Takes raw game data, applies multipliers, outputs final score + stars.
 */

import type { ScoreInput, ScoreResult, GameDifficulty } from './types';

const DIFFICULTY_MULTIPLIERS: Record<GameDifficulty, number> = {
  easy: 1.0,
  medium: 1.3,
  hard: 1.6,
};

/**
 * Calculate the final score from raw game data.
 */
export function calculateScore(input: ScoreInput): ScoreResult {
  const {
    rawScore,
    maxPossibleScore,
    correctAnswers,
    wrongAnswers,
    maxCombo,
    difficulty,
    timeElapsedSec,
    timeLimitSec,
    timerMode,
  } = input;

  // 1. Combo bonus: 1 + (maxCombo * 0.02), capped at 1.5x
  const comboBonus = Math.min(1 + maxCombo * 0.02, 1.5);

  // 2. Difficulty multiplier
  const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty];

  // 3. Speed bonus (countdown only): finishing early gives up to 20% bonus
  let speedBonus = 1;
  if (timerMode === 'countdown' && timeLimitSec > 0) {
    const timeRemaining = Math.max(0, timeLimitSec - timeElapsedSec);
    speedBonus = 1 + (timeRemaining / timeLimitSec) * 0.2;
  }

  // 4. Accuracy
  const totalAnswers = correctAnswers + wrongAnswers;
  const accuracy = totalAnswers > 0
    ? Math.round((correctAnswers / totalAnswers) * 100)
    : 0;

  // 5. Perfect bonus: 100% accuracy + 0 wrong → +15%
  const perfectBonus = accuracy === 100 && wrongAnswers === 0 && correctAnswers > 0
    ? 1.15
    : 1;

  // 6. Calculate final score
  const finalScore = Math.floor(
    rawScore * comboBonus * difficultyMultiplier * speedBonus * perfectBonus,
  );

  // 7. Stars calculation
  const stars = calculateStars(finalScore, maxPossibleScore * difficultyMultiplier);

  return {
    finalScore,
    accuracy,
    stars,
    comboBonus: Math.round((comboBonus - 1) * 100),      // Display as percentage
    difficultyMultiplier,
    speedBonus: Math.round((speedBonus - 1) * 100),       // Display as percentage
    perfectBonus: perfectBonus > 1 ? 15 : 0,              // Display as percentage
  };
}

/**
 * Calculate stars (0-3) from score vs max.
 */
function calculateStars(score: number, adjustedMax: number): number {
  if (adjustedMax <= 0) return 0;
  const ratio = score / adjustedMax;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.7) return 2;
  if (ratio >= 0.4) return 1;
  return 0;
}
