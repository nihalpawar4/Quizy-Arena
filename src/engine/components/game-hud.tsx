'use client';

import { Pause, Heart, Target, Flame, Clock } from 'lucide-react';
import type { GameEngine } from '../types';
import { formatTimer } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface GameHUDProps {
  engine: GameEngine;
}

/**
 * GameHUD displays score, timer, combo, and lives during gameplay.
 * Automatically shows/hides elements based on game config.
 */
export function GameHUD({ engine }: GameHUDProps) {
  const {
    score,
    timeRemaining,
    timeElapsed,
    combo,
    lives,
    isLowTime,
    definition,
    currentRound,
    totalRounds,
  } = engine;

  const showTimer = definition.timerMode !== 'infinite';
  const showCombo = definition.hasComboSystem && combo > 1;
  const showLives = definition.supportsLives;
  const showRounds = totalRounds > 0;

  const displayTime =
    definition.timerMode === 'countdown' || definition.timerMode === 'perRound'
      ? Math.ceil(timeRemaining)
      : Math.floor(timeElapsed);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-surface/80 backdrop-blur-sm border-b border-border">
      {/* Left: Timer */}
      <div className="flex items-center gap-2">
        {showTimer && (
          <div
            className={cn(
              'flex items-center gap-1.5 font-mono text-sm font-bold tabular-nums',
              isLowTime ? 'text-danger animate-pulse' : 'text-text-primary',
            )}
          >
            <Clock className="h-4 w-4" />
            <span>{formatTimer(displayTime)}</span>
          </div>
        )}

        {showRounds && (
          <span className="text-xs text-text-tertiary">
            R{currentRound}/{totalRounds}
          </span>
        )}
      </div>

      {/* Center: Score */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Target className="h-4 w-4 text-text-secondary" />
          <span className="font-mono text-base font-bold text-text-primary tabular-nums">
            {score.toLocaleString()}
          </span>
        </div>

        {/* Combo */}
        {showCombo && (
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold',
              'bg-warning-muted text-warning',
              combo >= 10 && 'animate-bounce',
            )}
          >
            <Flame className="h-3 w-3" />
            x{combo}
          </div>
        )}
      </div>

      {/* Right: Lives + Pause */}
      <div className="flex items-center gap-3">
        {showLives && (
          <div className="flex items-center gap-1">
            {Array.from({ length: definition.maxLives }).map((_, i) => (
              <Heart
                key={i}
                className={cn(
                  'h-4 w-4 transition-all',
                  i < lives
                    ? 'text-danger fill-danger'
                    : 'text-text-disabled',
                  i === lives && 'animate-ping',
                )}
              />
            ))}
          </div>
        )}

        {definition.supportsPause && (
          <button
            onClick={() => engine.pause()}
            className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-card transition-colors cursor-pointer"
            aria-label="Pause"
          >
            <Pause className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
