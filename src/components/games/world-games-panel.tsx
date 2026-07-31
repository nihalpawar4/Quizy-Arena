'use client';

import Link from 'next/link';
import { Lock, ChevronRight, Clock } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { WORLDS } from '@/lib/constants';
import { getGamesForWorld, getWorldProgress, isWorldUnlocked } from '@/lib/worlds';
import { formatSkillLabel, getGameLevelProgress, MAX_GAME_LEVEL } from '@/lib/game-config';
import { GameIcon, WorldIllustration } from '@/components/games/game-icon';
import { CoinIcon } from '@/components/illustrations/icons';
import { getGameCoinCost } from '@/engine/economy';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

interface WorldGamesPanelProps {
  worldSlug: string | null;
  playerLevel: number;
  onClose: () => void;
}

export function WorldGamesPanel({ worldSlug, playerLevel, onClose }: WorldGamesPanelProps) {
  const arenaProfile = useAuthStore((s) => s.arenaProfile);

  if (!worldSlug) return null;

  const world = WORLDS.find((w) => w.slug === worldSlug);
  if (!world) return null;

  const unlocked = isWorldUnlocked(worldSlug, playerLevel);
  const games = getGamesForWorld(worldSlug);
  const progress = getWorldProgress(playerLevel, worldSlug);


  return (
    <Modal
      isOpen={!!worldSlug}
      onClose={onClose}
      title={world.name}
      description={
        unlocked
          ? `Level ${world.unlockLevel} · ${games.length} games available`
          : `Unlocks at Level ${world.unlockLevel}`
      }
      size="lg"
      className="max-w-lg"
    >
      <div className="flex items-center gap-4 mb-5 p-4 rounded-xl bg-card-hover">
        <WorldIllustration slug={worldSlug} size={56} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-primary">{world.name}</span>
            {unlocked ? (
              <Badge variant="success">Unlocked</Badge>
            ) : (
              <Badge variant="default">
                <Lock className="h-3 w-3 mr-1" />
                Lv. {world.unlockLevel}
              </Badge>
            )}
          </div>
          <div className="mt-2">
            <ProgressBar value={unlocked ? 100 : progress} size="sm" />
          </div>
          <p className="text-[11px] text-text-tertiary mt-1">
            {unlocked ? 'All games ready to play' : `${progress}% toward unlock`}
          </p>
        </div>
      </div>

      {unlocked ? (
        <div className="space-y-2">
          {games.length > 0 ? (
            games.map((game) => {
              const highest = arenaProfile?.gameLevels?.[game.slug] ?? 0;
              const levelProgress = getGameLevelProgress(highest);
              const durationMin = Math.max(1, Math.ceil(game.defaultDurationSec / 60));
              const nextLevel = Math.min(highest + 1, MAX_GAME_LEVEL);
              const nextCoinCost = getGameCoinCost(nextLevel);

              return (
                <Link
                  key={game.slug}
                  href={`/games/${game.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface hover:bg-card-hover transition-colors group"
                >
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: `${game.accentColor}15` }}
                  >
                    <GameIcon iconKey={game.iconKey} color={game.accentColor} size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">{game.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="primary">{formatSkillLabel(game.primarySkill)}</Badge>
                      <span className="text-[10px] text-text-tertiary flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {durationMin} min
                      </span>
                      {nextCoinCost > 0 ? (
                        <span className="text-[10px] text-amber-500 flex items-center gap-0.5 font-medium">
                          <CoinIcon size={10} className="text-amber-500" />
                          {nextCoinCost}
                        </span>
                      ) : (
                        <Badge variant="success">Free</Badge>
                      )}
                    </div>
                    <div className="mt-2">
                      <ProgressBar value={levelProgress} size="sm" />
                      <p className="text-[10px] text-text-tertiary mt-0.5">
                        Level {nextLevel}/{MAX_GAME_LEVEL}
                        {highest >= MAX_GAME_LEVEL ? ' · Complete' : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-tertiary group-hover:text-primary transition-colors" />
                </Link>
              );
            })
          ) : (
            <p className="text-sm text-text-tertiary text-center py-6">
              Games coming soon to this world!
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <WorldIllustration slug={worldSlug} size={64} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm text-text-secondary">
            Reach Level {world.unlockLevel} to unlock {world.name}
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            You are currently Level {playerLevel}
          </p>
        </div>
      )}
    </Modal>
  );
}

interface WorldCardProps {
  worldSlug: string;
  playerLevel: number;
  onSelect: (slug: string) => void;
  compact?: boolean;
}

export function WorldCard({ worldSlug, playerLevel, onSelect, compact }: WorldCardProps) {
  const world = WORLDS.find((w) => w.slug === worldSlug);
  if (!world) return null;

  const unlocked = isWorldUnlocked(worldSlug, playerLevel);


  return (
    <button
      type="button"
      onClick={() => onSelect(worldSlug)}
      className={cn(
        'shrink-0 text-left transition-all duration-200 cursor-pointer group',
        compact ? 'w-28 lg:w-32' : 'w-full',
      )}
    >
      <div
        className={cn(
          'rounded-xl overflow-hidden transition-all duration-200',
          unlocked
            ? 'bg-surface hover:bg-card-hover hover:shadow-md'
            : 'bg-surface/60 opacity-60',
          compact ? 'p-3 text-center' : 'p-4 flex items-center gap-4',
        )}
      >
        {compact ? (
          <>
            <WorldIllustration slug={worldSlug} size={48} className="mx-auto mb-2" />
            <p className="text-xs font-semibold text-text-primary truncate">{world.name}</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              {unlocked ? (
                <span className="text-[10px] text-success font-medium">Level {world.unlockLevel}</span>
              ) : (
                <>
                  <Lock className="h-3 w-3 text-text-disabled" />
                  <span className="text-[10px] text-text-tertiary">Lv. {world.unlockLevel}</span>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <WorldIllustration slug={worldSlug} size={56} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">{world.name}</p>
              <p className="text-xs text-text-tertiary mt-0.5">
                {unlocked ? `Level ${world.unlockLevel}` : `Unlocks at Level ${world.unlockLevel}`}
              </p>
            </div>
            {unlocked ? (
              <ChevronRight className="h-4 w-4 text-text-tertiary group-hover:text-primary" />
            ) : (
              <Lock className="h-4 w-4 text-text-disabled" />
            )}
          </>
        )}
      </div>
    </button>
  );
}
