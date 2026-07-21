import type { GameDefinition } from '@/engine/types';

export const frostReflexDefinition: GameDefinition = {
  slug: 'frost-reflex',
  title: 'Frost Reflex',
  description: 'Tap the snowflakes before they melt away',
  iconKey: 'lightning',
  category: 'reaction',
  worldSlug: 'ice-kingdom',
  sortOrderInWorld: 2,

  difficulty: ['easy', 'medium', 'hard'],
  timerMode: 'countdown',
  defaultDurationSec: 120,
  maxScore: 1000,
  supportsLives: true,
  maxLives: 3,
  supportsPause: true,

  difficultyConfig: {
    easy: { durationSec: 120, maxScore: 600, itemCount: 15, maxReactionMs: 2000 },
    medium: { durationSec: 120, maxScore: 800, itemCount: 20, maxReactionMs: 1500 },
    hard: { durationSec: 120, maxScore: 1000, itemCount: 30, maxReactionMs: 1000 },
  },

  primarySkill: 'reaction',
  secondarySkills: ['focus', 'decisionMaking'],
  skillWeights: { reaction: 0.6, focus: 0.25, decisionMaking: 0.15 },

  baseXp: 120,
  baseCoinReward: 30,
  diamondChance: 0.12,

  unlockLevel: 7,
  unlockWorldSlug: 'ice-kingdom',

  isOfflineCapable: true,
  isMultiplayerCapable: false,
  hasComboSystem: true,
  hasDifficultyRamp: true,

  accentColor: '#93C5FD',
  instructions: [
    'Snowflakes appear on screen randomly',
    'Tap them before they disappear!',
    'Faster taps earn more points',
    'Missing 3 snowflakes ends the game',
  ],
};
