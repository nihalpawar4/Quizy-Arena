'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { getGameEntry } from '@/engine/registry';
import { GameShell } from '@/engine/components/game-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth-store';
import { getNextPlayLevel } from '@/lib/game-config';
import { levelFromXp } from '@/lib/xp';
import { isWorldUnlocked } from '@/lib/worlds';
import {
  getDailyChallengeSlug,
  DAILY_CHALLENGE_LEVELS_REQUIRED,
} from '@/lib/daily-challenge';
import type { GameRegistryEntry } from '@/engine/types';

import '@/games/register';

export default function GamePlayPage() {
  return (
    <Suspense fallback={<GamePlaySkeleton />}>
      <GamePlayContent />
    </Suspense>
  );
}

function GamePlaySkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="space-y-4 w-48 text-center">
        <Skeleton height={8} className="rounded-full" />
        <p className="text-sm text-text-tertiary">Loading game...</p>
      </div>
    </div>
  );
}

function GamePlayContent() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const arenaProfile = useAuthStore((s) => s.arenaProfile);
  const userProfile = useAuthStore((s) => s.userProfile);

  const [entry, setEntry] = useState<GameRegistryEntry | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);

  const globalLevel = Math.max(
    levelFromXp(userProfile?.globalXp ?? 0),
    arenaProfile?.arenaLevel ?? 1,
    levelFromXp(arenaProfile?.arenaXp ?? 0),
  );

  // Detect if this game is today's daily challenge
  const isDailyChallenge = params.slug === getDailyChallengeSlug();

  useEffect(() => {
    const gameEntry = getGameEntry(params.slug);
    if (!gameEntry) {
      router.replace('/games');
      return;
    }

    const { definition } = gameEntry;
    const worldOk = isWorldUnlocked(definition.worldSlug, globalLevel);
    const levelOk = globalLevel >= definition.unlockLevel;

    if (!worldOk || !levelOk) {
      router.replace('/games');
      return;
    }

    setEntry(gameEntry);
    setIsReady(true);
  }, [params.slug, router, globalLevel]);

  if (!isReady || !entry) {
    return <GamePlaySkeleton />;
  }

  const highestCompleted = arenaProfile?.gameLevels?.[params.slug];
  const startLevel = getNextPlayLevel(highestCompleted);

  return (
    <GameShell
      definition={entry.definition}
      GameComponent={entry.component}
      initialLevel={startLevel}
      maxLevel={isDailyChallenge ? DAILY_CHALLENGE_LEVELS_REQUIRED : undefined}
      onExit={() => router.push(isDailyChallenge ? '/' : '/games')}
    />
  );
}
