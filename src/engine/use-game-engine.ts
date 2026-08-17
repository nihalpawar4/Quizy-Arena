/**
 * useGameEngine — The main React hook
 *
 * This is the ONLY API a game component needs.
 * It manages the full lifecycle, timer, scoring, rewards, and saving.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  GameDefinition,
  GameDifficulty,
  GameEngine,
  GameLifecycleState,
  ScoreResult,
  RewardResult,
  SavePayload,
} from './types';
import { transition } from './lifecycle';
import { TimerManager, type TimerState } from './timer';
import { calculateScore } from './scoring';
import { calculateRewards } from './rewards';
import { saveGameSession } from './save-manager';
import { getGamesPlayedToday } from './anti-cheat';
import { getLevelConfig, difficultyFromLevel } from './level-generator';
import { useAuthStore } from '@/stores/auth-store';
import { buildSkillsRecord } from '@/lib/firebase/skill-fields';
import { generateId } from '@/lib/utils';

interface UseGameEngineOptions {
  definition: GameDefinition;
  difficulty?: GameDifficulty;
  level?: number;
  onStateChange?: (state: GameLifecycleState) => void;
}

interface GameEngineState {
  state: GameLifecycleState;
  score: number;
  combo: number;
  maxCombo: number;
  lives: number;
  correctAnswers: number;
  wrongAnswers: number;
  currentRound: number;
  totalRounds: number;
  timeRemaining: number;
  timeElapsed: number;
  isLowTime: boolean;
  sessionId: string;

  // Results (populated after scoring)
  scoreResult: ScoreResult | null;
  rewardResult: RewardResult | null;
}

export function useGameEngine(options: UseGameEngineOptions): GameEngine & {
  scoreResult: ScoreResult | null;
  rewardResult: RewardResult | null;
  level: number;
  reset: () => void;
} {
  const { definition, level = 1, onStateChange } = options;
  const difficulty = options.difficulty ?? difficultyFromLevel(level);
  const diffConfig = getLevelConfig(definition.slug, level);

  const { firebaseUser, arenaProfile, userProfile, applyGameRewards } = useAuthStore();

  const [engineState, setEngineState] = useState<GameEngineState>({
    state: 'loading',
    score: 0,
    combo: 0,
    maxCombo: 0,
    lives: definition.supportsLives ? definition.maxLives : 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    currentRound: 0,
    totalRounds: diffConfig.roundCount ?? 0,
    timeRemaining: diffConfig.durationSec,
    timeElapsed: 0,
    isLowTime: false,
    sessionId: generateId(),
    scoreResult: null,
    rewardResult: null,
  });

  const timerRef = useRef<TimerManager | null>(null);
  const stateRef = useRef(engineState.state);
  const sessionOutcomeRef = useRef<'completed' | 'failed' | null>(null);
  const failTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  stateRef.current = engineState.state;

  // ── Lifecycle transition helper ──
  const transitionTo = useCallback(
    (next: GameLifecycleState) => {
      setEngineState((prev) => {
        const newState = transition(prev.state, next);
        if (newState !== prev.state) {
          onStateChange?.(newState);
        }
        return { ...prev, state: newState };
      });
    },
    [onStateChange],
  );

  // ── Timer factory (reused by setup and reset) ──
  const createTimer = useCallback(() => {
    if (definition.timerMode === 'infinite') return null;

    return new TimerManager({
      mode: definition.timerMode,
      durationSec: diffConfig.durationSec,
      perRoundDurationSec: definition.timerMode === 'perRound'
        ? (diffConfig.speed ?? 5)
        : undefined,
      onTick: (timerState: TimerState) => {
        setEngineState((prev) => ({
          ...prev,
          timeRemaining: timerState.remaining,
          timeElapsed: timerState.elapsed,
          isLowTime: timerState.isLowTime,
        }));
      },
      onExpire: () => {
        if (stateRef.current === 'playing') {
          // Mark the outcome before transitioning so levelCompleted is true
          // when the save runs. Without this, timer-expiry games (Speed Math,
          // Pattern Recall, etc.) would never save their level progression.
          sessionOutcomeRef.current = 'completed';
          transitionTo('completed');
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition, diffConfig, transitionTo]);

  // ── Timer setup ──
  useEffect(() => {
    const timer = createTimer();
    timerRef.current = timer;

    return () => {
      timer?.destroy();
      // Clean up any pending fail timeout on unmount
      if (failTimeoutRef.current) {
        clearTimeout(failTimeoutRef.current);
        failTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-transitions after state changes ──
  useEffect(() => {
    const { state } = engineState;

    if (state === 'playing' && timerRef.current && !timerRef.current.getState().isRunning) {
      timerRef.current.start();
    }

    if (state === 'completed' || state === 'failed') {
      timerRef.current?.pause();
      // Auto-transition to scoring
      const timeout = setTimeout(() => transitionTo('scoring'), 50);
      return () => clearTimeout(timeout);
    }

    if (state === 'scoring') {
      // Read live profile data from store (not stale closure) to ensure
      // rewards are calculated against the latest skills, XP, and personal bests
      const liveState = useAuthStore.getState();
      const liveArenaProfile = liveState.arenaProfile;
      const liveUserProfile = liveState.userProfile;

      // Run scoring + rewards calculation
      const scoreResult = calculateScore({
        rawScore: engineState.score,
        maxPossibleScore: diffConfig.maxScore,
        correctAnswers: engineState.correctAnswers,
        wrongAnswers: engineState.wrongAnswers,
        combo: engineState.combo,
        maxCombo: engineState.maxCombo,
        difficulty,
        timeElapsedSec: engineState.timeElapsed,
        timeLimitSec: diffConfig.durationSec,
        timerMode: definition.timerMode,
      });

      const currentSkills = buildSkillsRecord(liveArenaProfile);

      const previousBest = liveArenaProfile?.personalBests?.[definition.slug] ?? null;

      const rewardResult = calculateRewards({
        definition,
        scoreResult,
        difficulty,
        level,
        rawScore: engineState.score,
        correctAnswers: engineState.correctAnswers,
        wrongAnswers: engineState.wrongAnswers,
        maxCombo: engineState.maxCombo,
        currentArenaXp: liveArenaProfile?.arenaXp ?? 0,
        currentGlobalXp: liveUserProfile?.globalXp ?? 0,
        currentArenaStreak: liveArenaProfile?.arenaStreak ?? 0,
        currentSkills,
        previousBestScore: previousBest,
        gamesPlayedToday: getGamesPlayedToday(),
      });

      // Set results synchronously (safe inside useEffect — no need for queueMicrotask)
      setEngineState((prev) => ({
        ...prev,
        scoreResult,
        rewardResult,
      }));

      // Auto-transition to results (delay ensures React commits the state above first)
      const timeout = setTimeout(() => transitionTo('results'), 100);
      return () => clearTimeout(timeout);
    }

    if (state === 'results') {
      // Auto-save after a brief display pause
      const timeout = setTimeout(() => transitionTo('saving'), 500);
      return () => clearTimeout(timeout);
    }

    if (state === 'saving') {
      // Read live profile for the freshest gameLevels
      const liveArena = useAuthStore.getState().arenaProfile;

      // Perform save
      const { scoreResult, rewardResult } = engineState;
      if (scoreResult && rewardResult && firebaseUser) {
        const levelCompleted = sessionOutcomeRef.current === 'completed';
        const prevHighest = liveArena?.gameLevels?.[definition.slug] ?? 0;
        const highestLevel = levelCompleted ? Math.max(prevHighest, level) : prevHighest;

        const payload: SavePayload = {
          sessionId: engineState.sessionId,
          userId: firebaseUser.uid,
          gameSlug: definition.slug,
          level,
          score: scoreResult.finalScore,
          accuracy: scoreResult.accuracy,
          durationSec: Math.round(engineState.timeElapsed),
          difficulty,
          xpEarned: rewardResult.xpEarned,
          coinsEarned: rewardResult.coinsEarned,
          diamondsEarned: rewardResult.diamondsEarned,
          starsEarned: scoreResult.stars,
          isPersonalBest: rewardResult.isPersonalBest,
          skillDeltas: rewardResult.skillDeltas,
          correctAnswers: engineState.correctAnswers,
          wrongAnswers: engineState.wrongAnswers,
          maxCombo: engineState.maxCombo,
          metadata: { levelCompleted, highestLevel },
        };

        applyGameRewards(payload, rewardResult);

        saveGameSession({ payload, rewards: rewardResult, definition, currentGameLevels: liveArena?.gameLevels })
          .then(() => {
            // Re-apply optimistic update after save completes in case the
            // onSnapshot listener delivered stale data in between.
            applyGameRewards(payload, rewardResult);
            transitionTo('rewards');
          })
          .catch((err) => {
            console.error('[GameEngine] Save failed:', err);
            // Re-apply so local state still reflects the completed level
            applyGameRewards(payload, rewardResult);
            transitionTo('rewards'); // Show rewards anyway
          });
      } else {
        transitionTo('rewards');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineState.state]);

  // ── Visibility change handler (auto-pause) ──
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden && stateRef.current === 'playing' && definition.supportsPause) {
        transitionTo('paused');
        timerRef.current?.pause();
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [definition.supportsPause, transitionTo]);

  // ── Build the engine API ──
  const engine: GameEngine = {
    // State
    state: engineState.state,
    sessionOutcome: sessionOutcomeRef.current,
    score: engineState.score,
    timeRemaining: engineState.timeRemaining,
    timeElapsed: engineState.timeElapsed,
    currentRound: engineState.currentRound,
    totalRounds: engineState.totalRounds,
    combo: engineState.combo,
    maxCombo: engineState.maxCombo,
    lives: engineState.lives,
    correctAnswers: engineState.correctAnswers,
    wrongAnswers: engineState.wrongAnswers,
    accuracy:
      engineState.correctAnswers + engineState.wrongAnswers > 0
        ? Math.round(
            (engineState.correctAnswers /
              (engineState.correctAnswers + engineState.wrongAnswers)) *
              100,
          )
        : 0,
    difficulty,
    isPaused: engineState.state === 'paused',
    isLowTime: engineState.isLowTime,
    sessionId: engineState.sessionId,

    // Config
    definition,
    difficultyConfig: diffConfig,

    // Actions
    ready: () => transitionTo('instructions'),
    startCountdown: () => transitionTo('countdown'),
    startPlaying: () => transitionTo('playing'),

    recordCorrect: (points = 10) => {
      setEngineState((prev) => {
        const newCombo = definition.hasComboSystem ? prev.combo + 1 : prev.combo;
        return {
          ...prev,
          score: prev.score + points,
          correctAnswers: prev.correctAnswers + 1,
          combo: newCombo,
          maxCombo: Math.max(prev.maxCombo, newCombo),
        };
      });
    },

    recordWrong: () => {
      setEngineState((prev) => {
        const newLives = definition.supportsLives
          ? Math.max(0, prev.lives - 1)
          : prev.lives;

        // Schedule fail transition once (guard: only if no timeout is already pending)
        if (newLives <= 0 && definition.supportsLives && stateRef.current === 'playing' && !failTimeoutRef.current) {
          sessionOutcomeRef.current = 'failed';
          failTimeoutRef.current = setTimeout(() => {
            failTimeoutRef.current = null;
            transitionTo('failed');
          }, 100);
        }

        return {
          ...prev,
          wrongAnswers: prev.wrongAnswers + 1,
          combo: 0, // Break combo
          lives: newLives,
        };
      });
    },

    addScore: (points) => {
      setEngineState((prev) => ({
        ...prev,
        score: prev.score + points,
      }));
    },

    addCombo: () => {
      setEngineState((prev) => {
        const newCombo = prev.combo + 1;
        return {
          ...prev,
          combo: newCombo,
          maxCombo: Math.max(prev.maxCombo, newCombo),
        };
      });
    },

    breakCombo: () => {
      setEngineState((prev) => ({ ...prev, combo: 0 }));
    },

    loseLife: () => {
      setEngineState((prev) => {
        const newLives = Math.max(0, prev.lives - 1);
        if (newLives <= 0 && stateRef.current === 'playing' && !failTimeoutRef.current) {
          sessionOutcomeRef.current = 'failed';
          failTimeoutRef.current = setTimeout(() => {
            failTimeoutRef.current = null;
            transitionTo('failed');
          }, 100);
        }
        return { ...prev, lives: newLives };
      });
    },

    complete: () => {
      // Guard: only transition if still playing (prevents double-complete)
      if (stateRef.current !== 'playing') return;
      sessionOutcomeRef.current = 'completed';
      transitionTo('completed');
    },
    fail: () => {
      // Guard: only transition if still playing or paused (prevents double-fail)
      if (stateRef.current !== 'playing' && stateRef.current !== 'paused') return;
      sessionOutcomeRef.current = 'failed';
      transitionTo('failed');
    },

    pause: () => {
      if (stateRef.current === 'playing') {
        transitionTo('paused');
        timerRef.current?.pause();
      }
    },

    resume: () => {
      if (stateRef.current === 'paused') {
        transitionTo('playing');
        timerRef.current?.resume();
      } else if (stateRef.current === 'failed') {
        // Extra-life resume: restore 1 life and go back to playing
        sessionOutcomeRef.current = null;
        setEngineState((prev) => ({ ...prev, lives: 1 }));
        transitionTo('playing');
        timerRef.current?.resume();
      }
    },

    setRound: (current, total) => {
      setEngineState((prev) => ({
        ...prev,
        currentRound: current,
        totalRounds: total ?? prev.totalRounds,
      }));
      if (definition.timerMode === 'perRound') {
        timerRef.current?.resetRound();
      }
    },
  };

  // Reset engine for "Play Again" without page reload
  const reset = useCallback(() => {
    sessionOutcomeRef.current = null;

    // Clear any pending fail timeout
    if (failTimeoutRef.current) {
      clearTimeout(failTimeoutRef.current);
      failTimeoutRef.current = null;
    }

    // Destroy old timer and create a fresh one
    timerRef.current?.destroy();
    timerRef.current = createTimer();

    setEngineState({
      state: 'loading',
      score: 0,
      combo: 0,
      maxCombo: 0,
      lives: definition.supportsLives ? definition.maxLives : 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      currentRound: 0,
      totalRounds: diffConfig.roundCount ?? 0,
      timeRemaining: diffConfig.durationSec,
      timeElapsed: 0,
      isLowTime: false,
      sessionId: generateId(),
      scoreResult: null,
      rewardResult: null,
    });
  }, [definition, diffConfig, createTimer]);

  return {
    ...engine,
    scoreResult: engineState.scoreResult,
    rewardResult: engineState.rewardResult,
    level,
    reset,
  };
}
