import type { GameDefinition } from '@/engine/types';

export const fallingIceDefinition: GameDefinition = {
  slug: 'falling-ice',
  title: 'Falling Ice',
  description: 'Solve math problems on falling ice blocks before they hit the ground',
  iconKey: 'crystal',
  category: 'math',
  worldSlug: 'ice-kingdom',
  sortOrderInWorld: 3,

  difficulty: ['easy', 'medium', 'hard'],
  timerMode: 'countdown',
  defaultDurationSec: 120,
  maxScore: 1200,
  supportsLives: true,
  maxLives: 3,
  supportsPause: true,

  difficultyConfig: {
    easy: { durationSec: 120, maxScore: 600, speed: 1, itemCount: 15 },
    medium: { durationSec: 120, maxScore: 900, speed: 1.5, itemCount: 20 },
    hard: { durationSec: 120, maxScore: 1200, speed: 2, itemCount: 25 },
  },

  primarySkill: 'logic',
  secondarySkills: ['reaction', 'focus'],
  skillWeights: { logic: 0.5, reaction: 0.3, focus: 0.2 },

  baseXp: 140,
  baseCoinReward: 35,
  diamondChance: 0.15,

  unlockLevel: 6,
  unlockWorldSlug: 'ice-kingdom',

  isOfflineCapable: true,
  isMultiplayerCapable: false,
  hasComboSystem: true,
  hasDifficultyRamp: true,

  accentColor: '#38BDF8',
  instructions: [
    'Ice blocks fall from the sky with math problems',
    'Tap the correct answer before the block hits the ground',
    'Faster answers earn more points and build combos',
    'Wrong answers or missed blocks cost a life — 3 lives total',
  ],
};
