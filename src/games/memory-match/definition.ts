import type { GameDefinition } from '@/engine/types';

export const memoryMatchDefinition: GameDefinition = {
  // Identity
  slug: 'memory-match',
  title: 'Memory Match',
  description: 'Find matching pairs by flipping cards',
  iconKey: 'brain',
  category: 'memory',
  worldSlug: 'training-camp',
  sortOrderInWorld: 1,

  // Gameplay
  difficulty: ['easy', 'medium', 'hard'],
  timerMode: 'countdown',
  defaultDurationSec: 60,
  maxScore: 1000,
  supportsLives: false,
  maxLives: 0,
  supportsPause: true,

  // Difficulty Scaling
  difficultyConfig: {
    easy: {
      durationSec: 60,
      maxScore: 600,
      gridSize: 12,     // 3×4 grid = 6 pairs
      itemCount: 6,
    },
    medium: {
      durationSec: 90,
      maxScore: 800,
      gridSize: 16,     // 4×4 grid = 8 pairs
      itemCount: 8,
    },
    hard: {
      durationSec: 120,
      maxScore: 1000,
      gridSize: 20,     // 4×5 grid = 10 pairs
      itemCount: 10,
    },
  },

  // Skills
  primarySkill: 'memory',
  secondarySkills: ['focus', 'patternRecognition'],
  skillWeights: {
    memory: 0.6,
    focus: 0.25,
    patternRecognition: 0.15,
  },

  // Rewards
  baseXp: 100,
  baseCoinReward: 25,
  diamondChance: 0.1,

  // Requirements
  unlockLevel: 1,
  unlockWorldSlug: 'training-camp',

  // Features
  isOfflineCapable: true,
  isMultiplayerCapable: false,
  hasComboSystem: true,
  hasDifficultyRamp: false,

  // UI
  accentColor: '#3B82F6',
  instructions: [
    'Tap a card to flip it over',
    'Find the matching pair by memory',
    'Match all pairs before time runs out',
    'Consecutive matches build your combo',
  ],
};
