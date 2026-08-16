import type { GameDefinition } from '@/engine/types';

export const glacierMatchDefinition: GameDefinition = {
  slug: 'glacier-match',
  title: 'Glacier Match',
  description: 'Memorize and repeat the ice crystal sequence',
  iconKey: 'brain',
  category: 'memory',
  worldSlug: 'ice-kingdom',
  sortOrderInWorld: 4,

  difficulty: ['easy', 'medium', 'hard'],
  timerMode: 'countdown',
  defaultDurationSec: 90,
  maxScore: 1000,
  supportsLives: true,
  maxLives: 3,
  supportsPause: true,

  difficultyConfig: {
    easy: { durationSec: 90, maxScore: 600, gridSize: 6, itemCount: 3 },
    medium: { durationSec: 90, maxScore: 800, gridSize: 9, itemCount: 5 },
    hard: { durationSec: 90, maxScore: 1000, gridSize: 12, itemCount: 7 },
  },

  primarySkill: 'memory',
  secondarySkills: ['focus', 'patternRecognition'],
  skillWeights: { memory: 0.6, focus: 0.25, patternRecognition: 0.15 },

  baseXp: 130,
  baseCoinReward: 30,
  diamondChance: 0.12,

  unlockLevel: 6,
  unlockWorldSlug: 'ice-kingdom',

  isOfflineCapable: true,
  isMultiplayerCapable: false,
  hasComboSystem: true,
  hasDifficultyRamp: true,

  accentColor: '#7DD3FC',
  instructions: [
    'Watch the ice crystals light up in sequence',
    'Repeat the sequence by tapping the crystals in order',
    'Each round adds one more crystal to remember',
    'Three mistakes and the game ends',
  ],
};
