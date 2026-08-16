'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { ResetNotice } from '@/components/reset-notice';
import { useRecentGames } from '@/hooks/use-recent-games';
import { useLeaderboard } from '@/hooks/use-leaderboard';
import { formatNumber, getGreeting } from '@/lib/utils';
import {
  levelFromXp,
  xpProgress,
  cumulativeXpForLevel,
  xpForLevel,
  getRankFromPoints,
} from '@/lib/xp';
import {
  getDailyChallengeSlug,
  getHoursUntilMidnight,
  isDailyChallengeCompleted,
  DAILY_CHALLENGE_REWARDS,
} from '@/lib/daily-challenge';
import { getGameLevelProgress, getNextPlayLevel, MAX_GAME_LEVEL } from '@/lib/game-config';
import {
  ChevronRight,
  Clock,

  Flame,
  Sparkles,
} from 'lucide-react';
import { ProgressBar } from '@/components/ui/progress-bar';
import { XpRing } from '@/components/illustrations/xp-ring';
import { HeroBanner } from '@/components/illustrations/hero-banner';
import {
  BrainIcon,
  LightningIcon,
  TargetIcon,
  CoinIcon,
  DiamondIcon,
  CrownIcon,
} from '@/components/illustrations/icons';
import { GameIcon } from '@/components/games/game-icon';
import {
  ContinuePlayingSkeleton,
  LeaderboardSkeleton,
} from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const GAME_META: Record<
  string,
  { name: string; icon: typeof BrainIcon; iconKey: 'brain' | 'lightning' | 'target' | 'puzzle' | 'eye' | 'crystal'; color: string; skill: string }
> = {
  'memory-match': { name: 'Memory Match', icon: BrainIcon, iconKey: 'brain', color: '#3B82F6', skill: 'Memory' },
  'speed-math': { name: 'Speed Math', icon: LightningIcon, iconKey: 'lightning', color: '#FACC15', skill: 'Reaction' },
  'pattern-recall': { name: 'Pattern Recall', icon: TargetIcon, iconKey: 'target', color: '#22C55E', skill: 'Focus' },
  'memory-grove': { name: 'Memory Grove', icon: BrainIcon, iconKey: 'brain', color: '#22C55E', skill: 'Memory' },
  'logic-sprint': { name: 'Logic Sprint', icon: LightningIcon, iconKey: 'lightning', color: '#38BDF8', skill: 'Logic' },
  'pattern-trail': { name: 'Pattern Trail', icon: TargetIcon, iconKey: 'target', color: '#16A34A', skill: 'Pattern' },
  'ice-puzzle': { name: 'Ice Puzzle', icon: BrainIcon, iconKey: 'puzzle', color: '#60A5FA', skill: 'Logic' },
  'frost-reflex': { name: 'Frost Reflex', icon: LightningIcon, iconKey: 'lightning', color: '#93C5FD', skill: 'Reaction' },
  'falling-ice': { name: 'Falling Ice', icon: LightningIcon, iconKey: 'crystal', color: '#38BDF8', skill: 'Logic' },
  'glacier-match': { name: 'Glacier Match', icon: BrainIcon, iconKey: 'brain', color: '#7DD3FC', skill: 'Memory' },
  'snowstorm-sort': { name: 'Snowstorm Sort', icon: TargetIcon, iconKey: 'eye', color: '#A5F3FC', skill: 'Focus' },
};

function getLevelTitle(level: number): string {
  if (level < 3) return 'Novice Thinker';
  if (level < 6) return 'Rising Mind';
  if (level < 10) return 'Sharp Learner';
  if (level < 15) return 'Brain Athlete';
  if (level < 25) return 'Master Strategist';
  return 'Arena Champion';
}

