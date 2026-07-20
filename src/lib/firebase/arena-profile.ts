import { setDocument, serverTimestamp } from './firestore';
import { getUnlockedWorldSlugs } from '@/lib/worlds';
import { levelFromXp } from '@/lib/xp';

export async function createArenaProfile(uid: string, globalXp = 0): Promise<void> {
  const playerLevel = levelFromXp(globalXp);
  const arenaDoc: Record<string, unknown> = {
    uid,
    arenaXp: 0,
    arenaLevel: 1,
    arenaRank: 'bronze_3',
    rankPoints: 0,
    skillMemory: 0,
    skillLogic: 0,
    skillFocus: 0,
    skillReaction: 0,
    skillCreativity: 0,
    skillProblemSolving: 0,
    skillPatternRecognition: 0,
    skillDecisionMaking: 0,
    brainScore: 0,
    arenaStreak: 0,
    arenaStreakBest: 0,
    lastPlayedAt: null,
    streakFreezeAvailable: 1,
    gamesPlayed: 0,
    gamesWon: 0,
    totalPlayTimeSec: 0,
    personalBests: {},
    gameLevels: {},
    currentWorldSlug: 'training-camp',
    unlockedWorldSlugs: getUnlockedWorldSlugs(playerLevel),
    isOnboarded: false,
    selectedSkillGoals: [],
    dailyChallengeDate: null,
    dailyChallengeSlug: null,
    updatedAt: serverTimestamp(),
  };

  await setDocument('arena_profiles', uid, arenaDoc);
}
