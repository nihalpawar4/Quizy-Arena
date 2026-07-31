import type { GameDefinition } from '@/engine/types';

export const cyberCodeDefinition: GameDefinition = {
  slug: 'cyber-code',
  title: 'Cyber Code',
  description: 'Decode digital patterns in the neon grid',
  iconKey: 'crystal',
  category: 'pattern',
  worldSlug: 'cyber-city',
  sortOrderInWorld: 1,

  difficulty: ['easy', 'medium', 'hard'],
  timerMode: 'countdown',
  defaultDurationSec: 180,
  maxScore: 1000,
  supportsLives: true,
  maxLives: 3,
  supportsPause: true,

  difficultyConfig: {
    easy: { durationSec: 180, maxScore: 600, itemCount: 4, roundCount: 8 },
    medium: { durationSec: 180, maxScore: 800, itemCount: 5, roundCount: 10 },
    hard: { durationSec: 180, maxScore: 1000, itemCount: 6, roundCount: 14 },
  },

  primarySkill: 'patternRecognition',
  secondarySkills: ['memory', 'focus'],
  skillWeights: { patternRecognition: 0.5, memory: 0.3, focus: 0.2 },

  baseXp: 150,
  baseCoinReward: 40,
  diamondChance: 0.18,

  unlockLevel: 30,
  unlockWorldSlug: 'cyber-city',

  isOfflineCapable: true,
  isMultiplayerCapable: false,
  hasComboSystem: true,
  hasDifficultyRamp: true,

  accentColor: '#A855F7',
  instructions: [
    'A code pattern appears briefly on screen',
    'Memorize the colored sequence',
    'Reproduce it by tapping in order',
    'Patterns get longer as you progress',
  ],
};
