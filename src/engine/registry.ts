/**
 * Game Registry
 *
 * Central registry mapping game slugs to definitions and lazy-loaded components.
 * Games are only downloaded when played.
 */

import { lazy } from 'react';
import type { GameDefinition, GameRegistryEntry } from './types';

// ── Import definitions (static, tiny) ──
// These will be added as games are built

const GAME_REGISTRY = new Map<string, GameRegistryEntry>();

/**
 * Register a game in the registry.
 */
export function registerGame(entry: GameRegistryEntry): void {
  GAME_REGISTRY.set(entry.definition.slug, entry);
}

/**
 * Get a game entry by slug.
 */
export function getGameEntry(slug: string): GameRegistryEntry | undefined {
  return GAME_REGISTRY.get(slug);
}

/**
 * Get a game definition by slug.
 */
export function getGameDefinition(slug: string): GameDefinition | undefined {
  return GAME_REGISTRY.get(slug)?.definition;
}

/**
 * Get all registered game definitions.
 */
export function getAllGameDefinitions(): GameDefinition[] {
  return Array.from(GAME_REGISTRY.values()).map((e) => e.definition);
}

/**
 * Get game definitions filtered by category.
 */
export function getGamesByCategory(category: string): GameDefinition[] {
  return getAllGameDefinitions().filter((d) => d.category === category);
}

/**
 * Get game definitions filtered by world.
 */
export function getGamesByWorld(worldSlug: string): GameDefinition[] {
  return getAllGameDefinitions()
    .filter((d) => d.worldSlug === worldSlug)
    .sort((a, b) => a.sortOrderInWorld - b.sortOrderInWorld);
}

/**
 * Get game definitions the player can access (by level).
 */
export function getUnlockedGames(playerLevel: number): GameDefinition[] {
  return getAllGameDefinitions().filter((d) => d.unlockLevel <= playerLevel);
}

// ============================================
// REGISTER GAMES
// ============================================

// Phase 1 games (added as they are built)
// Each game calls registerGame() from its own definition file.
// This avoids circular imports and keeps the registry clean.

// Games self-register by importing this module and calling registerGame().
// See: src/games/memory-match/definition.ts for example.
