/**
 * Firestore Document Type Interfaces
 *
 * These types mirror the Firestore collection schemas defined in
 * the Firebase architecture document. All timestamps are Firebase
 * Timestamp objects on read, but we accept Date on write.
 */

import type { Timestamp } from 'firebase/firestore';

// ============================================
// SHARED COLLECTIONS
// ============================================

/** users/{uid} — Core profile shared across all Quizy apps */
export interface UserDocument {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;

  // Global progression
  globalXp: number;
  globalLevel: number;

  // Currency
  coins: number;
  diamonds: number;

  // Premium
  isPremium: boolean;
  premiumPlan: 'free' | 'monthly' | 'yearly';
  premiumExpiresAt: Timestamp | null;

  // Cosmetics
  activeFrame: string | null;
  activeTitle: string | null;
  activeBadges: string[];
  earnedBadges: string[];
  earnedFrames: string[];
  earnedTitles: string[];

  // Settings (embedded)
  settings: UserSettings;

  // Platform
  onboardedApps: string[];
  blockedUsers: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastActiveAt: Timestamp;

  // Daily rewards
  lastDailyClaimAt?: Timestamp | null;
  dailyClaimStreak?: number;
  lastWheelSpinAt?: Timestamp | null;

  // Quizy-legacy fields (kept for compatibility)
  name?: string;
  role?: 'student' | 'teacher';
  studentClass?: number;
  xp?: number;
  photoURL?: string;
  currentStreak?: number;
  longestStreak?: number;
  lastStreakDate?: string;
}

export interface UserSettings {
  language: string;
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  colorBlindMode: boolean;
  privacy: {
    profilePublic: boolean;
    showOnlineStatus: boolean;
    showActivity: boolean;
  };
}

/** users/{uid}/friends/{friendUid} */
export interface FriendDocument {
  id?: string; // Firestore doc ID (added on read)
  status: 'pending_sent' | 'pending_received' | 'accepted';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  friendDisplayName: string;
  friendUsername: string;
  friendAvatarUrl: string | null;
  friendLevel: number;
}

/** users/{uid}/notifications/{id} */
export interface NotificationDocument {
  id?: string;
  type:
    | 'achievement'
    | 'friend_request'
    | 'match_invite'
    | 'reward'
    | 'season'
    | 'system'
    | 'level_up'
    | 'streak';
  source: 'quizy' | 'arena' | 'system';
  title: string;
  body: string;
  iconType: string;
  data: Record<string, string>;
  isRead: boolean;
  createdAt: Timestamp;
}

/** usernames/{username} */
export interface UsernameDocument {
  uid: string;
  createdAt: Timestamp;
}

/** achievements_catalog/{id} */
export interface AchievementCatalogDocument {
  id?: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  source: 'quizy' | 'arena' | 'ecosystem';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  coinReward: number;
  diamondReward: number;
  badgeId: string | null;
  requirement: {
    type: string;
    value: number;
  };
  isActive: boolean;
  sortOrder: number;
}

/** user_achievements/{uid}_{achievementId} */
export interface UserAchievementDocument {
  userId: string;
  achievementId: string;
  source: 'quizy' | 'arena' | 'ecosystem';
  progress: number;
  isCompleted: boolean;
  isClaimed: boolean;
  unlockedAt: Timestamp | null;
  claimedAt: Timestamp | null;
}

// ============================================
// ARENA-SPECIFIC COLLECTIONS
// ============================================

/** arena_profiles/{uid} */
export interface ArenaProfileDocument {
  uid: string;

  // Arena progression
  arenaXp: number;
  arenaLevel: number;

  // Competitive
  arenaRank: string;
  rankPoints: number;

  // Skills (0-100)
  skillMemory: number;
  skillLogic: number;
  skillFocus: number;
  skillReaction: number;
  skillCreativity: number;
  skillProblemSolving: number;
  skillPatternRecognition: number;
  skillDecisionMaking: number;
  brainScore: number;

  // Streaks
  arenaStreak: number;
  arenaStreakBest: number;
  lastPlayedAt: Timestamp | null;
  streakFreezeAvailable: number;

  // Stats
  gamesPlayed: number;
  gamesWon: number;
  totalPlayTimeSec: number;
  personalBests: Record<string, number>;
  /** Highest level completed (1–3) per game slug */
  gameLevels?: Record<string, number>;

  // World progression
  currentWorldSlug: string;
  unlockedWorldSlugs: string[];

  // Daily challenge
  dailyChallengeDate?: string | null;
  dailyChallengeSlug?: string | null;

