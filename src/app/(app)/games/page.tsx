'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Map, LayoutGrid, Lock, Star, ChevronRight, Clock, Zap } from 'lucide-react';
import { CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useAuthStore } from '@/stores/auth-store';
import { WORLDS, UPCOMING_GAMES } from '@/lib/constants';
import { levelFromXp } from '@/lib/xp';
import {
  getUnlockedWorldSlugs,
  getWorldProgress,
  WORLD_IMAGES,
  getGamesForWorld,
} from '@/lib/worlds';
import { ACTIVE_WORLD_SLUGS, formatSkillLabel, getGameLevelProgress } from '@/lib/game-config';
import { getAllGameDefinitions } from '@/engine/registry';
import { WorldGamesPanel } from '@/components/games/world-games-panel';
import { GameIcon, WorldIllustration } from '@/components/games/game-icon';
import { BrainIcon } from '@/components/illustrations/icons';
import { cn } from '@/lib/utils';
import '@/games/register';

type ViewMode = 'map' | 'discover';

const ALL_GAMES = getAllGameDefinitions();

export default function GamesPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-text-tertiary text-sm">Loading games...</div>}>
      <GamesPageContent />
    </Suspense>
  );
}

function GamesPageContent() {
  const searchParams = useSearchParams();
  const worldParam = searchParams.get('world');
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [selectedWorld, setSelectedWorld] = useState<string | null>(worldParam);

  const userProfile = useAuthStore((s) => s.userProfile);
  const arenaProfile = useAuthStore((s) => s.arenaProfile);
  const globalLevel = Math.max(
    levelFromXp(userProfile?.globalXp ?? 0),
    arenaProfile?.arenaLevel ?? 1,
    levelFromXp(arenaProfile?.arenaXp ?? 0),
  );
  const unlockedWorlds = getUnlockedWorldSlugs(globalLevel);

  useEffect(() => {
    if (worldParam) setSelectedWorld(worldParam);
  }, [worldParam]);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Games</h1>
        <div className="flex rounded-xl overflow-hidden bg-card-hover shadow-xs p-0.5">
          <button
            onClick={() => setViewMode('map')}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium transition-all cursor-pointer rounded-lg',
              viewMode === 'map' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary',
            )}
          >
            <Map className="h-3.5 w-3.5" />
            Worlds
          </button>
          <button
            onClick={() => setViewMode('discover')}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium transition-all cursor-pointer rounded-lg',
              viewMode === 'discover' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary',
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Discover
          </button>
        </div>
      </div>

      {viewMode === 'map' ? (
        <WorldMapView playerLevel={globalLevel} unlockedWorlds={unlockedWorlds} onSelectWorld={setSelectedWorld} />
      ) : (
        <DiscoverView playerLevel={globalLevel} unlockedWorlds={unlockedWorlds} />
      )}

      <WorldGamesPanel worldSlug={selectedWorld} playerLevel={globalLevel} onClose={() => setSelectedWorld(null)} />
    </div>
  );
}

