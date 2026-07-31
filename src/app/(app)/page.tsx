'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { useRecentGames } from '@/hooks/use-recent-games';
import { useDailyMissions } from '@/hooks/use-daily-missions';
import { useLeaderboard } from '@/hooks/use-leaderboard';
import { formatNumber, getGreeting } from '@/lib/utils';
import { WORLDS } from '@/lib/constants';
import {
  levelFromXp,
  xpProgress,
  xpToNextLevel,
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
import { ACTIVE_WORLD_SLUGS, getGameLevelProgress, getNextPlayLevel, MAX_GAME_LEVEL } from '@/lib/game-config';
import {
  Swords,
  ChevronRight,
  Clock,
  CheckCircle2,
  Flame,
  Trophy,
  Gift,
  Sparkles,
  TrendingUp,
  Map,
  Gamepad2,
  Users,
  ListChecks,
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
  TreasureIcon,
} from '@/components/illustrations/icons';
import { GameIcon } from '@/components/games/game-icon';
import {
  ContinuePlayingSkeleton,
  MissionsSkeleton,
  LeaderboardSkeleton,
} from '@/components/ui/skeleton';
import { EmptyState } from '@/components/states/empty-state';
import { NoMissionsIllustration } from '@/components/illustrations/empty-illustrations';
import { WorldCard, WorldGamesPanel } from '@/components/games/world-games-panel';
import { cn } from '@/lib/utils';

const GAME_META: Record<
  string,
  { name: string; icon: typeof BrainIcon; iconKey: 'brain' | 'lightning' | 'target'; color: string; skill: string }
> = {
  'memory-match': { name: 'Memory Match', icon: BrainIcon, iconKey: 'brain', color: '#3B82F6', skill: 'Memory' },
  'speed-math': { name: 'Speed Math', icon: LightningIcon, iconKey: 'lightning', color: '#FACC15', skill: 'Reaction' },
  'pattern-recall': { name: 'Pattern Recall', icon: TargetIcon, iconKey: 'target', color: '#22C55E', skill: 'Focus' },
  'memory-grove': { name: 'Memory Grove', icon: BrainIcon, iconKey: 'brain', color: '#22C55E', skill: 'Memory' },
  'logic-sprint': { name: 'Logic Sprint', icon: LightningIcon, iconKey: 'lightning', color: '#38BDF8', skill: 'Logic' },
  'pattern-trail': { name: 'Pattern Trail', icon: TargetIcon, iconKey: 'target', color: '#16A34A', skill: 'Pattern' },
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
  const [selectedWorld, setSelectedWorld] = useState<string | null>(null);

  const { games: recentGames, isLoading: recentLoading } = useRecentGames(6);
  const { missions, isLoading: missionsLoading, claimReward, completedCount, totalCount } = useDailyMissions();
  const { entries: leaderboard, userRank, isLoading: leaderboardLoading } = useLeaderboard(5);

  const displayName = userProfile?.displayName?.split(' ')[0] || 'Player';
  const globalXp = userProfile?.globalXp ?? 0;
  const globalLevel = levelFromXp(globalXp);
  const coins = userProfile?.coins ?? 0;
  const diamonds = userProfile?.diamonds ?? 0;
  const arenaStreak = arenaProfile?.arenaStreak ?? 0;
  const brainScore = arenaProfile?.brainScore ?? 0;
  const gamesPlayed = arenaProfile?.gamesPlayed ?? 0;
  const rank = getRankFromPoints(arenaProfile?.rankPoints ?? 0);

  const xpProg = xpProgress(globalXp);
  const xpRemaining = xpToNextLevel(globalXp);
  const levelStart = cumulativeXpForLevel(globalLevel);
  const nextLevelTotal = xpForLevel(globalLevel + 1);
  const xpInLevel = globalXp - levelStart;

  const dailySlug = getDailyChallengeSlug();
  const dailyMeta = GAME_META[dailySlug] ?? GAME_META['memory-match'];
  const hoursLeft = getHoursUntilMidnight();
  const challengeCompleted = isDailyChallengeCompleted(
    arenaProfile?.dailyChallengeDate,
    arenaProfile?.dailyChallengeSlug,
  );

  const activeWorlds = WORLDS.filter((w) => (ACTIVE_WORLD_SLUGS as readonly string[]).includes(w.slug));

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
    <div className="space-y-5">
      {/* Hero */}
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

      {/* Quick access */}
      <section className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { href: challengeCompleted ? '/games' : `/games/${dailySlug}`, label: 'Daily Challenge', icon: Sparkles, accent: 'text-primary' },
          { href: '/battle', label: 'Battle Arena', icon: Swords, accent: 'text-accent' },
          { href: '/games', label: 'Games', icon: Gamepad2, accent: 'text-primary' },
          { href: '/rewards', label: 'Rewards', icon: Gift, accent: 'text-warning' },
          { href: '/rewards', label: 'Missions', icon: ListChecks, accent: 'text-success' },
          { href: '/profile', label: 'Friends', icon: Users, accent: 'text-text-secondary' },
        ].map((item) => (
          <Link key={item.label} href={item.href} className="group">
            <div className="rounded-xl bg-surface shadow-sm p-3 text-center hover:bg-card-hover hover:shadow-md transition-all h-full flex flex-col items-center justify-center gap-2">
              <item.icon className={cn('h-5 w-5', item.accent, 'group-hover:scale-110 transition-transform')} />
              <span className="text-[10px] sm:text-xs font-medium text-text-secondary leading-tight">{item.label}</span>
            </div>
          </Link>
        ))}
      </section>

      <div className="lg:grid lg:grid-cols-12 lg:gap-5 space-y-4 lg:space-y-0">
        <div className="lg:col-span-8 space-y-4">
          {/* Daily Challenge */}
          {challengeCompleted ? (
            <div className="relative overflow-hidden rounded-2xl p-5 lg:p-6 bg-gradient-to-br from-success/90 to-emerald-600 text-white shadow-md">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80">Daily Challenge Complete</span>
                  </div>
                  <h2 className="text-lg font-bold">{dailyMeta.name}</h2>
                  <p className="text-sm text-white/70 mt-1">Great job! Come back tomorrow for a new challenge.</p>
                </div>
                <div className="hidden sm:flex h-14 w-14 rounded-2xl bg-white/15 items-center justify-center shrink-0">
                  <GameIcon iconKey={dailyMeta.iconKey} color="#fff" size={28} />
                </div>
              </div>
            </div>
          ) : (
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

          {/* Continue Playing */}
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

          {/* Worlds */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                <Map className="h-4 w-4 text-text-tertiary" />Worlds
              </h2>
              <Link href="/games" className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover">
                Explore<ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto arena-scroll-hidden -mx-4 px-4 lg:mx-0 lg:px-0">
              {activeWorlds.map((world) => (
                <WorldCard key={world.slug} worldSlug={world.slug} playerLevel={globalLevel} onSelect={setSelectedWorld} compact />
              ))}
            </div>
          </section>

          {/* Today's reward */}
          <Link href="/rewards" className="block group">
            <div className="rounded-2xl bg-surface shadow-sm p-4 flex items-center gap-4 hover:bg-card-hover transition-colors">
              <div
                className="h-14 w-14 rounded-xl shrink-0 flex items-center justify-center relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #F59E0B20, #D9770620)' }}
              >
                {/* Animated glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-orange-400/10 animate-pulse" />
                <TreasureIcon size={28} className="text-amber-500 relative z-10" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">Today&apos;s Reward</p>
                <p className="text-xs text-text-tertiary mt-0.5">Your daily gift is ready — claim coins and bonuses</p>
              </div>
              <ChevronRight className="h-4 w-4 text-text-tertiary group-hover:text-primary" />
            </div>
          </Link>

          {/* Brain */}
          <section className="rounded-xl bg-surface shadow-sm p-4 lg:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-primary">Your Brain</h2>
              <Link href="/profile" className="text-xs font-medium text-primary hover:text-primary-hover flex items-center gap-1">
                Details<ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-center shrink-0">
                <div className="arena-stat arena-gradient-text text-3xl">{brainScore}</div>
                <p className="text-[10px] text-text-tertiary mt-0.5 font-medium">Brain Score</p>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2">
                {[
                  { label: 'Memory', value: arenaProfile?.skillMemory ?? 0, icon: BrainIcon },
                  { label: 'Logic', value: arenaProfile?.skillLogic ?? 0, icon: TargetIcon },
                  { label: 'Focus', value: arenaProfile?.skillFocus ?? 0, icon: TargetIcon },
                  { label: 'Reaction', value: arenaProfile?.skillReaction ?? 0, icon: LightningIcon },
                ].map((skill) => (
                  <div key={skill.label} className="flex items-center gap-2">
                    <skill.icon size={12} className="text-text-tertiary shrink-0" />
                    <ProgressBar value={skill.value} size="sm" className="flex-1" />
                    <span className="text-[10px] font-mono text-text-tertiary w-5 text-right">{skill.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <StatChip label="Games" value={formatNumber(gamesPlayed)} icon={<Trophy className="h-3.5 w-3.5 text-primary" />} />
            <StatChip label="Rank" value={`#${userRank ?? '—'}`} icon={<TrendingUp className="h-3.5 w-3.5 text-success" />} />
            <StatChip label="Brain" value={String(brainScore)} icon={<BrainIcon size={14} className="text-accent" />} />
          </div>

          <section>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-sm font-semibold text-text-primary">Missions</h2>
              <span className="text-[11px] font-medium text-text-tertiary">{completedCount}/{totalCount}</span>
            </div>
            {missionsLoading ? <MissionsSkeleton /> : missions.length > 0 ? (
              <div className="space-y-1.5">
                {missions.map((mission) => (
                  <div key={mission.id} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-surface transition-colors">
                    <button
                      onClick={() => { if (mission.isCompleted && !mission.isClaimed) claimReward(mission.id); }}
                      disabled={!mission.isCompleted || mission.isClaimed}
                      className={cn(
                        'h-6 w-6 rounded-full flex items-center justify-center shrink-0 cursor-pointer',
                        mission.isClaimed ? 'bg-success text-white' : mission.isCompleted ? 'bg-primary text-white animate-pulse' : 'bg-card-hover text-transparent',
                      )}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={3} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-xs font-medium', mission.isClaimed ? 'text-text-tertiary line-through' : 'text-text-primary')}>{mission.title}</p>
                      <ProgressBar value={mission.currentValue} max={mission.requirementValue} size="sm" className="mt-1" color={mission.isClaimed ? 'success' : 'primary'} />
                    </div>
                    <span className={cn('text-[10px] font-bold shrink-0', mission.isClaimed ? 'text-success' : 'text-primary')}>
                      {mission.isClaimed ? 'Done' : `+${mission.xpReward}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState illustration={<NoMissionsIllustration size={64} />} title="No missions today" description="Play games to unlock missions" compact />
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-sm font-semibold text-text-primary">Leaderboard</h2>
              <Link href="/battle" className="text-xs font-medium text-primary flex items-center gap-1">Full<ChevronRight className="h-3.5 w-3.5" /></Link>
            </div>
            {leaderboardLoading ? <LeaderboardSkeleton /> : (
              <div className="space-y-1">
                {leaderboard.map((player) => (
                  <div key={player.rank} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-surface transition-colors">
                    <span className={cn('text-xs font-bold w-6 text-center shrink-0', player.rank <= 3 ? 'text-primary' : 'text-text-tertiary')}>
                      #{player.rank}
                    </span>
                    <p className="flex-1 text-xs font-medium text-text-primary truncate">{player.displayName}</p>
                    <span className="text-[10px] font-mono text-text-tertiary">{formatNumber(player.globalXp)}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg bg-primary-muted mt-1">
                  <CrownIcon size={14} className="text-primary shrink-0" />
                  <p className="flex-1 text-xs font-medium text-primary">You</p>
                  <span className="text-[10px] font-mono text-primary">#{userRank ?? '—'} · {formatNumber(globalXp)}</span>
                </div>
              </div>
            )}
          </section>

          <div className="grid grid-cols-2 gap-2">
            <Link href="/battle" className="p-3 rounded-xl bg-surface hover:bg-card-hover shadow-sm text-center group">
              <Swords className="h-5 w-5 text-accent mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-semibold text-text-primary">Battle</p>
              <p className="text-[10px] text-text-tertiary">Find opponent</p>
            </Link>
            <Link href="/rewards" className="p-3 rounded-xl bg-surface hover:bg-card-hover shadow-sm text-center group">
              <Gift className="h-5 w-5 text-warning mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-semibold text-text-primary">Rewards</p>
              <p className="text-[10px] text-text-tertiary">Claim daily</p>
            </Link>
          </div>
        </div>
      </div>

      <WorldGamesPanel worldSlug={selectedWorld} playerLevel={globalLevel} onClose={() => setSelectedWorld(null)} />
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

function StatChip({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="p-2.5 rounded-xl bg-surface shadow-sm text-center">
      <div className="flex items-center justify-center mb-1">{icon}</div>
      <p className="text-sm font-bold text-text-primary">{value}</p>
      <p className="text-[10px] text-text-tertiary">{label}</p>
    </div>
  );
}
