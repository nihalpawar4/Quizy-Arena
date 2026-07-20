/**
 * Missions Service
 *
 * Generates daily missions, tracks progress, handles claiming.
 * All mission types are defined here for consistency.
 */

import {
  getDocument,
  setDocument,
  updateDocument,
  serverTimestamp,
  increment,
} from './firestore';
import type { ArenaMissionProgressDocument } from './types';

// ── Mission Templates ──

export interface MissionTemplate {
  id: string;
  title: string;
  requirementType: 'play_game' | 'earn_xp' | 'score_high' | 'win_battle' | 'play_new_game';
  requirementValue: number;
  xpReward: number;
  coinReward: number;
  diamondReward: number;
}

/**
 * Pool of possible daily missions. 3 are picked each day.
 */
const MISSION_POOL: MissionTemplate[] = [
  { id: 'play_3', title: 'Play 3 games', requirementType: 'play_game', requirementValue: 3, xpReward: 50, coinReward: 25, diamondReward: 0 },
  { id: 'play_5', title: 'Play 5 games', requirementType: 'play_game', requirementValue: 5, xpReward: 100, coinReward: 50, diamondReward: 0 },
  { id: 'earn_200xp', title: 'Earn 200 XP', requirementType: 'earn_xp', requirementValue: 200, xpReward: 75, coinReward: 30, diamondReward: 0 },
  { id: 'earn_500xp', title: 'Earn 500 XP', requirementType: 'earn_xp', requirementValue: 500, xpReward: 150, coinReward: 75, diamondReward: 2 },
  { id: 'score_500', title: 'Score 500+ in any game', requirementType: 'score_high', requirementValue: 500, xpReward: 100, coinReward: 50, diamondReward: 0 },
  { id: 'score_1000', title: 'Score 1000+ in any game', requirementType: 'score_high', requirementValue: 1000, xpReward: 200, coinReward: 100, diamondReward: 3 },
];

/**
 * Get today's date string (YYYY-MM-DD) in local timezone.
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Pick 3 deterministic missions for a given date.
 * Uses date as seed so all users get the same missions.
 */
function pickMissionsForDate(dateStr: string): MissionTemplate[] {
  // Simple hash from date string
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) | 0;
  }
  hash = Math.abs(hash);

  const pool = [...MISSION_POOL];
  const picked: MissionTemplate[] = [];

  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = (hash + i * 7) % pool.length;
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }

  return picked;
}

/**
 * Get today's missions. Returns templates + progress.
 */
export interface MissionWithProgress extends MissionTemplate {
  currentValue: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

export async function getDailyMissions(uid: string): Promise<MissionWithProgress[]> {
  const today = getTodayDateString();
  const templates = pickMissionsForDate(today);
  const docId = `${uid}_${today}`;

  // Load or create progress document
  let progress = await getDocument<ArenaMissionProgressDocument>(
    'arena_mission_progress',
    docId,
  );

  if (!progress) {
    // Create new progress document for today
    const missions: ArenaMissionProgressDocument['missions'] = {};
    for (const t of templates) {
      missions[t.id] = { currentValue: 0, isCompleted: false, isClaimed: false };
    }

    await setDocument('arena_mission_progress', docId, {
      userId: uid,
      date: today,
      missions,
    });

    progress = { userId: uid, date: today, missions };
  }

  return templates.map((t) => {
    const p = progress!.missions[t.id] ?? { currentValue: 0, isCompleted: false, isClaimed: false };
    return {
      ...t,
      currentValue: p.currentValue,
      isCompleted: p.isCompleted || p.currentValue >= t.requirementValue,
      isClaimed: p.isClaimed,
    };
  });
}

/**
 * Update mission progress after a game session.
 */
export async function updateMissionProgress(
  uid: string,
  updates: {
    gamesPlayed?: number;
    xpEarned?: number;
    highScore?: number;
  },
): Promise<void> {
  const today = getTodayDateString();
  const docId = `${uid}_${today}`;
  const templates = pickMissionsForDate(today);

  const updateData: Record<string, unknown> = {};

  for (const t of templates) {
    let incrementValue = 0;

    switch (t.requirementType) {
      case 'play_game':
        incrementValue = updates.gamesPlayed ?? 0;
        break;
      case 'earn_xp':
        incrementValue = updates.xpEarned ?? 0;
        break;
      case 'score_high':
        // For score_high, set to max of current and new
        if (updates.highScore && updates.highScore >= t.requirementValue) {
          updateData[`missions.${t.id}.currentValue`] = updates.highScore;
          updateData[`missions.${t.id}.isCompleted`] = true;
        }
        continue; // Skip increment logic
    }

    if (incrementValue > 0) {
      updateData[`missions.${t.id}.currentValue`] = increment(incrementValue);
    }
  }

  if (Object.keys(updateData).length > 0) {
    try {
      await updateDocument('arena_mission_progress', docId, updateData);
    } catch {
      // Document might not exist yet — create it first
      await getDailyMissions(uid);
      await updateDocument('arena_mission_progress', docId, updateData);
    }
  }
}

/**
 * Claim a completed mission reward.
 * Returns the rewards given, or null if already claimed / not completed.
 */
export async function claimMissionReward(
  uid: string,
  missionId: string,
): Promise<{ xp: number; coins: number; diamonds: number } | null> {
  const today = getTodayDateString();
  const docId = `${uid}_${today}`;
  const templates = pickMissionsForDate(today);
  const template = templates.find((t) => t.id === missionId);
  if (!template) return null;

  // Check current state
  const progress = await getDocument<ArenaMissionProgressDocument>(
    'arena_mission_progress',
    docId,
  );
  if (!progress) return null;

  const mission = progress.missions[missionId];
  if (!mission) return null;
  if (mission.isClaimed) return null;
  if (mission.currentValue < template.requirementValue) return null;

  // Mark as claimed
  await updateDocument('arena_mission_progress', docId, {
    [`missions.${missionId}.isClaimed`]: true,
    [`missions.${missionId}.isCompleted`]: true,
  });

  // Award rewards to user
  const rewardUpdate: Record<string, unknown> = {
    globalXp: increment(template.xpReward),
    coins: increment(template.coinReward),
    updatedAt: serverTimestamp(),
  };
  if (template.diamondReward > 0) {
    rewardUpdate.diamonds = increment(template.diamondReward);
  }
  await updateDocument('users', uid, rewardUpdate);

  return {
    xp: template.xpReward,
    coins: template.coinReward,
    diamonds: template.diamondReward,
  };
}
