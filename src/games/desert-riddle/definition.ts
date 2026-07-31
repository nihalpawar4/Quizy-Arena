import type { GameDefinition } from '@/engine/types';

export const desertRiddleDefinition: GameDefinition = {
  slug: 'desert-riddle',
  title: 'Desert Riddle',
  description: 'Solve tricky logic puzzles in the desert sands',
  iconKey: 'eye',
  category: 'problem_solving',
  worldSlug: 'desert-of-logic',
  sortOrderInWorld: 1,

  difficulty: ['easy', 'medium', 'hard'],
  timerMode: 'countdown',
  defaultDurationSec: 180,
  maxScore: 1000,
  supportsLives: true,
  maxLives: 3,
  supportsPause: true,

  difficultyConfig: {
    easy: { durationSec: 180, maxScore: 600, itemCount: 5, roundCount: 5 },
    medium: { durationSec: 180, maxScore: 800, itemCount: 7, roundCount: 7 },
    hard: { durationSec: 180, maxScore: 1000, itemCount: 10, roundCount: 10 },
  },

  primarySkill: 'problemSolving',
  secondarySkills: ['logic', 'decisionMaking'],
  skillWeights: { problemSolving: 0.5, logic: 0.3, decisionMaking: 0.2 },

  baseXp: 140,
  baseCoinReward: 35,
  diamondChance: 0.15,

  unlockLevel: 16,
  unlockWorldSlug: 'desert-of-logic',

  isOfflineCapable: true,
  isMultiplayerCapable: false,
  hasComboSystem: true,
  hasDifficultyRamp: true,

  accentColor: '#F59E0B',
  instructions: [
    'Read each logic riddle carefully',
    'Choose the correct answer from 4 options',
    'Faster answers earn more points',
    'Wrong answers cost a life — 3 lives total',
  ],
};