export default function HomePage() {
  const userProfile = useAuthStore((s) => s.userProfile);
  const arenaProfile = useAuthStore((s) => s.arenaProfile);

  const { games: recentGames, isLoading: recentLoading } = useRecentGames(6);
  const { entries: leaderboard, userRank, isLoading: leaderboardLoading } = useLeaderboard(5);

  const displayName = userProfile?.displayName?.split(' ')[0] || 'Player';
  const globalXp = userProfile?.globalXp ?? 0;
  const globalLevel = levelFromXp(globalXp);
  const coins = userProfile?.coins ?? 0;
  const diamonds = userProfile?.diamonds ?? 0;
  const arenaStreak = arenaProfile?.arenaStreak ?? 0;
  const rank = getRankFromPoints(arenaProfile?.rankPoints ?? 0);

  const xpProg = xpProgress(globalXp);
  const levelStart = cumulativeXpForLevel(globalLevel);
  const nextLevelTotal = xpForLevel(globalLevel + 1);
  const xpInLevel = globalXp - levelStart;

  const dailySlug = getDailyChallengeSlug();
  const dailyMeta = GAME_META[dailySlug] ?? GAME_META['memory-match'];
  const hoursLeft = getHoursUntilMidnight();
  // Check the explicit flag written by save-manager when the daily challenge is completed
  const challengeCompleted = isDailyChallengeCompleted(
    arenaProfile?.dailyChallengeDate,
    arenaProfile?.dailyChallengeSlug,
  );

  const defaultGames = Object.entries(GAME_META).slice(0, 3).map(([slug, meta]) => {
    const highest = arenaProfile?.gameLevels?.[slug] ?? 0;
    const nextLevel = getNextPlayLevel(highest);
    return {
      slug,
      meta,
      subtitle: highest >= MAX_GAME_LEVEL ? 'Complete' : `Level ${nextLevel}/${MAX_GAME_LEVEL}`,
      progress: getGameLevelProgress(highest),
    };
  });

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Reset notice popup — shows once after major update */}
      <ResetNotice />

      {/* ═══ Hero Banner ═══ */}
      <section className="relative overflow-hidden rounded-3xl bg-surface shadow-md">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/10 pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-6 p-5 lg:p-8">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-secondary mb-4">
              {getGreeting()}, {displayName}! Ready to sharpen your brain today?
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <XpRing progress={xpProg * 100} level={globalLevel} size={88} strokeWidth={5} />
              <div>
                <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Your Progress</p>
                <p className="text-lg font-bold text-text-primary mt-0.5">
                  Level {globalLevel}{' '}
                  <span className="text-sm font-medium text-text-secondary">{getLevelTitle(globalLevel)}</span>
                </p>
                <p className="text-xs text-text-tertiary font-mono mt-1">
                  {formatNumber(xpInLevel)} / {formatNumber(nextLevelTotal)} XP
                </p>
                <ProgressBar value={xpProg * 100} size="sm" className="mt-2 max-w-xs" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-5">
              <StatPill icon={<CoinIcon size={14} className="text-warning" />} label={formatNumber(coins)} />
              <StatPill icon={<DiamondIcon size={14} className="text-accent" />} label={formatNumber(diamonds)} />
              <StatPill icon={<Flame className="h-3.5 w-3.5 text-danger" />} label={`${arenaStreak} Day Streak`} />
              <StatPill icon={<CrownIcon size={14} className="text-primary" />} label={rank.name} />
            </div>
          </div>
          <div className="hidden lg:block w-48 xl:w-56 shrink-0">
            <HeroBanner />
          </div>
        </div>
      </section>

      {/* ═══ Daily Challenge (hidden when completed) ═══ */}
      {!challengeCompleted && (
        <Link href={`/games/${dailySlug}`} className="block group">
          <div className="relative overflow-hidden rounded-2xl p-5 lg:p-6 bg-gradient-to-br from-primary via-primary to-accent text-white shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="h-4 w-4 text-yellow-300" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Daily Challenge</span>
                </div>
                <h2 className="text-lg font-bold">{dailyMeta.name}</h2>
                <p className="text-sm text-white/70 mt-1">Complete today&apos;s challenge — 3 levels to master</p>
                <div className="flex items-center gap-4 text-xs text-white/60 mt-3">
                  <span className="flex items-center gap-1"><LightningIcon size={13} className="text-yellow-300" />+{DAILY_CHALLENGE_REWARDS.xp} XP</span>
                  <span className="flex items-center gap-1"><CoinIcon size={13} className="text-yellow-300" />+{DAILY_CHALLENGE_REWARDS.coins}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{hoursLeft}h left</span>
                </div>
              </div>
              <div className="hidden sm:flex h-14 w-14 rounded-2xl bg-white/10 items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <GameIcon iconKey={dailyMeta.iconKey} color="#fff" size={28} />
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* ═══ Continue Playing ═══ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-primary">Continue Playing</h2>
          <Link href="/games" className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover">
            All Games<ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {recentLoading ? (
          <ContinuePlayingSkeleton />
        ) : (
          <div className="flex gap-3 overflow-x-auto arena-scroll-hidden -mx-4 px-4 lg:mx-0 lg:px-0">
            {(recentGames.length > 0
              ? recentGames.map((game) => {
                  const meta = GAME_META[game.gameSlug] ?? { name: game.gameSlug, icon: BrainIcon, iconKey: 'brain' as const, color: '#3B82F6', skill: 'Brain' };
                  const highest = arenaProfile?.gameLevels?.[game.gameSlug] ?? 0;
                  const nextLevel = getNextPlayLevel(highest);
                  return {
                    slug: game.gameSlug,
                    meta,
                    subtitle: highest >= MAX_GAME_LEVEL ? 'Complete' : `Level ${nextLevel}/${MAX_GAME_LEVEL}`,
                    progress: getGameLevelProgress(highest),
                  };
                })
              : defaultGames
            ).map((game) => (
              <Link key={game.slug} href={`/games/${game.slug}`} className="shrink-0">
                <div className="w-40 p-4 rounded-xl bg-surface hover:bg-card-hover shadow-sm hover:shadow-md transition-all group/card">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-2.5 group-hover/card:scale-105 transition-transform" style={{ backgroundColor: `${game.meta.color}15` }}>
                    <game.meta.icon size={20} style={{ color: game.meta.color }} />
                  </div>
                  <p className="text-sm font-semibold text-text-primary truncate">{game.meta.name}</p>
                  <p className="text-[11px] text-text-tertiary mt-0.5 mb-2.5">{game.subtitle}</p>
                  <ProgressBar value={game.progress} size="sm" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ═══ Leaderboard ═══ */}
      <section className="rounded-2xl bg-surface shadow-sm p-4 lg:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-primary">Leaderboard</h2>
          <Link href="/battle" className="text-xs font-medium text-primary flex items-center gap-1">
            View All<ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {leaderboardLoading ? <LeaderboardSkeleton /> : (
          <div className="space-y-1">
            {leaderboard.map((player) => (
              <div key={player.rank} className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg hover:bg-card-hover transition-colors">
                <span className={cn('text-xs font-bold w-6 text-center shrink-0', player.rank <= 3 ? 'text-primary' : 'text-text-tertiary')}>
                  #{player.rank}
                </span>
                <p className="flex-1 text-xs font-medium text-text-primary truncate">{player.displayName}</p>
                <span className="text-[10px] font-mono text-text-tertiary">{formatNumber(player.globalXp)} XP</span>
              </div>
            ))}
            <div className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg bg-primary-muted mt-1">
              <CrownIcon size={14} className="text-primary shrink-0" />
              <p className="flex-1 text-xs font-semibold text-primary">You</p>
              <span className="text-[10px] font-mono text-primary">#{userRank ?? '—'} · {formatNumber(globalXp)} XP</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function StatPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-card-hover text-xs font-semibold text-text-primary">
      {icon}
      {label}
    </div>
  );
}
