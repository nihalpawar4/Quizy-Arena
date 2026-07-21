/** Max playable levels per game. */
export const MAX_GAME_LEVEL = 10;

/** Worlds with playable content in this release. */
export const ACTIVE_WORLD_SLUGS = [
  'training-camp',
  'forest-of-focus',
  'ice-kingdom',
  'desert-of-logic',
  'volcano-peak',
  'cyber-city',
] as const;

export function clampGameLevel(level: number): number {
  return Math.max(1, Math.min(MAX_GAME_LEVEL, level));
}

/** Next level to play (1–3) from highest completed level (0 = none). */
export function getNextPlayLevel(highestCompleted: number | undefined): number {
  const done = highestCompleted ?? 0;
  if (done >= MAX_GAME_LEVEL) return MAX_GAME_LEVEL;
  return done + 1;
}

/** Progress 0–100 for UI (3 levels). */
export function getGameLevelProgress(highestCompleted: number | undefined): number {
  const done = highestCompleted ?? 0;
  return Math.round((done / MAX_GAME_LEVEL) * 100);
}

export function formatSkillLabel(skillId: string): string {
  const map: Record<string, string> = {
    memory: 'Memory',
    logic: 'Logic',
    focus: 'Focus',
    reaction: 'Reaction',
    patternRecognition: 'Pattern',
    pattern: 'Pattern',
    math: 'Logic',
    problem_solving: 'Problem Solving',
    creativity: 'Creativity',
    decision: 'Decision',
  };
  return map[skillId] ?? skillId.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}
