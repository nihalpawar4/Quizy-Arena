/**
 * Game Registration
 *
 * Side-effect import that registers all games with the engine.
 * Import this file once to make all games available.
 */

import { registerGame } from '@/engine/registry';
import { lazy } from 'react';

import { memoryMatchDefinition } from './memory-match/definition';
registerGame({
  definition: memoryMatchDefinition,
  component: lazy(() => import('./memory-match/game')),
});

import { speedMathDefinition } from './speed-math/definition';
registerGame({
  definition: speedMathDefinition,
  component: lazy(() => import('./speed-math/game')),
});

import { patternRecallDefinition } from './pattern-recall/definition';
registerGame({
  definition: patternRecallDefinition,
  component: lazy(() => import('./pattern-recall/game')),
});

// Forest of Focus — reuses core mechanics, separate progression slugs
import { memoryGroveDefinition } from './memory-grove/definition';
registerGame({
  definition: memoryGroveDefinition,
  component: lazy(() => import('./memory-match/game')),
});

import { logicSprintDefinition } from './logic-sprint/definition';
registerGame({
  definition: logicSprintDefinition,
  component: lazy(() => import('./speed-math/game')),
});

import { patternTrailDefinition } from './pattern-trail/definition';
registerGame({
  definition: patternTrailDefinition,
  component: lazy(() => import('./pattern-recall/game')),
});