function WorldMapView({
  playerLevel,
  unlockedWorlds,
  onSelectWorld,
}: {
  playerLevel: number;
  unlockedWorlds: string[];
  onSelectWorld: (slug: string) => void;
}) {
  const activeWorlds = WORLDS.filter((w) => (ACTIVE_WORLD_SLUGS as readonly string[]).includes(w.slug));
  const lockedWorlds = WORLDS.filter((w) => !(ACTIVE_WORLD_SLUGS as readonly string[]).includes(w.slug));

  return (
    <div className="space-y-3">
      {[...activeWorlds].reverse().map((world) => {
        const isUnlocked = unlockedWorlds.includes(world.slug);
        const worldImg = WORLD_IMAGES[world.slug];
        const progress = getWorldProgress(playerLevel, world.slug);
        const games = getGamesForWorld(world.slug);

        return (
          <button
            key={world.slug}
            type="button"
            onClick={() => onSelectWorld(world.slug)}
            className={cn(
              'w-full rounded-2xl bg-surface shadow-sm overflow-hidden text-left transition-all duration-200 cursor-pointer hover:shadow-md',
              !isUnlocked && 'opacity-60',
            )}
          >
            <div className="flex items-center gap-4 p-4">
              {worldImg ? (
                <div className="h-14 w-14 rounded-xl overflow-hidden shrink-0">
                  <Image src={worldImg} alt={world.name} width={56} height={56} className="h-full w-full object-cover" />
                </div>
              ) : (
                <WorldIllustration slug={world.slug} size={56} />
              )}
              <div className="flex-1 min-w-0">
                <CardTitle>{world.name}</CardTitle>
                <p className="text-xs text-text-tertiary mt-0.5">
                  {isUnlocked ? `Level ${world.unlockLevel} · ${games.length} games` : `Unlocks at Level ${world.unlockLevel}`}
                </p>
                <div className="mt-2"><ProgressBar value={isUnlocked ? 100 : progress} size="sm" /></div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {isUnlocked ? (
                  <>
                    <div className="flex gap-0.5">{[1, 2, 3].map((s) => <Star key={s} className="h-3 w-3 text-text-disabled" />)}</div>
                    <ChevronRight className="h-4 w-4 text-text-tertiary" />
                  </>
                ) : (
                  <Lock className="h-4 w-4 text-text-disabled" />
                )}
              </div>
            </div>
          </button>
        );
      })}

      {lockedWorlds.reverse().map((world) => (
        <div key={world.slug} className="w-full rounded-2xl bg-surface/50 shadow-sm p-4 opacity-50">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-card-hover flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5 text-text-disabled" />
            </div>
            <div className="flex-1">
              <CardTitle>{world.name}</CardTitle>
              <p className="text-xs text-text-tertiary mt-0.5">Unlocks at Level {world.unlockLevel}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function toDiscoverGame(def: ReturnType<typeof getAllGameDefinitions>[number]) {
  return {
    name: def.title,
    slug: def.slug,
    iconKey: def.iconKey,
    color: def.accentColor,
    skill: formatSkillLabel(def.primarySkill),
    time: `${Math.max(1, Math.ceil(def.defaultDurationSec / 60))} min`,
  };
}

function DiscoverView({ playerLevel, unlockedWorlds }: { playerLevel: number; unlockedWorlds: string[] }) {
  const allPlayable = ALL_GAMES.map(toDiscoverGame);

  const categories = [
    { label: 'Popular Today', icon: Zap, games: allPlayable.slice(0, 4) },
    { label: 'Quick Games', icon: Clock, games: allPlayable.filter((g) => g.time.startsWith('1') || g.time.startsWith('2')).slice(0, 4) },
    { label: 'Train Your Brain', icon: BrainIcon, games: allPlayable.slice(3, 7) },
    { label: 'All Games', icon: LayoutGrid, games: allPlayable },
  ];

  return (
    <div className="space-y-8">
      {categories.map((cat) => (
        <section key={cat.label}>
          <div className="flex items-center gap-2 mb-4">
            <cat.icon size={16} className="text-text-tertiary" />
            <h2 className="arena-section-title text-sm">{cat.label}</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto arena-scroll-hidden -mx-4 px-4">
            {cat.games.map((game) => {
              const def = ALL_GAMES.find((g) => g.slug === game.slug)!;
              const worldLocked = !unlockedWorlds.includes(def.worldSlug);
              return (
                <DiscoverGameCard key={`${cat.label}-${game.slug}`} game={game} locked={worldLocked} unlockLevel={def.unlockLevel} />
              );
            })}
          </div>
        </section>
      ))}

      {UPCOMING_GAMES.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Lock size={16} className="text-text-tertiary" />
            <h2 className="arena-section-title text-sm">Coming Soon</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto arena-scroll-hidden -mx-4 px-4">
            {UPCOMING_GAMES.map((game) => (
              <DiscoverGameCard
                key={game.slug}
                game={{
                  name: game.title,
                  slug: game.slug,
                  iconKey: game.iconKey,
                  color: game.color,
                  skill: game.skill,
                  time: game.time,
                }}
                locked
                unlockLevel={game.unlockLevel}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function DiscoverGameCard({
  game,
  locked,
  unlockLevel,
}: {
  game: {
    name: string;
    slug: string;
    iconKey: 'brain' | 'lightning' | 'target' | 'puzzle' | 'eye' | 'crystal';
    color: string;
    skill: string;
    time: string;
  };
  locked: boolean;
  unlockLevel?: number;
}) {
  const inner = (
    <div className={cn('w-44 rounded-2xl bg-surface shadow-sm overflow-hidden transition-all', !locked && 'hover:shadow-md hover:bg-card-hover cursor-pointer', locked && 'opacity-55')}>
      <div className="h-1.5 w-full" style={{ backgroundColor: locked ? '#64748B' : game.color }} />
      <div className="p-4 relative">
        {locked && <div className="absolute top-3 right-3"><Lock className="h-4 w-4 text-text-disabled" /></div>}
        <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${game.color}15` }}>
          <GameIcon iconKey={game.iconKey} color={game.color} size={20} />
        </div>
        <p className="text-sm font-semibold text-text-primary truncate">{game.name}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <Badge variant={locked ? 'default' : 'primary'}>{game.skill}</Badge>
          <span className="text-[10px] text-text-tertiary flex items-center gap-0.5"><Clock className="h-3 w-3" />{game.time}</span>
        </div>
        {locked && unlockLevel && <p className="text-[10px] text-text-tertiary mt-2">Unlocks at Level {unlockLevel}</p>}
      </div>
    </div>
  );

  if (locked) return <div className="shrink-0">{inner}</div>;
  return <Link href={`/games/${game.slug}`} className="shrink-0">{inner}</Link>;
}
