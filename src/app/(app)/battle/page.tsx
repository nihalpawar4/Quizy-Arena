'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  Users,
  Trophy,
  ChevronRight,
  Clock,
  Target,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { useLeaderboard } from '@/hooks/use-leaderboard';
import { getRankFromPoints } from '@/lib/xp';
import { formatNumber, cn } from '@/lib/utils';
import {
  CrownIcon,
  LightningIcon,
  DiamondIcon,
  CoinIcon,
} from '@/components/illustrations/icons';
import Link from 'next/link';

// Battle components
import { MatchmakingScreen } from '@/components/battle/matchmaking-screen';
import { BattleGame } from '@/components/battle/battle-game';
import { BattleResult } from '@/components/battle/battle-result';

// Battle services
import {
  joinMatchmaking,
  leaveMatchmaking,
  listenToMatchmaking,
  findAndMatchOpponent,
  listenToBattle,
  updateBattleScore,
  finishBattle,
  startBattle,
  finalizeBattle,
} from '@/lib/battle/matchmaking';
import {
  BATTLE_DURATION_SEC,
  MATCHMAKING_TIMEOUT_SEC,
  BATTLE_COUNTDOWN_SEC,
  BATTLE_REWARDS,
} from '@/lib/battle/types';
import type { BattleDocument, MatchmakingEntry } from '@/lib/battle/types';

// Economy — for awarding rewards
import { getDocRef, increment } from '@/lib/firebase/firestore';
import { updateDoc } from 'firebase/firestore';

type BattlePhase = 'lobby' | 'searching' | 'countdown' | 'playing' | 'result';

