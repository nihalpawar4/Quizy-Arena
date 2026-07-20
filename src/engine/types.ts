/**
 * Quizy Arena — Game Engine Type Definitions
 *
 * This file is the contract between games and the engine.
 * Every game must conform to GameDefinition.
 * Every game component interacts through GameEngine.
 */

import type { SkillId } from '@/lib/constants';

// ============================================
// GAME DEFINITION
// ============================================

export type GameCategory =
  | 'memory'
  | 'logic'
  | 'focus'
  | 'reaction'
  | 'pattern'
  | 'math'
  | 'problem_solving'
  | 'decision'
  | 'word'
  | 'strategy';

export type GameDifficulty = 'easy' | 'medium' | 'hard';

export type TimerMode =
  | 'countdown'   // 60s → 0s (most games)
  | 'countup'     // 0s → ∞ (time-attack)
  | 'perRound'    // Resets each round
  | 'infinite';   // No timer

export interface DifficultyConfig {
  durationSec: number;
  maxScore: number;
  speed?: number;
  gridSize?: number;
  itemCount?: number;
  roundCount?: number;
  [key: string]: unknown;
}

export interface GameDefinition {
  // ── Identity ──
  slug: string;
  title: string;
  description: string;
  iconKey: 'brain' | 'lightning' | 'target' | 'puzzle' | 'eye' | 'crystal';
  category: GameCategory;
  worldSlug: string;
  sortOrderInWorld: number;

  // ── Gameplay ──
  difficulty: GameDifficulty[];
  timerMode: TimerMode;
  defaultDurationSec: number;
  maxScore: number;
  supportsLives: boolean;
  maxLives: number;
  supportsPause: boolean;

  // ── Difficulty Scaling ──
  difficultyConfig: Record<GameDifficulty, DifficultyConfig>;

  // ── Skills ──
  primarySkill: SkillId;
  secondarySkills: SkillId[];
  skillWeights: Partial<Record<SkillId, number>>;

  // ── Rewards ──
  baseXp: number;
  baseCoinReward: number;
  diamondChance: number;

  // ── Requirements ──
  unlockLevel: number;
  unlockWorldSlug: string;

  // ── Features ──
  isOfflineCapable: boolean;
  isMultiplayerCapable: boolean;
  hasComboSystem: boolean;
  hasDifficultyRamp: boolean;

  // ── UI ──
  accentColor: string;
  instructions: string[];
}

// ============================================
// LIFECYCLE
// ============================================

export type GameLifecycleState =
  | 'loading'
  | 'instructions'
  | 'countdown'
  | 'playing'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'scoring'
  | 'results'
  | 'saving'
  | 'rewards';

// ============================================
// ENGINE API
// ============================================

export interface GameEngine {
  // ── State (read-only) ──
  state: GameLifecycleState;
  score: number;
  timeRemaining: number;
  timeElapsed: number;
  currentRound: number;
  totalRounds: number;
  combo: number;
  maxCombo: number;
  lives: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
  difficulty: GameDifficulty;
  isPaused: boolean;
  isLowTime: boolean;
  sessionId: string;

  // ── Lifecycle Actions ──
  ready(): void;             // loading → instructions
  startCountdown(): void;    // instructions → countdown
  startPlaying(): void;      // countdown → playing

  // ── Gameplay Actions ──
  recordCorrect(points?: number): void;
  recordWrong(): void;
  addScore(points: number): void;
  addCombo(): void;
  breakCombo(): void;
  loseLife(): void;
  complete(): void;
  fail(reason?: string): void;
  pause(): void;
  resume(): void;
  setRound(current: number, total?: number): void;

  // ── Config (read-only) ──
  definition: GameDefinition;
  difficultyConfig: DifficultyConfig;
}

// ============================================
// SCORING
// ============================================

export interface ScoreInput {
  rawScore: number;
  maxPossibleScore: number;
  correctAnswers: number;
  wrongAnswers: number;
  combo: number;
  maxCombo: number;
  difficulty: GameDifficulty;
  timeElapsedSec: number;
  timeLimitSec: number;
  timerMode: TimerMode;
}

export interface ScoreResult {
  finalScore: number;
  accuracy: number;
  stars: number;
  comboBonus: number;
  difficultyMultiplier: number;
  speedBonus: number;
  perfectBonus: number;
}

// ============================================
// REWARDS
// ============================================

export interface RewardResult {
  xpEarned: number;
  coinsEarned: number;
  diamondsEarned: number;
  skillDeltas: Partial<Record<SkillId, number>>;
  isPersonalBest: boolean;
  newArenaXp: number;
  newGlobalXp: number;
  newArenaLevel: number;
  newGlobalLevel: number;
  didLevelUp: boolean;
  newBrainScore: number;
  streakMaintained: boolean;
  newStreakCount: number;
}

// ============================================
// SAVE
// ============================================

export interface SavePayload {
  sessionId: string;
  userId: string;
  gameSlug: string;
  level: number;
  score: number;
  accuracy: number;
  durationSec: number;
  difficulty: GameDifficulty;
  xpEarned: number;
  coinsEarned: number;
  diamondsEarned: number;
  starsEarned: number;
  isPersonalBest: boolean;
  skillDeltas: Partial<Record<SkillId, number>>;
  correctAnswers: number;
  wrongAnswers: number;
  maxCombo: number;
  metadata: Record<string, unknown>;
}

// ============================================
// REGISTRY
// ============================================

export interface GameRegistryEntry {
  definition: GameDefinition;
  component: React.LazyExoticComponent<React.ComponentType<GameComponentProps>>;
}

export interface GameComponentProps {
  engine: GameEngine;
}

// ============================================
// OFFLINE QUEUE
// ============================================

export interface OfflineQueueItem {
  id: string;
  timestamp: number;
  type: 'game_session';
  data: SavePayload;
  isSynced: boolean;
}
