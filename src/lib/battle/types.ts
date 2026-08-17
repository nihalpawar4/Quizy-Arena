/**
 * Battle Arena Types
 *
 * Types for the online matchmaking queue and battle documents.
 */

export interface MatchmakingEntry {
  uid: string;
  displayName: string;
  avatarUrl: string | null;
  globalLevel: number;
  rankPoints: number;
  status: 'waiting' | 'matched';
  battleId: string | null;
  joinedAt: number; // Date.now() timestamp
}

export interface BattlePlayer {
  uid: string;
  displayName: string;
  avatarUrl: string | null;
  globalLevel: number;
  score: number;
  correctCount: number;
  wrongCount: number;
  isFinished: boolean;
}

export interface BattleDocument {
  id: string;
  gameType: 'speed-math';
  status: 'countdown' | 'playing' | 'finished';
  durationSec: number;
  player1: BattlePlayer;
  player2: BattlePlayer;
  winnerId: string | null;
  createdAt: number;
  startedAt: number | null;
  endedAt: number | null;
  /** Seed to generate identical problems for both players */
  problemSeed: number;
}

/** Rewards for winning/losing a battle */
export const BATTLE_REWARDS = {
  winner: {
    xp: 150,
    coins: 80,
    rankPoints: 25,
  },
  loser: {
    xp: 50,
    coins: 20,
    rankPoints: 5,
  },
  draw: {
    xp: 100,
    coins: 50,
    rankPoints: 15,
  },
} as const;

export const BATTLE_DURATION_SEC = 60;
export const MATCHMAKING_TIMEOUT_SEC = 30;
export const BATTLE_COUNTDOWN_SEC = 3;
