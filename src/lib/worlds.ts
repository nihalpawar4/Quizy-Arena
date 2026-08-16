import { WORLDS } from '@/lib/constants';
import { ACTIVE_WORLD_SLUGS, MAX_GAME_LEVEL } from '@/lib/game-config';
import { getAllGameDefinitions } from '@/engine/registry';
import '@/games/register';

/**
 * Games that only need 3 levels completed (instead of 10) to count as "done"
 * for unlocking the next game/world. These are harder pattern games.
 */
const BYPASS_SLUGS = new Set(['pattern-recall', 'pattern-trail']);

/** How many levels a game needs to count as "completed" for unlock purposes. */
function requiredLevelsForGame(slug: string): number {
  return BYPASS_SLUGS.has(slug) ? 3 : MAX_GAME_LEVEL;
}

/** Check if a specific game counts as "done" for unlock progression. */
export function isGameDone(slug: string, gameLevels?: Record<string, number>): boolean {
  const highest = gameLevels?.[slug] ?? 0;
  return highest >= requiredLevelsForGame(slug);
}

/**
 * Get sorted games for a world.
 */
export function getGamesForWorld(worldSlug: string) {
  return getAllGameDefinitions()
    .filter((g) => g.worldSlug === worldSlug)
    .sort((a, b) => a.sortOrderInWorld - b.sortOrderInWorld);
}

/**
 * Check if a specific game is unlocked within its world.
 * Rule: First game in a world is always unlocked (if world is unlocked).
 *       Each subsequent game requires the previous game to be "done".
 */
export function isGameUnlockedInWorld(
  gameSlug: string,
  gameLevels?: Record<string, number>,
): boolean {
  const allGames = getAllGameDefinitions();
  const game = allGames.find((g) => g.slug === gameSlug);
  if (!game) return false;

  // Check if the world itself is unlocked first
  if (!isWorldUnlocked(game.worldSlug, gameLevels)) return false;

  // First game in a world is always unlocked
  const worldGames = getGamesForWorld(game.worldSlug);
  const gameIndex = worldGames.findIndex((g) => g.slug === gameSlug);

  if (gameIndex <= 0) return true; // First game or not found

  // Previous game must be "done"
  const prevGame = worldGames[gameIndex - 1];
  return isGameDone(prevGame.slug, gameLevels);
}

/**
 * Worlds unlocked by completing all games in the previous world.
 * Training Camp is always unlocked.
 */
export function getUnlockedWorldSlugs(
  gameLevels?: Record<string, number>,
): string[] {
  const activeWorlds = WORLDS.filter((w) =>
    (ACTIVE_WORLD_SLUGS as readonly string[]).includes(w.slug),
  );

  const unlocked: string[] = [];

  for (let i = 0; i < activeWorlds.length; i++) {
    const world = activeWorlds[i];

    if (i === 0) {
      // First world (Training Camp) is always unlocked
      unlocked.push(world.slug);
      continue;
    }

    // Check if ALL games in the previous world are "done"
    const prevWorld = activeWorlds[i - 1];
    const prevWorldGames = getGamesForWorld(prevWorld.slug);
    const allPrevDone = prevWorldGames.length > 0 &&
      prevWorldGames.every((g) => isGameDone(g.slug, gameLevels));

    if (allPrevDone) {
      unlocked.push(world.slug);
    } else {
      break; // Worlds are sequential — if this one is locked, all after are too
    }
  }

  return unlocked;
}

/**
 * Check if a specific world is unlocked.
 */
export function isWorldUnlocked(
  worldSlug: string,
  gameLevels?: Record<string, number>,
): boolean {
  return getUnlockedWorldSlugs(gameLevels).includes(worldSlug);
}

/**
 * Get world progress as a percentage (0–100).
 * Based on how many games in the world are "done".
 */
export function getWorldProgress(
  worldSlug: string,
  gameLevels?: Record<string, number>,
): number {
  const games = getGamesForWorld(worldSlug);
  if (games.length === 0) return 0;

  const doneCount = games.filter((g) => isGameDone(g.slug, gameLevels)).length;
  return Math.round((doneCount / games.length) * 100);
}

export const WORLD_IMAGES: Record<string, string> = {
  'training-camp': '/illustrations/world-training-camp.png',
  'forest-of-focus': '/illustrations/world-forest.png',
  'ice-kingdom': '/illustrations/world-ice-kingdom.png',
};
