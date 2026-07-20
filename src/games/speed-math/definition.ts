import type { GameDefinition } from '@/engine/types';

export const speedMathDefinition: GameDefinition = {
  slug: 'speed-math',
  title: 'Speed Math',
  description: 'Solve math problems as fast as you can',
  iconKey: 'lightning',
  category: 'math',
  worldSlug: 'training-camp',
  sortOrderInWorld: 2,

  difficulty: ['easy', 'medium', 'hard'],
  timerMode: 'countdown',
  defaultDurationSec: 60,
  maxScore: 1000,
  supportsLives: true,
  maxLives: 3,
  supportsPause: true,

  difficultyConfig: {
    easy: {
      durationSec: 60,
      maxScore: 600,
      speed: 1,
      itemCount: 20,    // Max operand
    },
    medium: {
      durationSec: 60,
      maxScore: 800,
      speed: 1.3,
      itemCount: 50,
    },
    hard: {
      durationSec: 60,
      maxScore: 1000,
      speed: 1.6,
      itemCount: 100,
    },
  },

  primarySkill: 'logic',
  secondarySkills: ['reaction', 'focus'],
  skillWeights: {
    logic: 0.5,
    reaction: 0.3,
    focus: 0.2,
  },

  baseXp: 100,
  baseCoinReward: 25,
  diamondChance: 0.1,

  unlockLevel: 1,
  unlockWorldSlug: 'training-camp',

  isOfflineCapable: true,
  isMultiplayerCapable: false,
  hasComboSystem: true,
  hasDifficultyRamp: true,

  accentColor: '#FACC15',
  instructions: [
    'A math problem appears on screen',
    'Type the correct answer and press Enter',
    'Faster answers earn more points',
    'Wrong answers cost a life — 3 lives total',
  ],
};
