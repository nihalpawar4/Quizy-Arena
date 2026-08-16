/**
 * Timer Manager
 *
 * One timer system used by every game.
 * Uses performance.now() for accuracy (not setInterval).
 * Supports countdown, countup, perRound, and infinite modes.
 */

import type { TimerMode } from './types';

export interface TimerState {
  remaining: number;    // Seconds remaining (countdown/perRound)
  elapsed: number;      // Seconds elapsed (always tracked)
  isRunning: boolean;
  isLowTime: boolean;
  isExpired: boolean;
}

export interface TimerOptions {
  mode: TimerMode;
  durationSec: number;
  perRoundDurationSec?: number;
  lowTimeThresholdSec?: number;
  onTick?: (state: TimerState) => void;
  onLowTime?: () => void;
  onExpire?: () => void;
}

const DEFAULT_LOW_TIME_SEC = 10;

/** Minimum ms between onTick callbacks to avoid excessive React re-renders */
const TICK_THROTTLE_MS = 100;

export class TimerManager {
  private mode: TimerMode;
  private durationSec: number;
  private perRoundDurationSec: number;
  private lowTimeThresholdSec: number;

  private startTime: number = 0;
  private pausedAt: number = 0;
  private totalPausedMs: number = 0;
  private roundPausedMs: number = 0;
  private animFrameId: number = 0;
  private isRunning: boolean = false;
  private hasTriggeredLowTime: boolean = false;
  private roundStartTime: number = 0;
  private lastTickMs: number = 0;

  private onTick?: (state: TimerState) => void;
  private onLowTime?: () => void;
  private onExpire?: () => void;

  constructor(options: TimerOptions) {
    this.mode = options.mode;
    this.durationSec = options.durationSec;
    this.perRoundDurationSec = options.perRoundDurationSec ?? options.durationSec;
    this.lowTimeThresholdSec = options.lowTimeThresholdSec ?? DEFAULT_LOW_TIME_SEC;
    this.onTick = options.onTick;
    this.onLowTime = options.onLowTime;
    this.onExpire = options.onExpire;
  }

  /**
   * Start the timer.
   */
  start(): void {
    if (this.mode === 'infinite') {
      this.startTime = performance.now();
      this.isRunning = true;
      return; // No ticking needed for infinite mode
    }

    this.startTime = performance.now();
    this.roundStartTime = this.startTime;
    this.totalPausedMs = 0;
    this.roundPausedMs = 0;
    this.isRunning = true;
    this.hasTriggeredLowTime = false;
    this.lastTickMs = 0;
    this.tick();
  }

  /**
   * Pause the timer.
   */
  pause(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.pausedAt = performance.now();
    cancelAnimationFrame(this.animFrameId);
  }

  /**
   * Resume the timer.
   */
  resume(): void {
    if (this.isRunning) return;
    const pauseDuration = performance.now() - this.pausedAt;
    this.totalPausedMs += pauseDuration;
    this.roundPausedMs += pauseDuration;
    this.isRunning = true;
    this.tick();
  }

  /**
   * Reset the round timer (for perRound mode).
   */
  resetRound(): void {
    this.roundStartTime = performance.now();
    this.roundPausedMs = 0;
    this.hasTriggeredLowTime = false;
  }

  /**
   * Get current timer state.
   */
  getState(): TimerState {
    const elapsed = this.getElapsedSec();

    let remaining: number;
    if (this.mode === 'countdown') {
      remaining = Math.max(0, this.durationSec - elapsed);
    } else if (this.mode === 'perRound') {
      const roundElapsed = this.getRoundElapsedSec();
      remaining = Math.max(0, this.perRoundDurationSec - roundElapsed);
    } else {
      remaining = 0;
    }

    const isLowTime =
      (this.mode === 'countdown' || this.mode === 'perRound') &&
      remaining > 0 &&
      remaining <= this.lowTimeThresholdSec;

    const isExpired =
      (this.mode === 'countdown' || this.mode === 'perRound') &&
      remaining <= 0;

    return {
      remaining: Math.round(remaining * 10) / 10,
      elapsed: Math.round(elapsed * 10) / 10,
      isRunning: this.isRunning,
      isLowTime,
      isExpired,
    };
  }

  /**
   * Get total elapsed seconds (excluding paused time).
   */
  getElapsedSec(): number {
    if (this.startTime === 0) return 0;
    const now = this.isRunning ? performance.now() : this.pausedAt;
    return (now - this.startTime - this.totalPausedMs) / 1000;
  }

  /**
   * Get elapsed seconds in current round (excluding only this round's paused time).
   */
  private getRoundElapsedSec(): number {
    const now = this.isRunning ? performance.now() : this.pausedAt;
    return (now - this.roundStartTime - this.roundPausedMs) / 1000;
  }

  /**
   * Stop and clean up the timer.
   */
  destroy(): void {
    this.isRunning = false;
    cancelAnimationFrame(this.animFrameId);
  }

  /**
   * Internal tick loop using requestAnimationFrame.
   * onTick is throttled to fire at most every TICK_THROTTLE_MS to avoid
   * excessive React state updates (~60 setState/sec → ~10 setState/sec).
   * Expiry/lowTime checks still run every frame for accuracy.
   */
  private tick = (): void => {
    if (!this.isRunning) return;

    const state = this.getState();
    const now = performance.now();

    // Low time warning (checked every frame)
    if (state.isLowTime && !this.hasTriggeredLowTime) {
      this.hasTriggeredLowTime = true;
      this.onLowTime?.();
    }

    // Timer expired (checked every frame)
    if (state.isExpired) {
      this.isRunning = false;
      this.onTick?.(state); // Final tick with expired state
      this.onExpire?.();
      return;
    }

    // Throttled tick callback to avoid excessive React re-renders
    if (now - this.lastTickMs >= TICK_THROTTLE_MS) {
      this.lastTickMs = now;
      this.onTick?.(state);
    }

    this.animFrameId = requestAnimationFrame(this.tick);
  };
}
