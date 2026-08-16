import type { GameDefinition } from '@/engine/types';
import type { ComponentType } from 'react';
import type { GameComponentProps } from '@/engine/types';

/**
 * Extra / variant games — currently empty.
 * Games will be added here when needed.
 */

export const EXTRA_GAME_DEFINITIONS: GameDefinition[] = [];

/** Maps variant slugs to the base mechanic slug used by level-generator. */
export const EXTRA_GAME_BASE_SLUGS: Record<string, string> = {};

/** Maps variant slugs to their lazy-loaded game component loaders. */
export const EXTRA_GAME_COMPONENTS: Record<string, () => Promise<{ default: ComponentType<GameComponentProps> }>> = {};
