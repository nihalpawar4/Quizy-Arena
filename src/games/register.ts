/**
 * Game Registration
 *
 * Side-effect import that registers all games with the engine.
 * Import this file once to make all games available.
 */

import { registerGame } from '@/engine/registry';
import { lazy } from 'react';

// ── Training Camp ──
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

// ── Forest of Focus ──
import { memoryGroveDefinition } from './memory-grove/definition';
registerGame({
  definition: memoryGroveDefinition,
  component: lazy(() => import('./memory-grove/game')),
});

import { logicSprintDefinition } from './logic-sprint/definition';
registerGame({
  definition: logicSprintDefinition,
  component: lazy(() => import('./logic-sprint/game')),
});

import { patternTrailDefinition } from './pattern-trail/definition';
registerGame({
  definition: patternTrailDefinition,
  component: lazy(() => import('./pattern-trail/game')),
});

// ── Ice Kingdom ──
import { icePuzzleDefinition } from './ice-puzzle/definition';
registerGame({
  definition: icePuzzleDefinition,
  component: lazy(() => import('./ice-puzzle/game')),
});

import { frostReflexDefinition } from './frost-reflex/definition';
registerGame({
  definition: frostReflexDefinition,
  component: lazy(() => import('./frost-reflex/game')),
});

// ── Desert of Logic ──
import { desertRiddleDefinition } from './desert-riddle/definition';
registerGame({
  definition: desertRiddleDefinition,
  component: lazy(() => import('./desert-riddle/game')),
});

// ── Volcano Peak ──
import { lavaLogicDefinition } from './lava-logic/definition';
registerGame({
  definition: lavaLogicDefinition,
  component: lazy(() => import('./lava-logic/game')),
});

// ── Cyber City ──
import { cyberCodeDefinition } from './cyber-code/definition';
registerGame({
  definition: cyberCodeDefinition,
  component: lazy(() => import('./cyber-code/game')),
});
