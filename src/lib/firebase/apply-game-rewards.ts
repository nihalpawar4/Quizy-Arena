import type { SavePayload, RewardResult } from '@/engine/types';
import type { UserDocument, ArenaProfileDocument } from './types';
import { skillIdToArenaField } from './skill-fields';
import { getUnlockedWorldSlugs } from '@/lib/worlds';
import { QUIZY_XP_SHARE } from '@/lib/game-economy';

interface ApplyGameRewardsInput {
  userProfile: UserDocument;
  arenaProfile: ArenaProfileDocument;
  payload: SavePayload;
  rewards: RewardResult;
}

export function applyGameRewardsOptimistic({
  userProfile,
  arenaProfile,
  payload,
  rewards,
}: ApplyGameRewardsInput): {
  userProfile: UserDocument;
  arenaProfile: ArenaProfileDocument;
} {
  const levelCompleted = payload.metadata?.levelCompleted === true;
  const highestLevel = (payload.metadata?.highestLevel as number) ?? payload.level;
  const quizyXpEarned = Math.floor(rewards.xpEarned * QUIZY_XP_SHARE);

  const gameLevels = { ...(arenaProfile.gameLevels ?? {}) };
  if (levelCompleted && highestLevel >= 1) {
    gameLevels[payload.gameSlug] = Math.max(gameLevels[payload.gameSlug] ?? 0, highestLevel);
  }

  const playerLevel = Math.max(rewards.newGlobalLevel, rewards.newArenaLevel);
  const updatedArena: ArenaProfileDocument = {
    ...arenaProfile,
    arenaXp: rewards.newArenaXp,
    arenaLevel: rewards.newArenaLevel,
    brainScore: rewards.newBrainScore,
    gamesPlayed: arenaProfile.gamesPlayed + 1,
    gamesWon: levelCompleted ? arenaProfile.gamesWon + 1 : arenaProfile.gamesWon,
    totalPlayTimeSec: arenaProfile.totalPlayTimeSec + payload.durationSec,
    arenaStreak: rewards.newStreakCount,
    arenaStreakBest: Math.max(arenaProfile.arenaStreakBest ?? 0, rewards.newStreakCount),
    gameLevels,
    unlockedWorldSlugs: getUnlockedWorldSlugs(gameLevels),
    rankPoints: arenaProfile.rankPoints + Math.floor(rewards.xpEarned * 0.05),
  };

  for (const [skillId, delta] of Object.entries(rewards.skillDeltas)) {
    const field = skillIdToArenaField(skillId);
    const current = updatedArena[field];
    if (typeof current === 'number') {
      (updatedArena as unknown as Record<string, unknown>)[field] = Math.min(100, current + (delta as number));
    }
  }

  if (payload.isPersonalBest) {
    updatedArena.personalBests = {
      ...arenaProfile.personalBests,
      [payload.gameSlug]: payload.score,
    };
  }

  const updatedUser: UserDocument = {
    ...userProfile,
    globalXp: rewards.newGlobalXp,
    globalLevel: rewards.newGlobalLevel,
    coins: userProfile.coins + payload.coinsEarned,
    diamonds: userProfile.diamonds + payload.diamondsEarned,
    xp: (userProfile.xp ?? 0) + quizyXpEarned,
  };

  return { userProfile: updatedUser, arenaProfile: updatedArena };
}
