'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { getGameEntry } from '@/engine/registry';
import { GameShell } from '@/engine/components/game-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth-store';
import { getNextPlayLevel } from '@/lib/game-config';
import { isGameUnlockedInWorld } from '@/lib/worlds';
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
  const isProfileLoading = useAuthStore((s) => s.isProfileLoading);

  const [entry, setEntry] = useState<GameRegistryEntry | undefined>(undefined);
  const [accessChecked, setAccessChecked] = useState(false);

  const isDailyChallenge = params.slug === getDailyChallengeSlug();
  const highestCompleted = arenaProfile?.gameLevels?.[params.slug];
  const startLevel = getNextPlayLevel(highestCompleted);

  useEffect(() => {
    const gameEntry = getGameEntry(params.slug);
    if (!gameEntry) {
      router.replace('/games');
      return;
    }

    // Sequential unlock: game must be unlocked (world + previous game completed)
    // Daily challenges bypass the lock check
    const gameOk = isDailyChallenge || isGameUnlockedInWorld(params.slug, arenaProfile?.gameLevels);

    if (!gameOk) {
      router.replace('/games');
      return;
    }

    setEntry(gameEntry);
    setAccessChecked(true);
  }, [params.slug, router, arenaProfile?.gameLevels, isDailyChallenge]);


  if (isProfileLoading || !accessChecked || !entry) {
    return <GamePlaySkeleton />;
  }

  return (
    <GameShell
      key={params.slug}
      definition={entry.definition}
      GameComponent={entry.component}
      initialLevel={startLevel}
      maxLevel={isDailyChallenge ? DAILY_CHALLENGE_LEVELS_REQUIRED : undefined}
      onExit={() => router.push(isDailyChallenge ? '/' : '/games')}
    />
  );
}
