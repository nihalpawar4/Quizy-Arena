/**
 * Battle Matchmaking Service
 *
 * Handles the matchmaking queue and battle lifecycle via Firestore.
 *
 * Flow:
 * 1. Player calls joinMatchmaking() → writes to arena_matchmaking/{uid}
 * 2. listenToMatchmaking() watches the player's own queue doc
 * 3. A second listener watches for ANY other player in 'waiting' status
 * 4. When found, the first player to detect creates the battle doc
 * 5. Both players' queue entries are updated to 'matched' with the battleId
 * 6. listenToBattle() provides real-time score updates
 */

import {
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  limit,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase/config';
import type {
  MatchmakingEntry,
  BattleDocument,
  BattlePlayer,
} from './types';
import { BATTLE_DURATION_SEC } from './types';

const MATCHMAKING_COL = 'arena_matchmaking';
const BATTLES_COL = 'arena_battles';

/**
 * Join the matchmaking queue.
 */
export async function joinMatchmaking(
  uid: string,
  displayName: string,
  avatarUrl: string | null,
  globalLevel: number,
  rankPoints: number,
): Promise<void> {
  const entry: MatchmakingEntry = {
    uid,
    displayName,
    avatarUrl,
    globalLevel,
    rankPoints,
    status: 'waiting',
    battleId: null,
    joinedAt: Date.now(),
  };

  await setDoc(doc(getFirebaseDb(), MATCHMAKING_COL, uid), entry);
}

/**
 * Leave the matchmaking queue (cancel search).
 */
export async function leaveMatchmaking(uid: string): Promise<void> {
  try {
    await deleteDoc(doc(getFirebaseDb(), MATCHMAKING_COL, uid));
  } catch {
    // Doc may not exist — that's fine
  }
}

/**
 * Listen to the player's own matchmaking entry for status changes.
 * When status becomes 'matched', the callback receives the battleId.
 */
export function listenToMatchmaking(
  uid: string,
  onUpdate: (entry: MatchmakingEntry | null) => void,
): Unsubscribe {
  return onSnapshot(doc(getFirebaseDb(), MATCHMAKING_COL, uid), (snap) => {
    if (snap.exists()) {
      onUpdate(snap.data() as MatchmakingEntry);
    } else {
      onUpdate(null);
    }
  });
}

/**
 * Search for an available opponent and create a battle if found.
 * Returns the battleId if a match was made, null otherwise.
 */
export async function findAndMatchOpponent(
  myUid: string,
  myDisplayName: string,
  myAvatarUrl: string | null,
  myGlobalLevel: number,
): Promise<string | null> {
  // Query for any player currently waiting (excluding self)
  const q = query(
    collection(getFirebaseDb(), MATCHMAKING_COL),
    where('status', '==', 'waiting'),
    limit(10),
  );

  const snap = await getDocs(q);
  let opponent: MatchmakingEntry | null = null;

  for (const docSnap of snap.docs) {
    const entry = docSnap.data() as MatchmakingEntry;
    if (entry.uid !== myUid && entry.status === 'waiting') {
      opponent = entry;
      break;
    }
  }

  if (!opponent) return null;

  // Create a battle document
  const battleId = `${myUid}_${opponent.uid}_${Date.now()}`;
  const seed = Math.floor(Math.random() * 999999);

  const myPlayer: BattlePlayer = {
    uid: myUid,
    displayName: myDisplayName,
    avatarUrl: myAvatarUrl,
    globalLevel: myGlobalLevel,
    score: 0,
    correctCount: 0,
    wrongCount: 0,
    isFinished: false,
  };

  const opponentPlayer: BattlePlayer = {
    uid: opponent.uid,
    displayName: opponent.displayName,
    avatarUrl: opponent.avatarUrl,
    globalLevel: opponent.globalLevel,
    score: 0,
    correctCount: 0,
    wrongCount: 0,
    isFinished: false,
  };

  const battle: BattleDocument = {
    id: battleId,
    gameType: 'speed-math',
    status: 'countdown',
    durationSec: BATTLE_DURATION_SEC,
    player1: myPlayer,
    player2: opponentPlayer,
    winnerId: null,
    createdAt: Date.now(),
    startedAt: null,
    endedAt: null,
    problemSeed: seed,
  };

  try {
    // Write battle doc
    await setDoc(doc(getFirebaseDb(), BATTLES_COL, battleId), battle);

    // Update both players' queue entries to 'matched'
    await Promise.all([
      updateDoc(doc(getFirebaseDb(), MATCHMAKING_COL, myUid), {
        status: 'matched',
        battleId,
      }),
      updateDoc(doc(getFirebaseDb(), MATCHMAKING_COL, opponent.uid), {
        status: 'matched',
        battleId,
      }),
    ]);

    return battleId;
  } catch (err) {
    console.error('[Matchmaking] Failed to create battle:', err);
    return null;
  }
}

/**
 * Listen to a battle document for real-time score updates.
 */
export function listenToBattle(
  battleId: string,
  onUpdate: (battle: BattleDocument | null) => void,
): Unsubscribe {
  return onSnapshot(doc(getFirebaseDb(), BATTLES_COL, battleId), (snap) => {
    if (snap.exists()) {
      onUpdate({ ...snap.data(), id: battleId } as BattleDocument);
    } else {
      onUpdate(null);
    }
  });
}

/**
 * Update the player's score in a battle (called after each correct/wrong answer).
 */
export async function updateBattleScore(
  battleId: string,
  uid: string,
  playerKey: 'player1' | 'player2',
  score: number,
  correctCount: number,
  wrongCount: number,
): Promise<void> {
  try {
    await updateDoc(doc(getFirebaseDb(), BATTLES_COL, battleId), {
      [`${playerKey}.score`]: score,
      [`${playerKey}.correctCount`]: correctCount,
      [`${playerKey}.wrongCount`]: wrongCount,
    });
  } catch (err) {
    console.error('[Battle] Failed to update score:', err);
  }
}

/**
 * Mark the player as finished and determine winner if both are done.
 */
export async function finishBattle(
  battleId: string,
  playerKey: 'player1' | 'player2',
  finalScore: number,
  correctCount: number,
  wrongCount: number,
): Promise<void> {
  try {
    await updateDoc(doc(getFirebaseDb(), BATTLES_COL, battleId), {
      [`${playerKey}.score`]: finalScore,
      [`${playerKey}.correctCount`]: correctCount,
      [`${playerKey}.wrongCount`]: wrongCount,
      [`${playerKey}.isFinished`]: true,
    });
  } catch (err) {
    console.error('[Battle] Failed to finish battle:', err);
  }
}

/**
 * Set the battle status to 'playing' and record the start time.
 */
export async function startBattle(battleId: string): Promise<void> {
  try {
    await updateDoc(doc(getFirebaseDb(), BATTLES_COL, battleId), {
      status: 'playing',
      startedAt: Date.now(),
    });
  } catch (err) {
    console.error('[Battle] Failed to start battle:', err);
  }
}

/**
 * Finalize a battle — determine winner and set status to 'finished'.
 */
export async function finalizeBattle(
  battleId: string,
  battle: BattleDocument,
): Promise<void> {
  let winnerId: string | null = null;
  if (battle.player1.score > battle.player2.score) {
    winnerId = battle.player1.uid;
  } else if (battle.player2.score > battle.player1.score) {
    winnerId = battle.player2.uid;
  }
  // null means draw

  try {
    await updateDoc(doc(getFirebaseDb(), BATTLES_COL, battleId), {
      status: 'finished',
      winnerId,
      endedAt: Date.now(),
    });

    // Clean up matchmaking entries
    await Promise.all([
      deleteDoc(doc(getFirebaseDb(), MATCHMAKING_COL, battle.player1.uid)).catch(() => {}),
      deleteDoc(doc(getFirebaseDb(), MATCHMAKING_COL, battle.player2.uid)).catch(() => {}),
    ]);
  } catch (err) {
    console.error('[Battle] Failed to finalize battle:', err);
  }
}
