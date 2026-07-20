'use client';

import { Swords, Users, Trophy, ChevronRight, Clock, Target } from 'lucide-react';
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
} from '@/components/illustrations/icons';
import Link from 'next/link';

export default function BattlePage() {
  const arenaProfile = useAuthStore((s) => s.arenaProfile);
  const userProfile = useAuthStore((s) => s.userProfile);
  const addToast = useUIStore((s) => s.addToast);
  const { entries: leaderboard, userRank } = useLeaderboard(5);
  const rank = getRankFromPoints(arenaProfile?.rankPoints ?? 0);
  const globalXp = userProfile?.globalXp ?? 0;

  function handleComingSoon() {
    addToast({ message: 'Coming Soon — Multiplayer is in development!', variant: 'info' });
  }

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
            Match against a random opponent
          </h2>
          <p className="text-sm opacity-70 mb-5">
            60-second brain duel. Winner takes all.
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs opacity-60">Coming soon</span>
            </div>
            <Button
              className="bg-white text-primary hover:bg-white/90 shadow-sm font-semibold"
              onClick={handleComingSoon}
            >
              Find Opponent
            </Button>
          </div>
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
          <div className="absolute -right-4 -bottom-10 h-36 w-36 rounded-full bg-white/5" />
        </div>
      </section>

      {/* ═══ BATTLE MODES ═══ */}
      <section>
        <h2 className="arena-section-title mb-4">Battle Modes</h2>
        <div className="space-y-3">
          {/* Ranked */}
          <div className={cn(
            'rounded-2xl bg-surface border border-border shadow-sm p-5',
            'arena-card-lift cursor-pointer',
          )} onClick={handleComingSoon}>
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                <Trophy className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-text-primary">Ranked Battles</h3>
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
              <ChevronRight className="h-4 w-4 text-text-tertiary shrink-0" />
            </div>
          </div>

          {/* Friend Battle */}
          <div className={cn(
            'rounded-2xl bg-surface border border-border shadow-sm p-5',
            'arena-card-lift cursor-pointer',
          )}>
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-text-primary">Friend Battle</h3>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Challenge a friend to a brain duel
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={handleComingSoon}>Challenge</Button>
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

      {/* ═══ WEEKLY CHAMPIONSHIP ═══ */}
      <section>
        <div className={cn(
          'rounded-2xl bg-surface border border-border shadow-sm p-5',
          'arena-card-lift cursor-pointer',
        )} onClick={handleComingSoon}>
          <div className="flex items-center gap-2 mb-3">
            <CrownIcon size={16} className="text-warning" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-warning">
              Weekly Championship
            </span>
            <Badge variant="warning">Soon</Badge>
          </div>
          <h3 className="text-sm font-semibold text-text-primary mb-0.5">
            Speed Math Showdown
          </h3>
          <div className="flex items-center gap-1 text-xs text-text-tertiary mb-3">
            <Clock className="h-3 w-3" />
            Coming Soon
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-tertiary">
              Top 10 earn <span className="text-warning font-medium">Exclusive Badge</span>
            </p>
            <Button size="sm" variant="secondary" onClick={handleComingSoon}>Compete</Button>
          </div>
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
