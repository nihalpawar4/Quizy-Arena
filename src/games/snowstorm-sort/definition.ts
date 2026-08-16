import type { GameDefinition } from '@/engine/types';

export const snowstormSortDefinition: GameDefinition = {
  slug: 'snowstorm-sort',
  title: 'Snowstorm Sort',
  description: 'Tap the scattered numbers in ascending order through the blizzard',
  iconKey: 'eye',
  category: 'focus',
  worldSlug: 'ice-kingdom',
  sortOrderInWorld: 5,

  difficulty: ['easy', 'medium', 'hard'],
  timerMode: 'countdown',
  defaultDurationSec: 20,
  maxScore: 1000,
  supportsLives: true,
  maxLives: 3,
  supportsPause: true,

  difficultyConfig: {
    easy: { durationSec: 20, maxScore: 600, itemCount: 5, roundCount: 5 },
    medium: { durationSec: 20, maxScore: 800, itemCount: 6, roundCount: 5 },
    hard: { durationSec: 20, maxScore: 1000, itemCount: 7, roundCount: 5 },
  },

  primarySkill: 'focus',
  secondarySkills: ['reaction', 'patternRecognition'],
  skillWeights: { focus: 0.5, reaction: 0.3, patternRecognition: 0.2 },

  baseXp: 125,
  baseCoinReward: 30,
  diamondChance: 0.12,

  unlockLevel: 6,
  unlockWorldSlug: 'ice-kingdom',

  isOfflineCapable: true,
  isMultiplayerCapable: false,
  hasComboSystem: true,
  hasDifficultyRamp: true,

  accentColor: '#A5F3FC',
  instructions: [
    'Numbers appear scattered across the screen',
    'Tap them in ascending order (smallest to largest)',
    'Avoid tapping decoy numbers',
    'Complete 5 rounds to clear the level!',
  ],
};