  // Onboarding
  isOnboarded: boolean;
  selectedSkillGoals: string[];

  updatedAt: Timestamp;
}

/** arena_games/{gameId} */
export interface ArenaGameDocument {
  id?: string;
  slug: string;
  title: string;
  description: string;
  category:
    | 'memory'
    | 'logic'
    | 'focus'
    | 'reaction'
    | 'creativity'
    | 'problem_solving'
    | 'pattern'
    | 'decision';
  difficulty: 'easy' | 'medium' | 'hard';
  worldSlug: string;
  sortOrderInWorld: number;
  thumbnailUrl: string | null;
  minDurationSec: number;
  maxDurationSec: number;
  xpRewardBase: number;
  coinRewardBase: number;
  skillsAffected: string[];
  isMultiplayer: boolean;
  isActive: boolean;
  createdAt: Timestamp;
}

/** arena_worlds/{worldId} */
export interface ArenaWorldDocument {
  id?: string;
  slug: string;
  name: string;
  emoji: string;
  description: string;
  unlockLevel: number;
  sortOrder: number;
  gameCount: number;
}

/** arena_sessions/{sessionId} */
export interface ArenaSessionDocument {
  id?: string;
  userId: string;
  gameId: string;
  gameSlug: string;
  score: number;
  accuracy: number | null;
  durationSec: number;
  xpEarned: number;
  coinsEarned: number;
  starsEarned: number;
  difficulty: string;
  isPersonalBest: boolean;
  skillPointsAwarded: Record<string, number>;
  metadata: Record<string, unknown>;
  playedAt: Timestamp;
}

/** arena_matches/{matchId} */
export interface ArenaMatchDocument {
  id?: string;
  type: 'quick_match' | 'friend_challenge' | 'ranked' | 'tournament';
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  gameId: string;
  gameSlug: string;
  participants: Record<
    string,
    {
      displayName: string;
      avatarUrl: string | null;
      score: number | null;
      isReady: boolean;
      isWinner: boolean | null;
    }
  >;
  createdBy: string;
  createdAt: Timestamp;
  startedAt: Timestamp | null;
  endedAt: Timestamp | null;
}

/** arena_seasons/{seasonId} */
export interface ArenaSeasonDocument {
  id?: string;
  slug: string;
  name: string;
  description: string;
  startsAt: Timestamp;
  endsAt: Timestamp;
  themeAccent: string;
  rewardTiers: Array<{
    tier: number;
    xpRequired: number;
    reward: {
      type: 'coins' | 'diamonds' | 'badge' | 'frame' | 'chest' | 'xp';
      value: string | number;
    };
  }>;
  isActive: boolean;
}

/** arena_season_progress/{uid}_{seasonId} */
export interface ArenaSeasonProgressDocument {
  userId: string;
  seasonId: string;
  xpEarned: number;
  currentTier: number;
  claimedTiers: number[];
  updatedAt: Timestamp;
}

/** arena_missions/{missionId} */
export interface ArenaMissionDocument {
  id?: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly';
  requirementType: string;
  requirementValue: number;
  coinReward: number;
  diamondReward: number;
  xpReward: number;
  dayOfWeek: number | null;
  isActive: boolean;
}

/** arena_mission_progress/{uid}_{date} */
export interface ArenaMissionProgressDocument {
  userId: string;
  date: string;
  missions: Record<
    string,
    {
      currentValue: number;
      isCompleted: boolean;
      isClaimed: boolean;
    }
  >;
}

/** arena_leaderboards/{boardId} */
export interface ArenaLeaderboardDocument {
  type: 'global_weekly' | 'global_alltime' | 'game_weekly';
  gameId: string | null;
  period: string;
  entries: Array<{
    uid: string;
    username: string;
    avatarUrl: string | null;
    score: number;
    rank: number;
  }>;
  updatedAt: Timestamp;
}

/** arena_chests/{chestId} */
export interface ArenaChestDocument {
  id?: string;
  userId: string;
  type: 'wooden' | 'silver' | 'gold' | 'diamond';
  contents: Array<{
    type: 'coins' | 'diamonds' | 'badge' | 'xp';
    value: string | number;
  }>;
  isOpened: boolean;
  earnedAt: Timestamp;
  openedAt: Timestamp | null;
  source: string;
}

/** arena_stars/{uid}_{gameId} */
export interface ArenaStarDocument {
  userId: string;
  gameId: string;
  stars: number;
  bestScore: number;
  playCount: number;
  lastPlayedAt: Timestamp;
}
