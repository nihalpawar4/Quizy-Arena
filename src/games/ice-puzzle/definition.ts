import type { GameDefinition } from '@/engine/types';

export const icePuzzleDefinition: GameDefinition = {
  slug: 'ice-puzzle',
  title: 'Ice Puzzle',
  description: 'Slide frozen tiles into the correct order',
  iconKey: 'puzzle',
  category: 'logic',
  worldSlug: 'ice-kingdom',
  sortOrderInWorld: 1,

  difficulty: ['easy', 'medium', 'hard'],
  timerMode: 'countdown',
  defaultDurationSec: 240,
  maxScore: 1000,
  supportsLives: false,
  maxLives: 0,
  supportsPause: true,

  difficultyConfig: {
    easy: { durationSec: 240, maxScore: 600, gridSize: 9, itemCount: 8 },
    medium: { durationSec: 200, maxScore: 800, gridSize: 9, itemCount: 8 },
    hard: { durationSec: 240, maxScore: 1000, gridSize: 16, itemCount: 15 },
  },

  primarySkill: 'logic',
  secondarySkills: ['focus', 'problemSolving'],
  skillWeights: { logic: 0.5, focus: 0.3, problemSolving: 0.2 },

  baseXp: 130,
  baseCoinReward: 35,
  diamondChance: 0.15,

  unlockLevel: 10,
  unlockWorldSlug: 'ice-kingdom',

  isOfflineCapable: true,
  isMultiplayerCapable: false,
  hasComboSystem: false,
  hasDifficultyRamp: true,

  accentColor: '#60A5FA',
  instructions: [
    'Tap a tile next to the empty space to slide it',
    'Arrange all numbers in order (1, 2, 3...)',
    'Fewer moves = higher score',
    'Beat the timer to earn stars',
  ],
};
