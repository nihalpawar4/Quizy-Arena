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

  const { firebaseUser, arenaProfile, userProfile } = useAuthStore();

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
  stateRef.current = engineState.state;

  // ── Timer setup ──
  useEffect(() => {
    if (definition.timerMode === 'infinite') return;

    const timer = new TimerManager({
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
          transitionTo('completed');
        }
      },
    });

    timerRef.current = timer;

    return () => {
      timer.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      const currentSkills: Record<string, number> = {
        memory: arenaProfile?.skillMemory ?? 50,
        logic: arenaProfile?.skillLogic ?? 50,
        focus: arenaProfile?.skillFocus ?? 50,
        reaction: arenaProfile?.skillReaction ?? 50,
        creativity: arenaProfile?.skillCreativity ?? 50,
        problemSolving: arenaProfile?.skillProblemSolving ?? 50,
        patternRecognition: arenaProfile?.skillPatternRecognition ?? 50,
        decisionMaking: arenaProfile?.skillDecisionMaking ?? 50,
      };

      const previousBest = arenaProfile?.personalBests?.[definition.slug] ?? null;

      const rewardResult = calculateRewards({
        definition,
        scoreResult,
        difficulty,
        level,
        rawScore: engineState.score,
        correctAnswers: engineState.correctAnswers,
        wrongAnswers: engineState.wrongAnswers,
        maxCombo: engineState.maxCombo,
        currentArenaXp: arenaProfile?.arenaXp ?? 0,
        currentGlobalXp: userProfile?.globalXp ?? 0,
        currentArenaStreak: arenaProfile?.arenaStreak ?? 0,
        currentSkills,
        previousBestScore: previousBest,
        gamesPlayedToday: getGamesPlayedToday(),
      });

      queueMicrotask(() => {
        setEngineState((prev) => ({
          ...prev,
          scoreResult,
          rewardResult,
        }));
      });

      // Auto-transition to results
      const timeout = setTimeout(() => transitionTo('results'), 100);
      return () => clearTimeout(timeout);
    }

    if (state === 'results') {
      // Auto-save after a brief display pause
      const timeout = setTimeout(() => transitionTo('saving'), 500);
      return () => clearTimeout(timeout);
    }

    if (state === 'saving') {
      // Perform save
      const { scoreResult, rewardResult } = engineState;
      if (scoreResult && rewardResult && firebaseUser) {
        const levelCompleted = sessionOutcomeRef.current === 'completed';
        const prevHighest = arenaProfile?.gameLevels?.[definition.slug] ?? 0;
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

        saveGameSession({ payload, rewards: rewardResult, definition })
          .then(() => transitionTo('rewards'))
          .catch((err) => {
            console.error('[GameEngine] Save failed:', err);
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
          ? prev.lives - 1
          : prev.lives;

        if (newLives <= 0 && definition.supportsLives) {
          // Schedule fail transition
          setTimeout(() => transitionTo('failed'), 100);
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
        const newLives = prev.lives - 1;
        if (newLives <= 0) {
          setTimeout(() => transitionTo('failed'), 100);
        }
        return { ...prev, lives: newLives };
      });
    },

    complete: () => {
      sessionOutcomeRef.current = 'completed';
      transitionTo('completed');
    },
    fail: () => {
      sessionOutcomeRef.current = 'failed';
      transitionTo('failed');
    },

    pause: () => {
      if (engineState.state === 'playing') {
        transitionTo('paused');
        timerRef.current?.pause();
      }
    },

    resume: () => {
      if (engineState.state === 'paused') {
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
    timerRef.current?.destroy();
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
  }, [definition, diffConfig]);

  return {
    ...engine,
    scoreResult: engineState.scoreResult,
    rewardResult: engineState.rewardResult,
    level,
    reset,
  };
}
