import { create } from 'zustand';

export type GameState = 'idle' | 'countdown' | 'playing' | 'paused' | 'finished';

interface GameStore {
  // Active game
  activeGameSlug: string | null;
  gameState: GameState;
  score: number;
  timeRemaining: number;
  startTime: number | null;

  // Actions
  startGame: (slug: string, durationSec: number) => void;
  setGameState: (state: GameState) => void;
  addScore: (points: number) => void;
  setTimeRemaining: (seconds: number) => void;
  endGame: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  activeGameSlug: null,
  gameState: 'idle',
  score: 0,
  timeRemaining: 0,
  startTime: null,

  startGame: (slug, durationSec) =>
    set({
      activeGameSlug: slug,
      gameState: 'countdown',
      score: 0,
      timeRemaining: durationSec,
      startTime: Date.now(),
    }),

  setGameState: (state) => set({ gameState: state }),

  addScore: (points) =>
    set((prev) => ({ score: prev.score + points })),

  setTimeRemaining: (seconds) =>
    set({ timeRemaining: Math.max(0, seconds) }),

  endGame: () => set({ gameState: 'finished' }),

  resetGame: () =>
    set({
      activeGameSlug: null,
      gameState: 'idle',
      score: 0,
      timeRemaining: 0,
      startTime: null,
    }),
}));
