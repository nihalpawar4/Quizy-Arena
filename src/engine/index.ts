/**
 * Quizy Arena — Game Engine
 *
 * Public API for the game engine.
 * Games import from '@/engine' to access everything they need.
 */

// Types
export type {
  GameDefinition,
  GameDifficulty,
  GameCategory,
  TimerMode,
  DifficultyConfig,
  GameEngine,
  GameLifecycleState,
  GameComponentProps,
  GameRegistryEntry,
  ScoreInput,
  ScoreResult,
  RewardResult,
  SavePayload,
} from './types';

// Hook
export { useGameEngine } from './use-game-engine';

// Registry
export {
  registerGame,
  getGameEntry,
  getGameDefinition,
  getAllGameDefinitions,
  getGamesByCategory,
  getGamesByWorld,
  getUnlockedGames,
} from './registry';

// Lifecycle
export { isActiveState, isEndedState, isTerminalState } from './lifecycle';

// Components
export {
  GameShell,
  GameHUD,
  CountdownOverlay,
  InstructionsOverlay,
  PauseModal,
  ResultScreen,
  FeedbackFlash,
} from './components';

// Primitives
export {
  GameCard,
  GameGrid,
  GameButton,
  GameInput,
} from './primitives';