export default function BattlePage() {
  const arenaProfile = useAuthStore((s) => s.arenaProfile);
  const userProfile = useAuthStore((s) => s.userProfile);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const addToast = useUIStore((s) => s.addToast);
  const { entries: leaderboard, userRank } = useLeaderboard(5);
  const rank = getRankFromPoints(arenaProfile?.rankPoints ?? 0);
  const globalXp = userProfile?.globalXp ?? 0;

  // Battle state
  const [phase, setPhase] = useState<BattlePhase>('lobby');
  const [searchTime, setSearchTime] = useState(0);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [battle, setBattle] = useState<BattleDocument | null>(null);
  const [countdown, setCountdown] = useState(BATTLE_COUNTDOWN_SEC);
  const [battleResult, setBattleResult] = useState<'win' | 'lose' | 'draw' | null>(null);
  const [rewardsApplied, setRewardsApplied] = useState(false);

  // Refs for cleanup
  const matchmakingUnsub = useRef<(() => void) | null>(null);
  const battleUnsub = useRef<(() => void) | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const matchPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Determine which player I am in the battle
  const myUid = firebaseUser?.uid ?? '';
  const playerKey = battle?.player1?.uid === myUid ? 'player1' : 'player2';
  const myPlayer = battle ? battle[playerKey] : null;
  const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
  const opponent = battle ? battle[opponentKey] : null;

  // Keep a ref that always points to the latest battle state (avoids stale closures)
  const battleRef = useRef<BattleDocument | null>(null);
  battleRef.current = battle;

  // Cleanup all listeners/timers
  const cleanup = useCallback(() => {
    matchmakingUnsub.current?.();
    matchmakingUnsub.current = null;
    battleUnsub.current?.();
    battleUnsub.current = null;
    if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    if (matchPollRef.current) clearInterval(matchPollRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    searchTimerRef.current = null;
    matchPollRef.current = null;
    countdownRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      // Also leave the matchmaking queue if we were searching
      if (myUid) {
        leaveMatchmaking(myUid).catch(() => {});
      }
    };
  }, [cleanup, myUid]);

  // ── Start Searching ──
  const handleFindOpponent = useCallback(async () => {
    if (!firebaseUser || !userProfile) return;

    setPhase('searching');
    setSearchTime(0);
    setIsTimedOut(false);
    setBattle(null);
    setBattleResult(null);
    setRewardsApplied(false);

    const uid = firebaseUser.uid;
    const displayName = userProfile.displayName || 'Player';
    const avatarUrl = userProfile.avatarUrl || null;
    const globalLevel = userProfile.globalLevel || 1;
    const rankPoints = arenaProfile?.rankPoints ?? 0;

    // 1. Join the matchmaking queue
    await joinMatchmaking(uid, displayName, avatarUrl, globalLevel, rankPoints);

    // 2. Listen to our own queue entry for 'matched' status
    matchmakingUnsub.current = listenToMatchmaking(uid, (entry) => {
      if (entry?.status === 'matched' && entry.battleId) {
        // We've been matched! Start listening to the battle
        startListeningToBattle(entry.battleId);
      }
    });

    // 3. Poll for opponents every 2 seconds
    matchPollRef.current = setInterval(async () => {
      try {
        const battleId = await findAndMatchOpponent(
          uid,
          displayName,
          avatarUrl,
          globalLevel,
        );
        if (battleId) {
          // We created the match — start listening
          if (matchPollRef.current) clearInterval(matchPollRef.current);
          matchPollRef.current = null;
          startListeningToBattle(battleId);
        }
      } catch (err) {
        // Query error — continue polling
      }
    }, 2000);

    // 4. Search timer (for display + timeout)
    searchTimerRef.current = setInterval(() => {
      setSearchTime((prev) => {
        const next = prev + 1;
        if (next >= MATCHMAKING_TIMEOUT_SEC) {
          // Timeout — stop searching
          if (searchTimerRef.current) clearInterval(searchTimerRef.current);
          if (matchPollRef.current) clearInterval(matchPollRef.current);
          matchmakingUnsub.current?.();
          leaveMatchmaking(uid).catch(() => {});
          setIsTimedOut(true);
          return next;
        }
        return next;
      });
    }, 1000);
  }, [firebaseUser, userProfile, arenaProfile]);

  // ── Start listening to a battle document ──
  const startListeningToBattle = useCallback((battleId: string) => {
    // Stop matchmaking polling
    if (matchPollRef.current) clearInterval(matchPollRef.current);
    if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    matchPollRef.current = null;
    searchTimerRef.current = null;

    // Start battle listener
    battleUnsub.current = listenToBattle(battleId, (doc) => {
      if (!doc) return;
      setBattle(doc);

      if (doc.status === 'countdown') {
        setPhase('countdown');
      } else if (doc.status === 'playing') {
        setPhase('playing');
      } else if (doc.status === 'finished') {
        // Determine result
        const myUid = firebaseUser?.uid ?? '';
        if (doc.winnerId === null) {
          setBattleResult('draw');
        } else if (doc.winnerId === myUid) {
          setBattleResult('win');
        } else {
          setBattleResult('lose');
        }
        setPhase('result');
      }
    });

    // Move to countdown phase
    setPhase('countdown');
    setCountdown(BATTLE_COUNTDOWN_SEC);

    // Countdown timer
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          countdownRef.current = null;
          // Start the battle
          startBattle(battleId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [firebaseUser]);

  // ── Cancel Search ──
  const handleCancelSearch = useCallback(() => {
    cleanup();
    if (myUid) {
      leaveMatchmaking(myUid).catch(() => {});
    }
    setPhase('lobby');
    setSearchTime(0);
    setIsTimedOut(false);
  }, [cleanup, myUid]);

  // ── Battle Score Update ──
  const handleScoreUpdate = useCallback(
    (score: number, correct: number, wrong: number) => {
      const b = battleRef.current;
      if (!b) return;
      updateBattleScore(b.id, myUid, playerKey, score, correct, wrong);
    },
    [myUid, playerKey],
  );

  // ── Battle Time Up ──
  const handleTimeUp = useCallback(
    async (finalScore: number, correct: number, wrong: number) => {
      const b = battleRef.current;
      if (!b) return;

      // Mark myself as finished in Firestore
      await finishBattle(b.id, playerKey, finalScore, correct, wrong);

      // Safety timeout: if after 5s the battle hasn't finalized, force it
      setTimeout(async () => {
        const latest = battleRef.current;
        if (latest && latest.status !== 'finished') {
          // Build a merged version with my final data
          const merged = { ...latest };
          merged[playerKey] = {
            ...merged[playerKey],
            score: finalScore,
            correctCount: correct,
            wrongCount: wrong,
            isFinished: true,
          };
          await finalizeBattle(latest.id, merged);
        }
      }, 5000);
    },
    [playerKey],
  );

  // Watch for both players finishing — finalize battle
  useEffect(() => {
    if (!battle || battle.status === 'finished') return;
    if (battle.player1.isFinished && battle.player2.isFinished) {
      finalizeBattle(battle.id, battle);
    }
  }, [battle]);

  // ── Apply rewards on result ──
  useEffect(() => {
    if (phase !== 'result' || !battleResult || rewardsApplied || !firebaseUser) return;
    setRewardsApplied(true);

    const rewards = battleResult === 'win'
      ? BATTLE_REWARDS.winner
      : battleResult === 'draw'
        ? BATTLE_REWARDS.draw
        : BATTLE_REWARDS.loser;

    // Apply rewards to Firestore
    const uid = firebaseUser.uid;
    const userRef = getDocRef('users', uid);
    const arenaRef = getDocRef('arena_profiles', uid);

    Promise.all([
      updateDoc(userRef, {
        globalXp: increment(rewards.xp),
        coins: increment(rewards.coins),
      }),
      updateDoc(arenaRef, {
        rankPoints: increment(rewards.rankPoints),
        gamesPlayed: increment(1),
        ...(battleResult === 'win' ? { gamesWon: increment(1) } : {}),
      }),
    ]).then(() => {
      // Update local store optimistically
      const store = useAuthStore.getState();
      if (store.userProfile) {
        store.setUserProfile({
          ...store.userProfile,
          globalXp: store.userProfile.globalXp + rewards.xp,
          coins: store.userProfile.coins + rewards.coins,
        });
      }
      if (store.arenaProfile) {
        store.setArenaProfile({
          ...store.arenaProfile,
          rankPoints: (store.arenaProfile.rankPoints ?? 0) + rewards.rankPoints,
          gamesPlayed: (store.arenaProfile.gamesPlayed ?? 0) + 1,
          gamesWon: (store.arenaProfile.gamesWon ?? 0) + (battleResult === 'win' ? 1 : 0),
        });
      }
    }).catch((err) => {
      console.error('[Battle] Failed to apply rewards:', err);
    });
  }, [phase, battleResult, rewardsApplied, firebaseUser]);

  // ── Play Again ──
  const handlePlayAgain = useCallback(() => {
    cleanup();
    setBattle(null);
    setBattleResult(null);
    setRewardsApplied(false);
    handleFindOpponent();
  }, [cleanup, handleFindOpponent]);

  // ── Back to Lobby ──
  const handleBackToLobby = useCallback(() => {
    cleanup();
    setBattle(null);
    setBattleResult(null);
    setRewardsApplied(false);
    setPhase('lobby');
  }, [cleanup]);

  // ═══════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════

  // ── Searching Phase ──
  if (phase === 'searching') {
    return (
      <MatchmakingScreen
        displayName={userProfile?.displayName?.split(' ')[0] || 'Player'}
        globalLevel={userProfile?.globalLevel ?? 1}
        onCancel={handleCancelSearch}
        timeElapsed={searchTime}
        isTimedOut={isTimedOut}
      />
    );
  }

  // ── Countdown Phase ──
  if (phase === 'countdown' && battle) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center space-y-6"
        >
          {/* VS matchup */}
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">🧠</span>
              </div>
              <p className="text-sm font-semibold text-text-primary">
                {battle.player1.uid === myUid ? 'You' : battle.player1.displayName}
              </p>
            </div>

            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl"
            >
              <Swords className="h-6 w-6 text-white" />
            </motion.div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-danger/15 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">⚔️</span>
              </div>
              <p className="text-sm font-semibold text-text-primary">
                {battle.player2.uid === myUid ? 'You' : battle.player2.displayName}
              </p>
            </div>
          </div>

          {/* Countdown number */}
          <AnimatePresence mode="wait">
            <motion.div
              key={countdown}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-7xl font-black text-primary"
            >
              {countdown > 0 ? countdown : 'GO!'}
            </motion.div>
          </AnimatePresence>

          <p className="text-sm text-text-secondary">
            Speed Math Battle · {BATTLE_DURATION_SEC}s
          </p>
        </motion.div>
      </div>
    );
  }

  // ── Playing Phase ──
  if (phase === 'playing' && battle) {
    return (
      <BattleGame
        seed={battle.problemSeed}
        durationSec={BATTLE_DURATION_SEC}
        opponentName={opponent?.displayName || 'Opponent'}
        opponentScore={opponent?.score ?? 0}
        opponentCorrect={opponent?.correctCount ?? 0}
        onScoreUpdate={handleScoreUpdate}
        onTimeUp={handleTimeUp}
      />
    );
  }

  // ── Result Phase ──
  if (phase === 'result' && battle && battleResult) {
    return (
      <BattleResult
        result={battleResult}
        myScore={myPlayer?.score ?? 0}
        myCorrect={myPlayer?.correctCount ?? 0}
        myWrong={myPlayer?.wrongCount ?? 0}
        opponentName={opponent?.displayName || 'Opponent'}
        opponentScore={opponent?.score ?? 0}
        opponentCorrect={opponent?.correctCount ?? 0}
        onPlayAgain={handlePlayAgain}
        onBack={handleBackToLobby}
      />
    );
  }

  // ═══════════════════════════════════════
  // ── Lobby Phase (default) ──
  // ═══════════════════════════════════════
  return (
    <div className="space-y-8 pb-8">
      <h1 className="text-xl font-bold text-text-primary">Battle Arena</h1>

      {/* ═══ QUICK BATTLE HERO ═══ */}
      <section>
        <div className={cn(
          'relative overflow-hidden rounded-2xl p-6',
          'bg-gradient-to-br from-primary to-blue-700',
          'text-white shadow-md',
        )}>
          <div className="flex items-center gap-2 mb-3">
            <Swords className="h-4 w-4 opacity-80" />
            <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
              Quick Battle
            </span>
          </div>
          <h2 className="text-lg font-bold mb-1">
            Match against a real opponent
          </h2>
          <p className="text-sm opacity-70 mb-5">
            60-second Speed Math duel. Winner takes all.
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs opacity-60">Live PvP</span>
            </div>
            <Button
              className="bg-white text-primary hover:bg-white/90 shadow-sm font-semibold"
              onClick={handleFindOpponent}
            >
              <Swords className="h-4 w-4 mr-1.5" />
              Find Opponent
            </Button>
          </div>
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
          <div className="absolute -right-4 -bottom-10 h-36 w-36 rounded-full bg-white/5" />
        </div>
      </section>

      {/* ═══ BATTLE REWARDS INFO ═══ */}
      <section>
        <h2 className="arena-section-title mb-4">Battle Rewards</h2>
        <div className="grid grid-cols-3 gap-3">
          {/* Win */}
          <div className="rounded-xl bg-surface border border-border p-3 text-center">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
              <Trophy className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-[10px] font-semibold text-amber-500 uppercase">Victory</p>
            <p className="text-xs text-text-secondary mt-1">
              +{BATTLE_REWARDS.winner.xp} XP
            </p>
            <p className="text-xs text-text-secondary">
              +{BATTLE_REWARDS.winner.coins} <CoinIcon size={10} className="inline text-warning" />
            </p>
            <p className="text-xs text-text-secondary">
              +{BATTLE_REWARDS.winner.rankPoints} RP
            </p>
          </div>

          {/* Draw */}
          <div className="rounded-xl bg-surface border border-border p-3 text-center">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <span className="text-lg">🤝</span>
            </div>
            <p className="text-[10px] font-semibold text-primary uppercase">Draw</p>
            <p className="text-xs text-text-secondary mt-1">
              +{BATTLE_REWARDS.draw.xp} XP
            </p>
            <p className="text-xs text-text-secondary">
              +{BATTLE_REWARDS.draw.coins} <CoinIcon size={10} className="inline text-warning" />
            </p>
            <p className="text-xs text-text-secondary">
              +{BATTLE_REWARDS.draw.rankPoints} RP
            </p>
          </div>

          {/* Lose */}
          <div className="rounded-xl bg-surface border border-border p-3 text-center">
            <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-2">
              <span className="text-lg">💪</span>
            </div>
            <p className="text-[10px] font-semibold text-red-400 uppercase">Defeat</p>
            <p className="text-xs text-text-secondary mt-1">
              +{BATTLE_REWARDS.loser.xp} XP
            </p>
            <p className="text-xs text-text-secondary">
              +{BATTLE_REWARDS.loser.coins} <CoinIcon size={10} className="inline text-warning" />
            </p>
            <p className="text-xs text-text-secondary">
              +{BATTLE_REWARDS.loser.rankPoints} RP
            </p>
          </div>
        </div>
      </section>

      {/* ═══ BATTLE MODES ═══ */}
      <section>
        <h2 className="arena-section-title mb-4">Battle Modes</h2>
        <div className="space-y-3">
          {/* Ranked */}
          <div className={cn(
            'rounded-2xl bg-surface border border-border shadow-sm p-5',
            'arena-card-lift',
          )}>
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                <Trophy className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-text-primary">Your Rank</h3>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Current: <span className="text-text-secondary font-medium">{rank.name}</span>
                </p>
                <div className="mt-2">
                  <ProgressBar
                    value={arenaProfile?.rankPoints ?? 0}
                    max={500}
                    size="sm"
                    color="warning"
                  />
                  <p className="text-[10px] text-text-tertiary mt-1">
                    {formatNumber(arenaProfile?.rankPoints ?? 0)} / 500 RP to next rank
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Friend Battle */}
          <div className={cn(
            'rounded-2xl bg-surface border border-border shadow-sm p-5',
            'arena-card-lift cursor-pointer',
          )} onClick={() => addToast({ message: 'Friend battles coming soon!', variant: 'info' })}>
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-text-primary">Friend Battle</h3>
                  <Badge variant="primary">Soon</Badge>
                </div>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Challenge a friend to a brain duel
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-text-tertiary shrink-0" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DAILY BOSS ═══ */}
      <section>
        <div className={cn(
          'relative overflow-hidden rounded-2xl p-5',
          'bg-gradient-to-br from-red-500 to-rose-600',
          'text-white shadow-md',
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 opacity-80" />
            <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
              Daily Boss
            </span>
          </div>
          <h3 className="text-base font-bold mb-0.5">The Logician</h3>
          <p className="text-xs opacity-70 mb-3">
            Beat the AI in Speed Math. Difficulty: Hard.
          </p>
          <div className="flex items-center gap-4 mb-4 text-xs opacity-70">
            <span className="flex items-center gap-1">
              <LightningIcon size={12} />
              +300 XP
            </span>
            <span className="flex items-center gap-1">
              <DiamondIcon size={12} />
              +10
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs opacity-50">Beat 1000+ to win</span>
            <Link href="/games/speed-math">
              <Button size="sm" className="bg-white text-rose-600 hover:bg-white/90 shadow-sm">
                Challenge
              </Button>
            </Link>
          </div>
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
        </div>
      </section>

      {/* ═══ LEADERBOARD ═══ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="arena-section-title">Leaderboard</h2>
        </div>

        <div className="rounded-2xl bg-surface border border-border shadow-sm divide-y divide-border overflow-hidden">
          {leaderboard.length > 0 ? (
            leaderboard.map((entry) => (
                <div key={entry.rank} className="flex items-center gap-3 px-5 py-3.5">
                  <span className={cn(
                    'text-xs font-bold w-8 text-center',
                    entry.rank <= 3 ? 'text-primary' : 'text-text-tertiary',
                  )}>
                    #{entry.rank}
                  </span>
                  <span className="flex-1 text-sm text-text-primary font-medium">
                    {entry.displayName}
                  </span>
                  <span className="text-xs text-text-tertiary font-mono">
                    {formatNumber(entry.globalXp)} XP
                  </span>
                </div>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-text-tertiary">
              Be the first on the leaderboard!
            </div>
          )}

          {/* Your rank */}
          <div className="flex items-center gap-3 px-5 py-3.5 bg-primary-muted">
            <CrownIcon size={18} className="text-primary w-8 text-center" />
            <span className="flex-1 text-sm font-medium text-primary">You</span>
            <span className="text-xs font-mono text-primary">
              #{userRank ?? '—'} · {formatNumber(globalXp)} XP
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
