import { clampGameLevel, MAX_GAME_LEVEL } from '@/lib/game-config';

export { MAX_GAME_LEVEL };

/**
 * Level Generator — Algorithmic Difficulty Scaling
 *
 * Levels 1–10 per game.
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
  if (l <= 3) return 'easy';
  if (l <= 6) return 'medium';
  return 'hard';
}

function resolveBaseSlug(slug: string): string {
  if (slug === 'memory-match' || slug === 'memory-grove') return 'memory-match';
  if (slug === 'speed-math' || slug === 'logic-sprint') return 'speed-math';
  if (slug === 'pattern-recall' || slug === 'pattern-trail') return 'pattern-recall';
  if (slug === 'ice-puzzle') return 'ice-puzzle';
  if (slug === 'frost-reflex') return 'frost-reflex';
  if (slug === 'desert-riddle') return 'desert-riddle';
  if (slug === 'lava-logic') return 'lava-logic';
  if (slug === 'cyber-code') return 'cyber-code';
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
    case 'ice-puzzle':
      return getIcePuzzleConfig(l);
    case 'frost-reflex':
      return getFrostReflexConfig(l);
    case 'desert-riddle':
      return getDesertRiddleConfig(l);
    case 'lava-logic':
      return getLavaLogicConfig(l);
    case 'cyber-code':
      return getCyberCodeConfig(l);
    default:
      return getDefaultConfig(l);
  }
}

// ═══ MEMORY MATCH ═══
// Level 1: 6 pairs (3×4), 60s timer, 1.5s preview
// Level 5: 8 pairs (4×4), 75s, 1.0s preview
// Level 10: 12 pairs (4×6), 100s, 0.5s preview

function getMemoryMatchConfig(level: number): DifficultyConfig {
  const pairCount = Math.min(
    clamp(6 + Math.floor((level - 1) * 0.6), 6, 20),
    20,
  );
  const gridSize = pairCount * 2;

  const durationSec = clamp(
    Math.floor(55 + level * 2.5),
    55,
    130,
  );

  const previewTimeSec = clamp(
    Number((1.5 - (level - 1) * 0.08).toFixed(1)),
    0.2,
    1.5,
  );

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

function getSpeedMathConfig(level: number): DifficultyConfig {
  const maxOperand = clamp(
    Math.floor(15 + level * 4),
    15,
    200,
  );

  let operatorCount = 2;
  if (level >= 4) operatorCount = 3;
  if (level >= 9) operatorCount = 4;

  const durationSec = clamp(
    Math.floor(65 - level * 0.8),
    35,
    65,
  );

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

function getPatternRecallConfig(level: number): DifficultyConfig {
  const sequenceLength = clamp(
    3 + Math.floor((level - 1) * 0.5),
    3,
    16,
  );

  let gridSize = 9;
  if (level >= 8) gridSize = 16;
  if (level >= 18) gridSize = 25;

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

// ═══ ICE PUZZLE (Sliding Tile Puzzle) ═══
// Level 1: 3×3 grid (8 tiles), 240s
// Level 5: 3×3 grid, 180s (tighter time)
// Level 8+: 4×4 grid (15 tiles), 240s

function getIcePuzzleConfig(level: number): DifficultyConfig {
  let gridSize = 9; // 3×3
  if (level >= 8) gridSize = 16; // 4×4

  const tileCount = gridSize - 1;

  const durationSec = clamp(
    Math.floor(240 - (level - 1) * 8),
    120,
    240,
  );

  const maxScore = clamp(600 + level * 50, 600, 1500);

  return {
    durationSec,
    maxScore,
    gridSize,
    itemCount: tileCount,
  };
}

// ═══ FROST REFLEX (Reaction Tap) ═══
// Level 1: 2s max reaction, 120s total, 15 targets
// Level 10: 0.8s max reaction, 120s total, 30 targets

function getFrostReflexConfig(level: number): DifficultyConfig {
  const maxReactionMs = clamp(
    Math.floor(2000 - (level - 1) * 120),
    600,
    2000,
  );

  const targetCount = clamp(
    Math.floor(15 + (level - 1) * 1.5),
    15,
    40,
  );

  const durationSec = 120;
  const maxScore = clamp(500 + level * 50, 500, 1500);

  return {
    durationSec,
    maxScore,
    itemCount: targetCount,
    maxReactionMs,
  };
}

// ═══ DESERT RIDDLE (Logic Riddles) ═══
// Level 1: Easy riddles, 180s, 5 questions
// Level 10: Hard riddles, 180s, 10 questions

function getDesertRiddleConfig(level: number): DifficultyConfig {
  const questionCount = clamp(
    Math.floor(5 + (level - 1) * 0.5),
    5,
    12,
  );

  const durationSec = 180;
  const maxScore = clamp(500 + level * 50, 500, 1500);

  return {
    durationSec,
    maxScore,
    itemCount: questionCount,
    roundCount: questionCount,
  };
}

// ═══ LAVA LOGIC (Sequence Completion) ═══
// Level 1: Simple number sequences, 240s, 5 rounds
// Level 10: Complex sequences, 240s, 10 rounds

function getLavaLogicConfig(level: number): DifficultyConfig {
  const roundCount = clamp(
    Math.floor(5 + (level - 1) * 0.5),
    5,
    12,
  );

  const durationSec = 240;
  const maxScore = clamp(600 + level * 50, 600, 1500);

  return {
    durationSec,
    maxScore,
    itemCount: roundCount,
    roundCount,
  };
}

// ═══ CYBER CODE (Pattern Matching) ═══
// Level 1: 4-digit patterns, 180s, 8 rounds
// Level 10: 8-digit patterns, 180s, 15 rounds

function getCyberCodeConfig(level: number): DifficultyConfig {
  const patternLength = clamp(
    Math.floor(4 + (level - 1) * 0.4),
    4,
    8,
  );

  const roundCount = clamp(
    Math.floor(8 + (level - 1) * 0.7),
    8,
    18,
  );

  const durationSec = 180;
  const maxScore = clamp(600 + level * 50, 600, 1500);

  return {
    durationSec,
    maxScore,
    itemCount: patternLength,
    roundCount,
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
