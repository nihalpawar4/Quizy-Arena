import { clampGameLevel, MAX_GAME_LEVEL } from '@/lib/game-config';

export { MAX_GAME_LEVEL };

/**
 * Level Generator — Algorithmic Difficulty Scaling
 *
 * Phase 1: levels 1–3 per game.
 * Difficulty parameters scale smoothly based on the level number.
 * No predefined levels — everything is computed.
 *
 * Design principles:
 * - Never spike suddenly
 * - Always feel challenging but fair
 * - Same level should rarely appear twice (randomized content)
 * - Higher levels = more complex, not just faster
 */

import type { DifficultyConfig, GameDifficulty } from './types';

/**
 * Maps game level (1-based) to the old difficulty category for reward scaling.
 */
export function difficultyFromLevel(level: number): GameDifficulty {
  const l = clampGameLevel(level);
  if (l === 1) return 'easy';
  if (l === 2) return 'medium';
  return 'hard';
}

function resolveBaseSlug(slug: string): string {
  if (slug === 'memory-match' || slug === 'memory-grove') return 'memory-match';
  if (slug === 'speed-math' || slug === 'logic-sprint') return 'speed-math';
  if (slug === 'pattern-recall' || slug === 'pattern-trail') return 'pattern-recall';
  return slug;
}

/**
 * Returns the algorithmic DifficultyConfig for a given game at a given level.
 */
export function getLevelConfig(gameSlug: string, level: number): DifficultyConfig {
  const l = clampGameLevel(level);
  switch (resolveBaseSlug(gameSlug)) {
    case 'memory-match':
      return getMemoryMatchConfig(l);
    case 'speed-math':
      return getSpeedMathConfig(l);
    case 'pattern-recall':
      return getPatternRecallConfig(l);
    default:
      return getDefaultConfig(l);
  }
}

// ═══ MEMORY MATCH ═══
// Level 1: 6 pairs (3×4), 60s timer, 1.5s preview
// Level 5: 8 pairs (4×4), 75s, 1.0s preview
// Level 10: 10 pairs (4×5), 90s, 0.7s preview
// Level 20: 14 pairs (4×7), 100s, 0.4s preview
// Level 30+: 18 pairs (6×6), 110s, 0.3s preview

function getMemoryMatchConfig(level: number): DifficultyConfig {
  const pairCount = Math.min(
    clamp(6 + Math.floor((level - 1) * 0.6), 6, 20),
    20,
  );
  const gridSize = pairCount * 2;

  // Timer grows slightly with more pairs, but not proportionally (pressure)
  const durationSec = clamp(
    Math.floor(55 + level * 2.5),
    55,
    130,
  );

  // Preview time decreases (cards are shown face-up at start briefly)
  const previewTimeSec = clamp(
    Number((1.5 - (level - 1) * 0.08).toFixed(1)),
    0.2,
    1.5,
  );

  // Max score scales with pair count
  const maxScore = pairCount * 100;

  return {
    durationSec,
    maxScore,
    gridSize,
    itemCount: pairCount,
    previewTimeSec,
  };
}

// ═══ SPEED MATH ═══
// Level 1: add/subtract up to 20, 60s
// Level 5: add/subtract/multiply up to 50, 60s
// Level 10: all ops up to 100, 55s
// Level 15: add division, 50s
// Level 20+: multi-step, 45s

function getSpeedMathConfig(level: number): DifficultyConfig {
  const maxOperand = clamp(
    Math.floor(15 + level * 4),
    15,
    200,
  );

  // Operators unlocked by level
  // Level 1-3: +, -
  // Level 4-8: +, -, ×
  // Level 9+: +, -, ×, ÷
  let operatorCount = 2; // +, -
  if (level >= 4) operatorCount = 3; // + ×
  if (level >= 9) operatorCount = 4; // + ÷

  // Timer gets slightly tighter
  const durationSec = clamp(
    Math.floor(65 - level * 0.8),
    35,
    65,
  );

  // Multi-step problems (2-step at level 12+, 3-step at level 25+)
  const maxSteps = level >= 25 ? 3 : level >= 12 ? 2 : 1;

  const maxScore = clamp(600 + level * 30, 600, 2000);

  return {
    durationSec,
    maxScore,
    speed: 1 + (level - 1) * 0.08,
    itemCount: maxOperand,
    operatorCount,
    maxSteps,
  };
}

// ═══ PATTERN RECALL ═══
// Level 1: 3 tiles in sequence, 3×3 grid
// Level 5: 5 tiles, 3×3 grid
// Level 10: 7 tiles, 4×4 grid
// Level 15: 9 tiles, 4×4 grid
// Level 20+: 11+ tiles, 5×5 grid

function getPatternRecallConfig(level: number): DifficultyConfig {
  const sequenceLength = clamp(
    3 + Math.floor((level - 1) * 0.5),
    3,
    16,
  );

  // Grid expands at milestones
  let gridSize = 9;   // 3×3
  if (level >= 8) gridSize = 16;  // 4×4
  if (level >= 18) gridSize = 25; // 5×5

  // Show time per tile decreases
  const showTimeMsPerTile = clamp(
    Math.floor(600 - (level - 1) * 15),
    250,
    600,
  );

  const durationSec = clamp(
    Math.floor(60 + level * 2),
    60,
    120,
  );

  const maxScore = clamp(500 + level * 40, 500, 2000);

  return {
    durationSec,
    maxScore,
    gridSize,
    itemCount: sequenceLength,
    showTimeMsPerTile,
  };
}

// ═══ DEFAULT (fallback for future games) ═══

function getDefaultConfig(level: number): DifficultyConfig {
  return {
    durationSec: clamp(60 + level * 2, 60, 120),
    maxScore: clamp(600 + level * 25, 600, 1500),
    gridSize: 12,
    itemCount: clamp(6 + level, 6, 20),
  };
}

// ── Utility ──

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
