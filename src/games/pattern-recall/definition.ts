import type { GameDefinition } from '@/engine/types';

export const patternRecallDefinition: GameDefinition = {
  slug: 'pattern-recall',
  title: 'Pattern Recall',
  description: 'Remember and repeat the sequence',
  iconKey: 'target',
  category: 'pattern',
  worldSlug: 'training-camp',
  sortOrderInWorld: 3,

  difficulty: ['easy', 'medium', 'hard'],
  timerMode: 'perRound',
  defaultDurationSec: 5,
  maxScore: 1000,
  supportsLives: true,
  maxLives: 3,
  supportsPause: true,

  difficultyConfig: {
    easy: {
      durationSec: 300,     // Total game time limit
      maxScore: 600,
      speed: 6,             // Seconds per round to respond
      gridSize: 9,          // 3×3 grid
      roundCount: 0,        // Infinite rounds (until fail)
      itemCount: 3,         // Starting sequence length
    },
    medium: {
      durationSec: 300,
      maxScore: 800,
      speed: 5,
      gridSize: 9,
      roundCount: 0,
      itemCount: 4,
    },
    hard: {
      durationSec: 300,
      maxScore: 1000,
      speed: 4,
      gridSize: 16,          // 4×4 grid
      roundCount: 0,
      itemCount: 4,
    },
  },

  primarySkill: 'patternRecognition',
  secondarySkills: ['memory', 'focus'],
  skillWeights: {
    patternRecognition: 0.5,
    memory: 0.35,
    focus: 0.15,
  },

  baseXp: 120,
  baseCoinReward: 30,
  diamondChance: 0.12,

  unlockLevel: 1,
  unlockWorldSlug: 'training-camp',

  isOfflineCapable: true,
  isMultiplayerCapable: false,
  hasComboSystem: true,
  hasDifficultyRamp: true,

  accentColor: '#22C55E',
  instructions: [
    'Watch the tiles light up in sequence',
    'Tap the tiles in the same order',
    'Each round adds one more tile',
    'Mistakes cost a life — 3 lives total',
  ],
};
