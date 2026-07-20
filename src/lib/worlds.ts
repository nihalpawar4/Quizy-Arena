import { WORLDS } from '@/lib/constants';
import { ACTIVE_WORLD_SLUGS } from '@/lib/game-config';
import { getAllGameDefinitions } from '@/engine/registry';
import '@/games/register';

/**
 * Worlds unlocked when the player's global level meets the requirement.
 * Only active release worlds are returned.
 */
export function getUnlockedWorldSlugs(playerLevel: number): string[] {
  return WORLDS.filter(
    (w) =>
      (ACTIVE_WORLD_SLUGS as readonly string[]).includes(w.slug) &&
      w.unlockLevel <= playerLevel,
  ).map((w) => w.slug);
}

export function isWorldUnlocked(worldSlug: string, playerLevel: number): boolean {
  const world = WORLDS.find((w) => w.slug === worldSlug);
  if (!world) return false;
  return playerLevel >= world.unlockLevel;
}

export function getWorldProgress(playerLevel: number, worldSlug: string): number {
  const world = WORLDS.find((w) => w.slug === worldSlug);
  if (!world) return 0;
  if (playerLevel >= world.unlockLevel) return 100;

  const prevWorld = WORLDS.filter((w) => w.unlockLevel < world.unlockLevel)
    .sort((a, b) => b.unlockLevel - a.unlockLevel)[0];
  const prevLevel = prevWorld?.unlockLevel ?? 1;
  const range = world.unlockLevel - prevLevel;
  const progress = playerLevel - prevLevel;
  return Math.max(0, Math.min(100, Math.round((progress / range) * 100)));
}

export function getGamesForWorld(worldSlug: string) {
  return getAllGameDefinitions()
    .filter((g) => g.worldSlug === worldSlug)
    .sort((a, b) => a.sortOrderInWorld - b.sortOrderInWorld);
}

export const WORLD_IMAGES: Record<string, string> = {
  'training-camp': '/illustrations/world-training-camp.png',
  'forest-of-focus': '/illustrations/world-forest.png',
  'ice-kingdom': '/illustrations/world-ice-kingdom.png',
};
