/**
 * Game Lifecycle State Machine
 *
 * Defines valid transitions between game states.
 * No game can skip states or transition illegally.
 */

import type { GameLifecycleState } from './types';

const VALID_TRANSITIONS: Record<GameLifecycleState, GameLifecycleState[]> = {
  loading:      ['instructions'],
  instructions: ['countdown'],
  countdown:    ['playing'],
  playing:      ['paused', 'completed', 'failed'],
  paused:       ['playing', 'failed'],      // Can quit from pause (→ failed)
  completed:    ['scoring'],
  failed:       ['scoring'],
  scoring:      ['results'],
  results:      ['saving'],
  saving:       ['rewards'],
  rewards:      [],                          // Terminal state (exit game)
};

/**
 * Check if a lifecycle transition is valid.
 */
export function isValidTransition(
  from: GameLifecycleState,
  to: GameLifecycleState,
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Attempt a lifecycle transition. Returns the new state or throws.
 */
export function transition(
  current: GameLifecycleState,
  next: GameLifecycleState,
): GameLifecycleState {
  if (!isValidTransition(current, next)) {
    console.warn(
      `[GameEngine] Invalid transition: ${current} → ${next}. Allowed: [${VALID_TRANSITIONS[current].join(', ')}]`,
    );
    return current; // Silently reject invalid transitions in production
  }
  return next;
}

/**
 * Check if the game is in an active (interactable) state.
 */
export function isActiveState(state: GameLifecycleState): boolean {
  return state === 'playing' || state === 'paused';
}

/**
 * Check if the game is in a terminal state (no more transitions).
 */
export function isTerminalState(state: GameLifecycleState): boolean {
  return state === 'rewards';
}

/**
 * Check if the game has ended (completed or failed).
 */
export function isEndedState(state: GameLifecycleState): boolean {
  return (
    state === 'completed' ||
    state === 'failed' ||
    state === 'scoring' ||
    state === 'results' ||
    state === 'saving' ||
    state === 'rewards'
  );
}
