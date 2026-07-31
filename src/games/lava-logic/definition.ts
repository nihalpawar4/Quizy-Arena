import type { GameDefinition } from '@/engine/types';

export const lavaLogicDefinition: GameDefinition = {
  slug: 'lava-logic',
  title: 'Lava Logic',
  description: 'Find the next number in fiery sequences',
  iconKey: 'puzzle',
  category: 'logic',
  worldSlug: 'volcano-peak',
  sortOrderInWorld: 1,

  difficulty: ['easy', 'medium', 'hard'],
  timerMode: 'countdown',
  defaultDurationSec: 240,
  maxScore: 1000,
  supportsLives: true,
  maxLives: 3,
  supportsPause: true,

  difficultyConfig: {
    easy: { durationSec: 240, maxScore: 600, itemCount: 5, roundCount: 5 },
    medium: { durationSec: 240, maxScore: 800, itemCount: 7, roundCount: 7 },
    hard: { durationSec: 240, maxScore: 1000, itemCount: 10, roundCount: 10 },
  },

  primarySkill: 'logic',
  secondarySkills: ['patternRecognition', 'problemSolving'],
  skillWeights: { logic: 0.5, patternRecognition: 0.3, problemSolving: 0.2 },

  baseXp: 150,
  baseCoinReward: 40,
  diamondChance: 0.18,

  unlockLevel: 23,
  unlockWorldSlug: 'volcano-peak',

  isOfflineCapable: true,
  isMultiplayerCapable: false,
  hasComboSystem: true,
  hasDifficultyRamp: true,

  accentColor: '#EF4444',
  instructions: [
    'A number sequence is shown with one missing',
    'Figure out the pattern',
    'Choose the correct next number',
    'Wrong answers cost a life — 3 lives total',
  ],
};
